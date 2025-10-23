import Link from "next/link"
import Image from "next/image"
import { Instagram, MessageCircle, Music2, Twitter } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/placeholder-logo.png" alt="ProTrack Logo" width={48} height={48} className="object-contain" />
          <span className="text-4xl font-bold">PROTRACK</span>
        </div>

        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white text-[#2563eb] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <div className="relative group">
            <button className="px-8 py-3 bg-white text-[#2563eb] rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Registrarse
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <Link
                href="/auth/sign-up/director"
                className="block px-6 py-4 text-[#2563eb] hover:bg-gray-50 rounded-t-xl border-b border-gray-100"
              >
                <div className="font-semibold">Director General</div>
                <div className="text-sm text-gray-600">Gestiona tu empresa</div>
              </Link>
              <Link href="/auth/sign-up" className="block px-6 py-4 text-[#2563eb] hover:bg-gray-50 rounded-b-xl">
                <div className="font-semibold">Administrador</div>
                <div className="text-sm text-gray-600">Únete a una empresa</div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <div>
            <h1 className="text-6xl font-bold leading-tight mb-8">
              Organiza,
              <br />
              optimiza y<br />
              domina tu stock
            </h1>
          </div>

          {/* Right Side - Dashboard Preview */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                <Image
                  src="/image-dashboard.png"
                  alt="Vista previa del dashboard"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 right-8 flex gap-4">
        <a
          href="#"
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Instagram className="w-6 h-6" />
        </a>
        <a
          href="#"
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
        <a
          href="#"
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Music2 className="w-6 h-6" />
        </a>
        <a
          href="#"
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Twitter className="w-6 h-6" />
        </a>
      </footer>
    </div>
  )
}
