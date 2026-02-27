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
- **Hybrid Storage**: Firebase Storage (primary) + MongoDB (fallback)

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
- UK: Companies House Return, FCA Notification, PSC Register

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
- [x] Document upload with SHA-256 hashing
- [x] Hybrid storage support (Firebase Storage URL + MongoDB metadata)
- [x] AI Chat endpoint with mocked intelligent responses
- [x] Audit Trail aggregation endpoint
- [x] Stats endpoint for system metrics
- [x] Compliance status update endpoint

### Frontend (React + Tailwind + shadcn/ui)
- [x] Premium dark theme ("Old Money Tech" aesthetic)
- [x] Left sidebar with Active Matters and Statutory Tracker
- [x] Center chat panel with LEARNED SILK AI
- [x] Right panel with Document Vault and Audit Trail tabs
- [x] Jurisdiction selector (Nigeria, US, UK, Cross-Border)
- [x] Drag-and-drop document upload
- [x] Real-time compliance status badges (clickable to cycle)
- [x] Responsive design
- [x] Folder selector for document organization
- [x] Firebase/MongoDB storage indicator

### Firebase Integration
- [x] Firebase SDK initialized (project: gcc-sae-emergent-build)
- [x] Firebase Storage configured for document uploads
- [x] Hybrid storage with MongoDB fallback
- [ ] Firebase Firestore (requires database creation + security rules)
- [ ] Firebase Authentication

### Design System
- [x] Custom typography: Playfair Display (headings), Manrope (body), JetBrains Mono (code)
- [x] Color palette: Deep Navy (#0a1628) + Gold (#c9a227)
- [x] Status badges with semantic colors
- [x] Glass-morphism effects for headers and panels

---

## Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBVGXY40wIFGfdIT0YhefZIXYBSBYTcUtk",
  authDomain: "gcc-sae-emergent-build.firebaseapp.com",
  projectId: "gcc-sae-emergent-build",
  storageBucket: "gcc-sae-emergent-build.firebasestorage.app",
  messagingSenderId: "899804180054",
  appId: "1:899804180054:web:0306d98a670d64ba0055f7"
};
```

### Firebase Setup Required:
1. **Firestore Database**: Create in Firebase Console (if using Firestore)
2. **Storage Rules**: Configure security rules for document access
3. **Authentication**: Enable auth providers as needed

---

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] **Real LLM Integration** - Replace mocked AI with actual OpenAI/Claude API
- [ ] **Firebase Firestore** - Create database and configure security rules
- [ ] **Firebase Storage Rules** - Configure proper access controls

### P1 - High Priority
- [ ] **Authentication** - Firebase Auth integration
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
- [ ] **Vector Embeddings** - Vertex AI Vector Search for document intelligence
- [ ] **Webhook Integration** - External system notifications
- [ ] **Mobile App** - iOS/Android clients

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│    React 19 + Tailwind CSS + shadcn/ui + Firebase SDK       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Firebase       │ │  FastAPI        │ │  Firebase       │
│  Storage        │ │  Backend        │ │  Firestore      │
│  (Documents)    │ │  /api/*         │ │  (Future)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────┐
              │           MongoDB               │
              │   (Metadata + Fallback Data)    │
              └─────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | Health check |
| `/api/deal-rooms` | GET/POST | List/Create deal rooms |
| `/api/deal-rooms/{id}` | GET/DELETE | Get/Delete deal room |
| `/api/advisory-logs/{deal_room_id}` | GET/POST | Advisory logs |
| `/api/compliance-checklists/{deal_room_id}` | GET/POST | Compliance items |
| `/api/compliance-checklists/{id}` | PUT | Update compliance status |
| `/api/documents/upload` | POST | Upload document (supports Firebase URL) |
| `/api/documents/{deal_room_id}` | GET | List documents |
| `/api/documents/{id}` | DELETE | Delete document |
| `/api/chat` | POST | AI advisory chat |
| `/api/audit-trail/{deal_room_id}` | GET | Full audit trail |
| `/api/stats` | GET | System statistics |

---

## Test Results (Latest)

- **Backend**: 100% (9/9 API tests passed)
- **Frontend**: 95% (19/20 UI integration tests passed)
- **Overall**: 98% success rate

---

## Notes

- AI Chat is currently **MOCKED** with intelligent keyword-based responses
- Firebase Storage is configured but requires Storage Rules setup in Firebase Console
- Firebase Firestore is initialized but requires database creation in Firebase Console
- Document storage uses hybrid approach: Firebase Storage (primary) + MongoDB (fallback)
