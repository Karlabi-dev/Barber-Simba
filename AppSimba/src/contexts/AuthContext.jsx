import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { authService } from '../services/auth'
import { authReady } from '../config/firebase'
import { authErrorMessage } from '../services/authErrors'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroSessao, setErroSessao] = useState(null)

  useEffect(() => {
    let active = true
    let unsubscribe
    authReady.then(({ error }) => {
      if (!active) return
      if (error) {
        setErroSessao(authErrorMessage(error))
        setCarregando(false)
        return
      }
      unsubscribe = authService.observar(user => {
        setUsuario(user)
        setErroSessao(null)
        setCarregando(false)
      }, error => {
        setUsuario(null)
        setErroSessao(authErrorMessage(error))
        setCarregando(false)
      })
    })
    return () => { active = false; unsubscribe?.() }
  }, [])

  return <AuthContext.Provider value={{
    usuario, carregando, erroSessao,
    cadastrar: authService.cadastrar,
    entrar: authService.entrar,
    sair: authService.sair,
    recuperarSenha: authService.recuperarSenha,
  }}>{children}</AuthContext.Provider>
}
