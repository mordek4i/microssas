# ReservaZen 🌿

> **Menos confusão, mais controle sobre suas reservas.**  
> Plataforma SaaS completa e multiestabelecimento para gestão inteligente de reservas, agendamentos, clientes e páginas públicas com QR Code.

---

## 🚀 Funcionalidades

- **Multiestabelecimento & Adaptável**: Suporte nativo para Restaurantes, Bares, Barbearias, Salões de Beleza, Clínicas, Studios e Espaços de Eventos.
- **Página de Reservas Pública**: Link exclusivo e QR Code gerado automaticamente para clientes agendarem direto pelo celular ou WhatsApp.
- **Gestão em Tempo Real**:
  - Painel com métricas de reservas, clientes atendidos, taxa de ocupação e horários de pico.
  - Visão em Lista, Grade e Calendário (Kanban e Agenda).
  - Status em tempo real: Pendente, Confirmada, Em Atendimento, Concluída, Cancelada e No-Show.
- **Integração de Pagamentos com Cakto**:
  - Webhooks com validação de assinatura secreta e idempotência.
  - Período de teste de 7 dias grátis (*trial*).
  - Gestão automática de status da assinatura (`active`, `pending_payment`, `canceled`, `refunded`).
- **Configuração Guiada**: Onboarding intuitivo com capacidade, intervalo entre atendimentos, termos personalizados e políticas de cancelamento.

---

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, QR Code SVG
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **Banco de Dados**: SQLite nativo (Node 24 `node:sqlite`)
- **Pagamentos**: Webhooks Cakto

---

## 📦 Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/mordek4i/microssas.git
cd microssas
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
```env
PORT=3001
CAKTO_WEBHOOK_SECRET=sua_chave_secreta_da_cakto
CAKTO_CHECKOUT_URL=https://pay.cakto.com.br/seu-produto
```

### 4. Iniciar o Backend
```bash
npm run server
```
O servidor iniciará em `http://localhost:3001`.

### 5. Iniciar o Frontend
Em outro terminal:
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.

---

## 📄 Licença

Distribuído sob licença comercial / proprietária. Todos os direitos reservados.
