"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportZoneProps {
  userId: string;
  onImportComplete?: () => void;
}

type ImportStatus = "idle" | "extracting" | "success" | "error";

interface ImportResult {
  document: {
    id: string;
    title: string;
    personName: string | null;
  };
  extractedText: string;
}

export function ImportZone({ userId, onImportComplete }: ImportZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
      setStatus("idle");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleImport = async () => {
    if (!selectedFile) return;

    setStatus("extracting");
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", userId);

      const response = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
      setSelectedFile(null);
      onImportComplete?.();
    } catch {
      setError("Erro ao importar arquivo");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus("idle");
    setError(null);
    setResult(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Importar Documento</h3>
        <p className="text-sm text-muted-foreground">
          Importe um documento para extrair automaticamente o nome da pessoa.
        </p>

        {status === "success" && result ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-green-800">
                  Documento importado com sucesso!
                </p>
                <p className="text-sm text-green-700">
                  {result.document.personName ? (
                    <>
                      Nome extraído:{" "}
                      <span className="font-semibold">
                        {result.document.personName}
                      </span>
                    </>
                  ) : (
                    <span className="text-yellow-700">
                      Nome não identificado no documento.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleReset} className="w-full">
              Importar outro documento
            </Button>
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="text-lg">
                    Arraste e solte um arquivo aqui, ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    PDF, JPG, PNG ou WebP (máx. 10MB)
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={status === "extracting"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {status === "extracting" && (
              <div className="flex items-center gap-2 p-3 text-sm text-blue-600 bg-blue-50 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extraindo texto e analisando documento...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedFile || status === "extracting"}
              className="w-full"
            >
              {status === "extracting" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Importar e Extrair Nome"
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
