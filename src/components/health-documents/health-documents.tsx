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

type HealthDocumentListItem = {
  id: string;
  title: string;
  documentDate: string;
  createdAt: string;
  updatedAt: string;
};

type HealthDocument = HealthDocumentListItem & {
  pdfData: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function HealthDocuments() {
  const [documents, setDocuments] = useState<HealthDocumentListItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDocumentDate, setNewDocumentDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<HealthDocument | null>(null);
  const [openingDocument, setOpeningDocument] =
    useState<HealthDocumentListItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health-documents");
      if (!res.ok) {
        throw new Error("Failed to load documents.");
      }
      const data = (await res.json()) as HealthDocumentListItem[];
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

  // Cleanup blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

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

  async function openDocument(documentItem: HealthDocumentListItem) {
    setOpeningDocument(documentItem);
    setIsLoadingDocument(true);
    setError(null);
    try {
      // Fetch full document data including PDF
      const res = await fetch(`/api/health-documents/${documentItem.id}`);
      if (!res.ok) {
        throw new Error("Failed to load document.");
      }
      const fullDocument = (await res.json()) as HealthDocument;
      setSelectedDocument(fullDocument);
      // Convert base64 data URL to blob URL for better browser compatibility
      const blob = dataUrlToBlob(fullDocument.pdfData);
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document.");
      setOpeningDocument(null);
    } finally {
      setIsLoadingDocument(false);
    }
  }

  function closeDialog() {
    // Revoke the blob URL to free memory
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setSelectedDocument(null);
    setOpeningDocument(null);
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
        open={!!selectedDocument || !!openingDocument}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-[95vw] md:max-w-6xl lg:max-w-7xl h-[90vh] flex flex-col p-4 md:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div>
                <div>{selectedDocument?.title || openingDocument?.title}</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  {(selectedDocument || openingDocument) &&
                    formatDate((selectedDocument || openingDocument)!.documentDate)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pdfBlobUrl}
                  onClick={() => {
                    if (selectedDocument && pdfBlobUrl) {
                      const link = document.createElement("a");
                      link.href = pdfBlobUrl;
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
          {isLoadingDocument ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-muted-foreground">Loading document...</div>
            </div>
          ) : selectedDocument && pdfBlobUrl ? (
            <div className="flex-1 flex flex-col min-h-0 mt-4">
              {/* Mobile-friendly fallback button */}
              <div className="md:hidden flex items-center justify-center gap-2 mb-4 p-4 border rounded bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  PDF may not display on mobile.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pdfBlobUrl, "_blank")}
                >
                  Open PDF
                </Button>
              </div>
              <div className="flex-1 overflow-auto min-h-0">
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full border rounded min-h-[400px] md:min-h-0"
                  title={selectedDocument.title}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
