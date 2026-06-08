# ABCD ERP System - 5-Pillar Security Suite

Welcome to the **ABCD ERP System** (Next.js 16 + Prisma + PostgreSQL + Redis). This repository contains the Core administrative and security suite, incorporating corporate structures, RBAC permissions, and granular compliance audits.

---

## 🚀 Getting Started

Follow these steps to spin up the local development environment, database services, and mock seeding.

### Prerequisites
- **Node.js** (v20+ recommended)
- **Docker** (to host Redis, PostgreSQL is also packaged in `docker-compose.yml` but if a local PostgreSQL is already active on port `5435`, it will be utilized).

---

### Step 1: Environment Configuration

Verify or create a `.env` and `.env.local` file in your project root with the following variables:

```env
DATABASE_URL="postgresql://admin:changeme@localhost:5435/trace_compliance_master"
REDIS_URL="redis://localhost:6379"
```

*Note: Ensure `license_public_key.pub` and a valid `license.txt` exist in the root of the project to satisfy licensing validation middleware.*

---

### Step 2: Database Setup & Seeding

1. **Spin up Docker Services** (starts Redis):
   ```bash
   docker-compose up -d
   ```
   *If a port allocation conflict occurs for PostgreSQL (port `5435`), it indicates that your local system already hosts a Postgres instance on that port. In this case, the Docker container for Postgres will exit, and the system will connect directly to your local database.*

2. **Synchronize DB Schema**:
   Push the Prisma models to your active PostgreSQL instance (accepting data loss to wipe any legacy/mismatched tables):
   ```bash
   npx prisma db push --accept-data-loss
   ```

3. **Populate Initial Seeds**:
   Execute the Prisma seed script to populate your database with structured entities, menus, roles, permissions, and tester users:
   ```bash
   npx prisma db seed
   ```

---

### Step 3: Run the Development Server

Start the local Next.js dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal outputs, e.g., `http://localhost:3001`) with your browser to launch the dashboard.

---

## 🛡️ 5-Pillar Access Control & Tester Hats

We have configured **5 Tester Hats** that you can alternate directly inside the application header bar:

1. **CEO Boss** (`usr-ceo` / Rank 10):
   * *Role*: Standard
   * *Clearance*: Highest operational rank (10).
   * *Default Page*: Auto-redirects to **My Profile** (cannot access Company Setup administrative menus).
2. **IT Admin** (`usr-super-admin` / Rank 8):
   * *Role*: Super Admin
   * *Clearance*: Level 8. Full access to modify Company Setup, users, roles, settings, licensing, and workflow triggers.
3. **HR Manager** (`usr-hr-mgr` / Rank 6):
   * *Role*: Admin
   * *Clearance*: Level 6. Authorized to access Company Setup, add/edit entities, and manage HR departments.
4. **HR Specialist** (`usr-hr-spec` / Rank 3):
   * *Role*: Standard
   * *Clearance*: Level 3. Auto-redirects to **My Profile** (cannot view administrative configs).
5. **Auditor** (`usr-auditor` / Rank 4):
   * *Role*: Standard + Bypass
   * *Clearance*: Level 4. Granted `complianceBypass` permissions, allowing them to audit all logs.
