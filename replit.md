# PropManager - Property Management Platform

## Overview
Universal Property Management & Multi-Owner Rent Settlement Platform. Supports individual landlords with properties, tenant management, and automated rent tracking.

## Tech Stack
- **Frontend**: React, TailwindCSS, Recharts, Shadcn UI, Wouter routing
- **Backend**: Express.js, PostgreSQL, Drizzle ORM
- **Database**: PostgreSQL with Drizzle schema push

## Architecture
```
client/src/
  pages/        - Dashboard, Properties, Tenants, RentCollection
  components/   - AppSidebar, Shadcn UI components
  lib/          - Query client, utils
shared/
  schema.ts     - Drizzle schema (properties, units, tenants, rentInvoices)
server/
  routes.ts     - Express API routes
  storage.ts    - Database storage layer
  db.ts         - Database connection
  seed.ts       - Seed data
```

## Data Model
- **properties**: name, address, type (residential/commercial), ownershipType (single/multi), totalUnits
- **units**: propertyId, unitName, monthlyRent
- **tenants**: unitId, name, phone, email, leaseStart/End, securityDeposit, rentDueDay, isActive
- **rentInvoices**: tenantId, unitId, month, year, amount, status (paid/late/partial/unpaid), paidAmount, paidDate, paymentMethod, receiptNumber

## API Endpoints
- `GET/POST /api/properties` - CRUD properties
- `GET/POST /api/units` - CRUD units
- `GET/POST /api/tenants` - CRUD tenants
- `GET/POST /api/invoices` - CRUD invoices
- `POST /api/invoices/generate` - Generate invoices for a month
- `POST /api/invoices/:id/pay` - Mark invoice as paid
- `GET /api/dashboard/stats` - Dashboard statistics

## Currency
- PKR (Pakistani Rupee) format
- All amounts stored as decimal(12,2)
