import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Notifications from './pages/Notifications'
import Professionals from './pages/Professionals'
import Services from './pages/Services'
import Booking from './pages/Booking'
import BookingHistory from './pages/BookingHistory'
import BookingReview from './pages/BookingReview'
import BookingSuccess from './pages/BookingSuccess'
import Loading from './pages/Loading'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import AdminServices from './pages/AdminServices'
import { AdminTeam, AdminProfessionalForm } from './pages/AdminTeam'
import AdminAgenda from './pages/AdminAgenda'
import AdminBookingDetails from './pages/AdminBookingDetails'
import { useAuth } from './hooks/useAuth'
import { homeForRole } from './services/roles'

function RoleRoute({ role, children }) {
  const { usuario, papel, carregando, erroSessao } = useAuth()
  if (carregando) return <p className="route-loading" role="status">Carregando sua conta...</p>
  if (erroSessao) return <p className="route-loading" role="alert">{erroSessao}</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (papel !== role) return <Navigate to={homeForRole(papel)} replace />
  return children
}

function CustomerRoute({ children }) {
  const { usuario, papel, carregando } = useAuth()
  if (carregando) return <p className="route-loading" role="status">Carregando sua conta...</p>
  if (usuario && papel !== 'cliente') return <Navigate to={homeForRole(papel)} replace />
  return children
}

function StartRoute() {
  const { usuario, papel, carregando } = useAuth()
  if (carregando) return <p className="route-loading" role="status">Carregando sua conta...</p>
  return <Navigate to={usuario ? homeForRole(papel) : '/login'} replace />
}

function LoginRoute() {
  const { usuario, papel, carregando } = useAuth()
  if (carregando) return <p className="route-loading" role="status">Carregando sua conta...</p>
  return usuario ? <Navigate to={homeForRole(papel)} replace /> : <Login />
}

function ProfessionalLanding() {
  const { sair } = useAuth()
  return <main className="route-loading"><h1>Área do profissional</h1><p>A agenda do profissional será configurada na próxima etapa.</p><button type="button" onClick={sair}>Sair</button></main>
}

function AdminProfessionalRoute() {
  const { id } = useParams()
  return <AdminProfessionalForm key={id} />
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<StartRoute />} />
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/cadastro" element={<Register />} />
    <Route path="/esqueci-senha" element={<ForgotPassword />} />
    <Route path="/atualizar-senha" element={<ResetPassword />} />
    <Route path="/loading" element={<CustomerRoute><Loading /></CustomerRoute>} />
    <Route path="/notificacoes" element={<CustomerRoute><Notifications /></CustomerRoute>} />
    <Route path="/home" element={<CustomerRoute><Home /></CustomerRoute>} />
    <Route path="/perfil" element={<CustomerRoute><Profile /></CustomerRoute>} />
    <Route path="/profissionais" element={<CustomerRoute><Professionals /></CustomerRoute>} />
    <Route path="/servicos" element={<CustomerRoute><Services /></CustomerRoute>} />
    <Route path="/agendas" element={<CustomerRoute><BookingHistory /></CustomerRoute>} />
    <Route path="/agendamento" element={<CustomerRoute><Booking /></CustomerRoute>} />
    <Route path="/confirmar-agendamento" element={<CustomerRoute><BookingReview /></CustomerRoute>} />
    <Route path="/agendamento-confirmado" element={<CustomerRoute><BookingSuccess /></CustomerRoute>} />
    <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
    <Route path="/admin/agenda" element={<RoleRoute role="admin"><AdminAgenda /></RoleRoute>} />
    <Route path="/admin/agendamentos/:id" element={<RoleRoute role="admin"><AdminBookingDetails /></RoleRoute>} />
    <Route path="/admin/servicos" element={<RoleRoute role="admin"><AdminServices /></RoleRoute>} />
    <Route path="/admin/equipe" element={<RoleRoute role="admin"><AdminTeam /></RoleRoute>} />
    <Route path="/admin/equipe/:id" element={<RoleRoute role="admin"><AdminProfessionalRoute /></RoleRoute>} />
    <Route path="/profissional" element={<RoleRoute role="profissional"><ProfessionalLanding /></RoleRoute>} />
    <Route path="*" element={<StartRoute />} />
  </Routes></BrowserRouter>
}
