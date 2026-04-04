'use client'

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'

interface Props {
  programName: string
}

export default function PrintButton({ programName }: Props) {
  const [loading, setLoading] = useState(false)

  async function handlePDF() {
    setLoading(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const element = document.getElementById('program-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
      })

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // Largeur image = largeur page, hauteur proportionnelle
      const imgH = (canvas.height * pageW) / canvas.width

      let remaining = imgH
      let yOffset = 0

      // Première page
      pdf.addImage(imgData, 'PNG', 0, yOffset, pageW, imgH)
      remaining -= pageH

      // Pages suivantes si le contenu déborde
      while (remaining > 0) {
        yOffset -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, yOffset, pageW, imgH)
        remaining -= pageH
      }

      // Nettoyage du nom de fichier
      const safeName = programName.replace(/[/\\:*?"<>|]/g, '-').trim()
      pdf.save(`${safeName}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePDF}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 print:hidden"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Printer className="h-3.5 w-3.5" />
      )}
      {loading ? 'Génération PDF...' : 'Télécharger en PDF'}
    </button>
  )
}
