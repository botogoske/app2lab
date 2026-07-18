"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sidebar } from "@/components/sidebar";
import { UploadZone } from "@/components/documents/upload-zone";
import { CameraCapture } from "@/components/documents/camera-capture";
import { ImportZone } from "@/components/documents/import-zone";
import { FileText, Trash2, User, X, Menu, PanelRightOpen, PanelRightClose } from "lucide-react";

const PdfViewer = dynamic(
  () =>
    import("@/components/documents/pdf-viewer").then((mod) => mod.PdfViewer),
  { ssr: false },
);

interface User {
  id: string;
  name: string;
  email: string;
}

interface Document {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  personName: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/documents?userId=${user.id}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={user}
        isOpen={showLeftSidebar}
        onClose={() => setShowLeftSidebar(false)}
      />

      <div className="flex min-h-screen lg:ml-64">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b sticky top-0 bg-background z-30">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setShowLeftSidebar(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Documentos</h1>
                {selectedDocument && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => setSelectedDocument(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Fechar
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRightPanel(!showRightPanel)}
              >
                {showRightPanel ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            {selectedDocument ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold truncate">
                      {selectedDocument.title}
                    </h2>
                    {selectedDocument.personName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 shrink-0" />
                        {selectedDocument.personName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 sm:hidden"
                    onClick={() => setSelectedDocument(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Fechar
                  </Button>
                </div>
                {selectedDocument.fileType === "pdf" ? (
                  <PdfViewer fileUrl={selectedDocument.fileUrl} />
                ) : (
                  <Card className="p-4">
                    <img
                      src={selectedDocument.fileUrl}
                      alt={selectedDocument.title}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Seus Documentos</CardTitle>
                  <CardDescription>
                    Clique em um documento para visualizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground">
                      Carregando documentos...
                    </p>
                  ) : documents.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhum documento encontrado. Faça upload de um documento
                      ou capture uma foto.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="shrink-0">
                                  {new Date(doc.createdAt).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                                {doc.personName && (
                                  <>
                                    <span className="shrink-0">·</span>
                                    <span className="flex items-center gap-1 text-primary truncate">
                                      <User className="h-3 w-3 shrink-0" />
                                      {doc.personName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>

        {showRightPanel && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowRightPanel(false)}
            />
            <aside className="fixed right-0 top-0 h-full w-80 border-l bg-card overflow-y-auto z-50 lg:relative lg:z-auto lg:w-80 shrink-0">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Ações
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowRightPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ImportZone
                  userId={user.id}
                  onImportComplete={fetchDocuments}
                />
                <UploadZone
                  userId={user.id}
                  onUploadComplete={fetchDocuments}
                />
                <CameraCapture
                  userId={user.id}
                  onCaptureComplete={fetchDocuments}
                />
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
