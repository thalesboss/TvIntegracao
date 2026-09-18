// Exemplo de configuração do Supabase
// Renomeie este arquivo para 'config.js' para uso local.
window.ENV_CONFIG = {
  // OPÇÃO 1: Credenciais diretas (apenas em ambiente privado)
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_ANON_KEY: 'sua-chave-anon-publica-aqui',

  // OPÇÃO 2 :
  ENCRYPTED_CREDENTIALS: {
    salt: '',
    iv: '',
    data: ''
  }
};
