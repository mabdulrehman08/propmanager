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
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "property_owner",
  "co_owner",
  "accountant",
  "tenant",
]);
export const accessStatusEnum = pgEnum("access_status", [
  "pending",
  "approved",
  "rejected",
]);
export const paymentSourceEnum = pgEnum("payment_source", [
  "manual",
  "bank",
  "online",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "matched",
  "unmatched",
]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("property_owner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyUsers = pgTable("property_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("co_owner"),
  status: accessStatusEnum("status").notNull().default("pending"),
  ownershipPercent: decimal("ownership_percent", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: propertyTypeEnum("type").notNull().default("residential"),
  ownershipType: ownershipTypeEnum("ownership_type")
    .notNull()
    .default("single"),
  totalUnits: integer("total_units").notNull().default(1),
  createdById: integer("created_by_id").references(() => users.id),
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
  isHistorical: integer("is_historical").notNull().default(0),
  isDisputed: integer("is_disputed").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ownerSettlements = pgTable("owner_settlements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalRent: decimal("total_rent", { precision: 12, scale: 2 }).notNull().default("0"),
  ownerShare: decimal("owner_share", { precision: 12, scale: 2 }).notNull().default("0"),
  amountDistributed: decimal("amount_distributed", { precision: 12, scale: 2 }).notNull().default("0"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  referenceNumber: text("reference_number"),
  source: paymentSourceEnum("source").notNull().default("manual"),
  matchedInvoiceId: integer("matched_invoice_id").references(() => rentInvoices.id),
  status: matchStatusEnum("status").notNull().default("unmatched"),
  tenantName: text("tenant_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  tableName: text("table_name"),
  recordId: integer("record_id"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});
export const insertPropertyUserSchema = createInsertSchema(propertyUsers).omit({
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
export const insertOwnerSettlementSchema = createInsertSchema(ownerSettlements).omit({
  id: true,
  createdAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type InsertPropertyUser = z.infer<typeof insertPropertyUserSchema>;
export type PropertyUser = typeof propertyUsers.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertRentInvoice = z.infer<typeof insertRentInvoiceSchema>;
export type RentInvoice = typeof rentInvoices.$inferSelect;
export type InsertOwnerSettlement = z.infer<typeof insertOwnerSettlementSchema>;
export type OwnerSettlement = typeof ownerSettlements.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
