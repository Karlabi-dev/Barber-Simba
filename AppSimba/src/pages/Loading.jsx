import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Loading() {
  const navigate = useNavigate()
  useEffect(() => { const timer = setTimeout(() => navigate('/home', { replace: true }), 1600); return () => clearTimeout(timer) }, [navigate])
  return <main className="loading-screen"><div className="loading-brand"><span>♛</span><strong>Simba</strong></div><div className="loading-track"><span /></div></main>
}
