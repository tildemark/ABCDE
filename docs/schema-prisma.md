# Universal Database Schema: Prisma Model Reference

This file documents the Prisma models that match the universal PostgreSQL schema for Atomic HR. It defines the tables, columns, relations, and settings needed for compliance, tenant isolation, and audit logging.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Tenant {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  corporateName  String         @map("corporate_name") @db.VarChar(255)
  registeredTin  String?        @unique @map("registered_tin") @db.VarChar(50)
  industry       String?        @db.VarChar(100)
  createdAt      DateTime?      @default(now()) @map("created_at") @db.Timestamptz(6)
  
  license        TenantLicense?
  branches       Branch[]
  departments    Department[]
  employees      Employee[]
  leaveBalances  LeaveBalance[]
  documents      EmployeeDocument[]
  consentLogs    ConsentLog[]
  auditLogs      AuditLog[]

  @@map("tenants")
}

model TenantLicense {
  tenantId       String    @id @map("tenant_id") @db.Uuid
  hasHris        Boolean?  @default(true) @map("has_hris")
  hasTimekeeping Boolean?  @default(false) @map("has_timekeeping")
  hasPayroll     Boolean?  @default(false) @map("has_payroll")
  maxEmployees   Int?      @default(50) @map("max_employees")
  updatedAt      DateTime? @default(now()) @map("updated_at") @db.Timestamptz(6)
  
  tenant         Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("tenant_licenses")
}

model Branch {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String?      @map("tenant_id") @db.Uuid
  name           String       @db.VarChar(150)
  region         String?      @db.VarChar(100)
  isHeadquarters Boolean?     @default(false) @map("is_headquarters")
  createdAt      DateTime?    @default(now()) @map("created_at") @db.Timestamptz(6)
  
  tenant         Tenant?      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  departments    Department[]
  employees      Employee[]

  @@map("branches")
}

model Department {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String?    @map("tenant_id") @db.Uuid
  branchId    String?    @map("branch_id") @db.Uuid
  name        String     @db.VarChar(150)
  managerId   String?    @map("manager_id") @db.Uuid

  tenant      Tenant?    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  branch      Branch?    @relation(fields: [branchId], references: [id], onDelete: SetNull)
  manager     Employee?  @relation("DeptManager", fields: [managerId], references: [id], onDelete: SetNull)
  employees   Employee[] @relation("EmpDept")

  @@map("departments")
}

model Employee {
  id               String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId         String             @map("tenant_id") @db.Uuid
  branchId         String?            @map("branch_id") @db.Uuid
  departmentId     String?            @map("department_id") @db.Uuid
  employeeCode     String             @map("employee_code") @db.VarChar(50)
  firstName        String             @map("first_name") @db.VarChar(100)
  lastName         String             @map("last_name") @db.VarChar(100)
  workEmail        String?            @unique @map("work_email") @db.VarChar(150)
  employmentStatus String?            @default("Active") @map("employment_status") @db.VarChar(50)
  payGroup         String?            @default("Standard") @map("pay_group") @db.VarChar(50)
  customAttributes Json?              @default("{}") @map("custom_attributes")
  createdAt        DateTime?          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime?          @default(now()) @map("updated_at") @db.Timestamptz(6)

  tenant           Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  branch           Branch?            @relation(fields: [branchId], references: [id])
  department       Department?        @relation("EmpDept", fields: [departmentId], references: [id])
  
  managedDepts     Department[]       @relation("DeptManager")
  leaveBalances    LeaveBalance[]
  uploadedDocs     EmployeeDocument[] @relation("UploadedBy")
  documents        EmployeeDocument[] @relation("EmployeeDocs")
  consentLogs      ConsentLog[]

  @@unique([tenantId, employeeCode])
  @@map("employees")
}

model LeaveBalance {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId      String?  @map("tenant_id") @db.Uuid
  employeeId    String?  @map("employee_id") @db.Uuid
  leaveType     String   @map("leave_type") @db.VarChar(50)
  allocatedDays Decimal? @default(0.00) @map("allocated_days") @db.Decimal(5, 2)
  usedDays      Decimal? @default(0.00) @map("used_days") @db.Decimal(5, 2)
  year          Int

  tenant        Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employee      Employee? @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([employeeId, leaveType, year])
  @@map("leave_balances")
}

model EmployeeDocument {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String?   @map("tenant_id") @db.Uuid
  employeeId   String?   @map("employee_id") @db.Uuid
  documentType String    @map("document_type") @db.VarChar(100)
  s3FilePath   String    @map("s3_file_path") @db.VarChar(255)
  uploadedBy   String?   @map("uploaded_by") @db.Uuid
  uploadedAt   DateTime? @default(now()) @map("uploaded_at") @db.Timestamptz(6)

  tenant       Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employee     Employee? @relation("EmployeeDocs", fields: [employeeId], references: [id], onDelete: Cascade)
  uploader     Employee? @relation("UploadedBy", fields: [uploadedBy], references: [id])

  @@map("employee_documents")
}

model ConsentLog {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId            String?   @map("tenant_id") @db.Uuid
  employeeId          String?   @map("employee_id") @db.Uuid
  policyVersion       String    @map("policy_version") @db.VarChar(50)
  consentPi           Boolean?  @default(false) @map("consent_pi")
  consentSpi          Boolean?  @default(false) @map("consent_spi")
  granularPermissions Json?     @default("{}") @map("granular_permissions")
  ipAddress           String?   @map("ip_address") @db.VarChar(45)
  consentedAt         DateTime? @default(now()) @map("consented_at") @db.Timestamptz(6)

  tenant              Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employee            Employee? @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("consent_logs")
}

model AuditLog {
  logId      String    @id @default(dbgenerated("gen_random_uuid()")) @map("log_id") @db.Uuid
  tenantId   String?   @map("tenant_id") @db.Uuid
  tableName  String    @map("table_name") @db.VarChar(100)
  recordId   String    @map("record_id") @db.VarChar(255)
  actionType String    @map("action_type") @db.VarChar(20)
  oldData    Json?     @map("old_data")
  newData    Json?     @map("new_data")
  actorId    String?   @map("actor_id") @db.Uuid
  createdAt  DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)

  tenant     Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("audit_logs")
}
```
