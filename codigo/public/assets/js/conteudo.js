// URLs da API do JSON Server
const API_BASE = 'http://localhost:3000';
const MODULOS_URL = `${API_BASE}/modulos`;
const CONTEUDO_URL = `${API_BASE}/topicos`;

// Estado global
let courseData = [];
let allModulos = [];
let allTopicos = []; 
let isAdmin = false;

// --- PROGRESSO (FIXADO EM 0%) ---
function getModuleProgress(moduleId) {
    return 0; 
}

function getGeneralProgress() {
    return 0;
}

function updateProgressBar(percent, labelText) {
    const progressBar = document.getElementById('course-progress');
    const progressLabel = document.getElementById('progress-label');
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressLabel) progressLabel.textContent = `${labelText} (${Math.round(percent)}%)`;
}

// --- CARREGAMENTO INICIAL ---
async function loadCourseData() {
    try {
        const loadingMsg = document.getElementById('loading-message');
        if(loadingMsg) loadingMsg.textContent = "Carregando módulos...";
        
        const user = JSON.parse(sessionStorage.getItem('usuarioCorrente'));
        isAdmin = (user && user.perfil === 'admin');

        const [modulosResponse, topicosResponse] = await Promise.all([
            fetch(MODULOS_URL),
            fetch(CONTEUDO_URL)
        ]);

        allModulos = await modulosResponse.json();
        allTopicos = await topicosResponse.json();

        const courseMap = {};
        allModulos.sort((a, b) => a.ordem - b.ordem).forEach(mod => {
            courseMap[mod.id] = { ...mod, topicos: [] }; 
        });

        allTopicos.forEach(item => {
            if (courseMap[item.modulo_id]) {
                courseMap[item.modulo_id].topicos.push(item);
            }
        });

        courseData = Object.values(courseMap);
        renderInitialView();
        updateSidebarInfo(null); 
        checkLoginStatus();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        const loadingMsg = document.getElementById('loading-message');
        if(loadingMsg) loadingMsg.textContent = "Erro ao carregar conteúdo. API offline?";
    }
}

// --- SIDEBAR ---
// --- SIDEBAR (MODIFICADO PARA ANIMAÇÃO SUAVE) ---
// --- SIDEBAR (COM ANIMAÇÃO SINCRONIZADA DO TÍTULO E DESCRIÇÃO) ---
function updateSidebarInfo(modulo) {
    const temaBox = document.getElementById('tema-abordado');
    const descHeader = document.getElementById('descricao-header');
    const descBoxHover = document.getElementById('descricao-hover');
    const descriptionContainer = document.querySelector('.description-box'); 

    // 1. Inicia a animação de saída (Fade Out)
    // Adiciona a classe que deixa transparente e desloca um pouco
    if(descriptionContainer) descriptionContainer.classList.add('changing');
    if(temaBox) temaBox.classList.add('changing-theme'); 

    // 2. Aguarda 300ms (tempo da transição CSS) antes de trocar o texto real
    setTimeout(() => {
        if (!modulo) {
            // Estado Inicial / Mouse fora
            if(temaBox) temaBox.textContent = 'Geral'; // Troca o título aqui dentro
            if(descHeader) descHeader.textContent = 'Bem-vindo!';
            if(descBoxHover) descBoxHover.textContent = 'Passe o mouse sobre os módulos para visualizar o planejamento.';
            updateProgressBar(getGeneralProgress(), 'Progresso Geral');
        } else {
            // Mouse sobre o módulo
            if(temaBox) temaBox.textContent = modulo.titulo; // Troca o título aqui dentro
            if(descHeader) descHeader.textContent = 'Neste módulo você verá:';

            const textoDescricao = modulo.descricao ? 
                                   modulo.descricao.replace(/\n/g, '<br>') : 
                                   'Planejamento do módulo não cadastrado.';

            if(descBoxHover) descBoxHover.innerHTML = textoDescricao;
            updateProgressBar(getModuleProgress(modulo.id), 'Progresso do Módulo');
        }

        // 3. Inicia a animação de entrada (Fade In / Subir)
        // Remove a classe, fazendo o texto aparecer e subir suavemente
        if(descriptionContainer) descriptionContainer.classList.remove('changing');
        if(temaBox) temaBox.classList.remove('changing-theme');

    }, 300); // Sincronizado com o transition do CSS (0.3s)
}

// --- RENDERIZAÇÃO GRID (CORRIGIDO) ---
function renderInitialView() {
    const grid = document.getElementById('modulos-grid');
    grid.innerHTML = ''; // Limpa o grid existente

    // CORREÇÃO: Remove botões "Criar Novo" antigos se existirem
    const oldButtons = document.querySelectorAll('.admin-create-container');
    oldButtons.forEach(btn => btn.remove());

    if (courseData.length === 0 && !isAdmin) {
        grid.innerHTML = `<p>Nenhum módulo encontrado.</p>`;
        return;
    }
    
    courseData.forEach(modulo => {
        const moduloBox = document.createElement('div');
        moduloBox.className = 'modulo-box';
        moduloBox.id = `modulo-${modulo.id}`;
        
        let cardHTML = `<strong>${modulo.titulo}</strong>`;
        
        if (isAdmin) {
            cardHTML += `
                <div class="card-actions">
                    <button class="btn-card-action btn-edit" onclick="event.stopPropagation(); openAdminModal(event, '${modulo.id}')">Editar</button>
                    <button class="btn-card-action btn-delete" onclick="event.stopPropagation(); deleteModule(event, '${modulo.id}')">Excluir</button>
                </div>
            `;
        }
        
        moduloBox.innerHTML = cardHTML;
        moduloBox.addEventListener('mouseover', () => updateSidebarInfo(modulo));
        moduloBox.addEventListener('mouseout', () => updateSidebarInfo(null));
        moduloBox.addEventListener('click', (e) => {
             if(e.target.tagName !== 'BUTTON') showModuleDetails(modulo);
        });
        grid.appendChild(moduloBox);
    });

    // Adiciona o botão APENAS UMA VEZ se for admin
    if (isAdmin) {
        const createBtnContainer = document.createElement('div');
        createBtnContainer.className = 'admin-create-container';
        createBtnContainer.innerHTML = `<button class="admin-create-btn" onclick="openAdminModal(event)">➕ Criar Novo Módulo</button>`;
        // Insere DEPOIS do grid, garantindo que não duplique dentro dele
        grid.parentNode.insertBefore(createBtnContainer, grid.nextSibling);
    }
}

// --- FUNÇÕES CRUD MÓDULOS (ADMIN) ---

function openAdminModal(event, id = null) {
    if(event) event.stopPropagation();
    const form = document.getElementById('form-modulo');
    form.reset(); 
    
    if (id) {
        const modulo = courseData.find(m => m.id == id);
        if(modulo) {
            document.getElementById('modulo-id').value = modulo.id;
            document.getElementById('titulo').value = modulo.titulo;
            document.getElementById('ordem').value = modulo.ordem;
            document.getElementById('descricao').value = modulo.descricao || '';
            document.getElementById('modal-title').textContent = "Editar Módulo";
        }
    } else {
        document.getElementById('modulo-id').value = '';
        document.getElementById('modal-title').textContent = "Criar Novo Módulo";
    }
    document.getElementById('admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
}

async function saveModule(event) {
    event.preventDefault();
    const id = document.getElementById('modulo-id').value;
    
    const data = {
        titulo: document.getElementById('titulo').value,
        ordem: parseInt(document.getElementById('ordem').value),
        descricao: document.getElementById('descricao').value
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${MODULOS_URL}/${id}` : MODULOS_URL;
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { 
            closeAdminModal(); 
            loadCourseData(); // Recarrega a tela limpa
        }
    } catch (error) { alert('Erro ao salvar.'); }
}

async function deleteModule(event, id) {
    event.stopPropagation();
    if(!confirm("Tem certeza?")) return;
    try {
        await fetch(`${MODULOS_URL}/${id}`, { method: 'DELETE' });
        loadCourseData();
    } catch (error) { alert('Erro ao excluir.'); }
}

// --- NAVEGAÇÃO ---
function showModuleDetails(modulo) {
    window.location.href = `/modulo-visualizacao/visualizacao.html?modulo=${modulo.id}`; 
}

function hideModuleDetails() {
    document.getElementById('modulos-grid').classList.remove('hidden');
    document.getElementById('modulo-view').classList.add('hidden');
    updateSidebarInfo(null); 
}

// No arquivo conteudo.js

function checkLoginStatus() {
    // 1. Pega o elemento do botão/texto de login no HTML
    const userInfoDiv = document.getElementById('userInfo');
    
    // 2. Tenta recuperar o usuário salvo na sessão
    const user = JSON.parse(sessionStorage.getItem('usuarioCorrente'));

    // 3. Se houver usuário e o elemento existir na tela
    if (user && userInfoDiv) {
        
        // Verifica se é admin para formatar o texto
        if (user.perfil === 'admin') {
            // Exibe: "Ian (Admin)"
            userInfoDiv.textContent = `${user.login} (Admin)`;
            
            // Opcional: Adiciona uma cor diferente ou ícone se for admin
            userInfoDiv.style.color = 'var(--fin-dark-green)'; 
            userInfoDiv.innerHTML = `<i class="fas fa-user-shield"></i> ${user.login} (Admin)`; 
            
        } else {
            // Exibe apenas o username: "Ian"
            userInfoDiv.innerHTML = `<i class="fas fa-user"></i> ${user.login}`;
        }

        // (Opcional) Transformar o botão em um "Logout" ao clicar
        userInfoDiv.onclick = function() {
            if(confirm("Deseja sair da conta?")) {
                sessionStorage.removeItem('usuarioCorrente');
                window.location.href = '/modulos/login/login.html'; // Ou sua página de login
            }
        };
        
        // Ajuste visual para parecer menos um botão "clicável" de login e mais uma etiqueta
        userInfoDiv.style.cursor = 'pointer'; 
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-close-modal').addEventListener('click', closeAdminModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeAdminModal);
    document.getElementById('form-modulo').addEventListener('submit', saveModule);

    const closeViewBtn = document.getElementById('close-module-view');
    if(closeViewBtn) closeViewBtn.addEventListener('click', hideModuleDetails);

    setTimeout(() => {
        window.usuarioCorrente = window.usuarioCorrente || JSON.parse(sessionStorage.getItem('usuarioCorrente')) || {};
        loadCourseData();
    }, 50); 
});

// Expondo funções para o HTML
window.openAdminModal = openAdminModal;
window.deleteModule = deleteModule;
window.closeAdminModal = closeAdminModal;