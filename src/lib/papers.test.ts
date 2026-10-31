import { allTags, fetchPaperMeta, filterPapers, fromArxiv, fromCrossref, normalizePaper, parsePaperRef } from './papers'
import type { PaperStatus } from './types'

test('parsePaperRef: DOI forms', () => {
  expect(parsePaperRef('10.1000/xyz123')).toEqual({ kind: 'doi', id: '10.1000/xyz123' })
  expect(parsePaperRef('https://doi.org/10.1000/XYZ.1')).toEqual({ kind: 'doi', id: '10.1000/XYZ.1' })
  expect(parsePaperRef(' doi:10.1000/a.b ')).toEqual({ kind: 'doi', id: '10.1000/a.b' })
})

test('parsePaperRef: arXiv forms strip version', () => {
  expect(parsePaperRef('arXiv:2101.00001')).toEqual({ kind: 'arxiv', id: '2101.00001' })
  expect(parsePaperRef('https://arxiv.org/abs/2101.00001v2')).toEqual({ kind: 'arxiv', id: '2101.00001' })
  expect(parsePaperRef('https://arxiv.org/pdf/2101.00001v1.pdf')).toEqual({ kind: 'arxiv', id: '2101.00001' })
})

test('parsePaperRef: plain text → null', () => {
  expect(parsePaperRef('attention is all you need')).toBeNull()
  expect(parsePaperRef('')).toBeNull()
})

test('fromCrossref maps message fields', () => {
  const json = { message: { title: ['Deep Learning'], author: [{ given: 'Yann', family: 'LeCun' }, { name: 'DeepMind' }], issued: { 'date-parts': [[2015, 5]] }, 'container-title': ['Nature'], DOI: '10.1038/nature14539', URL: 'https://doi.org/10.1038/nature14539' } }
  expect(fromCrossref(json)).toEqual({ title: 'Deep Learning', authors: ['Yann LeCun', 'DeepMind'], year: 2015, venue: 'Nature', doi: '10.1038/nature14539', url: 'https://doi.org/10.1038/nature14539', arxivId: '' })
})

test('fromArxiv parses the first Atom entry; no entry → null', () => {
  const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/1706.03762v7</id><published>2017-06-12T17:57:34Z</published><title>Attention Is All You Need</title><author><name>Ashish Vaswani</name></author><author><name>Noam Shazeer</name></author></entry></feed>`
  expect(fromArxiv(xml)).toEqual({ title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer'], year: 2017, venue: 'arXiv', doi: '', url: 'https://arxiv.org/abs/1706.03762', arxivId: '1706.03762' })
  expect(fromArxiv('<feed xmlns="http://www.w3.org/2005/Atom"></feed>')).toBeNull()
})

test('fetchPaperMeta returns null on network/HTTP failure', async () => {
  const bad = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch
  expect(await fetchPaperMeta({ kind: 'doi', id: '10.1/x' }, bad)).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await fetchPaperMeta({ kind: 'arxiv', id: '1' }, boom)).toBeNull()
})

test('filterPapers: status, tag, query over title/authors/tags, newest first', () => {
  const p = (id: string, title: string, status: PaperStatus, tags: string[], addedAt: string, authors: string[] = []) => normalizePaper({ title, status, tags, addedAt, authors }, id)
  const list = [p('a', 'Causal Forests', 'read', ['causal'], '2026-01-01', ['Athey']), p('b', 'Double ML', 'toread', ['causal', 'ml'], '2026-02-01'), p('c', 'Transformers', 'reading', ['dl'], '2026-03-01')]
  expect(filterPapers(list, { status: 'all', tag: null, q: '' }).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  expect(filterPapers(list, { status: 'toread', tag: null, q: '' }).map((x) => x.id)).toEqual(['b'])
  expect(filterPapers(list, { status: 'all', tag: 'causal', q: '' }).map((x) => x.id)).toEqual(['b', 'a'])
  expect(filterPapers(list, { status: 'all', tag: null, q: 'athey' }).map((x) => x.id)).toEqual(['a'])
  expect(allTags(list)).toEqual(['causal', 'dl', 'ml'])
})

test('normalizePaper defaults', () => {
  expect(normalizePaper({}, 'x')).toMatchObject({ id: 'x', title: '', authors: [], year: null, status: 'toread', tags: [], quotes: [], readAt: null })
})
