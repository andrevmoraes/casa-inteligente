// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registrado'))
        .catch((err) => console.log('Service Worker falhou:', err));
}

// Prevenir zoom com gestos (pinch)
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// Prevenir zoom com duplo toque
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Estado da aplicação
let password = '';
let isUnlocking = false;
let isDragging = false; // Arrasto por toque
let isMouseDragging = false; // Arrasto por mouse
let numpadHeight = 0;
let isInitialized = false;

// Elementos
const lockScreen = document.getElementById('lockScreen');
const numpadContainer = document.getElementById('numpadContainer');
const successScreen = document.getElementById('successScreen');
const timeDisplay = document.getElementById('timeDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const passwordDots = document.getElementById('passwordDots');
const passwordPlaceholder = document.getElementById('passwordPlaceholder');
const passwordError = document.getElementById('passwordError');
const numButtons = document.querySelectorAll('.num-btn');

// Inicialização da UI
function initializeUI() {
    if (isInitialized) return;
    isInitialized = true;

    numpadHeight = numpadContainer.offsetHeight;
    
    // Esconde o teclado para a animação inicial
    numpadContainer.classList.remove('visible');
    numpadContainer.style.transform = 'translateY(100%)';

    // Abre o teclado automaticamente com animação
    setTimeout(() => {
        lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
        numpadContainer.classList.add('visible');
        numpadContainer.style.transform = 'translateY(0)';
    }, 200);
}

// Inicia a UI quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Atraso para garantir que o layout CSS foi aplicado
    setTimeout(initializeUI, 100); 
});

// Atualizar relógio
function updateClock() {
    const now = new Date();
    
    // Hora
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}`;
    
    // Data
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    
    dateDisplay.textContent = `${dayName}, ${day} de ${month}`;
}

// Iniciar relógio
updateClock();
setInterval(updateClock, 1000);


// Atualizar display de senha (otimizado para velocidade)
function updatePasswordDisplay() {
    // Mostrar/ocultar placeholder
    if (password.length > 0) {
        passwordPlaceholder.classList.add('hidden');
    } else {
        passwordPlaceholder.classList.remove('hidden');
    }
    
    // Atualizar dots usando DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < password.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot filled';
        fragment.appendChild(dot);
    }
    
    // Limpa e adiciona tudo de uma vez (mais rápido)
    passwordDots.innerHTML = '';
    passwordDots.appendChild(fragment);
}

// Teclado numérico - usando touchstart e mousedown para captura imediata
numButtons.forEach(btn => {
    let lastTouchTime = 0;
    let isProcessing = false;
    
    const handleInput = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevenir eventos duplicados (touch + mouse no mesmo clique)
        const now = Date.now();
        if (now - lastTouchTime < 50) return;
        lastTouchTime = now;
        
        // Prevenir processamento simultâneo
        if (isProcessing) return;
        isProcessing = true;
        
        // Feedback visual instantâneo
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
        
        const num = btn.dataset.num;
        const action = btn.dataset.action;
        
        if (num && password.length < 8) {
            // Esconde erro quando começa a digitar
            passwordError.classList.add('hidden');
            
            password += num;
            updatePasswordDisplay();
            
            // Verifica automaticamente a senha
            checkPasswordAutomatically();
        } else if (action === 'delete' && password.length > 0) {
            // Esconde erro quando apaga
            passwordError.classList.add('hidden');
            
            password = password.slice(0, -1);
            updatePasswordDisplay();
        }
        
        // Remove feedback visual
        setTimeout(() => {
            btn.style.background = '';
        }, 100);
        
        // Libera para próximo input
        setTimeout(() => {
            isProcessing = false;
        }, 10);
    };
    
    // Touch para mobile (prioridade)
    btn.addEventListener('touchstart', handleInput, { passive: false });
    
    // Mouse para desktop (fallback)
    btn.addEventListener('mousedown', handleInput);
});

// Funções removidas (não usadas mais)
function clearFeedback() {}
function showFeedback() {}

// Verificar senha automaticamente
async function checkPasswordAutomatically() {
    if (isUnlocking || password.length === 0) return;
    
    // Senha configurada (temporário - simulação local)
    const CORRECT_PASSWORD = '1234'; // Altere aqui sua senha de teste
    
    // Só verifica se tiver pelo menos 4 dígitos
    if (password.length < 4) return;
    
    isUnlocking = true;
    
    // Verificação instantânea
    if (password === CORRECT_PASSWORD) {
        // Senha correta - abre imediatamente
        // Tela de bloqueio termina de subir
        lockScreen.classList.add('unlocking');
        
        // Teclado desce
        numpadContainer.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        numpadContainer.style.transform = 'translateY(100%)';
        
        // Mostra tela de sucesso
        setTimeout(() => {
            successScreen.classList.remove('hidden');
        }, 200);
        
    } else {
        // Senha incorreta - mostra erro instantaneamente
        passwordDots.innerHTML = '';
        passwordPlaceholder.classList.add('hidden');
        passwordError.classList.remove('hidden');
        password = '';
        isUnlocking = false;
    }
}

// Desbloquear porta (não é mais usado diretamente, mas mantemos para compatibilidade)
// A verificação agora é automática em checkPasswordAutomatically()

// Resetar para tela de bloqueio
function resetToLockScreen() {
    successScreen.classList.add('hidden');
    lockScreen.classList.remove('unlocking');
    lockScreen.style.transform = '';
    numpadContainer.classList.remove('visible');
    numpadContainer.style.transform = 'translateY(100%)';
    password = '';
    passwordError.classList.add('hidden');
    updatePasswordDisplay();
}

// Suporte a teclado físico
document.addEventListener('keydown', (e) => {
    // Só funciona se o teclado estiver visível
    if (!numpadContainer.classList.contains('visible')) return;
    
    if (e.key >= '0' && e.key <= '9' && password.length < 8) {
        passwordError.classList.add('hidden');
        password += e.key;
        updatePasswordDisplay();
        checkPasswordAutomatically();
    } else if (e.key === 'Backspace' && password.length > 0) {
        e.preventDefault();
        passwordError.classList.add('hidden');
        password = password.slice(0, -1);
        updatePasswordDisplay();
    } else if (e.key === 'Escape') {
        resetToLockScreen();
    }
});

// ===================================================================
// LÓGICA UNIFICADA PARA O ARRASTO (TOQUE E MOUSE)
// ===================================================================

let dragStartY = 0;
let dragCurrentY = 0;
let dragSource = null; // 'lockScreen' ou 'numpad'

function handleDragStart(source, startY, evt) {
    // Ignora se já estiver arrastando
    if (isDragging || isMouseDragging) return;
    if (!evt) return;

    if (source === 'numpad' && evt.target.closest('.num-btn')) {
        return; // Não inicia o arrasto se clicar em um botão do numpad
    }

    dragSource = source;
    dragStartY = startY;
    dragCurrentY = startY;

    // Define a flag correta para o tipo de evento
    if (evt.type.startsWith('touch')) {
        isDragging = true;
    } else {
        isMouseDragging = true;
        evt.preventDefault(); // Evita seleção de texto durante o arrasto
    }

    // Desativa as transições durante o arrasto para um movimento direto
    lockScreen.classList.add('dragging');
    numpadContainer.classList.add('dragging');
}

function handleDragMove(currentY) {
    if (!isDragging && !isMouseDragging) return;

    dragCurrentY = currentY;
    const diff = dragStartY - dragCurrentY;

    // O movimento é relativo à posição inicial do teclado (aberto)
    const initialOffset = numpadContainer.classList.contains('visible') ? numpadHeight : 0;
    
    // Calcula o novo deslocamento da tela de bloqueio
    let newLockScreenY = -initialOffset + (dragCurrentY - dragStartY);
    
    // Limita o movimento para não arrastar mais que o necessário
    if (newLockScreenY > 0) newLockScreenY = 0; // Limite superior (fechado)
    if (newLockScreenY < -numpadHeight) newLockScreenY = -numpadHeight; // Limite inferior (aberto)

    if (dragSource === 'lockScreen' && newLockScreenY < 0 && !numpadContainer.classList.contains('visible')) {
        numpadContainer.classList.add('visible');
    }

    lockScreen.style.transform = `translateY(${newLockScreenY}px)`;

    // O teclado acompanha o movimento da tela de bloqueio
    const numpadProgress = 1 - (Math.abs(newLockScreenY) / numpadHeight);
    const clampedProgress = Math.min(Math.max(numpadProgress, 0), 1);
    numpadContainer.style.transform = `translateY(${clampedProgress * 100}%)`;
}

function handleDragEnd() {
    if (!isDragging && !isMouseDragging) return;

    const diff = dragStartY - dragCurrentY;
    const threshold = 50; // Limite de arrasto para acionar a ação

    // Garante que as transições CSS serão reativadas
    lockScreen.classList.remove('dragging');
    numpadContainer.classList.remove('dragging');

    // Determina a ação final baseada na origem e direção do arrasto
    const shouldClose = (dragSource === 'lockScreen' && diff < -threshold) || 
                        (dragSource === 'numpad' && diff < -threshold);
    
    const shouldOpen = dragSource === 'lockScreen' && diff > threshold;

    const wasVisible = numpadContainer.classList.contains('visible');

    const finalizePosition = () => {
        if (shouldClose) {
            lockScreen.style.transform = '';
            numpadContainer.classList.remove('visible');
            numpadContainer.style.transform = 'translateY(100%)';
            password = '';
            updatePasswordDisplay();
            clearFeedback();
        } else if (shouldOpen) {
            numpadContainer.classList.add('visible');
            lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
            numpadContainer.style.transform = 'translateY(0)';
        } else {
            if (wasVisible) {
                numpadContainer.classList.add('visible');
                lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
                numpadContainer.style.transform = 'translateY(0)';
            } else {
                lockScreen.style.transform = '';
                numpadContainer.classList.remove('visible');
                numpadContainer.style.transform = 'translateY(100%)';
            }
        }
    };

    // Aguarda dois frames para garantir que as transições estejam ativas
    requestAnimationFrame(() => {
        requestAnimationFrame(finalizePosition);
    });

    // Limpa as variáveis de estado
    isDragging = false;
    isMouseDragging = false;
    dragStartY = 0;
    dragCurrentY = 0;
    dragSource = null;
}

// ===================================================================
// EVENT LISTENERS
// ===================================================================

// Touch handlers
lockScreen.addEventListener('touchstart', (e) => handleDragStart('lockScreen', e.touches[0].clientY, e));
lockScreen.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientY));
lockScreen.addEventListener('touchend', handleDragEnd);
lockScreen.addEventListener('touchcancel', handleDragEnd);

numpadContainer.addEventListener('touchstart', (e) => handleDragStart('numpad', e.touches[0].clientY, e));
numpadContainer.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientY));
numpadContainer.addEventListener('touchend', handleDragEnd);
numpadContainer.addEventListener('touchcancel', handleDragEnd);

// Mouse handlers (para desktop)
lockScreen.addEventListener('mousedown', (e) => handleDragStart('lockScreen', e.clientY, e));
numpadContainer.addEventListener('mousedown', (e) => handleDragStart('numpad', e.clientY, e));

document.addEventListener('mousemove', (e) => handleDragMove(e.clientY));
document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('mouseleave', handleDragEnd);
window.addEventListener('blur', handleDragEnd);


// ===================================================================
// LÓGICA DE MANIPULAÇÃO DE SENHA
// ===================================================================
numButtons.forEach(button => {
    let lastTouchTime = 0;
    let isProcessing = false;
    
    const handleInput = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevenir eventos duplicados (touch + mouse no mesmo clique)
        const now = Date.now();
        if (now - lastTouchTime < 50) return;
        lastTouchTime = now;
        
        // Prevenir processamento simultâneo
        if (isProcessing) return;
        isProcessing = true;
        
        // Feedback visual instantâneo
        button.style.background = 'rgba(255, 255, 255, 0.2)';
        
        const num = button.dataset.num;
        const action = button.dataset.action;
        
        if (num && password.length < 8) {
            // Esconde erro quando começa a digitar
            passwordError.classList.add('hidden');
            
            password += num;
            updatePasswordDisplay();
            
            // Verifica automaticamente a senha
            checkPasswordAutomatically();
        } else if (action === 'delete' && password.length > 0) {
            // Esconde erro quando apaga
            passwordError.classList.add('hidden');
            
            password = password.slice(0, -1);
            updatePasswordDisplay();
        }
        
        // Remove feedback visual
        setTimeout(() => {
            button.style.background = '';
        }, 100);
        
        // Libera para próximo input
        setTimeout(() => {
            isProcessing = false;
        }, 10);
    };
    
    // Touch para mobile (prioridade)
    button.addEventListener('touchstart', handleInput, { passive: false });
    
    // Mouse para desktop (fallback)
    button.addEventListener('mousedown', handleInput);
});
