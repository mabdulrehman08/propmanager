import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  properties,
  units,
  tenants,
  rentInvoices,
  type InsertProperty,
  type Property,
  type InsertUnit,
  type Unit,
  type InsertTenant,
  type Tenant,
  type InsertRentInvoice,
  type RentInvoice,
} from "@shared/schema";

export interface IStorage {
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(data: InsertProperty): Promise<Property>;
  updateProperty(
    id: number,
    data: Partial<InsertProperty>,
  ): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;

  getUnits(propertyId: number): Promise<Unit[]>;
  getAllUnits(): Promise<Unit[]>;
  getUnit(id: number): Promise<Unit | undefined>;
  createUnit(data: InsertUnit): Promise<Unit>;
  updateUnit(id: number, data: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<void>;

  getTenants(): Promise<Tenant[]>;
  getTenantsByUnit(unitId: number): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  createTenant(data: InsertTenant): Promise<Tenant>;
  updateTenant(
    id: number,
    data: Partial<InsertTenant>,
  ): Promise<Tenant | undefined>;
  deleteTenant(id: number): Promise<void>;

  getRentInvoices(): Promise<RentInvoice[]>;
  getRentInvoicesByTenant(tenantId: number): Promise<RentInvoice[]>;
  getRentInvoice(id: number): Promise<RentInvoice | undefined>;
  createRentInvoice(data: InsertRentInvoice): Promise<RentInvoice>;
  updateRentInvoice(
    id: number,
    data: Partial<InsertRentInvoice>,
  ): Promise<RentInvoice | undefined>;
  getRentInvoicesByMonth(
    month: number,
    year: number,
  ): Promise<RentInvoice[]>;
}

export class DatabaseStorage implements IStorage {
  async getProperties(): Promise<Property[]> {
    return db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  async createProperty(data: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(data).returning();
    return property;
  }

  async updateProperty(
    id: number,
    data: Partial<InsertProperty>,
  ): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(data)
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

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

  async updateUnit(
    id: number,
    data: Partial<InsertUnit>,
  ): Promise<Unit | undefined> {
    const [unit] = await db
      .update(units)
      .set(data)
      .where(eq(units.id, id))
      .returning();
    return unit;
  }

  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  async getTenants(): Promise<Tenant[]> {
    return db.select().from(tenants);
  }

  async getTenantsByUnit(unitId: number): Promise<Tenant[]> {
    return db.select().from(tenants).where(eq(tenants.unitId, unitId));
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(data: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(data).returning();
    return tenant;
  }

  async updateTenant(
    id: number,
    data: Partial<InsertTenant>,
  ): Promise<Tenant | undefined> {
    const [tenant] = await db
      .update(tenants)
      .set(data)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async deleteTenant(id: number): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  async getRentInvoices(): Promise<RentInvoice[]> {
    return db
      .select()
      .from(rentInvoices)
      .orderBy(desc(rentInvoices.year), desc(rentInvoices.month));
  }

  async getRentInvoicesByTenant(tenantId: number): Promise<RentInvoice[]> {
    return db
      .select()
      .from(rentInvoices)
      .where(eq(rentInvoices.tenantId, tenantId))
      .orderBy(desc(rentInvoices.year), desc(rentInvoices.month));
  }

  async getRentInvoice(id: number): Promise<RentInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(rentInvoices)
      .where(eq(rentInvoices.id, id));
    return invoice;
  }

  async createRentInvoice(data: InsertRentInvoice): Promise<RentInvoice> {
    const [invoice] = await db
      .insert(rentInvoices)
      .values(data)
      .returning();
    return invoice;
  }

  async updateRentInvoice(
    id: number,
    data: Partial<InsertRentInvoice>,
  ): Promise<RentInvoice | undefined> {
    const [invoice] = await db
      .update(rentInvoices)
      .set(data)
      .where(eq(rentInvoices.id, id))
      .returning();
    return invoice;
  }

  async getRentInvoicesByMonth(
    month: number,
    year: number,
  ): Promise<RentInvoice[]> {
    return db
      .select()
      .from(rentInvoices)
      .where(
        and(eq(rentInvoices.month, month), eq(rentInvoices.year, year)),
      );
  }
}

export const storage = new DatabaseStorage();
