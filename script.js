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
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;
let numpadHeight = 0;

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

// Calcular altura do teclado
setTimeout(() => {
    numpadHeight = numpadContainer.offsetHeight;
}, 100);

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

// Touch handlers para arrastar
lockScreen.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    lockScreen.classList.add('dragging');
    numpadContainer.classList.add('dragging');
});

lockScreen.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    touchCurrentY = e.touches[0].clientY;
    const diff = touchStartY - touchCurrentY;
    
    // Subindo (diff > 0)
    if (diff > 0) {
        const progress = Math.min(diff / numpadHeight, 1);
        lockScreen.style.transform = `translateY(-${diff}px)`;
        numpadContainer.style.transform = `translateY(${(1 - progress) * 100}%)`;
    }
    // Descendo (diff < 0) - só funciona se o teclado estiver visível
    else if (diff < 0 && numpadContainer.classList.contains('visible')) {
        const absDiff = Math.abs(diff);
        const progress = Math.min(absDiff / numpadHeight, 1);
        
        // Tela de bloqueio desce junto
        lockScreen.style.transform = `translateY(-${numpadHeight - absDiff}px)`;
        // Teclado desce
        numpadContainer.style.transform = `translateY(${progress * 100}%)`;
    }
});

lockScreen.addEventListener('touchend', () => {
    if (!isDragging) return;
    
    const diff = touchStartY - touchCurrentY;
    const threshold = 30; // Mínimo de 30px de arrasto
    
    // Subindo - abre o teclado
    if (diff > threshold) {
        lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
        numpadContainer.classList.add('visible');
        numpadContainer.style.transform = 'translateY(0)';
    }
    // Descendo - fecha o teclado
    else if (diff < -threshold && numpadContainer.classList.contains('visible')) {
        lockScreen.style.transform = '';
        numpadContainer.classList.remove('visible');
        numpadContainer.style.transform = 'translateY(100%)';
        password = '';
        updatePasswordDisplay();
        clearFeedback();
    }
    // Volta para posição atual
    else {
        if (numpadContainer.classList.contains('visible')) {
            lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
            numpadContainer.style.transform = 'translateY(0)';
        } else {
            lockScreen.style.transform = '';
            numpadContainer.style.transform = 'translateY(100%)';
        }
    }
    
    isDragging = false;
    lockScreen.classList.remove('dragging');
    numpadContainer.classList.remove('dragging');
});

// Mouse handlers (para desktop)
let isMouseDragging = false;
let mouseStartY = 0;

lockScreen.addEventListener('mousedown', (e) => {
    mouseStartY = e.clientY;
    isMouseDragging = true;
    lockScreen.classList.add('dragging');
    numpadContainer.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    
    const diff = mouseStartY - e.clientY;
    
    // Subindo (diff > 0)
    if (diff > 0) {
        const progress = Math.min(diff / numpadHeight, 1);
        lockScreen.style.transform = `translateY(-${diff}px)`;
        numpadContainer.style.transform = `translateY(${(1 - progress) * 100}%)`;
    }
    // Descendo (diff < 0) - só funciona se o teclado estiver visível
    else if (diff < 0 && numpadContainer.classList.contains('visible')) {
        const absDiff = Math.abs(diff);
        const progress = Math.min(absDiff / numpadHeight, 1);
        
        lockScreen.style.transform = `translateY(-${numpadHeight - absDiff}px)`;
        numpadContainer.style.transform = `translateY(${progress * 100}%)`;
    }
});

document.addEventListener('mouseup', (e) => {
    if (!isMouseDragging) return;
    
    const diff = mouseStartY - e.clientY;
    const threshold = 30; // Mínimo de 30px de arrasto
    
    // Subindo - abre o teclado
    if (diff > threshold) {
        lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
        numpadContainer.classList.add('visible');
        numpadContainer.style.transform = 'translateY(0)';
    }
    // Descendo - fecha o teclado
    else if (diff < -threshold && numpadContainer.classList.contains('visible')) {
        lockScreen.style.transform = '';
        numpadContainer.classList.remove('visible');
        numpadContainer.style.transform = 'translateY(100%)';
        password = '';
        updatePasswordDisplay();
        clearFeedback();
    }
    // Volta para posição atual
    else {
        if (numpadContainer.classList.contains('visible')) {
            lockScreen.style.transform = `translateY(-${numpadHeight}px)`;
            numpadContainer.style.transform = 'translateY(0)';
        } else {
            lockScreen.style.transform = '';
            numpadContainer.style.transform = 'translateY(100%)';
        }
    }
    
    isMouseDragging = false;
    lockScreen.classList.remove('dragging');
    numpadContainer.classList.remove('dragging');
});

// Atualizar display de senha
function updatePasswordDisplay() {
    // Mostrar/ocultar placeholder
    if (password.length > 0) {
        passwordPlaceholder.classList.add('hidden');
    } else {
        passwordPlaceholder.classList.remove('hidden');
    }
    
    // Atualizar dots
    passwordDots.innerHTML = '';
    for (let i = 0; i < password.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot filled';
        passwordDots.appendChild(dot);
    }
}

// Teclado numérico
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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
    });
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
