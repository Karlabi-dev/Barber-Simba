import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import ServiceCard from '../components/ServiceCard'
import { services } from '../data/services'

export default function Services() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => services.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase())), [search])
  return <AppShell><Header title="Serviços" compact />
    <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar serviço" /></label>
    <section className="catalog-intro"><h2>Catálogo de serviços</h2><p>Escolha a experiência ideal para o seu estilo.</p></section>
    <section className="service-list">{filtered.map((service) => <ServiceCard key={service.nome} {...service} />)}</section>
  </AppShell>
}
