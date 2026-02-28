import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  properties,
  propertyUsers,
  units,
  tenants,
  rentInvoices,
  ownerSettlements,
  payments,
  auditLogs,
  type InsertUser,
  type User,
  type InsertProperty,
  type Property,
  type InsertPropertyUser,
  type PropertyUser,
  type InsertUnit,
  type Unit,
  type InsertTenant,
  type Tenant,
  type InsertRentInvoice,
  type RentInvoice,
  type InsertOwnerSettlement,
  type OwnerSettlement,
  type InsertPayment,
  type Payment,
  type InsertAuditLog,
  type AuditLog,
} from "@shared/schema";

export class DatabaseStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Properties
  async getProperties(): Promise<Property[]> {
    return db.select().from(properties).orderBy(desc(properties.createdAt));
  }
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }
  async createProperty(data: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(data).returning();
    return property;
  }
  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db.update(properties).set(data).where(eq(properties.id, id)).returning();
    return property;
  }
  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }
  async getPropertiesByUser(userId: number): Promise<Property[]> {
    const pu = await db.select().from(propertyUsers).where(
      and(eq(propertyUsers.userId, userId), eq(propertyUsers.status, "approved"))
    );
    if (pu.length === 0) return [];
    const propIds = pu.map(p => p.propertyId);
    const all = await db.select().from(properties);
    return all.filter(p => propIds.includes(p.id));
  }

  // Property Users
  async getPropertyUsers(propertyId: number): Promise<PropertyUser[]> {
    return db.select().from(propertyUsers).where(eq(propertyUsers.propertyId, propertyId));
  }
  async getPropertyUserById(id: number): Promise<PropertyUser | undefined> {
    const [pu] = await db.select().from(propertyUsers).where(eq(propertyUsers.id, id));
    return pu;
  }
  async getPropertyUser(userId: number, propertyId: number): Promise<PropertyUser | undefined> {
    const [pu] = await db.select().from(propertyUsers).where(
      and(eq(propertyUsers.userId, userId), eq(propertyUsers.propertyId, propertyId))
    );
    return pu;
  }
  async createPropertyUser(data: InsertPropertyUser): Promise<PropertyUser> {
    const [pu] = await db.insert(propertyUsers).values(data).returning();
    return pu;
  }
  async updatePropertyUser(id: number, data: Partial<InsertPropertyUser>): Promise<PropertyUser | undefined> {
    const [pu] = await db.update(propertyUsers).set(data).where(eq(propertyUsers.id, id)).returning();
    return pu;
  }
  async getPropertyUsersByUser(userId: number): Promise<PropertyUser[]> {
    return db.select().from(propertyUsers).where(eq(propertyUsers.userId, userId));
  }

  // Units
  async getUnits(propertyId: number): Promise<Unit[]> {
    return db.select().from(units).where(eq(units.propertyId, propertyId));
  }
  async getAllUnits(): Promise<Unit[]> {
    return db.select().from(units);
  }
  async getUnit(id: number): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }
  async createUnit(data: InsertUnit): Promise<Unit> {
    const [unit] = await db.insert(units).values(data).returning();
    return unit;
  }
  async updateUnit(id: number, data: Partial<InsertUnit>): Promise<Unit | undefined> {
    const [unit] = await db.update(units).set(data).where(eq(units.id, id)).returning();
    return unit;
  }
  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return db.select().from(tenants);
  }
  async getTenantsByUnit(unitId: number): Promise<Tenant[]> {
    return db.select().from(tenants).where(eq(tenants.unitId, unitId));
  }
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }
  async createTenant(data: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(data).returning();
    return tenant;
  }
  async updateTenant(id: number, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants).set(data).where(eq(tenants.id, id)).returning();
    return tenant;
  }
  async deleteTenant(id: number): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // Rent Invoices
  async getRentInvoices(): Promise<RentInvoice[]> {
    return db.select().from(rentInvoices).orderBy(desc(rentInvoices.year), desc(rentInvoices.month));
  }
  async getRentInvoicesByTenant(tenantId: number): Promise<RentInvoice[]> {
    return db.select().from(rentInvoices).where(eq(rentInvoices.tenantId, tenantId)).orderBy(desc(rentInvoices.year), desc(rentInvoices.month));
  }
  async getRentInvoice(id: number): Promise<RentInvoice | undefined> {
    const [invoice] = await db.select().from(rentInvoices).where(eq(rentInvoices.id, id));
    return invoice;
  }
  async createRentInvoice(data: InsertRentInvoice): Promise<RentInvoice> {
    const [invoice] = await db.insert(rentInvoices).values(data).returning();
    return invoice;
  }
  async updateRentInvoice(id: number, data: Partial<InsertRentInvoice>): Promise<RentInvoice | undefined> {
    const [invoice] = await db.update(rentInvoices).set(data).where(eq(rentInvoices.id, id)).returning();
    return invoice;
  }
  async getRentInvoicesByMonth(month: number, year: number): Promise<RentInvoice[]> {
    return db.select().from(rentInvoices).where(
      and(eq(rentInvoices.month, month), eq(rentInvoices.year, year))
    );
  }
  async getRentInvoicesByUnit(unitId: number): Promise<RentInvoice[]> {
    return db.select().from(rentInvoices).where(eq(rentInvoices.unitId, unitId)).orderBy(desc(rentInvoices.year), desc(rentInvoices.month));
  }

  // Owner Settlements
  async getOwnerSettlements(propertyId: number): Promise<OwnerSettlement[]> {
    return db.select().from(ownerSettlements).where(eq(ownerSettlements.propertyId, propertyId));
  }
  async getOwnerSettlementsByUser(userId: number): Promise<OwnerSettlement[]> {
    return db.select().from(ownerSettlements).where(eq(ownerSettlements.userId, userId));
  }
  async createOwnerSettlement(data: InsertOwnerSettlement): Promise<OwnerSettlement> {
    const [s] = await db.insert(ownerSettlements).values(data).returning();
    return s;
  }
  async updateOwnerSettlement(id: number, data: Partial<InsertOwnerSettlement>): Promise<OwnerSettlement | undefined> {
    const [s] = await db.update(ownerSettlements).set(data).where(eq(ownerSettlements.id, id)).returning();
    return s;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }
  async getPayment(id: number): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments).where(eq(payments.id, id));
    return p;
  }
  async createPayment(data: InsertPayment): Promise<Payment> {
    const [p] = await db.insert(payments).values(data).returning();
    return p;
  }
  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [p] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return p;
  }

  // Audit Logs
  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
