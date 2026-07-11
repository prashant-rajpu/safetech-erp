# SAFETECH OPERATIONS CONTROL PANEL
## Permanent Development Context

Version: 1.0

---

# PROJECT OVERVIEW

This project is an enterprise-grade ERP system developed exclusively for Precast Concrete Manufacturing Operations.

The objective is to build a modern, scalable, production-ready ERP capable of handling the complete lifecycle of precast concrete elements from design until final site erection.

This project is NOT intended to be a generic ERP.

---

# CORE PRINCIPLES

Always preserve:

• Existing routing
• Existing architecture
• Existing responsive behaviour
• Existing sidebar layout

As of the Phase 7 design-system switch, the canonical visual identity is the
concrete-grey / blueprint-blue system (see UI GUIDELINES below) — single
theme, no dark mode. This superseded the earlier red/black glassmorphism
system and its "existing light/dark themes" preservation rule.

Never redesign completed pages' structure/layout unless absolutely necessary.

Always improve rather than replace.

---

# BUSINESS SCOPE

The ERP covers the complete precast workflow:

Design
↓

Planning
↓

Production
↓

Quality Control
↓

Stockyard
↓

Dispatch

↓

Transportation

↓

Site Erection

↓

Project Handover

↓

Defects Liability Period

Everything should follow this lifecycle.

---

# OUT OF SCOPE

Never implement:

Finance

Accounting

Payroll

Purchase Orders

Procurement

Billing

Taxation

Costing

Inventory valuation

Human Resource Management

CRM

Sales

Marketing

These modules are permanently excluded.

---

# TARGET TECHNOLOGY

Frontend

React

TypeScript

Vite

TailwindCSS

Backend

Supabase

PostgreSQL

Authentication

Supabase Auth

Storage

Supabase Storage

---

# DATABASE PHILOSOPHY

Single source of truth.

Never duplicate business entities.

Every module must use relational data.

No LocalStorage fallback.

No mock database.

No duplicated master tables.

Always normalize where appropriate.

Every table must contain:

created_at

updated_at

created_by

updated_by

when applicable.

---

# CODING RULES

Prefer extending existing modules.

Never rewrite functioning features.

Never introduce duplicate pages.

Never create parallel systems.

Reuse:

components

hooks

utilities

services

registry

types

Keep code modular.

Keep functions reusable.

Keep files organized.

Avoid large components.

---

# UI GUIDELINES

## Design System (canonical, as of Phase 7)

Single theme — no dark mode.

Colors (Tailwind tokens, defined in tailwind.config.cjs):

• surface (#F4F4F2) — concrete-grey background
• ink (#1C1C1E) — primary text
• primary (#1B4B8C) / primary-dark (#163C6E) — blueprint-blue, brand/interactive accent
• alert (#E8622C) — safety-orange, warnings/destructive actions
• success (#2C7A6B) — muted teal, confirmations/positive status

Status-chip colors (statusChipClass() in uiHelpers.ts, statusColor3D() in
ElementBox.tsx) are semantic — pass/fail/warning — and intentionally separate
from brand chrome. Don't recolor them to match the brand palette.

Typography:

• Body/UI text: Outfit
• Headings: Space Grotesk (font-heading utility)
• Data, codes, tables: IBM Plex Mono (font-mono utility)

Icons: Lucide (lucide-react), via the icon map in src/lib/erp/icons.ts. No
emoji icons in new work.

Shared chrome classes (src/styles/tailwind.css) — reuse these rather than
hand-rolling new panel/input/button styles: glass-panel, glass-card-3d,
glowing-input, btn-interactive, concrete-accent-primary/neutral,
glow-text-primary/neutral.

Maintain existing design language within the above system.

Consistent spacing.

Consistent typography.

Consistent cards.

Consistent forms.

Consistent dialogs.

Consistent tables.

Consistent badges.

Consistent colors.

Responsive on:

Desktop

Tablet

Mobile

---

# ERP MODULES

1.
Master Data

Projects

Clients

Consultants

Suppliers

Element Types

Mix Designs

Concrete Grades

Production Beds

Moulds

Vehicles

Drivers

Trailers

Yard Bays

Lifting Plans

2.
Design

Drawing Register

Shop Drawings

Revisions

Approvals

Element Library

3.
Planning

Production Planning

Casting Schedule

Capacity Planning

Bed Utilization

4.
Production

Batching

Reinforcement

Mould Preparation

Casting

Demoulding

Curing

Repair

Production Log

5.
QA/QC

Incoming Inspection

Pre Pour

Post Pour

Concrete Tests

Cube Tests

Dimensional Inspection

Finish Inspection

NCR

Corrective Action

6.
Stockyard

Inventory

Yard Movement

Bay Allocation

Crane Planning

QR Tracking

7.
Dispatch

Dispatch Planning

Vehicle Inspection

Trailer Inspection

Loading

Dispatch Log

Delivery Notes

Delivery Reports

8.
Site Erection

Erection Planning

Erection Log

Grouting

Connection Inspection

Punch List

Completion

9.
Maintenance

Equipment Register

Preventive Maintenance

Breakdown Maintenance

Calibration

Spare Parts

10.
HSE

Incident Register

Toolbox Talks

Risk Assessment

Permits

Certifications

Safety Audits

11.
Prestressing

Strands

Tensioning

Release

Long Line Planning

12.
Document Control

RFI

Method Statements

Submittals

13.
Workforce

Crew Planning

Crew Assignment

Shift Planning

Certification Tracking

14.
Customer Handover

Handover Package

DLP

Defects

Customer Acceptance

15.
Sustainability

Carbon

Waste

Water

Environmental Reports

16.
Reporting

Dashboards

KPIs

Department Reports

Analytics

17.
Administration

Users

Roles

Permissions

Audit Logs

Backups

System Settings

---

# ROLE BASED SECURITY

Every module must support:

View

Create

Edit

Delete

Approve

Permissions are enforced in both:

Frontend

Database

Never rely only on UI permissions.

---

# QR TRACEABILITY

Every precast element shall have one unique QR Code.

Lifecycle:

Planning

↓

Casting

↓

QC

↓

Curing

↓

Stockyard

↓

Loading

↓

Dispatch

↓

Delivered

↓

At Site

↓

Erected

↓

Completed

Every stage records:

Timestamp

User

Department

Status

Remarks

---

# REPORTING

Every module should expose:

Dashboard

Filters

Export PDF

Export Excel

Printing

KPIs

Charts where appropriate

---

# PERFORMANCE

Prefer:

Reusable components

Memoization

Lazy loading

Optimized queries

Pagination

Server-side filtering

Avoid unnecessary renders.

---

# DEVELOPMENT RULES

Before writing code:

1.
Analyze existing implementation.

2.
Search for reusable code.

3.
Extend instead of duplicate.

4.
Maintain architecture consistency.

5.
Update types.

6.
Update services.

7.
Update permissions.

8.
Update documentation.

After each phase produce:

Completed work

Files changed

Database changes

Breaking changes

Remaining tasks

Never continue automatically.

Wait for approval before starting the next phase.

---

# QUALITY STANDARD

Target enterprise software quality.

The finished ERP should be comparable in quality to Oracle, SAP, Procore, Autodesk Construction Cloud, and similar industrial systems while remaining optimized specifically for precast concrete manufacturing operations.

Every implementation should prioritize maintainability, scalability, performance, security, and clean architecture over quick solutions.

This document is the permanent development context for all future Claude Code sessions.
