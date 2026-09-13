import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import BarberCard from '../components/BarberCard'
import { barbeiros } from '../data/barbeiros'

export default function Professionals() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => barbeiros.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase())), [search])
  return <AppShell className="professionals-screen"><Header title="Profissionais" compact />
    <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar profissional" placeholder="Buscar profissional" /></label>
    <section className="professional-list">{filtered.map((barber) => <BarberCard key={barber.nome} {...barber} list />)}{filtered.length === 0 && <p role="status">Nenhum profissional encontrado.</p>}</section>
  </AppShell>
}
