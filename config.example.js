// Exemplo de configuração de ambiente da TV Integração
// Renomeie este arquivo para 'config.js' para uso local (ignorado pelo Git).
window.ENV_CONFIG = {
  // OPÇÃO 1: Credenciais diretas (apenas em ambiente local/privado)
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_ANON_KEY: 'sua-chave-anon-publica-aqui',

  // Endpoint opcional de relay de e-mail para relatórios CTRS (Google Apps Script / Webhook HTTPS)
  EMAIL_RELAY_URL: '',

  // OPÇÃO 2: Pacote criptografado AES-256-GCM + PBKDF2 (desbloqueado pela Chave da Estação)
  ENCRYPTED_CREDENTIALS: {
    salt: '',
    iv: '',
    data: ''
  }
};
