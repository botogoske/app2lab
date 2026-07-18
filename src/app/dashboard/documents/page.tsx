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
import { FileText, Trash2, User, X } from "lucide-react";

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
  const [showSidebarContent, setShowSidebarContent] = useState(true);

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
      <Sidebar user={user} />

      <div className="ml-64 min-h-screen flex flex-col">
        <header className="border-b sticky top-0 bg-background z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Documentos</h1>
              {selectedDocument && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Fechar visualização
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebarContent(!showSidebarContent)}
            >
              {showSidebarContent ? "Ocultar painel" : "Mostrar painel"}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {selectedDocument ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedDocument.title}
                    </h2>
                    {selectedDocument.personName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {selectedDocument.personName}
                      </p>
                    )}
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
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>
                                    {new Date(
                                      doc.createdAt,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                  {doc.personName && (
                                    <>
                                      <span>·</span>
                                      <span className="flex items-center gap-1 text-primary">
                                        <User className="h-3 w-3" />
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
            </div>

            {showSidebarContent && (
              <div className="w-80 shrink-0 space-y-4">
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
