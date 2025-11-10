# Casa Inteligente 🏠🔐

Sistema de controle remoto para fechadura inteligente com interface estilo Windows Phone.

## 🎯 Funcionalidades

- ✅ Tela de bloqueio com relógio em tempo real
- ✅ Animação de deslizar para cima (estilo Windows Phone)
- ✅ Teclado numérico flat sem bordas arredondadas
- ✅ Autenticação por senha
- ✅ API serverless para segurança
- ✅ Rate limiting (proteção contra força bruta)
- ✅ Design responsivo para mobile
- 🔄 Integração com Kit Smart Fechadura Positivo (em desenvolvimento)

## 🚀 Deploy no Vercel

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com) (gratuita)
2. [Vercel CLI](https://vercel.com/cli) instalado (opcional)

### Opção 1: Deploy via GitHub (Recomendado)

1. **Criar repositório no GitHub**
   - Crie um novo repositório no GitHub
   - Faça commit e push deste projeto

2. **Conectar ao Vercel**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Clique em "Import Git Repository"
   - Selecione seu repositório
   - Clique em "Import"

3. **Configurar variáveis de ambiente**
   - No dashboard do Vercel, vá em "Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     - `DOOR_PASSWORD`: sua senha (ex: `1234`)
     - `LOCK_API_KEY`: chave da API da fechadura (quando disponível)
     - `LOCK_DEVICE_ID`: ID do dispositivo (quando disponível)

4. **Deploy automático**
   - O Vercel fará deploy automaticamente
   - Cada push na branch main disparará um novo deploy

### Opção 2: Deploy via CLI

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy de teste
   vercel
   
   # Deploy em produção
   vercel --prod
   ```

4. **Configurar variáveis de ambiente**
   ```bash
   vercel env add DOOR_PASSWORD
   vercel env add LOCK_API_KEY
   vercel env add LOCK_DEVICE_ID
   ```

## 🔧 Desenvolvimento Local

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Criar arquivo `.env` local** (opcional)
   ```env
   DOOR_PASSWORD=1234
   LOCK_API_KEY=sua_chave_api
   LOCK_DEVICE_ID=seu_device_id
   ```

3. **Rodar localmente**
   ```bash
   npm run dev
   ```

4. **Acessar**
   - Abra http://localhost:3000

## 📱 Configurar NFC Tag

Após o deploy:

1. Copie a URL do seu site (ex: `https://casa-inteligente.vercel.app`)
2. Use um app de gravação de NFC (Android: **NFC Tools** / iOS: **NFC Tools**)
3. Grave a URL na tag NFC
4. Cole a tag na porta
5. Aproxime o celular para abrir automaticamente

## 🔐 Segurança

- ✅ Rate limiting: máximo 5 tentativas a cada 15 minutos
- ✅ Senha armazenada como variável de ambiente (não no código)
- ✅ HTTPS automático pelo Vercel
- ✅ Logs de acesso com IP

### ⚠️ Recomendações importantes:

1. **Altere a senha padrão** (`1234`) nas variáveis de ambiente
2. **Use senha forte** (6-8 dígitos aleatórios)
3. **Monitore os logs** do Vercel para tentativas suspeitas
4. **Configure alertas** para tentativas excessivas

## 🏗️ Estrutura do Projeto

```
casa-inteligente/
├── index.html          # Interface principal
├── styles.css          # Estilo Windows Phone
├── script.js           # Lógica do frontend
├── api/
│   └── unlock.js       # API serverless
├── package.json        # Dependências
├── vercel.json         # Configuração Vercel
└── README.md           # Este arquivo
```

## 🔌 Integração com a Fechadura

Quando o **Kit Smart Fechadura Positivo** chegar:

1. Consulte a documentação da API/SDK da Positivo
2. Obtenha as credenciais de acesso (API key, device ID)
3. Edite o arquivo `api/unlock.js`:
   - Descomente e adapte a seção `unlockDoor()`
   - Configure as variáveis de ambiente no Vercel

### Exemplo de integração (genérico):

```javascript
async function unlockDoor() {
    const response = await fetch('https://api-positivo.com/unlock', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.LOCK_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            deviceId: process.env.LOCK_DEVICE_ID,
            action: 'unlock'
        })
    });
    
    return response.ok;
}
```

## 🎨 Personalização

### Alterar imagem de fundo

No arquivo `styles.css`, linha 22:
```css
background: url('SUA_IMAGEM_AQUI') center/cover;
```

### Alterar cores

- Azul do Windows Phone: `#00a4ef`
- Verde (sucesso): `#60a917`
- Vermelho (erro): `#e51400`

## 📝 TODO

- [ ] Integrar com API do Kit Smart Fechadura Positivo
- [ ] Adicionar histórico de acessos
- [ ] Notificações push quando porta for aberta
- [ ] Modo escuro/claro
- [ ] Múltiplos usuários com senhas diferentes

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs no dashboard do Vercel
2. Teste localmente com `npm run dev`
3. Verifique as variáveis de ambiente

## 📄 Licença

MIT
