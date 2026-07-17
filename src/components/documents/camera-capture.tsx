"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, Check, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  userId: string;
  onCaptureComplete?: () => void;
}

export function CameraCapture({
  userId,
  onCaptureComplete,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setIsActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador.",
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const uploadPhoto = useCallback(async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const uploadResponse = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        setError(result.error);
        return;
      }

      setCapturedImage(null);
      onCaptureComplete?.();
    } catch {
      setError("Erro ao enviar foto");
    } finally {
      setIsUploading(false);
    }
  }, [capturedImage, userId, onCaptureComplete]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Capturar Documento com Câmera
        </h3>

        {!isActive && !capturedImage && (
          <Button onClick={startCamera} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Abrir Câmera
          </Button>
        )}

        {isActive && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button onClick={capturePhoto} size="lg">
                <Check className="h-4 w-4 mr-2" />
                Capturar
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <img
              src={capturedImage}
              alt="Documento capturado"
              className="w-full rounded-lg border"
            />
            <div className="flex gap-2">
              <Button
                onClick={uploadPhoto}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? "Enviando..." : "Enviar Foto"}
              </Button>
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Tirar Outra
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
