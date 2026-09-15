import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Professionals from './pages/Professionals'
import Services from './pages/Services'
import Booking from './pages/Booking'
import BookingReview from './pages/BookingReview'
import BookingSuccess from './pages/BookingSuccess'
import Loading from './pages/Loading'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/cadastro" element={<Register />} />
    <Route path="/esqueci-senha" element={<ForgotPassword />} />
    <Route path="/atualizar-senha" element={<ResetPassword />} />
    <Route path="/loading" element={<Loading />} />
    <Route path="/home" element={<Home />} />
    <Route path="/perfil" element={<Profile />} />
    <Route path="/profissionais" element={<Professionals />} />
    <Route path="/servicos" element={<Services />} />
    <Route path="/agendamento" element={<Booking />} />
    <Route path="/confirmar-agendamento" element={<BookingReview />} />
    <Route path="/agendamento-confirmado" element={<BookingSuccess />} />
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes></BrowserRouter>
}
