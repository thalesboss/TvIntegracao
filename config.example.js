// Exemplo de configuração do Supabase
// Renomeie este arquivo para 'config.js' para uso local.
window.ENV_CONFIG = {
  // OPÇÃO 1: Credenciais diretas (apenas em ambiente privado)
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_ANON_KEY: 'sua-chave-anon-publica-aqui',

  // OPÇÃO 2 (RECOMENDADA PARA GITHUB PÚBLICO):
  // Pacote gerado na aba Configurações protegido por Chave de Acesso da TV (AES-GCM 256 + PBKDF2 250k)
  // Pode ser versionado no GitHub com 100% de segurança matemática.
  ENCRYPTED_CREDENTIALS: {
    salt: '',
    iv: '',
    data: ''
  }
};
