import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
]);
export const ownershipTypeEnum = pgEnum("ownership_type", [
  "single",
  "multi",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "late",
  "partial",
  "unpaid",
]);

export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: propertyTypeEnum("type").notNull().default("residential"),
  ownershipType: ownershipTypeEnum("ownership_type")
    .notNull()
    .default("single"),
  totalUnits: integer("total_units").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const units = pgTable("units", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitName: text("unit_name").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
});

export const tenants = pgTable("tenants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  leaseStart: date("lease_start").notNull(),
  leaseEnd: date("lease_end"),
  securityDeposit: decimal("security_deposit", {
    precision: 12,
    scale: 2,
  }).default("0"),
  rentDueDay: integer("rent_due_day").notNull().default(1),
  isActive: integer("is_active").notNull().default(1),
});

export const rentInvoices = pgTable("rent_invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("unpaid"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paidDate: date("paid_date"),
  paymentMethod: text("payment_method"),
  receiptNumber: text("receipt_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});
export const insertUnitSchema = createInsertSchema(units).omit({ id: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
});
export const insertRentInvoiceSchema = createInsertSchema(rentInvoices).omit({
  id: true,
  createdAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertRentInvoice = z.infer<typeof insertRentInvoiceSchema>;
export type RentInvoice = typeof rentInvoices.$inferSelect;
