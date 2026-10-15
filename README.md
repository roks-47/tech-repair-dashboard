# TechFix OS 🛠️🎮📱
### Dashboard Online de Gestão de Reparos & Assistência Técnica (Celulares & Videogames)

Uma aplicação web moderna, responsiva e pronta para nuvem, desenvolvida especialmente para bancadas de assistência técnica compartilhadas entre técnicos.

---

## 🌟 Principais Recursos

1. **Acesso Online 24/7 de Qualquer Lugar (PC e Celular):**
   - Não depende do computador estar ligado.
   - Funciona como PWA (pode ser "Adicionado à Tela de Início" no Android ou iPhone com ícone de app nativo).
2. **Sincronização em Tempo Real (Supabase):**
   - Quando você atualiza o status de um aparelho no seu celular, seu colega vê a alteração instantaneamente no celular ou computador dele.
   - Se estiver sem internet ou antes de conectar a nuvem, funciona com cache local offline automático (`localStorage`).
3. **Divisão Visual por Tipo de Dispositivo:**
   - Filtros e identificadores específicos para **📱 Celulares** e **🎮 Videogames**.
   - Sugestões rápidas de marcas (Apple, Samsung, Xiaomi, Sony PlayStation, Xbox, Nintendo...).
   - Campos essenciais para cada aparelho: Senha/Padrão de desbloqueio, acessórios deixados, laudo técnico.
4. **Controle Financeiro & Lucro Líquido Automático:**
   - Registro de **Valor Cobrado** e **Custo das Peças**.
   - Cálculo automático do **Lucro Líquido Real** por ordem e no painel geral.
5. **Avisos ao Cliente no WhatsApp com 1 Toque:**
   - Mensagens pré-formatadas profissionais prontas para enviar no WhatsApp do cliente:
     - Aparelho Pronto para Retirada (com valor a pagar);
     - Orçamento Disponível para Aprovação;
     - Aguardando Peça / Atualização da Bancada;
     - Agradecimento pós-entrega.
6. **Impressão de Comprovante / Recibo de Bancada:**
   - Layout profissional pronto para impressão (A4 ou bobina térmica) com termos de garantia e linhas para assinatura do cliente e do técnico.
7. **Segurança por PIN da Bancada:**
   - Bloqueio por senha rápida de 4 dígitos para impedir alterações não autorizadas.

---

## 🚀 Como Executar Localmente

No terminal, dentro da pasta do projeto:

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Ou visualizar o build de produção
npm run preview
```

Abra o endereço indicado (ex: `http://localhost:5173`) no navegador.

---

## ☁️ Como Colocar Online 24/7 Gratuitamente

### Passo 1: Criar o Banco de Dados no Supabase (Grátis)
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project** (escolha um nome e senha para o banco).
3. No menu lateral esquerdo, vá em **SQL Editor**.
4. Abra a Dashboard TechFix, clique no ícone de ⚙️ **Configurações** no topo direito, e clique em **"Copiar Script SQL para Supabase"**.
5. Cole o script no SQL Editor do Supabase e clique em **Run**. As tabelas, políticas de segurança e sincronização em tempo real estarão criadas!
6. Vá em **Project Settings > API** e copie a **Project URL** e a **anon public key**.
7. Na dashboard TechFix (ou em `.env`), cole esses dois dados. O status mudará imediatamente para **🟢 Nuvem 24/7**.

### Passo 2: Hospedar o Site na Vercel ou Netlify (Grátis para sempre)
1. Crie uma conta em [vercel.com](https://vercel.com) ou [netlify.com](https://netlify.com).
2. Conecte o repositório do projeto no GitHub (ou use a CLI `npx vercel` / `npx netlify deploy --prod`).
3. (Opcional) Adicione as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na Vercel/Netlify. *(Caso prefira, você também pode simplesmente abrir o link da Vercel no celular, ir nas configurações ⚙️ e colar lá uma única vez).*
4. Pronto! Você receberá um link público seguro com HTTPS (ex: `https://sua-assistencia.vercel.app`).

---

## 📲 Como Usar no Celular como Aplicativo

Com o link da aplicação aberto no celular:
- **No Android (Google Chrome):**
  Toque nos 3 pontos verticais no canto superior direito e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **No iPhone (Safari):**
  Toque no botão de compartilhamento (ícone central inferior com um quadrado e seta para cima) e escolha **"Adicionar à Tela de Início"**.

O ícone do TechFix aparecerá na sua lista de apps do celular e abrirá em tela cheia como um app nativo!
