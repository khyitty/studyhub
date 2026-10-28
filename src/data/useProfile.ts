import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useUid } from '../features/auth/AuthProvider'
import { DEFAULT_SCALE4 } from '../lib/gpa'
import type { Grade, TermCode } from '../lib/types'

export interface Profile {
  lang: 'ko' | 'en'
  theme: 'system' | 'light' | 'dark'
  xp: number
  currentTerm: TermCode
  termStart: string
  termEnd: string
  gradReq: { total: number; major: number; liberal: number }
  gpa4Scale: Record<Grade, number>
  gpaPortal: number | null
  appName: string
}

export const DEFAULT_PROFILE: Profile = {
  lang: 'ko',
  theme: 'system',
  xp: 0,
  currentTerm: '2026-2',
  termStart: '2026-09-01',
  termEnd: '2026-12-20',
  gradReq: { total: 130, major: 0, liberal: 0 },
  gpa4Scale: DEFAULT_SCALE4,
  gpaPortal: null,
  appName: 'StudyHub',
}

export function normalizeProfile(raw: Partial<Profile> | undefined): Profile {
  return {
    ...DEFAULT_PROFILE,
    ...raw,
    gradReq: { ...DEFAULT_PROFILE.gradReq, ...(raw?.gradReq ?? {}) },
    gpa4Scale: { ...DEFAULT_PROFILE.gpa4Scale, ...(raw?.gpa4Scale ?? {}) },
  }
}

export function useProfile() {
  const uid = useUid()
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        void setDoc(ref, DEFAULT_PROFILE)
        return
      }
      setProfile(normalizeProfile(snap.data() as Partial<Profile>))
      setLoading(false)
    })
  }, [uid])

  const update = async (patch: Partial<Profile>) => {
    await updateDoc(doc(db, 'users', uid), patch)
  }

  return { profile, update, loading }
}
