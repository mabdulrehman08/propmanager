import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPropertySchema,
  insertUnitSchema,
  insertTenantSchema,
  insertRentInvoiceSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Properties
  app.get("/api/properties", async (_req, res) => {
    const data = await storage.getProperties();
    res.json(data);
  });

  app.get("/api/properties/:id", async (req, res) => {
    const property = await storage.getProperty(Number(req.params.id));
    if (!property) return res.status(404).json({ message: "Not found" });
    res.json(property);
  });

  app.post("/api/properties", async (req, res) => {
    const parsed = insertPropertySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const property = await storage.createProperty(parsed.data);
    res.status(201).json(property);
  });

  app.patch("/api/properties/:id", async (req, res) => {
    const parsed = insertPropertySchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const property = await storage.updateProperty(
      Number(req.params.id),
      parsed.data,
    );
    if (!property) return res.status(404).json({ message: "Not found" });
    res.json(property);
  });

  app.delete("/api/properties/:id", async (req, res) => {
    await storage.deleteProperty(Number(req.params.id));
    res.status(204).send();
  });

  // Units
  app.get("/api/properties/:propertyId/units", async (req, res) => {
    const data = await storage.getUnits(Number(req.params.propertyId));
    res.json(data);
  });

  app.get("/api/units", async (_req, res) => {
    const data = await storage.getAllUnits();
    res.json(data);
  });

  app.get("/api/units/:id", async (req, res) => {
    const unit = await storage.getUnit(Number(req.params.id));
    if (!unit) return res.status(404).json({ message: "Not found" });
    res.json(unit);
  });

  app.post("/api/units", async (req, res) => {
    const parsed = insertUnitSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.createUnit(parsed.data);
    res.status(201).json(unit);
  });

  app.patch("/api/units/:id", async (req, res) => {
    const parsed = insertUnitSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.updateUnit(Number(req.params.id), parsed.data);
    if (!unit) return res.status(404).json({ message: "Not found" });
    res.json(unit);
  });

  app.delete("/api/units/:id", async (req, res) => {
    await storage.deleteUnit(Number(req.params.id));
    res.status(204).send();
  });

  // Tenants
  app.get("/api/tenants", async (_req, res) => {
    const data = await storage.getTenants();
    res.json(data);
  });

  app.get("/api/tenants/:id", async (req, res) => {
    const tenant = await storage.getTenant(Number(req.params.id));
    if (!tenant) return res.status(404).json({ message: "Not found" });
    res.json(tenant);
  });

  app.post("/api/tenants", async (req, res) => {
    const parsed = insertTenantSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const tenant = await storage.createTenant(parsed.data);
    res.status(201).json(tenant);
  });

  app.patch("/api/tenants/:id", async (req, res) => {
    const parsed = insertTenantSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const tenant = await storage.updateTenant(
      Number(req.params.id),
      parsed.data,
    );
    if (!tenant) return res.status(404).json({ message: "Not found" });
    res.json(tenant);
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    await storage.deleteTenant(Number(req.params.id));
    res.status(204).send();
  });

  // Rent Invoices
  app.get("/api/invoices", async (_req, res) => {
    const data = await storage.getRentInvoices();
    res.json(data);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getRentInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json(invoice);
  });

  app.post("/api/invoices", async (req, res) => {
    const parsed = insertRentInvoiceSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const invoice = await storage.createRentInvoice(parsed.data);
    res.status(201).json(invoice);
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    const parsed = insertRentInvoiceSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.message });
    const invoice = await storage.updateRentInvoice(
      Number(req.params.id),
      parsed.data,
    );
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json(invoice);
  });

  app.get("/api/tenants/:tenantId/invoices", async (req, res) => {
    const data = await storage.getRentInvoicesByTenant(
      Number(req.params.tenantId),
    );
    res.json(data);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    const [allProperties, allUnits, allTenants, allInvoices] =
      await Promise.all([
        storage.getProperties(),
        storage.getAllUnits(),
        storage.getTenants(),
        storage.getRentInvoices(),
      ]);

    const activeTenants = allTenants.filter((t) => t.isActive === 1);
    const occupiedUnits = new Set(activeTenants.map((t) => t.unitId));
    const occupancyRate =
      allUnits.length > 0
        ? Math.round((occupiedUnits.size / allUnits.length) * 100)
        : 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthInvoices = allInvoices.filter(
      (i) => i.month === currentMonth && i.year === currentYear,
    );
    const totalMonthlyIncome = currentMonthInvoices
      .filter((i) => i.status === "paid" || i.status === "late")
      .reduce((sum, i) => sum + parseFloat(i.paidAmount || "0"), 0);
    const outstandingRent = currentMonthInvoices
      .filter((i) => i.status !== "paid")
      .reduce(
        (sum, i) =>
          sum + parseFloat(i.amount) - parseFloat(i.paidAmount || "0"),
        0,
      );

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthInvoices = allInvoices.filter(
        (inv) => inv.month === m && inv.year === y,
      );
      const collected = monthInvoices
        .filter(
          (inv) => inv.status === "paid" || inv.status === "late",
        )
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

    const upcomingExpirations = allTenants
      .filter((t) => {
        if (!t.leaseEnd || t.isActive !== 1) return false;
        const end = new Date(t.leaseEnd);
        const diff =
          (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 90;
      })
      .map((t) => ({
        tenantId: t.id,
        tenantName: t.name,
        leaseEnd: t.leaseEnd,
        unitId: t.unitId,
      }));

    res.json({
      totalProperties: allProperties.length,
      totalUnits: allUnits.length,
      totalTenants: activeTenants.length,
      occupancyRate,
      totalMonthlyIncome,
      outstandingRent,
      last6Months,
      upcomingExpirations,
    });
  });

  // Generate invoices for a month
  app.post("/api/invoices/generate", async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    const allTenants = await storage.getTenants();
    const activeTenants = allTenants.filter((t) => t.isActive === 1);
    const existingInvoices = await storage.getRentInvoicesByMonth(
      month,
      year,
    );
    const existingTenantIds = new Set(
      existingInvoices.map((i) => i.tenantId),
    );

    const created: any[] = [];
    for (const tenant of activeTenants) {
      if (existingTenantIds.has(tenant.id)) continue;
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) continue;
      const receiptNum = `RNT-${year}${String(month).padStart(2, "0")}-${tenant.id}`;
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
  app.post("/api/invoices/:id/pay", async (req, res) => {
    const { paidAmount, paymentMethod } = req.body;
    const invoice = await storage.getRentInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Not found" });

    const paid = parseFloat(paidAmount || invoice.amount);
    const total = parseFloat(invoice.amount);

    if (paid < 0) {
      return res
        .status(400)
        .json({ message: "Payment amount cannot be negative" });
    }
    if (paid > total) {
      return res
        .status(400)
        .json({ message: "Payment amount cannot exceed invoice total" });
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
    res.json(updated);
  });

  return httpServer;
}
