import Link from "next/link"
import { Instagram, MessageCircle, Music2, Twitter } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <path
                d="M20 5 L20 20 M20 20 L35 20 M20 20 L20 35 M20 20 L5 20"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-4xl font-bold">PROTRACK</span>
        </div>

        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white text-[#2563eb] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-8 py-3 bg-white text-[#2563eb] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Registrarse
          </Link>
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
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 40 40" className="w-12 h-12">
                      <path
                        d="M20 5 L20 20 M20 20 L35 20 M20 20 L20 35 M20 20 L5 20"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="text-white/80">Vista previa del dashboard</p>
                </div>
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
