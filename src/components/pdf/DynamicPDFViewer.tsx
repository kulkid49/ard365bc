import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { Download, Maximize2, Minus, Plus, Printer, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AgenticCase, AgenticDocumentType } from '@/data/mockData'
import { buildPdfModel } from './pdfData'
import type { PdfDocType } from './pdfTypes'
import { GeneratedPdfDocument } from './templates/GeneratedPdfDocument'

type ViewerDocType = AgenticDocumentType | PdfDocType

type ViewerContext = {
  case?: AgenticCase
  customerName?: string
  contractValue?: number
  d365InvoiceNo?: string
  d365SoNo?: string
  irn?: string
}

const blobCache = new Map<string, { url: string; createdAt: number }>()
const MAX_CACHE = 36

function pruneCache() {
  if (blobCache.size <= MAX_CACHE) return
  const sorted = Array.from(blobCache.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt)
  const toDrop = Math.max(0, sorted.length - MAX_CACHE)
  for (let i = 0; i < toDrop; i += 1) {
    const [, v] = sorted[i]
    try {
      URL.revokeObjectURL(v.url)
    } catch {
      //
    }
    blobCache.delete(sorted[i][0])
  }
}

function filenameSafe(s: string) {
  return s
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 60)
}

async function buildBlobUrl(params: { docType: ViewerDocType; ctx: ViewerContext; revisionSeed: number }) {
  const c = params.ctx.case
  const customerName = params.ctx.customerName ?? c?.customerName ?? 'Customer'
  const contractValue = params.ctx.contractValue ?? c?.contractValue ?? 0
  const caseId = c?.caseId
  const d365InvoiceNo = params.ctx.d365InvoiceNo ?? c?.d365InvoiceNo
  const d365SoNo = params.ctx.d365SoNo ?? c?.d365SoNo
  const irn = params.ctx.irn

  const base = buildPdfModel({
    docType: params.docType,
    caseId,
    customerName,
    contractValue,
    d365InvoiceNo,
    d365SoNo,
    irn,
    revisionSeed: params.revisionSeed,
  })

  const qrDataUrl = irn ? await QRCode.toDataURL(irn, { margin: 1, width: 220, errorCorrectionLevel: 'M' }) : undefined
  const model = { ...base, qrDataUrl }

  const blob = await pdf(<GeneratedPdfDocument model={model} />).toBlob()
  return URL.createObjectURL(blob)
}

export function DynamicPDFViewer({
  docType,
  ctx,
  className,
  heightClassName = 'h-[520px]',
}: {
  docType: ViewerDocType
  ctx: ViewerContext
  className?: string
  heightClassName?: string
}) {
  const [revisionSeed, setRevisionSeed] = useState(0)
  const [zoomPct, setZoomPct] = useState(110)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const cacheKey = useMemo(() => {
    const c = ctx.case
    const customerName = ctx.customerName ?? c?.customerName ?? ''
    const contractValue = ctx.contractValue ?? c?.contractValue ?? 0
    const inv = ctx.d365InvoiceNo ?? c?.d365InvoiceNo ?? ''
    const irn = ctx.irn ?? ''
    return `${docType}|${c?.caseId ?? ''}|${customerName}|${contractValue}|${inv}|${irn}|${revisionSeed}`
  }, [ctx.case, ctx.contractValue, ctx.customerName, ctx.d365InvoiceNo, ctx.irn, docType, revisionSeed])

  const filename = useMemo(() => {
    const c = ctx.case
    const customer = filenameSafe(ctx.customerName ?? c?.customerName ?? 'Customer')
    const t = filenameSafe(String(docType))
    const id = filenameSafe(c?.caseId ?? ctx.d365InvoiceNo ?? 'DOC')
    return `${t}_${customer}_${id}.pdf`
  }, [ctx.case, ctx.customerName, ctx.d365InvoiceNo, docType])

  const regenerate = useCallback(() => setRevisionSeed((s) => s + 1), [])

  const ensureUrl = useCallback(async () => {
    const cached = blobCache.get(cacheKey)
    if (cached?.url) {
      setErr(null)
      setUrl(cached.url)
      return cached.url
    }

    setLoading(true)
    setErr(null)
    try {
      const u = await buildBlobUrl({ docType, ctx, revisionSeed })
      blobCache.set(cacheKey, { url: u, createdAt: Date.now() })
      pruneCache()
      setUrl(u)
      return u
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to generate PDF')
      setUrl(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [cacheKey, ctx, docType, revisionSeed])

  useEffect(() => {
    void ensureUrl()
    return () => undefined
  }, [ensureUrl])

  const download = useCallback(async () => {
    const u = await ensureUrl()
    if (!u) return
    const a = document.createElement('a')
    a.href = u
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(u)
      } catch {
        //
      }
    }, 60_000)
  }, [ensureUrl, filename])

  const openFull = useCallback(async () => {
    const u = await ensureUrl()
    if (!u) return
    window.open(u, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(u)
      } catch {
        //
      }
    }, 60_000)
  }, [ensureUrl])

  const printPdf = useCallback(async () => {
    const u = await ensureUrl()
    if (!u) return
    const w = window.open(u, '_blank', 'noopener,noreferrer')
    if (!w) return
    window.setTimeout(() => {
      try {
        w.focus()
        w.print()
      } catch {
        //
      }
    }, 650)
  }, [ensureUrl])

  const requestFullScreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const anyEl = el as unknown as { requestFullscreen?: () => Promise<void> }
    void anyEl.requestFullscreen?.()
  }, [])

  const iframeSrc = useMemo(() => {
    if (!url) return null
    const z = Math.max(80, Math.min(200, zoomPct))
    return `${url}#zoom=${z}`
  }, [url, zoomPct])

  return (
    <div ref={containerRef} className={cn('rounded-2xl bg-slate-50 p-4 dark:bg-slate-900', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">PDF Viewer</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
            <Button variant="ghost" size="icon" onClick={() => setZoomPct((z) => Math.max(80, z - 10))} aria-label="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <div className="min-w-[54px] text-center text-xs font-semibold text-slate-600 dark:text-slate-300">{zoomPct}%</div>
            <Button variant="ghost" size="icon" onClick={() => setZoomPct((z) => Math.min(200, z + 10))} aria-label="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={regenerate} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Regenerate PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={download} disabled={loading || !url}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="secondary" size="sm" onClick={printPdf} disabled={loading || !url}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="secondary" size="sm" onClick={openFull} disabled={loading || !url}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Full Screen
          </Button>
          <Button variant="ghost" size="sm" onClick={requestFullScreen}>
            Viewport Fullscreen
          </Button>
        </div>
      </div>

      <div className={cn('mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70', heightClassName)}>
        {loading ? (
          <div className="grid h-full place-items-center text-sm text-slate-600 dark:text-slate-400">Generating professional PDF…</div>
        ) : err ? (
          <div className="grid h-full place-items-center text-sm text-rose-700 dark:text-rose-300">{err}</div>
        ) : iframeSrc ? (
          <iframe title="Generated PDF" src={iframeSrc} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-600 dark:text-slate-400">No PDF available.</div>
        )}
      </div>
    </div>
  )
}

export async function generatePdfDownload(params: { docType: ViewerDocType; ctx: ViewerContext; fileName: string }) {
  const url = await buildBlobUrl({ docType: params.docType, ctx: params.ctx, revisionSeed: Date.now() })
  const a = document.createElement('a')
  a.href = url
  a.download = params.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url)
    } catch {
      //
    }
  }, 60_000)
}
