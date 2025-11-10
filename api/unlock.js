// API Serverless para Vercel
// Este arquivo será executado como uma função serverless

// Configuração (em produção, use variáveis de ambiente no Vercel)
const CORRECT_PASSWORD = process.env.DOOR_PASSWORD || '1234'; // Altere para sua senha
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos

// Armazena tentativas (em produção, use Redis ou DB)
const attemptLog = new Map();

// Rate limiting simples
function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = attemptLog.get(ip) || [];
    
    // Remover tentativas antigas
    const recentAttempts = attempts.filter(time => now - time < ATTEMPT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        return {
            allowed: false,
            remainingTime: Math.ceil((recentAttempts[0] + ATTEMPT_WINDOW - now) / 60000)
        };
    }
    
    // Adicionar tentativa atual
    recentAttempts.push(now);
    attemptLog.set(ip, recentAttempts);
    
    return { allowed: true };
}

// Função placeholder para enviar comando à fechadura
async function unlockDoor() {
    // TODO: Implementar integração com Kit Smart Fechadura Positivo
    // Quando a fechadura chegar, você precisará:
    // 1. Descobrir a API/protocolo da fechadura (HTTP, MQTT, etc)
    // 2. Obter credenciais de acesso
    // 3. Implementar a chamada aqui
    
    console.log('🔓 Comando de desbloqueio enviado!');
    
    // Simulação de chamada à API da fechadura
    // Exemplo genérico:
    /*
    const response = await fetch('https://api-fechadura-positivo.com/unlock', {
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
    */
    
    // Por enquanto, apenas simula sucesso
    return new Promise(resolve => {
        setTimeout(() => resolve(true), 500);
    });
}

// Handler principal da API
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Apenas aceitar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Método não permitido' 
        });
    }
    
    try {
        const { password } = req.body;
        
        // Validação básica
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: 'Senha inválida' 
            });
        }
        
        // Obter IP do cliente
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress || 
                        'unknown';
        
        // Verificar rate limiting
        const rateLimit = checkRateLimit(clientIp);
        if (!rateLimit.allowed) {
            return res.status(429).json({ 
                success: false, 
                message: `Muitas tentativas. Tente novamente em ${rateLimit.remainingTime} minutos.` 
            });
        }
        
        // Verificar senha
        if (password !== CORRECT_PASSWORD) {
            console.log(`❌ Tentativa de acesso negada - IP: ${clientIp}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Senha incorreta' 
            });
        }
        
        // Senha correta - tentar desbloquear
        console.log(`✅ Acesso autorizado - IP: ${clientIp}`);
        
        const unlocked = await unlockDoor();
        
        if (unlocked) {
            return res.status(200).json({ 
                success: true, 
                message: 'Porta desbloqueada com sucesso!' 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao desbloquear a porta. Tente novamente.' 
            });
        }
        
    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
}
