import { storage } from "./storage";
import { db } from "./db";
import { properties, units, tenants, rentInvoices } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await storage.getProperties();
  if (existing.length > 0) return;

  const prop1 = await storage.createProperty({
    name: "Sunset Heights",
    address: "45 Main Boulevard, Gulberg III, Lahore",
    type: "residential",
    ownershipType: "single",
    totalUnits: 4,
  });

  const prop2 = await storage.createProperty({
    name: "Blue Horizon Plaza",
    address: "12 Shahrah-e-Faisal, Karachi",
    type: "commercial",
    ownershipType: "single",
    totalUnits: 3,
  });

  const prop3 = await storage.createProperty({
    name: "Green Valley Residences",
    address: "78 F-7/2, Islamabad",
    type: "residential",
    ownershipType: "multi",
    totalUnits: 6,
  });

  const prop4 = await storage.createProperty({
    name: "Downtown Business Center",
    address: "23 Mall Road, Rawalpindi",
    type: "commercial",
    ownershipType: "single",
    totalUnits: 2,
  });

  const u1 = await storage.createUnit({ propertyId: prop1.id, unitName: "Apt 101", monthlyRent: "45000" });
  const u2 = await storage.createUnit({ propertyId: prop1.id, unitName: "Apt 102", monthlyRent: "50000" });
  const u3 = await storage.createUnit({ propertyId: prop1.id, unitName: "Apt 201", monthlyRent: "55000" });
  const u4 = await storage.createUnit({ propertyId: prop1.id, unitName: "Apt 202", monthlyRent: "48000" });

  const u5 = await storage.createUnit({ propertyId: prop2.id, unitName: "Office A", monthlyRent: "120000" });
  const u6 = await storage.createUnit({ propertyId: prop2.id, unitName: "Office B", monthlyRent: "95000" });
  const u7 = await storage.createUnit({ propertyId: prop2.id, unitName: "Office C", monthlyRent: "110000" });

  const u8 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 1", monthlyRent: "85000" });
  const u9 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 2", monthlyRent: "90000" });
  const u10 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 3", monthlyRent: "80000" });
  const u11 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 4", monthlyRent: "92000" });
  const u12 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 5", monthlyRent: "88000" });
  const u13 = await storage.createUnit({ propertyId: prop3.id, unitName: "Villa 6", monthlyRent: "87000" });

  const u14 = await storage.createUnit({ propertyId: prop4.id, unitName: "Suite 1", monthlyRent: "75000" });
  const u15 = await storage.createUnit({ propertyId: prop4.id, unitName: "Suite 2", monthlyRent: "80000" });

  const t1 = await storage.createTenant({ unitId: u1.id, name: "Ahmed Khan", phone: "+92-300-1234567", email: "ahmed.khan@email.com", leaseStart: "2025-01-01", leaseEnd: "2026-12-31", securityDeposit: "90000", rentDueDay: 5, isActive: 1 });
  const t2 = await storage.createTenant({ unitId: u2.id, name: "Sara Malik", phone: "+92-321-9876543", email: "sara.malik@email.com", leaseStart: "2025-03-01", leaseEnd: "2026-02-28", securityDeposit: "100000", rentDueDay: 1, isActive: 1 });
  const t3 = await storage.createTenant({ unitId: u3.id, name: "Bilal Hussain", phone: "+92-333-4567890", email: "bilal.h@email.com", leaseStart: "2024-06-15", leaseEnd: "2026-06-14", securityDeposit: "110000", rentDueDay: 10, isActive: 1 });
  const t4 = await storage.createTenant({ unitId: u5.id, name: "TechCorp Solutions", phone: "+92-21-35678901", email: "info@techcorp.pk", leaseStart: "2025-01-01", leaseEnd: "2027-12-31", securityDeposit: "360000", rentDueDay: 1, isActive: 1 });
  const t5 = await storage.createTenant({ unitId: u6.id, name: "Global Trading LLC", phone: "+92-21-34567890", email: "accounts@globaltrading.pk", leaseStart: "2025-02-01", leaseEnd: "2026-01-31", securityDeposit: "285000", rentDueDay: 5, isActive: 1 });
  const t6 = await storage.createTenant({ unitId: u8.id, name: "Fatima Noor", phone: "+92-345-6789012", email: "fatima.noor@email.com", leaseStart: "2025-04-01", leaseEnd: "2026-03-31", securityDeposit: "170000", rentDueDay: 1, isActive: 1 });
  const t7 = await storage.createTenant({ unitId: u9.id, name: "Usman Ali", phone: "+92-311-2345678", email: "usman.ali@email.com", leaseStart: "2024-09-01", leaseEnd: "2026-08-31", securityDeposit: "180000", rentDueDay: 3, isActive: 1 });
  const t8 = await storage.createTenant({ unitId: u14.id, name: "Nexus Consulting", phone: "+92-51-2345678", email: "billing@nexus.pk", leaseStart: "2025-05-01", leaseEnd: "2026-04-30", securityDeposit: "150000", rentDueDay: 1, isActive: 1 });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const allTenantUnits = [
    { t: t1, u: u1 }, { t: t2, u: u2 }, { t: t3, u: u3 },
    { t: t4, u: u5 }, { t: t5, u: u6 }, { t: t6, u: u8 },
    { t: t7, u: u9 }, { t: t8, u: u14 },
  ];

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(currentYear, currentMonth - 1 - offset, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    for (const { t, u } of allTenantUnits) {
      const leaseStartDate = new Date(t.leaseStart);
      if (new Date(y, m - 1) < new Date(leaseStartDate.getFullYear(), leaseStartDate.getMonth())) continue;

      const isPastMonth = offset > 0;
      let status: "paid" | "late" | "partial" | "unpaid";
      let paidAmount = "0";
      let paidDate: string | null = null;
      let paymentMethod: string | null = null;

      if (isPastMonth) {
        const rand = Math.random();
        if (rand < 0.7) {
          status = "paid";
          paidAmount = u.monthlyRent;
          paidDate = `${y}-${String(m).padStart(2, "0")}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, "0")}`;
          paymentMethod = ["bank_transfer", "cash", "cheque", "online"][Math.floor(Math.random() * 4)];
        } else if (rand < 0.85) {
          status = "late";
          paidAmount = u.monthlyRent;
          paidDate = `${y}-${String(m).padStart(2, "0")}-${String(Math.floor(Math.random() * 15) + 15).padStart(2, "0")}`;
          paymentMethod = "cash";
        } else if (rand < 0.95) {
          status = "partial";
          paidAmount = String(Math.round(parseFloat(u.monthlyRent) * 0.5));
          paidDate = `${y}-${String(m).padStart(2, "0")}-10`;
          paymentMethod = "cash";
        } else {
          status = "unpaid";
        }
      } else {
        const rand = Math.random();
        if (rand < 0.4) {
          status = "paid";
          paidAmount = u.monthlyRent;
          paidDate = `${y}-${String(m).padStart(2, "0")}-03`;
          paymentMethod = "bank_transfer";
        } else {
          status = "unpaid";
        }
      }

      await storage.createRentInvoice({
        tenantId: t.id,
        unitId: u.id,
        month: m,
        year: y,
        amount: u.monthlyRent,
        status,
        paidAmount,
        paidDate,
        paymentMethod,
        receiptNumber: `RNT-${y}${String(m).padStart(2, "0")}-${t.id}`,
      });
    }
  }
}
