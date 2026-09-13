import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import ServiceCard from '../components/ServiceCard'
import { services } from '../data/services'

export default function Services() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const filtered = useMemo(() => services.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()) && (category === 'Todos' || item.categoria === category)), [search, category])
  return <AppShell><Header title="Serviços" compact />
    <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar serviço" placeholder="Buscar serviço" /></label>
    <div className="category-tabs" aria-label="Categorias">{['Todos', 'Cabelo', 'Barba', 'Combos'].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <section className="catalog-intro"><h2>Escolha seu serviço</h2></section>
    <section className="service-list">{filtered.map((service) => <ServiceCard key={service.nome} {...service} />)}{filtered.length === 0 && <p role="status">Nenhum serviço encontrado.</p>}</section>
  </AppShell>
}
