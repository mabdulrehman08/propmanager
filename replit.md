# PropManager - Multi-Owner Property Management & Rent Settlement Platform

## Overview
Universal Property Management platform supporting multi-party ownership, role-based access with approval workflow, historical rent reconstruction back to 2015, multi-owner settlement engine, payment matching, and audit logging.

## Tech Stack
- **Frontend**: React, TailwindCSS, Recharts, Shadcn UI, Wouter routing
- **Backend**: Express.js, PostgreSQL, Drizzle ORM
- **Auth**: Passport.js (Local Strategy), express-session, connect-pg-simple
- **Database**: Replit cloud PostgreSQL (Neon) via DATABASE_URL

## Architecture
```
client/src/
  pages/        - Dashboard, Properties, Tenants, RentCollection, Settlements, Payments, AuditLogs, Auth
  components/   - AppSidebar, Shadcn UI components
  hooks/        - useAuth, useToast, useMobile
  lib/          - Query client, utils
shared/
  schema.ts     - Drizzle schema (users, properties, propertyUsers, units, tenants, rentInvoices, ownerSettlements, payments, auditLogs)
server/
  auth.ts       - Passport auth setup, register/login/logout endpoints
  routes.ts     - Express API routes (all auth-protected)
  storage.ts    - DatabaseStorage class
  db.ts         - Database connection (pool + drizzle)
  seed.ts       - Seed data with users and properties
  github.ts     - GitHub integration via @octokit/rest
```

## Data Model
- **users**: username, password (hashed), fullName, email, phone, role (super_admin/property_owner/co_owner/accountant/tenant)
- **propertyUsers**: userId, propertyId, role, status (pending/approved/rejected), ownershipPercent
- **properties**: name, address, type, ownershipType, totalUnits, createdById
- **units**: propertyId, unitName, monthlyRent
- **tenants**: unitId, name, phone, email, leaseStart/End, securityDeposit, rentDueDay, isActive
- **rentInvoices**: tenantId, unitId, month, year, amount, status, paidAmount, paidDate, paymentMethod, receiptNumber, isHistorical, isDisputed, notes
- **ownerSettlements**: propertyId, userId, month, year, totalRent, ownerShare, amountDistributed, balance
- **payments**: amount, date, referenceNumber, source, matchedInvoiceId, status (matched/unmatched), tenantName
- **auditLogs**: userId, action, tableName, recordId, oldValue, newValue

## Key Features
1. **Role-based auth** with approval workflow (property_users table)
2. **Historical rent reconstruction** - reverse-compound from current rent back to 2015
3. **Multi-owner settlement engine** - calculate owner shares based on ownership percentage
4. **Payment matching** - auto-match incoming payments to unpaid invoices
5. **Audit logging** - all financial changes tracked with old/new values
6. **Data visibility control** - users only see approved properties

## API Endpoints
- `POST /api/auth/register|login|logout` - Authentication
- `GET /api/auth/me` - Current user
- `GET/POST /api/properties` - Properties (filtered by user access)
- `GET/POST /api/properties/:id/users` - Property users/access
- `POST /api/properties/:id/request-access` - Request access
- `PATCH /api/property-users/:id/approve|reject` - Approve/reject access
- `GET/POST /api/units` - Units
- `GET/POST /api/tenants` - Tenants
- `GET/POST /api/invoices` - Invoices
- `POST /api/invoices/generate` - Generate monthly invoices
- `POST /api/invoices/:id/pay` - Mark invoice paid
- `POST /api/units/:id/reconstruct-history` - Reconstruct rent history
- `GET/POST /api/properties/:id/calculate-settlements` - Owner settlements
- `GET /api/settlements/my` - Current user settlements
- `GET/POST /api/payments` - Payment tracking
- `GET /api/audit-logs` - Audit log (super_admin only)
- `GET /api/dashboard/stats` - Dashboard statistics

## Demo Accounts
- **Admin**: admin / admin123 (super_admin - sees everything)
- **Owner**: ahmed_owner / owner123 (property_owner)
- **Co-Owner**: sara_owner / owner123 (co_owner)

## Currency
- PKR (Pakistani Rupee) format
- All money stored as decimal(12,2)

## GitHub
- Repo: https://github.com/mabdulrehman08/propmanager
- Connection ID: connection:conn_github_01KJGZQ8M7XECN1BJAKVQZT2SF
