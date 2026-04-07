"use client";

import { useCallback, useState } from "react";
import { Eye, FileText, FileType2, Presentation, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "pptx";
  date: string;
  status: "processing" | "ready";
  size: string;
}

const mockDocs: Document[] = [
  { id: "1", name: "Q4 Financial Report.pdf", type: "pdf", date: "Apr 5, 2026", status: "ready", size: "2.4 MB" },
  { id: "2", name: "Product Roadmap.docx", type: "docx", date: "Apr 4, 2026", status: "ready", size: "1.1 MB" },
  { id: "3", name: "Team Meeting Notes.pdf", type: "pdf", date: "Apr 3, 2026", status: "processing", size: "890 KB" },
  { id: "4", name: "Marketing Pitch.pptx", type: "pptx", date: "Apr 2, 2026", status: "ready", size: "5.2 MB" },
];

const typeIcons = { pdf: FileText, docx: FileType2, pptx: Presentation };
const typeColors = {
  pdf: "bg-destructive/10 text-destructive",
  docx: "bg-info/10 text-info",
  pptx: "bg-warning/10 text-warning",
};

export function DocumentsView() {
  const [docs, setDocs] = useState<Document[]>(mockDocs);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const simulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setDocs((prev) => [
            {
              id: String(Date.now()),
              name: "New Upload.pdf",
              type: "pdf",
              date: "Just now",
              status: "processing",
              size: "1.5 MB",
            },
            ...prev,
          ]);
          return 0;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    simulateUpload();
  }, []);

  const handleDelete = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-muted-foreground mt-1">{docs.length} documents uploaded</p>
        </div>
      </div>

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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Uploading...</p>
            <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">DOCX</Badge>
              <Badge variant="secondary">PPTX</Badge>
            </div>
            <input type="file" className="hidden" accept=".pdf,.docx,.pptx" />
            <Button variant="outline" className="mt-4" onClick={simulateUpload}>
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
                        {doc.size} · {doc.date}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${typeColors[doc.type]}`}>
                      {doc.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block sm:col-span-2 text-sm text-muted-foreground">{doc.date}</div>
                  <div className="hidden sm:block sm:col-span-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        doc.status === "ready" ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {doc.status === "ready" ? "Ready" : "Processing"}
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
                      onClick={() => handleDelete(doc.id)}
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
