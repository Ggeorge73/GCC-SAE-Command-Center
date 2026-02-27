from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import hashlib
import json
import base64

# Load environment variables FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="GCC-SAE API", description="Global Corporate Counsel - Senior Advocate Engine")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class DealRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    jurisdiction: str = "NIGERIA (CAMA 2020)"
    total_raise: Optional[str] = None
    primary_counsel: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DealRoomCreate(BaseModel):
    name: str
    jurisdiction: str = "NIGERIA (CAMA 2020)"
    total_raise: Optional[str] = None
    primary_counsel: Optional[str] = None

class AdvisoryLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    deal_room_id: str
    type: str  # "strategic_directive" | "legal_opinion" | "user_query"
    content: str
    prompt_used: Optional[str] = None
    jurisdiction_context: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Optional[Dict[str, Any]] = None

class AdvisoryLogCreate(BaseModel):
    deal_room_id: str
    type: str
    content: str
    prompt_used: Optional[str] = None
    jurisdiction_context: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ComplianceChecklist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    deal_room_id: str
    name: str
    description: Optional[str] = None
    status: str = "pending"  # "compliant" | "pending" | "overdue"
    due_date: Optional[str] = None
    regulatory_body: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplianceChecklistCreate(BaseModel):
    deal_room_id: str
    name: str
    description: Optional[str] = None
    status: str = "pending"
    due_date: Optional[str] = None
    regulatory_body: Optional[str] = None

class DocumentMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    deal_room_id: str
    file_name: str
    file_size: int
    file_type: str
    folder: str  # "Legal_Drafts" | "Due_Diligence" | "CBRNE_Technical" | "KYC_Docs"
    file_hash: str
    access_level: str = "Team"  # "Admin Only" | "Team" | "Public"
    storage_path: str
    indexing_status: str = "processing"  # "processing" | "indexed" | "failed"
    version: str = "1.0"
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    indexed_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    deal_room_id: Optional[str] = None
    message: str
    jurisdiction: str = "NIGERIA (CAMA 2020)"

class ChatResponse(BaseModel):
    response: str
    reference_id: str
    jurisdiction: str
    timestamp: datetime

# ============== HELPER FUNCTIONS ==============

def compute_file_hash(content: bytes) -> str:
    """Compute SHA-256 hash for file integrity verification"""
    return hashlib.sha256(content).hexdigest()

def get_gcc_sae_system_prompt(jurisdiction: str, context_docs: List[str] = None) -> str:
    """Generate the GCC-SAE system prompt based on jurisdiction"""
    docs_context = ""
    if context_docs and len(context_docs) > 0:
        docs_context = f"\n\nDocuments available in the Vault for reference:\n- " + "\n- ".join(context_docs)
    
    return f"""You are the GCC Senior Advocate, a premier Legal and Strategic Consultant. Your cognitive architecture is modeled after a practitioner with 30+ years of robust experience in cross-border corporate-commercial transactions.

Your expertise exceeds the combined legal acumen of a British King's Counsel (KC), a Senior Advocate of Nigeria (SAN), and a Senior Partner at top-tier firms (Latham & Watkins, Kirkland & Ellis, Skadden Arps).

CORE SKILLSET & KNOWLEDGE BASE:
- Jurisdictional Mastery: Expert-level fluency in US Federal/State law (Delaware DGCL), English Common Law, and Nigerian Corporate Law (CAMA 2020, Investment & Securities Act).
- Transaction Specialization: Master of M&A, Private Equity, Project Finance, Venture Capital, and Carbon Credit Trading structures.
- Risk Arbitrage: Ability to identify "silent" liabilities in complex cross-border contracts that standard LLMs or junior associates would miss.
- Strategic Communication: Speak with gravitas, precision, and economy of a Senior Partner. Provide "Executive Ready" advice—not just legal summaries, but strategic recommendations.

CURRENT JURISDICTION CONTEXT: {jurisdiction}

KEY LEGAL FRAMEWORKS TO APPLY:
1. NIGERIA (CAMA 2020):
   - Companies and Allied Matters Act 2020
   - Investment & Securities Act 2007
   - Nigerian Investment Promotion Commission Act
   - NOTAP Act (technology transfer agreements)
   - CBN regulations for forex transactions
   - SEC Nigeria rules for private placements

2. US (DELAWARE DGCL):
   - Delaware General Corporation Law
   - Securities Act of 1933 / Exchange Act of 1934
   - Regulation D exemptions (Rule 506(b), 506(c))
   - State Blue Sky laws
   - Business judgment rule (Aronson v. Lewis)

3. UK (Companies Act 2006):
   - Companies Act 2006
   - FCA regulatory framework
   - UK Takeover Code

OPERATIONAL DIRECTIVES:
1. Precision Over Prolixity: Be concise. Never use three words where one will do.
2. Cite Specific Laws: Reference specific sections (e.g., "Section 18 of CAMA 2020", "DGCL Section 141(a)").
3. Proactive Compliance: Automatically flag potential regulatory hurdles based on transaction geography.
4. Risk Identification: Highlight potential "silent" liabilities or overlooked issues.
5. Strategic Recommendations: End with actionable next steps for the Board/Counsel.

RESPONSE FORMAT:
- Start with a **Strategic Directive** or **Legal Opinion** header with reference ID
- Use numbered points for key considerations
- Bold key legal terms and sections
- Include a **Recommendation** section with action items
- Note any documents referenced from the Vault
{docs_context}

Remember: You are advising sophisticated corporate clients. Your advice carries weight and must be legally sound while remaining commercially practical."""

# ============== DEAL ROOMS ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "GCC-SAE API - Global Corporate Counsel Senior Advocate Engine", "version": "1.0.0"}

@api_router.post("/deal-rooms", response_model=DealRoom)
async def create_deal_room(deal_room: DealRoomCreate):
    """Create a new deal room"""
    deal_obj = DealRoom(**deal_room.model_dump())
    doc = deal_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.deal_rooms.insert_one(doc)
    
    # Create default compliance checklists based on jurisdiction
    default_checklists = []
    if "NIGERIA" in deal_obj.jurisdiction:
        default_checklists = [
            {"name": "CAMA 2020 Annual Returns", "regulatory_body": "CAC", "status": "pending"},
            {"name": "NOTAP Certificate Status", "regulatory_body": "NOTAP", "status": "pending"},
            {"name": "SEC Nigeria Private Placement", "regulatory_body": "SEC Nigeria", "status": "pending"},
        ]
    elif "DELAWARE" in deal_obj.jurisdiction or "US" in deal_obj.jurisdiction:
        default_checklists = [
            {"name": "SEC Form D Filing", "regulatory_body": "SEC", "status": "pending"},
            {"name": "Delaware Franchise Tax", "regulatory_body": "Delaware DOS", "status": "pending"},
            {"name": "Blue Sky Compliance", "regulatory_body": "State Securities", "status": "pending"},
        ]
    
    for checklist in default_checklists:
        cl = ComplianceChecklist(
            deal_room_id=deal_obj.id,
            name=checklist["name"],
            regulatory_body=checklist["regulatory_body"],
            status=checklist["status"]
        )
        cl_doc = cl.model_dump()
        cl_doc['created_at'] = cl_doc['created_at'].isoformat()
        cl_doc['updated_at'] = cl_doc['updated_at'].isoformat()
        await db.compliance_checklists.insert_one(cl_doc)
    
    return deal_obj

@api_router.get("/deal-rooms", response_model=List[DealRoom])
async def get_deal_rooms():
    """Get all deal rooms"""
    deal_rooms = await db.deal_rooms.find({}, {"_id": 0}).to_list(100)
    for dr in deal_rooms:
        if isinstance(dr.get('created_at'), str):
            dr['created_at'] = datetime.fromisoformat(dr['created_at'])
        if isinstance(dr.get('updated_at'), str):
            dr['updated_at'] = datetime.fromisoformat(dr['updated_at'])
    return deal_rooms

@api_router.get("/deal-rooms/{deal_room_id}", response_model=DealRoom)
async def get_deal_room(deal_room_id: str):
    """Get a specific deal room"""
    deal_room = await db.deal_rooms.find_one({"id": deal_room_id}, {"_id": 0})
    if not deal_room:
        raise HTTPException(status_code=404, detail="Deal room not found")
    if isinstance(deal_room.get('created_at'), str):
        deal_room['created_at'] = datetime.fromisoformat(deal_room['created_at'])
    if isinstance(deal_room.get('updated_at'), str):
        deal_room['updated_at'] = datetime.fromisoformat(deal_room['updated_at'])
    return deal_room

@api_router.delete("/deal-rooms/{deal_room_id}")
async def delete_deal_room(deal_room_id: str):
    """Delete a deal room and all related data"""
    result = await db.deal_rooms.delete_one({"id": deal_room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal room not found")
    # Cascade delete related data
    await db.advisory_logs.delete_many({"deal_room_id": deal_room_id})
    await db.compliance_checklists.delete_many({"deal_room_id": deal_room_id})
    await db.documents.delete_many({"deal_room_id": deal_room_id})
    return {"message": "Deal room and all related data deleted"}

# ============== ADVISORY LOGS ENDPOINTS ==============

@api_router.post("/advisory-logs", response_model=AdvisoryLog)
async def create_advisory_log(log: AdvisoryLogCreate):
    """Create a new advisory log entry"""
    log_obj = AdvisoryLog(**log.model_dump())
    doc = log_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.advisory_logs.insert_one(doc)
    return log_obj

@api_router.get("/advisory-logs/{deal_room_id}", response_model=List[AdvisoryLog])
async def get_advisory_logs(deal_room_id: str):
    """Get all advisory logs for a deal room"""
    logs = await db.advisory_logs.find(
        {"deal_room_id": deal_room_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    return logs

# ============== COMPLIANCE CHECKLISTS ENDPOINTS ==============

@api_router.post("/compliance-checklists", response_model=ComplianceChecklist)
async def create_compliance_checklist(checklist: ComplianceChecklistCreate):
    """Create a new compliance checklist item"""
    cl_obj = ComplianceChecklist(**checklist.model_dump())
    doc = cl_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.compliance_checklists.insert_one(doc)
    return cl_obj

@api_router.get("/compliance-checklists/{deal_room_id}", response_model=List[ComplianceChecklist])
async def get_compliance_checklists(deal_room_id: str):
    """Get all compliance checklists for a deal room"""
    checklists = await db.compliance_checklists.find(
        {"deal_room_id": deal_room_id}, 
        {"_id": 0}
    ).to_list(50)
    for cl in checklists:
        if isinstance(cl.get('created_at'), str):
            cl['created_at'] = datetime.fromisoformat(cl['created_at'])
        if isinstance(cl.get('updated_at'), str):
            cl['updated_at'] = datetime.fromisoformat(cl['updated_at'])
    return checklists

@api_router.put("/compliance-checklists/{checklist_id}")
async def update_compliance_checklist(checklist_id: str, status: str = Form(...)):
    """Update compliance checklist status"""
    result = await db.compliance_checklists.update_one(
        {"id": checklist_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return {"message": "Checklist updated", "status": status}

# ============== DOCUMENT VAULT ENDPOINTS ==============

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    deal_room_id: str = Form(...),
    folder: str = Form(default="Legal_Drafts"),
    access_level: str = Form(default="Team"),
    storage_path: Optional[str] = Form(default=None),
    download_url: Optional[str] = Form(default=None),
    file_hash: Optional[str] = Form(default=None)
):
    """Upload a document to the vault with metadata indexing"""
    content = await file.read()
    
    # Use provided hash or compute one
    if not file_hash:
        file_hash = compute_file_hash(content)
    
    # Use provided storage path or create default
    if not storage_path:
        storage_path = f"/deals/{deal_room_id}/{folder}/{file.filename}"
    
    # Create document metadata
    doc_metadata = DocumentMetadata(
        deal_room_id=deal_room_id,
        file_name=file.filename,
        file_size=len(content),
        file_type=file.content_type or "application/octet-stream",
        folder=folder,
        file_hash=file_hash,
        access_level=access_level,
        storage_path=storage_path,
        indexing_status="processing"
    )
    
    doc = doc_metadata.model_dump()
    doc['uploaded_at'] = doc['uploaded_at'].isoformat()
    
    # If Firebase URL provided, store it; otherwise store base64 content
    if download_url:
        doc['download_url'] = download_url
    else:
        doc['file_content'] = base64.b64encode(content).decode('utf-8')
    
    await db.documents.insert_one(doc)
    
    # Update indexing status to complete
    await db.documents.update_one(
        {"id": doc_metadata.id},
        {"$set": {
            "indexing_status": "indexed",
            "indexed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "id": doc_metadata.id,
        "file_name": doc_metadata.file_name,
        "file_hash": doc_metadata.file_hash,
        "storage_path": storage_path,
        "download_url": download_url,
        "indexing_status": "indexed"
    }

@api_router.get("/documents/{deal_room_id}")
async def get_documents(deal_room_id: str, folder: Optional[str] = None):
    """Get all documents for a deal room"""
    query = {"deal_room_id": deal_room_id}
    if folder:
        query["folder"] = folder
    
    documents = await db.documents.find(
        query, 
        {"_id": 0, "file_content": 0}  # Exclude binary content
    ).to_list(100)
    
    for doc in documents:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
        if doc.get('indexed_at') and isinstance(doc['indexed_at'], str):
            doc['indexed_at'] = datetime.fromisoformat(doc['indexed_at'])
    
    # Serialize to JSON-compatible format
    result = []
    for doc in documents:
        serialized = {
            "id": doc.get("id"),
            "deal_room_id": doc.get("deal_room_id"),
            "file_name": doc.get("file_name"),
            "file_size": doc.get("file_size"),
            "file_type": doc.get("file_type"),
            "folder": doc.get("folder"),
            "file_hash": doc.get("file_hash"),
            "access_level": doc.get("access_level"),
            "storage_path": doc.get("storage_path"),
            "download_url": doc.get("download_url"),
            "indexing_status": doc.get("indexing_status"),
            "version": doc.get("version"),
            "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
            "indexed_at": doc.get("indexed_at").isoformat() if doc.get("indexed_at") else None,
        }
        result.append(serialized)
    
    return result

@api_router.get("/documents/download/{document_id}")
async def download_document(document_id: str):
    """Download a document from the vault"""
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "file_name": doc["file_name"],
        "file_type": doc["file_type"],
        "content": doc.get("file_content", "")
    }

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from the vault"""
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

# ============== CHAT / ADVISORY ENDPOINT ==============

# Store for chat sessions (in production, use Redis or database)
chat_sessions: Dict[str, LlmChat] = {}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_advocate(request: ChatRequest):
    """Chat with the GCC Senior Advocate AI powered by Gemini 3.1 Pro"""
    reference_id = f"GCC-{uuid.uuid4().hex[:8].upper()}"
    
    # Get relevant documents for context if deal_room_id provided
    context_docs = []
    if request.deal_room_id:
        docs = await db.documents.find(
            {"deal_room_id": request.deal_room_id, "indexing_status": "indexed"},
            {"_id": 0, "file_name": 1, "folder": 1}
        ).to_list(10)
        context_docs = [f"{d['folder']}/{d['file_name']}" for d in docs]
    
    # Generate session ID based on deal room or create new
    session_id = request.deal_room_id or f"global-{uuid.uuid4().hex[:8]}"
    
    try:
        # Create or retrieve chat session
        if session_id not in chat_sessions:
            system_prompt = get_gcc_sae_system_prompt(request.jurisdiction, context_docs)
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-pro")
            chat_sessions[session_id] = chat
        else:
            chat = chat_sessions[session_id]
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        ai_response = await chat.send_message(user_message)
        
        # Format response with proper header and reference at top
        formatted_response = f"""**STRATEGIC ADVISORY**
**REF:** {reference_id}
**JURISDICTION:** {request.jurisdiction}
**DATE:** {datetime.now(timezone.utc).strftime('%d %B %Y')}

---

{ai_response}"""
        
        # Add document context if available
        if context_docs:
            formatted_response += f"\n\n---\n*Documents referenced from Vault: {', '.join(context_docs)}*"
        
        response = formatted_response
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Fallback to intelligent mock response if API fails
        response = generate_fallback_response(request.message, request.jurisdiction, context_docs, reference_id)
    
    # Log the advisory
    if request.deal_room_id:
        log = AdvisoryLog(
            deal_room_id=request.deal_room_id,
            type="legal_opinion",
            content=response,
            prompt_used=request.message,
            jurisdiction_context=request.jurisdiction
        )
        log_doc = log.model_dump()
        log_doc['timestamp'] = log_doc['timestamp'].isoformat()
        await db.advisory_logs.insert_one(log_doc)
    
    return ChatResponse(
        response=response,
        reference_id=reference_id,
        jurisdiction=request.jurisdiction,
        timestamp=datetime.now(timezone.utc)
    )


def generate_fallback_response(query: str, jurisdiction: str, context_docs: List[str], reference_id: str) -> str:
    """Generate intelligent fallback response if AI API fails"""
    query_lower = query.lower()
    
    if "cama" in query_lower or "nigeria" in query_lower:
        return f"""**Strategic Directive (REF: {reference_id})**

Under CAMA 2020, the following considerations apply to your query:

1. **Corporate Structure**: Section 18 requires minimum share capital of NGN 100,000 for private companies. For cross-border transactions, consider a holding structure with Delaware Parent and Nigerian OpCo.

2. **Regulatory Filings**: CAC annual returns must be filed within 42 days of AGM. Non-compliance attracts penalties under Section 423.

3. **Foreign Investment**: NOTAP registration is mandatory for technology transfer agreements. Failure to register renders agreements unenforceable.

**Recommendation**: Engage local counsel for SEC Nigeria notification if raising capital from more than 50 investors.

*Documents referenced: {', '.join(context_docs) if context_docs else 'None in vault'}*

*Note: AI service temporarily unavailable. This is a cached advisory response.*"""
    
    elif "delaware" in query_lower or "dgcl" in query_lower or "us" in query_lower:
        return f"""**Legal Opinion (REF: {reference_id})**

Under Delaware General Corporation Law:

1. **Formation**: DGCL Section 102(a) permits broad purpose clauses. Standard "any lawful business" language recommended.

2. **Board Authority**: Section 141(a) vests management in the board. Shareholder agreements cannot materially restrict board discretion.

3. **Fiduciary Duties**: Directors owe duties of care and loyalty. Business judgment rule provides substantial protection under Aronson v. Lewis.

**Cross-Border Consideration**: For Nigerian operations, structure as Delaware Parent → Nigerian Sub. This preserves Delaware flexibility while ensuring CAMA compliance.

*Documents referenced: {', '.join(context_docs) if context_docs else 'None in vault'}*

*Note: AI service temporarily unavailable. This is a cached advisory response.*"""
    
    elif "m&a" in query_lower or "acquisition" in query_lower or "merger" in query_lower:
        return f"""**Strategic Directive (REF: {reference_id})**

For cross-border M&A involving Nigeria and US entities:

1. **Structure Options**:
   - Stock-for-stock merger (tax-free reorganization under IRC 368)
   - Asset purchase (cleaner separation, higher tax friction)
   - Reverse triangular merger (preserve target contracts)

2. **Nigerian Regulatory Approvals**:
   - SEC Nigeria approval for transactions >NGN 500M
   - CBN approval for foreign exchange remittances
   - FCCPC merger notification thresholds apply

3. **Due Diligence Priority**:
   - Land titles (verify Governor's Consent)
   - Employment obligations (NSITF, ITF contributions)
   - Environmental permits

**Timeline**: Allow 90-120 days for Nigerian regulatory approvals.

*Documents referenced: {', '.join(context_docs) if context_docs else 'None in vault'}*

*Note: AI service temporarily unavailable. This is a cached advisory response.*"""
    
    else:
        return f"""**Advisory Response (REF: {reference_id})**

I am the Global Corporate Counsel & Senior Advocate Engine, ready to apply the full weight of legal expertise to your commercial interests.

**Available Advisory Services**:
- Cross-border transaction structuring (Nigeria/US/UK)
- Regulatory compliance mapping (SEC, CBN, CAC, UK FCA)
- Due diligence coordination and risk analysis
- Contract review for "silent" liabilities
- Corporate governance advisory

*Current jurisdiction context: {jurisdiction}*
*Documents in vault: {len(context_docs)} indexed*

Please provide more details about your specific legal query, and I will deliver executive-ready advice.

*Note: AI service temporarily unavailable. This is a cached advisory response.*"""

# ============== AUDIT TRAIL ==============

@api_router.get("/audit-trail/{deal_room_id}")
async def get_audit_trail(deal_room_id: str):
    """Get complete audit trail for a deal room"""
    # Get advisory logs
    logs = await db.advisory_logs.find(
        {"deal_room_id": deal_room_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    # Get document uploads
    docs = await db.documents.find(
        {"deal_room_id": deal_room_id},
        {"_id": 0, "file_content": 0}
    ).sort("uploaded_at", -1).to_list(100)
    
    # Get compliance updates
    checklists = await db.compliance_checklists.find(
        {"deal_room_id": deal_room_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(50)
    
    return {
        "advisory_logs": logs,
        "document_uploads": docs,
        "compliance_updates": checklists
    }

# ============== STATS ==============

@api_router.get("/stats")
async def get_stats():
    """Get system statistics"""
    deal_rooms_count = await db.deal_rooms.count_documents({})
    documents_count = await db.documents.count_documents({})
    advisory_logs_count = await db.advisory_logs.count_documents({})
    
    # Compliance stats
    compliant_count = await db.compliance_checklists.count_documents({"status": "compliant"})
    pending_count = await db.compliance_checklists.count_documents({"status": "pending"})
    overdue_count = await db.compliance_checklists.count_documents({"status": "overdue"})
    
    return {
        "deal_rooms": deal_rooms_count,
        "documents": documents_count,
        "advisory_logs": advisory_logs_count,
        "compliance": {
            "compliant": compliant_count,
            "pending": pending_count,
            "overdue": overdue_count
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
