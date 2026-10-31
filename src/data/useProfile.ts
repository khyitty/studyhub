import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useUid } from '../features/auth/AuthProvider'
import { DEFAULT_PROFILE, normalizeProfile, type Profile } from './profile'

export { DEFAULT_PROFILE, normalizeProfile } from './profile'
export type { Profile } from './profile'

export interface ProfileCtx {
  profile: Profile
  update: (patch: Partial<Profile>) => Promise<void>
  loading: boolean
}

/** Subscribes to users/{uid}. Mount once (ProfileProvider); screens use useProfile(). */
export function useProfileDoc(): ProfileCtx {
  const uid = useUid()
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        // Only create once the server confirms the doc is missing; merge so a stale
        // cache miss can never overwrite data written from another device.
        if (!snap.metadata.fromCache) void setDoc(ref, DEFAULT_PROFILE, { merge: true })
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

export const ProfileContext = createContext<ProfileCtx>({ profile: DEFAULT_PROFILE, update: async () => {}, loading: true })

export function useProfile(): ProfileCtx {
  return useContext(ProfileContext)
}
