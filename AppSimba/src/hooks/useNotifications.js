import { useEffect, useState } from 'react'
import { NOTIFICATIONS_CHANGED, markNotificationsRead, readNotifications, syncReminders } from '../data/notifications'
import { readBookingHistory } from '../data/booking'
import { useAuth } from './useAuth'
import { listNotifications, markAllNotificationsRead } from '../services/notifications'
export function useNotifications() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const { usuario } = useAuth()
  const uid = useNeon ? usuario?.uid : 'demo'
  const [snapshot, setSnapshot] = useState(() => ({ uid: useNeon ? undefined : 'demo', items: useNeon ? [] : readNotifications(), error: '' }))
  const { items, error } = snapshot.uid === uid ? snapshot : { items: [], error: '' }
  useEffect(() => {
    let active = true
    const check = async () => {
      if (useNeon) {
        if (!usuario) return
        try {
          const result = await listNotifications(usuario)
          if (active) setSnapshot({ uid, items: result, error: '' })
        } catch (cause) { if (active) setSnapshot(previous => ({ uid, items: previous.uid === uid ? previous.items : [], error: cause.message })) }
      } else {
        syncReminders(readBookingHistory())
        if (active) setSnapshot({ uid, items: readNotifications(), error: '' })
      }
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') check() }
    window.addEventListener(NOTIFICATIONS_CHANGED, check)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisibility)
    check()
    const timer = window.setInterval(check, 60000)
    return () => { active = false; window.removeEventListener(NOTIFICATIONS_CHANGED, check); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', onVisibility); window.clearInterval(timer) }
  }, [useNeon, usuario, uid])

  async function markAllRead() {
    if (useNeon) {
      try {
        await markAllNotificationsRead(usuario)
        setSnapshot(current => ({ uid, items: current.uid === uid ? current.items.map(item => ({ ...item, read: true })) : [], error: '' }))
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
      } catch (cause) { setSnapshot(current => ({ uid, items: current.uid === uid ? current.items : [], error: cause.message })) }
    } else {
      // O modo de demonstração continua usando os dados da sessão.
      markNotificationsRead()
    }
  }
  return { items, error, markAllRead }
}
