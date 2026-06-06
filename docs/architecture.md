# ATOMIC HR: Enterprise Architecture & Technical Blueprint

This document serves as the complete technical specification for Atomic HR, a highly scalable, commercial Human Resource Information System (HRIS), Timekeeping, and Payroll platform. The architecture emphasizes a shared-nothing, micro-modular design that adapts dynamically to client licenses, integrating strict Philippine regulatory compliance (BIR, DOLE, DPA 2012) directly into its foundation.

---

## 1. Architectural Philosophy & Core Pillars

The system operates on three foundational principles: **Strict Modularity**, **Immutability**, and **Privacy by Design**. The architecture follows a Shared-Nothing pattern across three bounded contexts:

* **HRIS (Core):** Owns the `Employee` profile data, organizational hierarchy, contract terms, and leave balances.
* **Timekeeping:** Owns the `Worker` logs, raw attendance punch data, shifts, schedules, and calculated payable hours.
* **Payroll:** Owns the `Payee` ledger, salary profiles, tax statuses, custom allowances, and generated payslips.

To accommodate wildly varying client policies without changing source code, the application uses a Data-Driven Rule Engine where client configurations (grace periods, custom overtime) are saved directly into PostgreSQL as `JSONB` schemas.

---

## 2. The Comprehensive Tech Stack

| Tier | Technology | Architectural Role |
| --- | --- | --- |
| **Cloud Frontend & API** | **Next.js (TypeScript)** | Unified repository handling role-based routing, Employee Portal PWA delivery, and modular feature flagging. |
| **Identity & Auth** | **Auth.js (NextAuth)** | Manages JWT sessions, credential logins, and enterprise SSO connections securely within the Next.js environment. |
| **Database Engine** | **PostgreSQL** | Primary state store utilizing `JSONB` for flexible rules, Row-Level Security for isolation, and native triggers for immutable audit logs. |
| **Message Broker** | **Redis** | Pub/Sub event bus enabling decoupled module communication, in-memory caching, and API rate limiting. |
| **Document Storage** | **MinIO** | S3-compatible object storage managing 201 files, scanned consent forms, and contracts without bloating the relational database. |
| **Edge Hardware Agent** | **Tauri (Rust) + C++** | Deployed on a Raspberry Pi 5. Interfaces directly with ZKTeco devices via native C++ shared objects for flawless biometric syncing. |
| **Infrastructure** | **Docker & Portainer** | Containerized delivery allowing automated provisioning of specific module combinations per client license. |
| **Internal Licensing (Keymaster)** | **SQLite + Node.js** `crypto` | Dedicated internal SQLite ledger using AES-256-GCM encryption-at-rest for keys, and RSA/ECDSA for signing licenses. |

---

## 3. Authentication & Role-Based Access Control (RBAC)

To protect corporate data and ensure users only interact with their permitted modules, Atomic HR enforces a strict, multi-tiered RBAC model.

### A. The Role Hierarchy

* **System Admin:** Your internal team. Manages tenant creation, global licensing, and feature flags.
* **Tenant Executive (HR_Exec):** The client's top-level administrator. Can access confidential payroll, modify rule engines, and view all branches.
* **HR Standard:** Manages standard employee profiles, leaves, and processes non-confidential payroll.
* **Timekeeper:** Restricted access. Can only view/edit shift schedules and resolve biometric log discrepancies.
* **Employee:** Self-service portal access only (view own payslips, file own leaves).

### B. The Three-Layer Enforcement Strategy

Security cannot rely on the frontend alone. Access is verified at three distinct boundaries:

1. **Edge/Routing Layer (Next.js Middleware):** Intercepts incoming requests. If an `Employee` attempts to navigate to `/admin/payroll`, the middleware rejects the request before the page even renders.
2. **API/Controller Layer:** Every Next.js API route or Server Action decodes the JWT session token to verify the `role` claim before executing business logic.
3. **Database Layer (PostgreSQL RLS):** The ultimate failsafe. The Next.js API injects the user's role into the database transaction (`SET LOCAL app.current_role = 'Timekeeper'`). PostgreSQL Row-Level Security policies explicitly block a Timekeeper from selecting from the `payees` table, returning zero rows even if an API bug allowed the query to execute.

---

## 4. Data Integration & Event-Driven Pipeline

Modules interact without hard database dependencies via two standardized methods:

* **Standardized API Boundaries:** Payroll does not query Timekeeping. It exposes `POST /api/v1/payroll/timesheets`. Timekeeping pushes computed logs here. If Timekeeping is unlicensed, HR uploads a CSV mapping to the exact same JSON payload.
* **Redis Event Bus (Pub/Sub):** When an employee's salary is updated in HRIS, an `EMPLOYEE_SALARY_CHANGED` event is published to Redis. The Payroll module catches this and updates its internal ledger. HRIS remains unaware of Payroll's existence.

---

## 5. The Edge-to-Cloud Biometric Pipeline

Interfacing cloud software with local network biometric devices (ZKTeco K14) requires high fault tolerance and strict privacy boundaries.

* **Direct C++ Binding:** The Tauri Rust agent uses Foreign Function Interface (FFI) to bind to ZKTeco's official C++ SDK, eliminating remote enrollment failures.
* **Privacy-First Extraction:** The agent strictly pulls *attendance logs* (Time In/Out). Raw fingerprint templates remain encrypted on the physical device unless explicit, documented consent is provided for cloud synchronization.
* **Offline Resilience:** The agent continuously polls the K14. Raw logs are saved to a local SQLite database on the Pi 5. Upon internet connection restoration, the agent performs a secure batch upload to the Next.js API.

---

## 6. Durable Workflow Engine

For long-running, asynchronous tasks (e.g., multi-stage leave approvals or data retention schedules), the system utilizes a self-hosted state machine within PostgreSQL to guarantee durability across server restarts.

* **The State Store:** A `workflows` table tracks `workflow_type`, `status`, `current_step`, and a `JSONB payload`.
* **The Execution Daemon:** A background cron service wakes up at regular intervals, pulls rows where `status = 'pending'`, executes the required action, and safely updates the step within a database transaction.

---

## 7. Document Management (MinIO)

To manage large files securely and efficiently:

* Next.js generates a Pre-Signed URL.
* The client's browser uploads the file directly to the MinIO container, bypassing the Node backend entirely.
* PostgreSQL only stores the metadata and the S3-compatible path (e.g., `s3://atomic-hr/tenant-hq/emp-101/contract.pdf`).

---

## 8. Security, Confidentiality & Audit Trail

Corporate ledgers demand undeniable traceability and strict access control, especially regarding executive compensation.

### Dual-Layer Confidentiality

* **Logical Separation:** PostgreSQL RLS restricts read access based on `pay_group`. Standard HR API queries automatically filter out confidential rows unless the authenticated session holds the `HR_Exec` role.
* **Cryptographic Separation:** Financial fields are encrypted within the Next.js application layer before insertion. Database administrators querying raw tables will only see ciphertext.

### Immutable Audit Logging

An append-only, database-level audit trail guarantees compliance.

* **Universal Schema:** A central `audit_logs` table utilizes `JSONB` to capture `old_data` and `new_data` for every critical action across the system.
* **Trigger Mechanism:** Native PostgreSQL triggers automatically capture the state before and after any `INSERT`, `UPDATE`, or `DELETE`, completely independent of the Next.js API layer.
* **Actor Injection:** Next.js injects the active user's ID into the PostgreSQL transaction session (`SET LOCAL app.current_user_id`), allowing the database trigger to record exactly *who* initiated the change.
* **Tamper-Proofing:** The database user utilized by the Next.js app is explicitly revoked of `UPDATE` and `DELETE` privileges on the `audit_logs` table.

---

## 9. Privacy by Design & Consent Lifecycle

Compliance with the Data Privacy Act of 2012 (RA 10173) is natively engineered into the data lifecycle, distinguishing between Personal Information (PI) and Sensitive Personal Information (SPI).

* **Digital Click-Wrap:** First-time PWA logins are intercepted by Next.js middleware. Employees must explicitly accept the privacy policy.
* **Granular Consent Logging:** A `consent_logs` table records the agreed policy version and specific `JSONB` parameters (e.g., allowing data sharing with HMOs or banks). Access to the portal is blocked until consent is captured.
* **Automated Retention & Purging:** When an employee resigns, the DIY Workflow Engine initiates a 5-year sleep timer. Upon waking, it automatically executes a purge script that deletes physical documents from MinIO and scrubs PI/SPI from PostgreSQL (redacting names to maintain mathematical integrity of historical payroll ledgers).

---

## 10. Manual Overrides (CSV Fallback)

Manual CSV import/export functionality remains a permanent, critical feature to support enterprise edge cases.

* **Off-Site Workers:** Facilitates time logging for field personnel unable to access physical ZKTeco hardware.
* **Bulk Adjustments:** Enables rapid retroactive pay corrections and one-time corporate bonuses.
* **Audits & Migrations:** Provides necessary raw data exports for external DOLE/BIR audits and allows for rapid bulk-importing during new client onboarding. All manual uploads trigger entries in the Immutable Audit Log.

---

## 11. Commercial Packaging Strategy

Licensing requires HRIS as the foundational layer to maintain clean data topology, with modular add-ons scaling to full automation.

| Package Tier | Included Modules | Operational Workflow |
| --- | --- | --- |
| **Tier 1: Core + Time** | HRIS + Timekeeping | Next.js UI enables shift scheduling and edge biometric syncing. Payroll features are disabled via feature flags. |
| **Tier 2: Core + Pay** | HRIS + Payroll | Next.js UI enables tax formulas and ledger generation. Timekeeping is bypassed; HR uploads a single monthly CSV of payable hours. |
| **Tier 3: Full Suite** | HRIS + Timekeeping + Payroll | Complete end-to-end automation. Biometrics stream from the Pi 5, evaluate against JSON rules, pass through Redis, and instantly compute compliant payslips. |

## 12. The Keymaster: Central Licensing Authority

To securely issue licenses for on-premise deployments across Atomic HR and future products, the system utilizes a standalone internal application: **The Keymaster**.

### Multi-Product Architecture

* The Keymaster uses an isolated SQLite database containing `products`, `modules`, `staff_users`, and an immutable `issued_licenses` ledger.
* Non-technical staff (Sales/Onboarding) use a Next.js web dashboard to generate licenses without interacting with raw cryptography.

### Encryption-at-Rest & Key Generation Lifecycle

1. **Storage:** The Asymmetric Private Keys (RSA/ECDSA) for each product are stored in the SQLite database encrypted via **AES-256-GCM** (Symmetric Encryption).
2. **The Master Password:** The symmetric decryption key is stored strictly in the Keymaster server's `.env` file (`MASTER_ENCRYPTION_KEY`).
3. **Generation:** When a staff member generates a license, the Keymaster reads the `.env`, decrypts the product's Private Key *in memory*, signs the JSON payload, and outputs a Base64 hash.
4. **Garbage Collection:** The decrypted Private Key is immediately dropped from memory.
5. **Client Verification:** The Atomic HR client application contains the hardcoded Public Key and refuses to boot if the license string signature is invalid or tampered with.
