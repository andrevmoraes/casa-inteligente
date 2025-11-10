// Estado da aplicação
let password = '';
let isUnlocking = false;
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

// Elementos
const lockScreen = document.getElementById('lockScreen');
const authScreen = document.getElementById('authScreen');
const timeDisplay = document.getElementById('timeDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const passwordDots = document.getElementById('passwordDots');
const feedbackMessage = document.getElementById('feedbackMessage');
const unlockBtn = document.getElementById('unlockBtn');
const backBtn = document.getElementById('backBtn');
const numButtons = document.querySelectorAll('.num-btn');

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
});

lockScreen.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    touchCurrentY = e.touches[0].clientY;
    const diff = touchStartY - touchCurrentY;
    
    if (diff > 0) {
        lockScreen.style.transform = `translateY(-${diff}px)`;
    }
});

lockScreen.addEventListener('touchend', () => {
    if (!isDragging) return;
    
    const diff = touchStartY - touchCurrentY;
    
    if (diff > 100) {
        // Deslizou suficiente, mostrar tela de auth
        lockScreen.style.transform = 'translateY(-100vh)';
        setTimeout(() => {
            lockScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            lockScreen.style.transform = '';
        }, 300);
    } else {
        // Voltar posição original
        lockScreen.style.transform = '';
    }
    
    isDragging = false;
    lockScreen.classList.remove('dragging');
});

// Mouse handlers (para desktop)
let isMouseDragging = false;
let mouseStartY = 0;

lockScreen.addEventListener('mousedown', (e) => {
    mouseStartY = e.clientY;
    isMouseDragging = true;
    lockScreen.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    
    const diff = mouseStartY - e.clientY;
    
    if (diff > 0) {
        lockScreen.style.transform = `translateY(-${diff}px)`;
    }
});

document.addEventListener('mouseup', (e) => {
    if (!isMouseDragging) return;
    
    const diff = mouseStartY - e.clientY;
    
    if (diff > 100) {
        lockScreen.style.transform = 'translateY(-100vh)';
        setTimeout(() => {
            lockScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            lockScreen.style.transform = '';
        }, 300);
    } else {
        lockScreen.style.transform = '';
    }
    
    isMouseDragging = false;
    lockScreen.classList.remove('dragging');
});

// Atualizar display de senha
function updatePasswordDisplay() {
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
            password += num;
            updatePasswordDisplay();
            clearFeedback();
        } else if (action === 'delete' && password.length > 0) {
            password = password.slice(0, -1);
            updatePasswordDisplay();
            clearFeedback();
        } else if (action === 'clear') {
            password = '';
            updatePasswordDisplay();
            clearFeedback();
        }
    });
});

// Limpar feedback
function clearFeedback() {
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'feedback-message';
}

// Mostrar feedback
function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message ${type}`;
}

// Desbloquear porta
unlockBtn.addEventListener('click', async () => {
    if (isUnlocking || password.length === 0) return;
    
    isUnlocking = true;
    unlockBtn.classList.add('loading');
    unlockBtn.disabled = true;
    clearFeedback();
    
    try {
        const response = await fetch('/api/unlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showFeedback('✓ Porta desbloqueada com sucesso!', 'success');
            password = '';
            updatePasswordDisplay();
            
            // Voltar para tela de bloqueio após 2 segundos
            setTimeout(() => {
                authScreen.classList.add('hidden');
                lockScreen.classList.remove('hidden');
                clearFeedback();
            }, 2000);
        } else {
            showFeedback(data.message || '✗ Senha incorreta', 'error');
            password = '';
            updatePasswordDisplay();
        }
    } catch (error) {
        console.error('Erro:', error);
        showFeedback('✗ Erro de conexão. Tente novamente.', 'error');
    } finally {
        isUnlocking = false;
        unlockBtn.classList.remove('loading');
        unlockBtn.disabled = false;
    }
});

// Voltar para tela de bloqueio
backBtn.addEventListener('click', () => {
    authScreen.classList.add('hidden');
    lockScreen.classList.remove('hidden');
    password = '';
    updatePasswordDisplay();
    clearFeedback();
});

// Suporte a teclado físico
document.addEventListener('keydown', (e) => {
    if (authScreen.classList.contains('hidden')) return;
    
    if (e.key >= '0' && e.key <= '9' && password.length < 8) {
        password += e.key;
        updatePasswordDisplay();
        clearFeedback();
    } else if (e.key === 'Backspace' && password.length > 0) {
        e.preventDefault();
        password = password.slice(0, -1);
        updatePasswordDisplay();
        clearFeedback();
    } else if (e.key === 'Enter' && password.length > 0) {
        unlockBtn.click();
    } else if (e.key === 'Escape') {
        backBtn.click();
    }
});
