const messages = {
  'auth/expired-action-code': 'Este link expirou. Solicite um novo e-mail de recuperação.',
  'auth/invalid-action-code': 'Este link é inválido ou já foi usado. Solicite um novo e-mail de recuperação.',
  'auth/profile-save-failed': 'Conta criada, mas não foi possível salvar o nome. Entre com o e-mail e senha cadastrados.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/missing-password': 'Informe a senha.',
  'auth/weak-password': 'A senha não atende aos requisitos do projeto Firebase.',
  'auth/password-does-not-meet-requirements': 'A senha não atende aos requisitos do projeto Firebase.',
  'auth/email-already-in-use': 'Não foi possível cadastrar com esse e-mail. Tente entrar na sua conta.',
  'auth/invalid-credential': 'Não foi possível entrar. Confira seu e-mail e senha.',
  'auth/user-not-found': 'Não foi possível entrar. Confira seu e-mail e senha.',
  'auth/wrong-password': 'Não foi possível entrar. Confira seu e-mail e senha.',
  'auth/user-disabled': 'Não foi possível entrar nesta conta.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'auth/network-request-failed': 'Não foi possível conectar. Verifique sua internet.',
  'auth/operation-not-allowed': 'O acesso por e-mail e senha precisa ser habilitado no Firebase.',
  'auth/web-storage-unsupported': 'O navegador não permite armazenar a sessão.',
}

export function authErrorMessage(error) {
  return messages[error?.code] || 'Não foi possível concluir a autenticação. Tente novamente.'
}
