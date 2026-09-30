import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import ServiceCard from '../components/ServiceCard'
import { services } from '../data/services'
import { loadServices } from '../services/catalog'

export default function Services() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const [catalog, setCatalog] = useState(useNeon ? [] : services)
  const [loading, setLoading] = useState(useNeon)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  useEffect(() => {
    if (!useNeon) return
    const controller = new AbortController()
    loadServices(controller.signal)
      .then(items => { setCatalog(items); setLoading(false) })
      .catch(cause => {
        if (cause.name !== 'AbortError') { setError(cause.message); setLoading(false) }
      })
    return () => controller.abort()
  }, [useNeon])
  const filtered = useMemo(() => catalog.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()) && (category === 'Todos' || item.categoria === category)), [catalog, search, category])
  return <AppShell><Header title="Serviços" compact />
    <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar serviço" placeholder="Buscar serviço" /></label>
    <div className="category-tabs" aria-label="Categorias">{['Todos', 'Cabelo', 'Barba', 'Combos'].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <section className="catalog-intro"><h2>Escolha seu serviço</h2></section>
    <section className="service-list">{loading && <p role="status">Carregando serviços...</p>}{error && <p role="alert">{error}</p>}{!loading && !error && filtered.map((service) => <ServiceCard key={service.id || service.nome} {...service} />)}{!loading && !error && filtered.length === 0 && <p role="status">Nenhum serviço encontrado.</p>}</section>
  </AppShell>
}
