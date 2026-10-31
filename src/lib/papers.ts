import type { DocumentData } from 'firebase/firestore'
import type { Paper, PaperStatus } from './types'

export const PAPER_STATUSES: PaperStatus[] = ['toread', 'reading', 'read']

const strArr = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])

export function normalizePaper(raw: DocumentData, id: string): Paper {
  return {
    id,
    title: String(raw.title ?? ''),
    authors: strArr(raw.authors),
    year: typeof raw.year === 'number' && Number.isFinite(raw.year) ? raw.year : null,
    venue: String(raw.venue ?? ''),
    doi: String(raw.doi ?? ''),
    url: String(raw.url ?? ''),
    arxivId: String(raw.arxivId ?? ''),
    tags: strArr(raw.tags),
    status: PAPER_STATUSES.includes(raw.status) ? raw.status : 'toread',
    summary: String(raw.summary ?? ''),
    quotes: strArr(raw.quotes),
    notes: String(raw.notes ?? ''),
    addedAt: String(raw.addedAt ?? new Date().toISOString()),
    readAt: raw.readAt ? String(raw.readAt) : null,
  }
}

export type PaperRef = { kind: 'doi'; id: string } | { kind: 'arxiv'; id: string }

/** Accepts a bare DOI, a doi.org URL, `doi:…`, `arXiv:1234.56789`, or an arxiv.org abs/pdf URL. Anything else → null. */
export function parsePaperRef(input: string): PaperRef | null {
  const s = input.trim()
  if (!s) return null
  const ax = s.match(/arxiv(?:\.org\/(?:abs|pdf)\/|:)\s*(\d{4}\.\d{4,5})(?:v\d+)?/i)
  if (ax) return { kind: 'arxiv', id: ax[1] }
  const doi = s.match(/\b(10\.\d{4,9}\/[^\s]+)/)
  if (doi) return { kind: 'doi', id: doi[1].replace(/[.,;)]+$/, '') }
  return null
}

export type PaperMeta = Pick<Paper, 'title' | 'authors' | 'year' | 'venue' | 'doi' | 'url' | 'arxivId'>

/** Crossref `works/{doi}` response (or its `message`) → metadata. */
export function fromCrossref(json: unknown): PaperMeta {
  const root = json as Record<string, unknown>
  const m = (root && typeof root.message === 'object' && root.message ? root.message : root) as Record<string, unknown>
  const first = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : '')
  const authors = Array.isArray(m.author)
    ? (m.author as Array<Record<string, string>>).map((a) => (a.name ? a.name : [a.given, a.family].filter(Boolean).join(' '))).filter(Boolean)
    : []
  const issued = m.issued as { 'date-parts'?: number[][] } | undefined
  const year = issued?.['date-parts']?.[0]?.[0]
  const doi = String(m.DOI ?? '')
  return {
    title: first(m.title),
    authors,
    year: typeof year === 'number' ? year : null,
    venue: first(m['container-title']),
    doi,
    url: String(m.URL ?? (doi ? `https://doi.org/${doi}` : '')),
    arxivId: '',
  }
}

/** arXiv Atom feed → first entry's metadata; null when the feed has no entry. */
export function fromArxiv(xml: string): PaperMeta | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const entry = doc.getElementsByTagName('entry')[0]
  if (!entry) return null
  const text = (tag: string, el: Element = entry) => (el.getElementsByTagName(tag)[0]?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const rawId = text('id')
  // an unknown id comes back as a feed with a single error entry titled "Error"
  if (rawId.includes('/api/errors')) return null
  const idMatch = rawId.match(/(\d{4}\.\d{4,5})(?:v\d+)?/)
  const arxivId = idMatch ? idMatch[1] : rawId.replace(/^.*\/abs\//, '')
  const authors = Array.from(entry.getElementsByTagName('author')).map((a) => text('name', a)).filter(Boolean)
  const published = text('published')
  const year = published ? Number(published.slice(0, 4)) : NaN
  return {
    title: text('title'),
    authors,
    year: Number.isFinite(year) ? year : null,
    venue: 'arXiv',
    doi: '',
    url: arxivId ? `https://arxiv.org/abs/${arxivId}` : '',
    arxivId,
  }
}

/** Client-side lookup; any network or HTTP failure → null so the form falls back to manual entry. */
export async function fetchPaperMeta(ref: PaperRef, fetchImpl: typeof fetch = fetch): Promise<PaperMeta | null> {
  try {
    if (ref.kind === 'doi') {
      const res = await fetchImpl(`https://api.crossref.org/works/${encodeURIComponent(ref.id)}`)
      if (!res.ok) return null
      return fromCrossref(await res.json())
    }
    const res = await fetchImpl(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(ref.id)}`)
    if (!res.ok) return null
    return fromArxiv(await res.text())
  } catch {
    return null
  }
}

export type PaperFilter = { status: PaperStatus | 'all'; tag: string | null; q: string }

/** Status + tag + text filter (title, authors, tags; case-insensitive), newest first. */
export function filterPapers(papers: Paper[], f: PaperFilter): Paper[] {
  const q = f.q.trim().toLowerCase()
  return papers
    .filter((p) => f.status === 'all' || p.status === f.status)
    .filter((p) => !f.tag || p.tags.includes(f.tag))
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.authors.some((a) => a.toLowerCase().includes(q)) || p.tags.some((t) => t.toLowerCase().includes(q)))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

export function allTags(papers: Paper[]): string[] {
  return [...new Set(papers.flatMap((p) => p.tags))].sort()
}

/** Status transitions stamp `readAt`: entering `read` records now, leaving it clears; no change → untouched. */
export function withReadAt<T extends { status?: PaperStatus }>(patch: T, currentStatus: PaperStatus, now: string): T & { readAt?: string | null } {
  if (!patch.status || patch.status === currentStatus) return patch
  return { ...patch, readAt: patch.status === 'read' ? now : null }
}
