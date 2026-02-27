# GCC-SAE Product Requirements Document
## Global Corporate Counsel - Senior Advocate Engine

### Last Updated: January 27, 2026

---

## Overview

GCC-SAE is an elite legal and financial advisory engine designed for cross-border corporate-commercial transactions. The platform provides AI-powered legal advisory with specialized knowledge in US Federal/State law, English Common Law, and Nigerian Corporate Law (CAMA 2020).

---

## User Personas

### Primary Users
1. **Senior Legal Professionals** - Partners at law firms handling M&A, PE, and Project Finance
2. **Corporate Counsels** - In-house legal teams managing cross-border transactions
3. **M&A Advisors** - Transaction advisors coordinating due diligence

### Secondary Users
1. **Compliance Officers** - Monitoring regulatory filings and deadlines
2. **Junior Associates** - Conducting research and document management

---

## Core Requirements (Static)

### 1. Deal Room Management
- Create and manage transaction-specific workspaces
- Jurisdiction-aware configuration (Nigeria CAMA 2020, US DGCL, UK Companies Act 2006, Cross-Border)
- Unique Case IDs for audit tracking

### 2. Document Vault (The Vault)
- Secure document storage with folder organization:
  - Legal_Drafts
  - Due_Diligence
  - CBRNE_Technical
  - KYC_Docs
- File integrity verification via SHA-256 hashing
- Indexing status tracking (Processing → Indexed)
- Access level controls (Admin Only, Team, Public)

### 3. AI Legal Advisory (LEARNED SILK)
- Multi-jurisdictional legal advice
- Context-aware responses using uploaded documents
- Reference ID tracking for audit trail
- Specialized in:
  - M&A transaction structuring
  - Regulatory compliance mapping
  - Cross-border risk analysis

### 4. Compliance Tracker (Statutory Tracker)
- Auto-generated checklists based on jurisdiction
- Status tracking: Compliant, Pending, Overdue
- Nigeria: CAMA 2020 Returns, NOTAP Certificate, SEC Nigeria filings
- US: SEC Form D, Delaware Franchise Tax, Blue Sky Compliance

### 5. Audit Trail
- Complete transaction history
- Advisory logs with prompts and responses
- Document upload records with file hashes
- Compliance status changes

---

## What's Been Implemented (January 27, 2026)

### Backend (FastAPI + MongoDB)
- [x] Deal Rooms CRUD operations
- [x] Advisory Logs storage with timestamps
- [x] Compliance Checklists with auto-creation based on jurisdiction
- [x] Document upload with SHA-256 hashing and base64 storage
- [x] AI Chat endpoint with mocked intelligent responses
- [x] Audit Trail aggregation endpoint
- [x] Stats endpoint for system metrics

### Frontend (React + Tailwind + shadcn/ui)
- [x] Premium dark theme ("Old Money Tech" aesthetic)
- [x] Left sidebar with Active Matters and Statutory Tracker
- [x] Center chat panel with LEARNED SILK AI
- [x] Right panel with Document Vault and Audit Trail tabs
- [x] Jurisdiction selector (Nigeria, US, UK, Cross-Border)
- [x] Drag-and-drop document upload
- [x] Real-time compliance status badges
- [x] Responsive design

### Design System
- [x] Custom typography: Playfair Display (headings), Manrope (body), JetBrains Mono (code)
- [x] Color palette: Deep Navy (#0a1628) + Gold (#c9a227)
- [x] Status badges with semantic colors
- [x] Glass-morphism effects for headers and panels

---

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] **Real LLM Integration** - Replace mocked AI with actual OpenAI/Claude API
- [ ] **Firebase Integration** - Implement actual Firebase Storage for document vault
- [ ] **Vector Embeddings** - Enable document search and citation using Vertex AI

### P1 - High Priority
- [ ] **Authentication** - Firebase Auth or JWT-based user authentication
- [ ] **Role-Based Access Control** - Admin, Partner, Associate roles
- [ ] **App Check Enforcement** - Security validation for all requests
- [ ] **Document Preview** - In-app PDF/DOCX viewer
- [ ] **Resumable Uploads** - For large due diligence folders

### P2 - Medium Priority
- [ ] **Full-Text Search** - Search across all indexed documents
- [ ] **Email Notifications** - Compliance deadline alerts
- [ ] **Export Reports** - Generate PDF compliance reports
- [ ] **Multi-language Support** - Support for French (OHADA) jurisdictions
- [ ] **Analytics Dashboard** - Transaction metrics and insights

### P3 - Future Enhancements
- [ ] **Watchdog Protocol** - Auto-alert for documents stuck in processing
- [ ] **Zero-Ghosting Persistence** - Automatic metadata cleanup on file deletion
- [ ] **API Rate Limiting** - Prevent abuse of AI endpoints
- [ ] **Webhook Integration** - External system notifications
- [ ] **Mobile App** - iOS/Android clients

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│    React 19 + Tailwind CSS + shadcn/ui + Lucide Icons       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
│   /api/deal-rooms, /api/chat, /api/documents, /api/audit    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│   Collections: deal_rooms, advisory_logs, compliance_       │
│                checklists, documents                         │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | Health check |
| `/api/deal-rooms` | GET/POST | List/Create deal rooms |
| `/api/deal-rooms/{id}` | GET/DELETE | Get/Delete deal room |
| `/api/advisory-logs/{deal_room_id}` | GET/POST | Advisory logs |
| `/api/compliance-checklists/{deal_room_id}` | GET/POST/PUT | Compliance items |
| `/api/documents/upload` | POST | Upload document |
| `/api/documents/{deal_room_id}` | GET | List documents |
| `/api/documents/{id}` | DELETE | Delete document |
| `/api/chat` | POST | AI advisory chat |
| `/api/audit-trail/{deal_room_id}` | GET | Full audit trail |
| `/api/stats` | GET | System statistics |

---

## Notes

- AI Chat is currently **MOCKED** with intelligent keyword-based responses
- Document storage uses Base64 encoding in MongoDB (production should use Firebase/S3)
- No authentication implemented yet (all endpoints are public)
