"use client"

import { useState } from "react"

interface ConfirmDialogProps {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => Promise<void> | void
  children: React.ReactNode
}

export default function ConfirmDialog({ title = "Confirmar", description = "¿Estás seguro?", confirmText = "Sí, borrar", cancelText = "Cancelar", onConfirm, children }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="mb-4 text-sm text-gray-600">{description}</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded border">
                {cancelText}
              </button>
              <button onClick={handleConfirm} disabled={loading} className="px-3 py-1 rounded bg-red-600 text-white">
                {loading ? "..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
