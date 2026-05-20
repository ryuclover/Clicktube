# 🚀 Guia de Fix - Upload Não Funcionando no Deploy

## ⚙️ PASSO 1: Verificar VITE_API_URL no Vercel

O problema mais comum é que a variável `VITE_API_URL` não está configurada corretamente no Vercel.

1. Acesse **Vercel Dashboard** → Seu projeto Clicktube
2. Vá para **Settings** → **Environment Variables**
3. Procure por `VITE_API_URL`
   - Se **não existir**: Criar uma nova
   - Se **existir**: Verificar se o valor está correto

### ✅ Valor Correto para VITE_API_URL:
```
https://clicktube-api.onrender.com/api
```

**Importante:** 
- Deve incluir `https://` (não http)
- Deve terminar com `/api` (sem trailing slash)
- Não deve incluir `/videos/upload` ou outras rotas

---

## ⚙️ PASSO 2: Verificar FRONTEND_URL no Backend (Render)

O backend precisa saber qual domínio do frontend pode fazer requisições (CORS).

1. Acesse **Render Dashboard** → Seu serviço `clicktube-api`
2. Vá para **Environment** (ou **Environment Variables**)
3. Procure por `FRONTEND_URL`
   - Se **não existir**: Criar uma nova
   - Se **existir**: Atualizar se necessário

### ✅ Valor Correto para FRONTEND_URL:
```
https://clicktubeapp.vercel.app
```

**Importante:** Não inclua trailing slash

---

## 🧪 PASSO 3: Testar usando a Página de Diagnósticos

1. Deploy o código atualizado (com a página de Diagnósticos)
2. Acesse: `https://clicktubeapp.vercel.app/diagnostics`
3. Você verá:
   - VITE_API_URL que o frontend está usando
   - Status da conexão com backend
   - Botão para testar upload (se logado)

Se o diagnóstico mostrar erro, vá para PASSO 4.

---

## 🔧 PASSO 4: Diagnosticar Erros com DevTools

Se o teste falhar, abra o DevTools do navegador:

1. **Chrome/Edge**: F12 → **Network**
2. Tente fazer upload novamente
3. Procure pela requisição `POST /videos/upload` ou `POST upload`
4. Verifique:
   - **Status HTTP**: Pode ser 401, 403, 404, 500, etc.
   - **Request Headers**: Procure por `Authorization: Bearer <token>`
   - **Response Body**: Veja a mensagem de erro retornada
   - **CORS Error**: Se tiver erro de CORS, volte ao PASSO 2

### Exemplos de Erros e Soluções:

| Erro | Causa | Solução |
|------|-------|--------|
| **404** | Endpoint não encontrado | Verificar VITE_API_URL (falta `/api`?) |
| **401** | Token inválido/expirado | Fazer logout e login novamente |
| **403** | CORS bloqueando | Adicionar frontend URL em FRONTEND_URL no Render |
| **500** | Erro no Cloudinary | Verificar credenciais do Cloudinary no Render |
| **413** | Arquivo muito grande | Limitar tamanho (máx ~100MB recomendado) |

---

## 📝 Mudanças Aplicadas no Código

### Backend (`server/routes/videos.js`)
- ✅ Adicionado logging mais detalhado de erros
- ✅ Mensagens de erro mais específicas (Cloudinary, arquivo, etc)

### Frontend (`src/pages/Diagnostics.jsx`)
- ✅ Nova página de diagnóstico para testar conexão
- ✅ Mostra VITE_API_URL em uso
- ✅ Teste de upload sem arquivo real
- ✅ Dicas de troubleshooting

---

## 🚀 Deploy após Correções

```bash
# Local (teste antes de fazer push)
npm run dev

# Frontend no Vercel (auto-deploy ao fazer push)
git add .
git commit -m "fix: configure VITE_API_URL and improve upload diagnostics"
git push origin main

# Backend no Render (auto-deploy ao fazer push)
# Ou redeploy manual no Render Dashboard
```

---

## ❓ Perguntas Frequentes

**P: Qual é a URL exata do backend?**
R: `https://clicktube-api.onrender.com`

**P: Por que preciso de VITE_API_URL?**
R: O frontend precisa saber para onde enviar requisições. Em desenvolvimento é `localhost:5000/api`, em produção é o Render.

**P: Posso usar `http://` ao invés de `https://`?**
R: Não. Vercel force HTTPS, então VITE_API_URL deve ser `https://...`

**P: O CORS está bloqueando meu frontend?**
R: Se sim, você verá um erro no console do navegador como "blocked by CORS policy". Verifique se FRONTEND_URL no Render está correto.

---

## 📞 Próximos Passos

1. Configure `VITE_API_URL` no Vercel
2. Configure `FRONTEND_URL` no Render  
3. Deploy ambos os serviços
4. Teste a página de diagnósticos
5. Tente fazer upload de um vídeo teste

**Se ainda não funcionar**, compartilhe o erro que aparece na página de Diagnostics ou no DevTools.
