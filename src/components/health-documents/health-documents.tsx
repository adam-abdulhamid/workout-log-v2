"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Trash2, Upload, Download } from "lucide-react";

type HealthDocument = {
  id: string;
  title: string;
  documentDate: string;
  pdfData: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HealthDocuments() {
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDocumentDate, setNewDocumentDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<HealthDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health-documents");
      if (!res.ok) {
        throw new Error("Failed to load documents.");
      }
      const data = (await res.json()) as HealthDocument[];
      setDocuments(data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load documents."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file.");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    const documentDate = newDocumentDate;

    if (!title || !documentDate || !selectedFile) {
      setError("All fields are required.");
      return;
    }

    setIsSaving(true);
    try {
      // Convert PDF to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const pdfData = await base64Promise;

      const res = await fetch("/api/health-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, documentDate, pdfData }),
      });
      if (!res.ok) {
        throw new Error("Failed to save document.");
      }
      const document = (await res.json()) as HealthDocument;
      setDocuments((prev) => [document, ...prev]);
      setNewTitle("");
      setNewDocumentDate("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedDocument) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/health-documents/${selectedDocument.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete document.");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== selectedDocument.id));
      setSelectedDocument(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openDocument(document: HealthDocument) {
    setSelectedDocument(document);
  }

  function closeDialog() {
    setSelectedDocument(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Health Documents</CardTitle>
          <CardDescription>
            Upload and view health assessment documents (DEXA scans, VO2 max
            tests, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., DEXA Scan - January 2024"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Document Date
              </label>
              <Input
                type="date"
                value={newDocumentDate}
                onChange={(e) => setNewDocumentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                PDF File
              </label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isSaving || !newTitle.trim() || !newDocumentDate || !selectedFile
              }
            >
              {isSaving ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="text-xs uppercase tracking-wider text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Documents
            </div>
            {isLoading ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
                No documents yet.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => openDocument(document)}
                    className="w-full text-left p-3 rounded-lg border border-border bg-background/40 hover:bg-background/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {document.title}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          {formatDate(document.documentDate)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedDocument}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-[95vw] md:max-w-6xl lg:max-w-7xl h-[90vh] flex flex-col p-4 md:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div>
                <div>{selectedDocument?.title}</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  {selectedDocument &&
                    formatDate(selectedDocument.documentDate)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedDocument) {
                      const link = document.createElement("a");
                      link.href = selectedDocument.pdfData;
                      link.download = `${selectedDocument.title}.pdf`;
                      link.click();
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="flex-1 overflow-auto min-h-0 mt-4">
              <object
                data={selectedDocument.pdfData}
                type="application/pdf"
                className="w-full h-full border rounded"
                title={selectedDocument.title}
              >
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Your browser cannot display PDFs. Please download the file to
                    view it.
                  </p>
                  <Button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = selectedDocument.pdfData;
                      link.download = `${selectedDocument.title}.pdf`;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </object>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
