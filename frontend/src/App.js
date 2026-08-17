import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { 
  FileText, Shield, Upload, Send, Plus, Scale, ChevronRight,
  FolderOpen, Clock, CheckCircle, AlertTriangle, XCircle,
  Search, Menu, LogOut, Settings, BarChart2, FileEdit,
  Trash2, Download, Lock, Unlock, RefreshCw, X, ExternalLink,
  Briefcase, Globe, Building2, Cloud, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import CommandCenter from "@/components/CommandCenter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";

// Firebase imports for storage
import {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
  isFirebaseAvailable,
  computeFileHash,
} from "@/lib/firebase";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Jurisdictions
const JURISDICTIONS = [
  { value: "NIGERIA (CAMA 2020)", label: "Nigeria (CAMA 2020)" },
  { value: "US (DELAWARE DGCL)", label: "US (Delaware DGCL)" },
  { value: "UK (Companies Act 2006)", label: "UK (Companies Act 2006)" },
  { value: "CROSS-BORDER", label: "Cross-Border Transaction" },
];

// Document folders
const FOLDERS = [
  { value: "Legal_Drafts", label: "Legal Drafts", icon: FileEdit },
  { value: "Due_Diligence", label: "Due Diligence", icon: Search },
  { value: "CBRNE_Technical", label: "Technical Documents", icon: Settings },
  { value: "KYC_Docs", label: "KYC Documents", icon: Shield },
];

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    compliant: { className: "badge-compliant", label: "COMPLIANT" },
    pending: { className: "badge-pending", label: "PENDING" },
    overdue: { className: "badge-overdue", label: "OVERDUE" },
    indexed: { className: "badge-indexed", label: "INDEXED" },
    processing: { className: "badge-pending", label: "PROCESSING" },
  };
  const { className, label } = config[status] || config.pending;
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-sm ${className}`}>
      {label}
    </span>
  );
};

// GCC-SAE Logo
const GCCLogo = () => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-sm bg-[var(--accent-gold-dim)] flex items-center justify-center border border-[var(--border-color)]">
      <Scale className="w-4 h-4 text-[var(--primary)]" />
    </div>
    <div>
      <h1 className="font-serif text-lg font-semibold text-[var(--foreground)]">GCC-SAE</h1>
      <p className="text-[10px] text-[var(--foreground-muted)] tracking-wider">Executive Deal Room</p>
    </div>
  </div>
);

// Storage Badge
const StorageBadge = ({ useFirebase }) => (
  <div className={`flex items-center gap-1 px-2 py-1 rounded-sm ${
    useFirebase 
      ? "bg-orange-900/20 text-orange-400 border border-orange-800/30" 
      : "bg-blue-900/20 text-blue-400 border border-blue-800/30"
  }`}>
    {useFirebase ? <Cloud className="w-3 h-3" /> : <Database className="w-3 h-3" />}
    <span className="text-[10px] font-bold">{useFirebase ? "FIREBASE" : "MONGODB"}</span>
  </div>
);

// Sidebar Component
const Sidebar = ({ dealRooms, selectedDealRoom, onSelectDealRoom, onCreateDealRoom, complianceItems, onUpdateCompliance }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("NIGERIA (CAMA 2020)");

  const handleCreate = async () => {
    if (!newDealName.trim()) return;
    await onCreateDealRoom(newDealName, newJurisdiction);
    setNewDealName("");
    setIsCreating(false);
  };

  const handleStatusClick = async (item) => {
    const statusCycle = ['pending', 'compliant', 'overdue'];
    const currentIndex = statusCycle.indexOf(item.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    await onUpdateCompliance(item.id, nextStatus);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] border-r border-[var(--navy-light)] bg-[var(--background)] hidden md:flex flex-col z-30">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--navy-light)]">
        <GCCLogo />
      </div>

      {/* Active Matters */}
      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
            Active Matters
          </span>
        </div>

        {/* New Matter Button */}
        {!isCreating ? (
          <Button
            data-testid="new-matter-btn"
            onClick={() => setIsCreating(true)}
            className="w-full mb-4 btn-primary rounded-sm h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Matter
          </Button>
        ) : (
          <div className="mb-4 p-3 bg-[var(--background-secondary)] rounded-sm border border-[var(--navy-light)] animate-fade-in">
            <Input
              data-testid="new-matter-name-input"
              value={newDealName}
              onChange={(e) => setNewDealName(e.target.value)}
              placeholder="Deal name..."
              className="input-advisory mb-2 h-8 text-sm"
              autoFocus
            />
            <Select value={newJurisdiction} onValueChange={setNewJurisdiction}>
              <SelectTrigger data-testid="new-matter-jurisdiction-select" className="input-advisory h-8 text-sm mb-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JURISDICTIONS.map((j) => (
                  <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                data-testid="create-matter-btn"
                onClick={handleCreate}
                className="flex-1 btn-primary rounded-sm h-7 text-xs"
                disabled={!newDealName.trim()}
              >
                Create
              </Button>
              <Button
                data-testid="cancel-create-btn"
                onClick={() => setIsCreating(false)}
                variant="ghost"
                className="h-7 text-xs px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Deal Rooms List */}
        <ScrollArea className="flex-1 -mx-2">
          <div className="px-2 space-y-1">
            {dealRooms.length === 0 ? (
              <p className="text-xs text-[var(--foreground-muted)] text-center py-4">
                No active matters
              </p>
            ) : (
              dealRooms.map((deal) => (
                <button
                  key={deal.id}
                  data-testid={`deal-room-${deal.id}`}
                  onClick={() => onSelectDealRoom(deal)}
                  className={`w-full text-left p-3 rounded-sm transition-all ${
                    selectedDealRoom?.id === deal.id
                      ? "bg-[var(--accent-gold-dim)] border border-[var(--border-color)]"
                      : "hover:bg-[var(--background-secondary)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3 h-3 text-[var(--primary)]" />
                    <span className="text-sm font-medium truncate">{deal.name}</span>
                  </div>
                  <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                    {deal.jurisdiction}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Tools Section */}
        <div className="mt-4 pt-4 border-t border-[var(--navy-light)]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2 block">
            Tools
          </span>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 p-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] rounded-sm transition-colors">
              <FileEdit className="w-4 h-4" />
              Drafting
            </button>
            <button className="w-full flex items-center gap-2 p-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] rounded-sm transition-colors">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Statutory Tracker */}
        <div className="mt-4 pt-4 border-t border-[var(--navy-light)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
              Statutory Tracker
            </span>
            <RefreshCw className="w-3 h-3 text-[var(--foreground-muted)]" />
          </div>
          <ScrollArea className="h-[180px] -mx-2">
            <div className="px-2 space-y-2">
              {complianceItems.length === 0 ? (
                <p className="text-xs text-[var(--foreground-muted)] text-center py-4">
                  Select a matter to view compliance
                </p>
              ) : (
                complianceItems.map((item) => (
                  <div
                    key={item.id}
                    className={`compliance-item ${item.status} p-2 bg-[var(--background-secondary)] rounded-sm cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors`}
                    onClick={() => handleStatusClick(item)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.regulatory_body && (
                      <p className="text-[10px] text-[var(--foreground-muted)]">
                        {item.regulatory_body}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {complianceItems.length > 0 && (
            <p className="text-[10px] text-[var(--foreground-muted)] text-center mt-2">
              Click status to cycle through states
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

// Header Component
const Header = ({ selectedDealRoom, activeTab, setActiveTab, useFirebaseStorage, workspaceMode, setWorkspaceMode }) => (
  <header className="glass-header h-14 flex items-center justify-between px-4 sticky top-0 z-20">
    <div className="flex items-center gap-4">
      {/* Mobile menu */}
      <button className="md:hidden p-2 hover:bg-[var(--background-secondary)] rounded-sm">
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Deal room info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-sm bg-[var(--accent-gold-dim)] flex items-center justify-center text-[var(--primary)] font-serif font-semibold">
          {workspaceMode === "control" ? "C" : "S"}
        </div>
        <div>
          <h2 className="font-serif font-semibold text-[var(--foreground)]">
            {workspaceMode === "control" ? "GCC Control Center" : (selectedDealRoom?.name || "GCC-SAE")}
          </h2>
          <p className="text-[10px] text-[var(--foreground-muted)]">
            {workspaceMode === "control" ? "Adoption · Governance · Value" : "Privileged & Confidential"}
          </p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {/* Case ID */}
      {workspaceMode === "workspace" && selectedDealRoom && (
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-[10px] text-[var(--foreground-muted)]">CASE ID</span>
          <span className="text-xs font-mono text-[var(--foreground)]">
            {selectedDealRoom.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      )}

      {/* Action buttons */}
      {workspaceMode === "workspace" && (
        <Button variant="outline" size="sm" className="btn-secondary rounded-sm h-8 text-xs hidden xl:flex">
          <Building2 className="w-3 h-3 mr-1" />
          Call Counsel
        </Button>
      )}
      
      {/* Secure badge */}
      <div className="flex items-center gap-1 px-2 py-1 badge-encrypted rounded-sm">
        <Lock className="w-3 h-3" />
        <span className="text-[10px] font-bold">{workspaceMode === "control" ? "ADMIN" : "SECURE"}</span>
      </div>

      {/* Primary workspace switcher */}
      <div className="hidden lg:flex items-center rounded-sm border border-[var(--navy-light)] bg-[var(--background-secondary)] p-0.5">
        <button
          type="button"
          onClick={() => setWorkspaceMode("workspace")}
          className={`h-7 px-2.5 text-[10px] font-semibold transition ${workspaceMode === "workspace" ? "bg-[var(--accent-gold-dim)] text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
          data-testid="workspace-mode"
        >
          Deal workspace
        </button>
        <button
          type="button"
          onClick={() => setWorkspaceMode("control")}
          className={`h-7 px-2.5 text-[10px] font-semibold transition ${workspaceMode === "control" ? "bg-[var(--accent-gold-dim)] text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
          data-testid="control-center-mode"
        >
          Control Center
        </button>
      </div>

      {/* Tabs */}
      {workspaceMode === "workspace" && <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
        <TabsList className="bg-[var(--background-secondary)] h-8">
          <TabsTrigger
            data-testid="tab-vault"
            value="vault"
            className="text-xs data-[state=active]:bg-[var(--accent-gold-dim)] data-[state=active]:text-[var(--primary)]"
          >
            The Vault
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-audit"
            value="audit"
            className="text-xs data-[state=active]:bg-[var(--accent-gold-dim)] data-[state=active]:text-[var(--primary)]"
          >
            Audit Trail
          </TabsTrigger>
        </TabsList>
      </Tabs>}

      {/* User menu */}
      <div className="flex items-center gap-2 pl-3 border-l border-[var(--navy-light)]">
        <span className="text-[10px] text-[var(--foreground-muted)] hidden lg:block">
          Firm Administrator
        </span>
        <button className="p-1 hover:bg-[var(--background-secondary)] rounded-sm">
          <LogOut className="w-4 h-4 text-[var(--foreground-muted)]" />
        </button>
      </div>
    </div>
  </header>
);

// Chat Message Component
const ChatMessage = ({ message, isUser }) => (
  <div className={`animate-fade-in ${isUser ? "flex justify-end" : ""}`}>
    <div className={`max-w-[90%] p-4 ${isUser ? "chat-message-user" : "chat-message-assistant"}`}>
      {!isUser && message.reference_id && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-color)]">
          <span className="font-serif text-xs text-[var(--primary)]">LEARNED SILK</span>
          <span className="text-[10px] text-[var(--foreground-muted)]">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
      <div className="prose-advisory text-sm whitespace-pre-wrap">
        {message.content}
      </div>
      {!isUser && message.reference_id && (
        <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
          <span>REF: {message.reference_id}</span>
          <span>•</span>
          <span>STATUS: ADVISORY</span>
        </div>
      )}
    </div>
  </div>
);

// Chat Panel Component
const ChatPanel = ({ selectedDealRoom, jurisdiction, setJurisdiction }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        content: `Greetings. I am the Global Corporate Counsel & Senior Advocate Engine. I have access to the full repository of CAMA 2020, DGCL, and International Precedents. I stand ready to apply the full weight of the law to secure your commercial interests. How may I guide your Board today?`,
        isUser: false,
        reference_id: "GCC-INIT",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        deal_room_id: selectedDealRoom?.id || null,
        message: inputValue,
        jurisdiction: jurisdiction,
      });

      const assistantMessage = {
        id: Date.now().toString() + "_response",
        content: response.data.response,
        isUser: false,
        reference_id: response.data.reference_id,
        timestamp: response.data.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response from the Advocate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isUser={msg.isUser} />
          ))}
          {isLoading && (
            <div className="chat-message-assistant p-4 max-w-[90%]">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xs text-[var(--primary)]">LEARNED SILK</span>
                <div className="typing-indicator flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-[var(--navy-light)] bg-[var(--background)]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[var(--background-secondary)] rounded-sm border border-[var(--navy-light)] p-3">
            <Textarea
              data-testid="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type to start a new matter..."
              className="min-h-[60px] max-h-[120px] bg-transparent border-0 resize-none focus:ring-0 text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--navy-light)]">
              <div className="flex items-center gap-2">
                <Select value={jurisdiction} onValueChange={setJurisdiction}>
                  <SelectTrigger data-testid="jurisdiction-select" className="input-advisory h-8 w-[180px] text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button className="p-2 hover:bg-[var(--background)] rounded-sm transition-colors">
                  <Upload className="w-4 h-4 text-[var(--foreground-muted)]" />
                </button>
              </div>
              <Button
                data-testid="send-message-btn"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="btn-primary rounded-sm h-8 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-2 text-[var(--foreground-muted)]">
            GCC-SAE AI Advisory • Supports PDF, Images & Text • Not a substitute for human counsel.
          </p>
        </div>
      </div>
    </div>
  );
};

// Document Vault Component
const DocumentVault = ({ selectedDealRoom, documents, onUpload, onDelete, onRefresh, isUploading, uploadProgress, useFirebaseStorage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("Legal_Drafts");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await onUpload(file, selectedFolder);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      await onUpload(file, selectedFolder);
    }
    e.target.value = "";
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--navy-light)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg text-[var(--primary)]">THE VAULT</h3>
            <StorageBadge useFirebase={useFirebaseStorage} />
          </div>
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-[var(--background-secondary)] rounded-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Folder selector */}
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="input-advisory h-8 text-xs mb-3">
            <FolderOpen className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOLDERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Drop zone */}
        <div
          data-testid="document-drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`drop-zone p-4 rounded-sm text-center cursor-pointer transition-all ${
            isDragging ? "active" : ""
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="space-y-2">
              <Cloud className="w-6 h-6 mx-auto text-[var(--primary)] animate-pulse" />
              <p className="text-xs text-[var(--foreground-muted)]">
                {useFirebaseStorage ? "Uploading to Firebase Storage..." : "Uploading to MongoDB..."}
              </p>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--foreground-muted)]" />
              <p className="text-xs text-[var(--foreground-muted)]">
                Drag & Drop Legal Briefs
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                PDF, DOCX, CSV (Max 65MB)
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.docx,.doc,.csv,.xlsx,.txt"
            disabled={isUploading}
          />
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
          <Input
            data-testid="document-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indexed documents..."
            className="input-advisory h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Documents list */}
      <ScrollArea className="flex-1 p-4">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--foreground-muted)] opacity-50" />
            <p className="text-xs text-[var(--foreground-muted)]">
              {selectedDealRoom ? "No documents uploaded yet" : "Select a matter to view documents"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                data-testid={`document-${doc.id}`}
                className="doc-card p-3 rounded-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-sm bg-[var(--accent-gold-dim)] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{doc.file_name}</span>
                      <StatusBadge status={doc.indexing_status || 'indexed'} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-muted)]">
                      <span>v{doc.version || '1.0'}</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                    {doc.download_url && (
                      <a 
                        href={doc.download_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in Firebase
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1 hover:bg-[var(--background)] rounded-sm transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Audit Trail Component
const AuditTrail = ({ selectedDealRoom, auditData }) => {
  if (!selectedDealRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[var(--foreground-muted)]">Select a matter to view audit trail</p>
      </div>
    );
  }

  const allEvents = [
    ...(auditData.advisory_logs || []).map((log) => ({
      type: "advisory",
      title: log.type === "legal_opinion" ? "Legal Opinion" : "Strategic Directive",
      content: (log.content || '').substring(0, 100) + "...",
      timestamp: log.timestamp,
    })),
    ...(auditData.document_uploads || []).map((doc) => ({
      type: "document",
      title: `Document Uploaded: ${doc.file_name}`,
      content: `Folder: ${doc.folder} | Hash: ${(doc.file_hash || '').substring(0, 8)}...`,
      timestamp: doc.uploaded_at,
    })),
    ...(auditData.compliance_updates || []).map((cl) => ({
      type: "compliance",
      title: `Compliance: ${cl.name}`,
      content: `Status: ${(cl.status || 'pending').toUpperCase()}`,
      timestamp: cl.updated_at || cl.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--navy-light)]">
        <h3 className="font-serif text-lg text-[var(--primary)]">AUDIT TRAIL</h3>
        <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
          Complete transaction history
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        {allEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--foreground-muted)] opacity-50" />
            <p className="text-xs text-[var(--foreground-muted)]">No audit events yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEvents.map((event, idx) => (
              <div
                key={idx}
                className="p-3 bg-[var(--background-secondary)] rounded-sm border-l-2 border-[var(--primary)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  {event.type === "advisory" && <Scale className="w-3 h-3 text-[var(--primary)]" />}
                  {event.type === "document" && <FileText className="w-3 h-3 text-[var(--status-info)]" />}
                  {event.type === "compliance" && <CheckCircle className="w-3 h-3 text-[var(--status-success)]" />}
                  <span className="text-xs font-medium">{event.title}</span>
                </div>
                <p className="text-[10px] text-[var(--foreground-muted)] mb-1">{event.content}</p>
                <span className="text-[10px] text-[var(--foreground-muted)]">
                  {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Main App Component
function App() {
  const [dealRooms, setDealRooms] = useState([]);
  const [selectedDealRoom, setSelectedDealRoom] = useState(null);
  const [complianceItems, setComplianceItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditData, setAuditData] = useState({ advisory_logs: [], document_uploads: [], compliance_updates: [] });
  const [activeTab, setActiveTab] = useState("vault");
  const [jurisdiction, setJurisdiction] = useState("NIGERIA (CAMA 2020)");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useFirebaseStorage, setUseFirebaseStorage] = useState(isFirebaseAvailable());
  // Lead with the portfolio's enterprise administration surface. The
  // practitioner workspace remains one click away and loads its API data only
  // when requested.
  const [workspaceMode, setWorkspaceMode] = useState("control");

  // Fetch deal rooms
  const fetchDealRooms = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/deal-rooms`);
      setDealRooms(response.data);
    } catch (error) {
      console.error("Error fetching deal rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch compliance items
  const fetchCompliance = useCallback(async (dealRoomId) => {
    try {
      const response = await axios.get(`${API}/compliance-checklists/${dealRoomId}`);
      setComplianceItems(response.data);
    } catch (error) {
      console.error("Error fetching compliance:", error);
    }
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async (dealRoomId) => {
    try {
      const response = await axios.get(`${API}/documents/${dealRoomId}`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, []);

  // Fetch audit trail
  const fetchAuditTrail = useCallback(async (dealRoomId) => {
    try {
      const response = await axios.get(`${API}/audit-trail/${dealRoomId}`);
      setAuditData(response.data);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (workspaceMode === "workspace") {
      fetchDealRooms();
    }
  }, [fetchDealRooms, workspaceMode]);

  // Load deal room data when selected
  useEffect(() => {
    if (selectedDealRoom) {
      fetchCompliance(selectedDealRoom.id);
      fetchDocuments(selectedDealRoom.id);
      fetchAuditTrail(selectedDealRoom.id);
      setJurisdiction(selectedDealRoom.jurisdiction);
    } else {
      setComplianceItems([]);
      setDocuments([]);
      setAuditData({ advisory_logs: [], document_uploads: [], compliance_updates: [] });
    }
  }, [selectedDealRoom, fetchCompliance, fetchDocuments, fetchAuditTrail]);

  // Create deal room
  const handleCreateDealRoom = async (name, jurisdiction) => {
    try {
      const response = await axios.post(`${API}/deal-rooms`, { name, jurisdiction });
      setDealRooms((prev) => [...prev, response.data]);
      setSelectedDealRoom(response.data);
      toast.success("Deal room created");
    } catch (error) {
      console.error("Error creating deal room:", error);
      toast.error("Failed to create deal room");
    }
  };

  // Update compliance status
  const handleUpdateCompliance = async (checklistId, status) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      await axios.put(`${API}/compliance-checklists/${checklistId}`, formData);
      if (selectedDealRoom) {
        await fetchCompliance(selectedDealRoom.id);
        await fetchAuditTrail(selectedDealRoom.id);
      }
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error("Error updating compliance:", error);
      toast.error("Failed to update status");
    }
  };

  // Upload document - try Firebase first, fallback to MongoDB
  const handleUploadDocument = async (file, folder) => {
    if (!selectedDealRoom) {
      toast.error("Please select a deal room first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Try Firebase Storage first
      if (useFirebaseStorage) {
        try {
          const firebaseResult = await uploadToFirebaseStorage(
            file,
            selectedDealRoom.id,
            folder,
            (progress) => setUploadProgress(progress)
          );

          // Save metadata to MongoDB backend
          const formData = new FormData();
          formData.append("file", file);
          formData.append("deal_room_id", selectedDealRoom.id);
          formData.append("folder", folder);
          formData.append("storage_path", firebaseResult.storagePath);
          formData.append("download_url", firebaseResult.downloadURL);
          formData.append("file_hash", firebaseResult.fileHash);

          await axios.post(`${API}/documents/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          toast.success(`${file.name} uploaded to Firebase Storage`);
        } catch (firebaseError) {
          console.warn("Firebase upload failed, falling back to MongoDB:", firebaseError);
          setUseFirebaseStorage(false);
          // Fall through to MongoDB upload
          throw firebaseError;
        }
      } else {
        // Upload directly to MongoDB
        const formData = new FormData();
        formData.append("file", file);
        formData.append("deal_room_id", selectedDealRoom.id);
        formData.append("folder", folder);

        await axios.post(`${API}/documents/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          },
        });

        toast.success(`${file.name} uploaded`);
      }

      await fetchDocuments(selectedDealRoom.id);
      await fetchAuditTrail(selectedDealRoom.id);
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // If Firebase failed, try MongoDB as fallback
      if (useFirebaseStorage) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("deal_room_id", selectedDealRoom.id);
          formData.append("folder", folder);

          await axios.post(`${API}/documents/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

          toast.success(`${file.name} uploaded (using MongoDB fallback)`);
          await fetchDocuments(selectedDealRoom.id);
          await fetchAuditTrail(selectedDealRoom.id);
        } catch (fallbackError) {
          toast.error("Failed to upload document");
        }
      } else {
        toast.error("Failed to upload document");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API}/documents/${documentId}`);
      toast.success("Document deleted");
      if (selectedDealRoom) {
        await fetchDocuments(selectedDealRoom.id);
        await fetchAuditTrail(selectedDealRoom.id);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="h-screen w-full flex">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      {workspaceMode === "workspace" && (
        <Sidebar
          dealRooms={dealRooms}
          selectedDealRoom={selectedDealRoom}
          onSelectDealRoom={setSelectedDealRoom}
          onCreateDealRoom={handleCreateDealRoom}
          complianceItems={complianceItems}
          onUpdateCompliance={handleUpdateCompliance}
        />
      )}

      {/* Main content */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${workspaceMode === "workspace" ? "md:ml-[240px]" : ""}`}>
        {/* Header */}
        <Header
          selectedDealRoom={selectedDealRoom}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          useFirebaseStorage={useFirebaseStorage}
          workspaceMode={workspaceMode}
          setWorkspaceMode={setWorkspaceMode}
        />

        {workspaceMode === "control" ? (
          <CommandCenter />
        ) : (
          /* Content area */
          <div className="flex-1 flex overflow-hidden">
            {/* Chat panel */}
            <div className="flex-1 lg:border-r lg:border-[var(--navy-light)]">
              <ChatPanel
                selectedDealRoom={selectedDealRoom}
                jurisdiction={jurisdiction}
                setJurisdiction={setJurisdiction}
              />
            </div>

            {/* Right panel (Vault/Audit) */}
            <div className="hidden lg:block w-[360px] bg-[var(--background-secondary)]/50">
              {activeTab === "vault" ? (
                <DocumentVault
                  selectedDealRoom={selectedDealRoom}
                  documents={documents}
                  onUpload={handleUploadDocument}
                  onDelete={handleDeleteDocument}
                  onRefresh={() => selectedDealRoom && fetchDocuments(selectedDealRoom.id)}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  useFirebaseStorage={useFirebaseStorage}
                />
              ) : (
                <AuditTrail
                  selectedDealRoom={selectedDealRoom}
                  auditData={auditData}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
