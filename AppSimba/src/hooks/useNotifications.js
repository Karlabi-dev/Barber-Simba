import { useEffect, useState } from 'react'
import { NOTIFICATIONS_CHANGED, readNotifications, syncReminders } from '../data/notifications'
import { readBookingHistory } from '../data/booking'
export function useNotifications() {
  const [items, setItems] = useState(readNotifications)
  useEffect(() => {
    const refresh = () => setItems(readNotifications())
    const check = () => { syncReminders(readBookingHistory()); refresh() }
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    window.addEventListener('focus', check)
    check()
    const timer = window.setInterval(check, 60000)
    return () => { window.removeEventListener(NOTIFICATIONS_CHANGED, refresh); window.removeEventListener('focus', check); window.clearInterval(timer) }
  }, [])
  return items
}
