# Sistema de Gestão de Tecnologia — TV Integração

Sistema integrado para monitoramento operacional, registro de ocorrências, rondas técnicas, controle de equipamentos e relatórios gerenciais das emissoras da Rede Integração (Afiliada Globo).

---

## 🚀 Funcionalidades Principais

- **Painel de Ocorrências:** Registro, acompanhamento e resolução de chamados técnicos categorizados por praça, equipamento e operador.
- **Ronda Técnica (Tecnologia UDI):** Acompanhamento diário dos 26 subsistemas de transmissão, estúdios, centro exibidor, enlaces e satélites.
- **Visão Geral Analítica & Gráficos:** Painéis de conformidade operacional com filtros por período (Ano 2026, Mês Atual, 2025, 2024 ou histórico completo).
- **Exportação Profissional em PDF:** Emissão de mini relatórios executivos individuais e consolidações completas em formato A4 para arquivo e auditoria.
- **Histórico Geral Unificado:** Mais de 1.400 registros históricos com filtros simultâneos por praça, período de data e tipo de evento.
- **Resiliência Offline & Sincronização em Nuvem:** Modo local automático com contagem de itens pendentes e sincronização em tempo real via Supabase.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 moderno (Custom Properties, Flexbox, Grid), JavaScript modular (ES6+).
- **Ícones:** Lucide Icons.
- **Armazenamento:** Supabase (PostgreSQL / REST) com contingência local via IndexedDB e LocalStorage.

---

## ⚙️ Configuração Local

1. Clone ou baixe este repositório.
2. Copie o arquivo `config.example.js` para `config.js`:
   ```bash
   cp config.example.js config.js
   ```
3. Preencha as credenciais da sua instância do Supabase em `config.js`.
4. Abra o arquivo `index.html` em qualquer navegador web moderno.
