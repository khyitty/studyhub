import { createContext, useContext } from 'react'
import ko from './ko.json'
import en from './en.json'

export type Lang = 'ko' | 'en'
type Dict = Record<string, unknown>
const dicts: Record<Lang, Dict> = { ko, en }

export const LangContext = createContext<Lang>('ko')

function lookup(dict: Dict, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Dict)[k] : undefined), dict)
  return typeof v === 'string' ? v : undefined
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const s = lookup(dicts[lang], key) ?? lookup(dicts.ko, key) ?? key
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`)) : s
}

export function useLang(): Lang {
  return useContext(LangContext)
}

/** t('home.greeting', {name}) — returns the key itself when missing. */
export function useT() {
  const lang = useLang()
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars)
}
