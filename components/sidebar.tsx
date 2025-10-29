"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  profile: {
    nombre: string;
    rol: string;
    foto_url: string | null;
  } | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#0d2646] text-white p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 relative">
          <Image
            src="/placeholder-logo.png"
            alt="ProTrack Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold">PROTRACK</h1>
      </div>

      <Link href="/dashboard/profile" className="mb-8">
        <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white/20">
            {profile?.foto_url ? (
              <Image
                src={profile.foto_url || "/placeholder.svg"}
                alt={profile.nombre}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                {profile?.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">
              {profile?.nombre || "Usuario"}
            </h2>
            <p className="text-sm text-gray-300">
              {profile?.rol || "Administradora"}
            </p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-2">
        <Link href="/dashboard">
          <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className={`w-full justify-start text-left ${
              pathname === "/dashboard"
                ? "bg-white text-[#0d2646] hover:bg-white/90"
                : "text-white hover:bg-white/10 hover:text-white"
            }`}
          >
            CATÁLOGO
          </Button>
        </Link>

        <div className="pt-4">
          <p className="text-xs text-gray-400 mb-2 px-3">FILTROS</p>
        </div>
      </nav>

      <Button
        onClick={handleLogout}
        variant="ghost"
        className="w-full text-white hover:bg-white/10 mt-4 hover:text-white"
      >
        Cerrar Sesión
      </Button>
    </aside>
  );
}
