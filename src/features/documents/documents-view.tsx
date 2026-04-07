"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, FileType2, Presentation, Trash2, Upload } from "lucide-react";

import { api } from "@/services/api";
import type { DocumentItem, DocumentProcessingWorkerStats, DocumentType } from "@/types/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const typeIcons: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  docx: FileType2,
  ppt: Presentation,
  pptx: Presentation,
};
const typeColors = {
  pdf: "bg-destructive/10 text-destructive",
  docx: "bg-info/10 text-info",
  ppt: "bg-warning/10 text-warning",
  pptx: "bg-warning/10 text-warning",
};
const supportedExt = new Set<DocumentType>(["pdf", "docx", "ppt", "pptx"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const formatUploadError = (message: string): string => {
  if (message.includes("413") || message.toLowerCase().includes("10mb")) {
    return "File is too large. Maximum upload size is 10 MB per file.";
  }
  if (message.toLowerCase().includes("size does not match")) {
    return "Upload could not be verified. Try again, or refresh and re-upload.";
  }
  return message;
};

export function DocumentsView() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerStats, setWorkerStats] = useState<DocumentProcessingWorkerStats | null>(null);

  const loadDocuments = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await api.listDocuments();
      setDocs(data.documents);
      if (!opts?.silent) setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const hasPendingProcessing = useMemo(
    () => docs.some((d) => d.status === "uploaded" || d.status === "processing"),
    [docs]
  );

  useEffect(() => {
    if (!hasPendingProcessing) return;
    const id = window.setInterval(() => {
      void loadDocuments({ silent: true });
    }, 2500);
    return () => window.clearInterval(id);
  }, [hasPendingProcessing, loadDocuments]);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const data = await api.getDocumentProcessingHealth();
        setWorkerStats(data.worker);
      } catch {
        setWorkerStats(null);
      }
    };
    void loadHealth();
    const id = window.setInterval(loadHealth, 5000);
    return () => window.clearInterval(id);
  }, []);

  const formatSize = (sizeBytes: number): string => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const mapExt = useCallback((fileName: string): DocumentType | null => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !supportedExt.has(ext as DocumentType)) return null;
    return ext as DocumentType;
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      setError(null);
      try {
        for (const file of fileArray) {
          const type = mapExt(file.name);
          if (!type) {
            throw new Error(`Unsupported file type for "${file.name}"`);
          }
          if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error(`"${file.name}" exceeds the 10 MB limit.`);
          }
          await api.uploadDocumentFile(file);
        }
        await loadDocuments();
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Failed to upload document";
        setError(formatUploadError(raw));
      } finally {
        setUploading(false);
      }
    },
    [loadDocuments, mapExt]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      void uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await api.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const countText = useMemo(() => {
    if (loading) return "Loading documents...";
    return `${docs.length} documents uploaded`;
  }, [docs.length, loading]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in pb-safe">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-muted-foreground mt-1">{countText}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {workerStats && (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span className="font-medium text-foreground">Processing worker</span>
          <span>
            Status:{" "}
            <span className={workerStats.running ? "text-warning" : "text-muted-foreground"}>
              {workerStats.running ? "active" : "idle"}
            </span>
          </span>
          <span>Queued: {workerStats.queued}</span>
          <span>In progress: {workerStats.inProgress}</span>
          <span>Processed (session): {workerStats.processedTotal}</span>
          <span>Failed: {workerStats.failedTotal}</span>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading files...</p>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
              Max 10 MB per file. Status updates automatically while documents are processing.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">DOCX</Badge>
              <Badge variant="secondary">PPTX</Badge>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.ppt,.pptx"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  void uploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <Button variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Upload Files
            </Button>
          </>
        )}
      </div>

      {/* Documents list */}
      {docs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border bg-card">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-secondary/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y">
            {docs.map((doc) => {
              const Icon = typeIcons[doc.type];
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors items-center"
                >
                  <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatSize(doc.sizeBytes)} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${typeColors[doc.type]}`}>
                      {doc.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block sm:col-span-2 text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </div>
                  <div className="hidden sm:block sm:col-span-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        doc.status === "ready"
                          ? "bg-accent text-accent-foreground"
                          : doc.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {doc.status === "ready"
                        ? "Ready"
                        : doc.status === "failed"
                          ? "Failed"
                          : doc.status === "uploaded"
                            ? "Uploaded"
                            : "Processing"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
