# Arkatva CRM (v2.0 - Next.js & Supabase)

Arkatva CRM is built with **Next.js 14 (App Router, TypeScript)**, **Supabase (PostgreSQL & Storage)**, and an obsidian black & white dark theme tailored to match the Arkatva crystal emblem.

## Key Features & Highlights

1. **Owner Financial Architecture & Cash Inflow**:
   - Tailored for **Anish (Arkatva Owner)**.
   - **Cash Brought Into Business (Capital Inflow)**: Track capital introduced to the business with contributor name, destination account, category, mode, reference, and purpose.
   - Real-time tracking of:
     - **Cash Brought In (Capital Inflow)**
     - **Total Revenue (Receipts)**
     - **Total Business Expenses**
     - **Owner Withdrawals**
     - **Available Net Cash Liquidity**: $(\text{Revenue} + \text{Capital Injected}) - \text{Expenses} - \text{Withdrawals}$
     - **Retained Business Capital**: $\text{Capital Injected} + (\text{Revenue} - \text{Expenses}) - \text{Withdrawals}$

2. **Complete CRM Modules**:
   - **Dashboard**: Real-time KPI metrics, Owner Financial Health ledger, Retained Capital overview, pending invoices, upcoming renewals with 1-click WhatsApp button, recent transactions, and quotations.
   - **Cash Brought In (`/capital`)**: Dedicated ledger and modal for recording owner capital, partner investments, and liquidity infusions.
   - **Invoices & Billing**: Full invoice generator with "Import from Quotation" autofill, catalog preset dropdowns, advance amounts, balance due, printable voucher, and client-side PDF export.
   - **Quotations**: Quotation generator, dynamic item rows, validity dates, notes, and printable PDF voucher.
   - **Receipts**: Receipt voucher generator with pending invoice selector and **automatic invoice settlement** (`status = 'paid'`) when fully settled.
   - **Expenses**: Category manager, debit account ledger, and **Supabase Storage file upload** for receipt images and vouchers.
   - **Withdrawals**: Owner drawing ledger with account tracking and delete capability.
   - **Support Tickets**: Support ticket management with status, priority, and conversational messages thread.
   - **Renewals**: Service subscriptions with auto-expiry calculations and **1-click WhatsApp notification links**.
   - **Clients Registry**: Client directory with multi-email and phone tracking.
   - **Products & Services**: Product catalogue with instant add, edit, and delete.
   - **Authentication**: Admin session login (`crm@arkatva.com` / `Ark@crm88`) and 2-step password reset verified by Date of Birth (DOB).

3. **Supabase Database Schema & Optimizations**:
   - The PostgreSQL migration script is located at [`supabase_schema.sql`](./supabase_schema.sql).
   - Execute this script in your [Supabase SQL Editor](https://supabase.com/dashboard/project/yrfkfmavyrhakzbvkrkh/sql) to set up all tables, performance indexes, RLS policies, and storage policies.
   - Includes seed for default admin `crm@arkatva.com` with password `Ark@crm88`.

4. **Default Admin Login Credentials**:
   - **Username**: `crm@arkatva.com`
   - **Password**: `Ark@crm88`

## Getting Started

```bash
# Install dependencies
npm install

# Run locally in development mode
npm run dev

# Build for production
npm run build
npm start
```
