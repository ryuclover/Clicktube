# ▶️ Clicktube

Clicktube é uma plataforma de compartilhamento de vídeos completa e moderna, construída do zero inspirada no YouTube. Ela permite aos usuários assistirem, fazerem upload, gerenciarem suas playlists e interagirem com o conteúdo, tudo com uma interface elegante e super responsiva.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React, Vite, CSS Puro (variáveis, flexbox, grid)
- **Backend:** Node.js, Express
- **Banco de Dados:** Banco de dados JSON (ou MongoDB, configurável no backend)

## ✨ Principais Funcionalidades

- **Upload de Vídeos:** Envio de vídeos com extração automática da duração do arquivo de vídeo.
- **Sistema de Autenticação:** Login e registro de usuários.
- **Biblioteca Completa (Library):** Histórico de vídeos assistidos e gerenciamento de playlists.
- **Dashboard Admin:** Uma área exclusiva (`/admin`) para administradores visualizarem estatísticas globais e moderarem (excluírem) vídeos de qualquer usuário.
- **Interface Responsiva:** Design incrivelmente adaptável para Mobile, Tablet e Desktop.
- **Modo Noturno Estiloso:** Interface focada em uma estética moderna em tons escuros e com efeitos de vidro (Glassmorphism).

## 🛠️ Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/ryuclover/Clicktube.git
   ```

2. **Frontend:**
   ```bash
   cd Clicktube
   npm install
   npm run dev
   ```

3. **Backend:**
   Abra outro terminal:
   ```bash
   cd Clicktube/server
   npm install
   npm start
   ```

## 🌐 Deploy
O frontend pode ser facilmente hospedado na **Vercel** e o backend no **Render**. Verifique o guia de deploy no repositório ou pergunte ao mantenedor.
