import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { authService } from '../services/auth'
import { authReady } from '../config/firebase'
import { authErrorMessage } from '../services/authErrors'
import { roleFromClaims } from '../services/roles'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [papel, setPapel] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroSessao, setErroSessao] = useState(null)

  useEffect(() => {
    let active = true
    let authRevision = 0
    let unsubscribe
    authReady.then(({ error }) => {
      if (!active) return
      if (error) {
        setErroSessao(authErrorMessage(error))
        setCarregando(false)
        return
      }
      unsubscribe = authService.observar(async user => {
        const revision = ++authRevision
        if (!active) return
        setCarregando(true)
        if (!user) {
          setUsuario(null)
          setPapel(null)
          setErroSessao(null)
          setCarregando(false)
          return
        }
        try {
          const { claims } = await user.getIdTokenResult(true)
          if (!active || revision !== authRevision) return
          setUsuario(user)
          setPapel(roleFromClaims(claims))
          setErroSessao(null)
        } catch (error) {
          if (!active || revision !== authRevision) return
          setUsuario(null)
          setPapel(null)
          setErroSessao(authErrorMessage(error))
        } finally {
          if (active && revision === authRevision) setCarregando(false)
        }
      }, error => {
        authRevision++
        if (!active) return
        setUsuario(null)
        setPapel(null)
        setErroSessao(authErrorMessage(error))
        setCarregando(false)
      })
    })
    return () => { active = false; authRevision++; unsubscribe?.() }
  }, [])

  return <AuthContext.Provider value={{
    usuario, papel, carregando, erroSessao,
    cadastrar: authService.cadastrar,
    entrar: authService.entrar,
    atualizarPerfil: authService.atualizarPerfil,
    alterarEmail: authService.alterarEmail,
    alterarSenha: authService.alterarSenha,
    sair: authService.sair,
    recuperarSenha: authService.recuperarSenha,
  }}>{children}</AuthContext.Provider>
}
