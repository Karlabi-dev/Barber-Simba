import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Button from '../components/Button'
import bell from '../assets/icons/sino.png'

export default function BookingSuccess() {
  const navigate = useNavigate()
  return <AppShell nav={false} className="success-screen"><section className="success-final">
    <span className="check-circle">✓</span><h1>Tudo pronto!</h1><p>Seu agendamento foi confirmado com sucesso.</p>
    <div className="reminder"><img src={bell} alt="" /><p>Enviamos a confirmação e as instruções por WhatsApp e e-mail.</p></div>
    <Button onClick={() => navigate('/home')}>Voltar para a Home</Button>
  </section></AppShell>
}
