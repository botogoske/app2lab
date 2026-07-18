"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Upload, Camera, Import } from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">DocViewer</h1>
        <p className="text-xs text-muted-foreground mt-1">Visualizador de Documentos</p>
      </div>

      <nav className="flex-1 space-y-2">
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="h-4 w-4 mr-2" />
          Documentos
        </Button>
      </nav>

      <div className="border-t pt-4 mt-auto">
        <div className="mb-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
