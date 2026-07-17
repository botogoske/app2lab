'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadZone } from '@/components/documents/upload-zone'
import { CameraCapture } from '@/components/documents/camera-capture'
import { FileText, LogOut, Trash2 } from 'lucide-react'

const PdfViewer = dynamic(
  () => import('@/components/documents/pdf-viewer').then((mod) => mod.PdfViewer),
  { ssr: false }
)

interface User {
  id: string
  name: string
  email: string
}

interface Document {
  id: string
  title: string
  fileUrl: string
  fileType: string
  createdAt: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  const fetchDocuments = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/documents?userId=${user.id}`)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      setDocuments(documents.filter((doc) => doc.id !== documentId))
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visualizador de Documentos</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá, {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {selectedDocument ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{selectedDocument.title}</h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDocument(null)}
                  >
                    Voltar
                  </Button>
                </div>
                {selectedDocument.fileType === 'pdf' ? (
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
                    <p className="text-muted-foreground">Carregando documentos...</p>
                  ) : documents.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhum documento encontrado. Faça upload de um documento ou capture uma foto.
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
                              <p className="text-sm text-muted-foreground">
                                {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(doc.id)
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

          <div className="space-y-6">
            <UploadZone userId={user.id} onUploadComplete={fetchDocuments} />
            <CameraCapture userId={user.id} onCaptureComplete={fetchDocuments} />
          </div>
        </div>
      </main>
    </div>
  )
}
