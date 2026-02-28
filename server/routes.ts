import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import {
  insertPropertySchema,
  insertUnitSchema,
  insertTenantSchema,
  insertRentInvoiceSchema,
  insertPaymentSchema,
  insertPropertyUserSchema,
} from "@shared/schema";

async function userCanAccessProperty(userId: number, userRole: string, propertyId: number): Promise<boolean> {
  if (userRole === "super_admin") return true;
  const pu = await storage.getPropertyUser(userId, propertyId);
  return pu?.status === "approved";
}

async function userIsPropertyOwner(userId: number, userRole: string, propertyId: number): Promise<boolean> {
  if (userRole === "super_admin") return true;
  const pu = await storage.getPropertyUser(userId, propertyId);
  return pu?.status === "approved" && pu?.role === "property_owner";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Properties
  app.get("/api/properties", requireAuth, async (req, res) => {
    const user = req.user!;
    if (user.role === "super_admin") {
      const data = await storage.getProperties();
      return res.json(data);
    }
    const data = await storage.getPropertiesByUser(user.id);
    res.json(data);
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.id);
    if (!await userCanAccessProperty(req.user!.id, req.user!.role, propertyId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const property = await storage.getProperty(propertyId);
    if (!property) return res.status(404).json({ message: "Not found" });
    res.json(property);
  });

  app.post("/api/properties", requireAuth, async (req, res) => {
    const parsed = insertPropertySchema.safeParse({ ...req.body, createdById: req.user!.id });
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const property = await storage.createProperty(parsed.data);
    await storage.createPropertyUser({
      userId: req.user!.id,
      propertyId: property.id,
      role: "property_owner",
      status: "approved",
      ownershipPercent: "100",
    });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "create_property",
      tableName: "properties",
      recordId: property.id,
      newValue: JSON.stringify(property),
    });
    res.status(201).json(property);
  });

  app.patch("/api/properties/:id", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.id);
    if (!await userIsPropertyOwner(req.user!.id, req.user!.role, propertyId)) {
      return res.status(403).json({ message: "Only property owner can edit" });
    }
    const parsed = insertPropertySchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const old = await storage.getProperty(propertyId);
    const property = await storage.updateProperty(propertyId, parsed.data);
    if (!property) return res.status(404).json({ message: "Not found" });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "update_property",
      tableName: "properties",
      recordId: property.id,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(property),
    });
    res.json(property);
  });

  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.id);
    if (!await userIsPropertyOwner(req.user!.id, req.user!.role, propertyId)) {
      return res.status(403).json({ message: "Only property owner can delete" });
    }
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete_property",
      tableName: "properties",
      recordId: propertyId,
    });
    await storage.deleteProperty(propertyId);
    res.status(204).send();
  });

  // Property Users (access control)
  app.get("/api/properties/:propertyId/users", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    if (!await userCanAccessProperty(req.user!.id, req.user!.role, propertyId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const data = await storage.getPropertyUsers(propertyId);
    const usersData = await storage.getUsers();
    const enriched = data.map(pu => {
      const u = usersData.find(u => u.id === pu.userId);
      return { ...pu, userName: u?.fullName || "Unknown", userEmail: u?.email };
    });
    res.json(enriched);
  });

  app.post("/api/properties/:propertyId/request-access", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    const existing = await storage.getPropertyUser(req.user!.id, propertyId);
    if (existing) return res.status(409).json({ message: "Access request already exists" });
    const pu = await storage.createPropertyUser({
      userId: req.user!.id,
      propertyId,
      role: req.body.role || "co_owner",
      status: "pending",
      ownershipPercent: req.body.ownershipPercent || "0",
    });
    res.status(201).json(pu);
  });

  app.patch("/api/property-users/:id/approve", requireAuth, async (req, res) => {
    const puId = Number(req.params.id);
    const targetPu = await storage.getPropertyUserById(puId);
    if (!targetPu) return res.status(404).json({ message: "Not found" });
    if (!await userIsPropertyOwner(req.user!.id, req.user!.role, targetPu.propertyId)) {
      return res.status(403).json({ message: "Only property owner can approve access" });
    }
    const pu = await storage.updatePropertyUser(puId, { status: "approved" });
    if (!pu) return res.status(404).json({ message: "Not found" });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "approve_access",
      tableName: "property_users",
      recordId: pu.id,
      newValue: JSON.stringify(pu),
    });
    res.json(pu);
  });

  app.patch("/api/property-users/:id/reject", requireAuth, async (req, res) => {
    const puId = Number(req.params.id);
    const targetPu = await storage.getPropertyUserById(puId);
    if (!targetPu) return res.status(404).json({ message: "Not found" });
    if (!await userIsPropertyOwner(req.user!.id, req.user!.role, targetPu.propertyId)) {
      return res.status(403).json({ message: "Only property owner can reject access" });
    }
    const pu = await storage.updatePropertyUser(puId, { status: "rejected" });
    if (!pu) return res.status(404).json({ message: "Not found" });
    res.json(pu);
  });

  app.patch("/api/property-users/:id", requireAuth, async (req, res) => {
    const parsed = insertPropertyUserSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const pu = await storage.updatePropertyUser(Number(req.params.id), parsed.data);
    if (!pu) return res.status(404).json({ message: "Not found" });
    res.json(pu);
  });

  // Units
  app.get("/api/properties/:propertyId/units", requireAuth, async (req, res) => {
    const data = await storage.getUnits(Number(req.params.propertyId));
    res.json(data);
  });

  app.get("/api/units", requireAuth, async (_req, res) => {
    const data = await storage.getAllUnits();
    res.json(data);
  });

  app.get("/api/units/:id", requireAuth, async (req, res) => {
    const unit = await storage.getUnit(Number(req.params.id));
    if (!unit) return res.status(404).json({ message: "Not found" });
    res.json(unit);
  });

  app.post("/api/units", requireAuth, async (req, res) => {
    const parsed = insertUnitSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.createUnit(parsed.data);
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "create_unit",
      tableName: "units",
      recordId: unit.id,
      newValue: JSON.stringify(unit),
    });
    res.status(201).json(unit);
  });

  app.patch("/api/units/:id", requireAuth, async (req, res) => {
    const parsed = insertUnitSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const old = await storage.getUnit(Number(req.params.id));
    const unit = await storage.updateUnit(Number(req.params.id), parsed.data);
    if (!unit) return res.status(404).json({ message: "Not found" });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "update_unit",
      tableName: "units",
      recordId: unit.id,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(unit),
    });
    res.json(unit);
  });

  app.delete("/api/units/:id", requireAuth, async (req, res) => {
    await storage.deleteUnit(Number(req.params.id));
    res.status(204).send();
  });

  // Tenants
  app.get("/api/tenants", requireAuth, async (_req, res) => {
    const data = await storage.getTenants();
    res.json(data);
  });

  app.get("/api/tenants/:id", requireAuth, async (req, res) => {
    const tenant = await storage.getTenant(Number(req.params.id));
    if (!tenant) return res.status(404).json({ message: "Not found" });
    res.json(tenant);
  });

  app.post("/api/tenants", requireAuth, async (req, res) => {
    const parsed = insertTenantSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const tenant = await storage.createTenant(parsed.data);
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "create_tenant",
      tableName: "tenants",
      recordId: tenant.id,
      newValue: JSON.stringify(tenant),
    });
    res.status(201).json(tenant);
  });

  app.patch("/api/tenants/:id", requireAuth, async (req, res) => {
    const parsed = insertTenantSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const old = await storage.getTenant(Number(req.params.id));
    const tenant = await storage.updateTenant(Number(req.params.id), parsed.data);
    if (!tenant) return res.status(404).json({ message: "Not found" });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "update_tenant",
      tableName: "tenants",
      recordId: tenant.id,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(tenant),
    });
    res.json(tenant);
  });

  app.delete("/api/tenants/:id", requireAuth, async (req, res) => {
    await storage.deleteTenant(Number(req.params.id));
    res.status(204).send();
  });

  // Rent Invoices
  app.get("/api/invoices", requireAuth, async (_req, res) => {
    const data = await storage.getRentInvoices();
    res.json(data);
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    const invoice = await storage.getRentInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json(invoice);
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    const parsed = insertRentInvoiceSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const invoice = await storage.createRentInvoice(parsed.data);
    res.status(201).json(invoice);
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    const parsed = insertRentInvoiceSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const old = await storage.getRentInvoice(Number(req.params.id));
    const invoice = await storage.updateRentInvoice(Number(req.params.id), parsed.data);
    if (!invoice) return res.status(404).json({ message: "Not found" });
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "update_invoice",
      tableName: "rent_invoices",
      recordId: invoice.id,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(invoice),
    });
    res.json(invoice);
  });

  app.get("/api/tenants/:tenantId/invoices", requireAuth, async (req, res) => {
    const data = await storage.getRentInvoicesByTenant(Number(req.params.tenantId));
    res.json(data);
  });

  // Generate invoices for a month
  app.post("/api/invoices/generate", requireAuth, async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    const allTenants = await storage.getTenants();
    const activeTenants = allTenants.filter((t) => t.isActive === 1);
    const existingInvoices = await storage.getRentInvoicesByMonth(month, year);
    const existingTenantIds = new Set(existingInvoices.map((i) => i.tenantId));

    const created: any[] = [];
    for (const tenant of activeTenants) {
      if (existingTenantIds.has(tenant.id)) continue;
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) continue;
      const receiptNum = `INV-${year}${String(month).padStart(2, "0")}-${tenant.id}`;
      const invoice = await storage.createRentInvoice({
        tenantId: tenant.id,
        unitId: tenant.unitId,
        month,
        year,
        amount: unit.monthlyRent,
        status: "unpaid",
        paidAmount: "0",
        receiptNumber: receiptNum,
      });
      created.push(invoice);
    }
    res.status(201).json({ generated: created.length, invoices: created });
  });

  // Mark invoice as paid
  app.post("/api/invoices/:id/pay", requireAuth, async (req, res) => {
    const { paidAmount, paymentMethod } = req.body;
    const invoice = await storage.getRentInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Not found" });

    const paid = parseFloat(paidAmount || invoice.amount);
    const total = parseFloat(invoice.amount);

    if (paid < 0) {
      return res.status(400).json({ message: "Payment amount cannot be negative" });
    }
    if (paid > total) {
      return res.status(400).json({ message: "Payment amount cannot exceed invoice total" });
    }

    let status: "paid" | "partial" | "late";
    if (paid >= total) {
      const tenant = await storage.getTenant(invoice.tenantId);
      const dueDay = tenant?.rentDueDay || 1;
      const today = new Date();
      const dueDate = new Date(invoice.year, invoice.month - 1, dueDay);
      status = today > dueDate ? "late" : "paid";
    } else {
      status = "partial";
    }

    const updated = await storage.updateRentInvoice(invoice.id, {
      status,
      paidAmount: String(paid),
      paidDate: new Date().toISOString().split("T")[0],
      paymentMethod: paymentMethod || "cash",
    });

    await storage.createAuditLog({
      userId: req.user!.id,
      action: "mark_payment",
      tableName: "rent_invoices",
      recordId: invoice.id,
      oldValue: JSON.stringify({ status: invoice.status, paidAmount: invoice.paidAmount }),
      newValue: JSON.stringify({ status, paidAmount: String(paid) }),
    });

    res.json(updated);
  });

  // Historical rent reconstruction
  app.post("/api/units/:unitId/reconstruct-history", requireAuth, async (req, res) => {
    const unitId = Number(req.params.unitId);
    const { currentRent, yearlyIncreasePercent, startYear, startMonth } = req.body;

    if (!currentRent || !yearlyIncreasePercent) {
      return res.status(400).json({ message: "currentRent and yearlyIncreasePercent required" });
    }

    const unit = await storage.getUnit(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const sYear = startYear || 2015;
    const sMonth = startMonth || 1;
    const rate = parseFloat(yearlyIncreasePercent) / 100;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const yearlyRents: { year: number; rent: number }[] = [];
    let rent = parseFloat(currentRent);

    for (let y = currentYear; y >= sYear; y--) {
      yearlyRents.unshift({ year: y, rent: Math.round(rent) });
      if (y > sYear) {
        rent = rent / (1 + rate);
      }
    }

    const created: any[] = [];
    for (const yr of yearlyRents) {
      const endMonth = yr.year === currentYear ? currentMonth : 12;
      const beginMonth = yr.year === sYear ? sMonth : 1;
      for (let m = beginMonth; m <= endMonth; m++) {
        const existing = await storage.getRentInvoicesByMonth(m, yr.year);
        const alreadyExists = existing.find(inv => inv.unitId === unitId);
        if (alreadyExists) continue;

        const tenantsByUnit = await storage.getTenantsByUnit(unitId);
        const activeTenant = tenantsByUnit.find(t => t.isActive === 1) || tenantsByUnit[0];

        if (activeTenant) {
          const receiptNum = `HIST-${yr.year}${String(m).padStart(2, "0")}-${unitId}`;
          const invoice = await storage.createRentInvoice({
            tenantId: activeTenant.id,
            unitId,
            month: m,
            year: yr.year,
            amount: String(yr.rent),
            status: "unpaid",
            paidAmount: "0",
            receiptNumber: receiptNum,
            isHistorical: 1,
            notes: `Reconstructed: ${yearlyIncreasePercent}% annual increase from PKR ${currentRent}`,
          });
          created.push(invoice);
        }
      }
    }

    await storage.createAuditLog({
      userId: req.user!.id,
      action: "reconstruct_history",
      tableName: "rent_invoices",
      recordId: unitId,
      newValue: JSON.stringify({ currentRent, yearlyIncreasePercent, startYear: sYear, records: created.length }),
    });

    res.status(201).json({ generated: created.length, yearlyRents, invoices: created });
  });

  // Owner Settlements
  app.get("/api/properties/:propertyId/settlements", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    if (!await userCanAccessProperty(req.user!.id, req.user!.role, propertyId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const data = await storage.getOwnerSettlements(propertyId);
    res.json(data);
  });

  app.get("/api/settlements/my", requireAuth, async (req, res) => {
    const data = await storage.getOwnerSettlementsByUser(req.user!.id);
    res.json(data);
  });

  app.post("/api/properties/:propertyId/calculate-settlements", requireAuth, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    const { month, year } = req.body;

    const propertyUnits = await storage.getUnits(propertyId);
    const unitIds = propertyUnits.map(u => u.id);

    const allInvoices = await storage.getRentInvoicesByMonth(month, year);
    const propertyInvoices = allInvoices.filter(inv => unitIds.includes(inv.unitId));

    const totalRent = propertyInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);

    const owners = await storage.getPropertyUsers(propertyId);
    const approvedOwners = owners.filter(o => o.status === "approved" && (o.role === "property_owner" || o.role === "co_owner"));

    const settlements: any[] = [];
    for (const owner of approvedOwners) {
      const percent = parseFloat(owner.ownershipPercent || "0");
      const share = (totalRent * percent) / 100;

      const settlement = await storage.createOwnerSettlement({
        propertyId,
        userId: owner.userId,
        month,
        year,
        totalRent: String(totalRent),
        ownerShare: String(share),
        amountDistributed: "0",
        balance: String(share),
      });
      settlements.push(settlement);
    }

    res.status(201).json(settlements);
  });

  // Payments (for future bank verification)
  app.get("/api/payments", requireAuth, async (_req, res) => {
    const data = await storage.getPayments();
    res.json(data);
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    const parsed = insertPaymentSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });

    const payment = await storage.createPayment(parsed.data);

    if (payment.amount && payment.tenantName) {
      const allInvoices = await storage.getRentInvoices();
      const match = allInvoices.find(inv => {
        if (inv.status === "paid") return false;
        const amtMatch = Math.abs(parseFloat(inv.amount) - parseFloat(payment.amount)) < 1;
        return amtMatch;
      });

      if (match) {
        await storage.updatePayment(payment.id, {
          matchedInvoiceId: match.id,
          status: "matched",
        });
        await storage.updateRentInvoice(match.id, {
          status: "paid",
          paidAmount: payment.amount,
          paidDate: payment.date,
        });
        payment.status = "matched";
        payment.matchedInvoiceId = match.id;
      }
    }

    await storage.createAuditLog({
      userId: req.user!.id,
      action: "add_payment",
      tableName: "payments",
      recordId: payment.id,
      newValue: JSON.stringify(payment),
    });

    res.status(201).json(payment);
  });

  // Audit Logs
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    if (req.user!.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admins can view audit logs" });
    }
    const data = await storage.getAuditLogs(200);
    res.json(data);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = req.user!;
    let allProperties: any[];
    if (user.role === "super_admin") {
      allProperties = await storage.getProperties();
    } else {
      allProperties = await storage.getPropertiesByUser(user.id);
    }

    const allUnits = await storage.getAllUnits();
    const propertyIds = allProperties.map(p => p.id);
    const filteredUnits = allUnits.filter(u => propertyIds.includes(u.propertyId));

    const allTenants = await storage.getTenants();
    const filteredUnitIds = filteredUnits.map(u => u.id);
    const filteredTenants = allTenants.filter(t => filteredUnitIds.includes(t.unitId));
    const activeTenants = filteredTenants.filter((t) => t.isActive === 1);
    const occupiedUnits = new Set(activeTenants.map((t) => t.unitId));
    const occupancyRate =
      filteredUnits.length > 0
        ? Math.round((occupiedUnits.size / filteredUnits.length) * 100)
        : 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const allInvoices = await storage.getRentInvoices();
    const filteredInvoices = allInvoices.filter(i => filteredUnitIds.includes(i.unitId));

    const currentMonthInvoices = filteredInvoices.filter(
      (i) => i.month === currentMonth && i.year === currentYear,
    );
    const totalMonthlyIncome = currentMonthInvoices
      .filter((i) => i.status === "paid" || i.status === "late")
      .reduce((sum, i) => sum + parseFloat(i.paidAmount || "0"), 0);
    const outstandingRent = currentMonthInvoices
      .filter((i) => i.status !== "paid")
      .reduce(
        (sum, i) => sum + parseFloat(i.amount) - parseFloat(i.paidAmount || "0"),
        0,
      );

    const totalCollectedAllTime = filteredInvoices
      .filter(i => i.status === "paid" || i.status === "late")
      .reduce((sum, i) => sum + parseFloat(i.paidAmount || "0"), 0);

    const totalRentAllTime = filteredInvoices
      .reduce((sum, i) => sum + parseFloat(i.amount), 0);

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthInvoices = filteredInvoices.filter(
        (inv) => inv.month === m && inv.year === y,
      );
      const collected = monthInvoices
        .filter((inv) => inv.status === "paid" || inv.status === "late")
        .reduce((s, inv) => s + parseFloat(inv.paidAmount || "0"), 0);
      const total = monthInvoices.reduce(
        (s, inv) => s + parseFloat(inv.amount),
        0,
      );
      last6Months.push({
        month: d.toLocaleString("default", { month: "short" }),
        year: y,
        collected,
        total,
      });
    }

    const upcomingExpirations = filteredTenants
      .filter((t) => {
        if (!t.leaseEnd || t.isActive !== 1) return false;
        const end = new Date(t.leaseEnd);
        const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 90;
      })
      .map((t) => ({
        tenantId: t.id,
        tenantName: t.name,
        leaseEnd: t.leaseEnd,
        unitId: t.unitId,
      }));

    let ownerSettlementSummary = null;
    if (user.role !== "super_admin") {
      const mySettlements = await storage.getOwnerSettlementsByUser(user.id);
      const totalEarned = mySettlements.reduce((s, os) => s + parseFloat(os.ownerShare), 0);
      const totalDistributed = mySettlements.reduce((s, os) => s + parseFloat(os.amountDistributed), 0);
      const pendingSettlement = totalEarned - totalDistributed;
      ownerSettlementSummary = { totalEarned, totalDistributed, pendingSettlement };
    }

    res.json({
      totalProperties: allProperties.length,
      totalUnits: filteredUnits.length,
      totalTenants: activeTenants.length,
      occupancyRate,
      totalMonthlyIncome,
      outstandingRent,
      totalCollectedAllTime,
      totalRentAllTime,
      last6Months,
      upcomingExpirations,
      ownerSettlementSummary,
    });
  });

  // Users list (for admin)
  app.get("/api/users", requireAuth, async (req, res) => {
    if (req.user!.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const all = await storage.getUsers();
    const safe = all.map(({ password, ...rest }) => rest);
    res.json(safe);
  });

  return httpServer;
}
