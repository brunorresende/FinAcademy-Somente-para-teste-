// visualizacao.js (CÓDIGO CORRIGIDO - FINAL)

const API_BASE = 'http://localhost:3000';
const QUIZ_URL = `${API_BASE}/questions`; // Endpoint para o Quiz

// Elementos Principais
const areaConteudo = document.getElementById('area-conteudo-aula');
const scrollArea = document.querySelector('.content-area');
const toolbar = document.getElementById('floating-toolbar');
const btnEditar = document.getElementById('btn-editar-conteudo');
const adminPanel = document.getElementById('admin-panel');
const sidebarAdminArea = document.getElementById('sidebar-admin-area');
const btnAnterior = document.getElementById('btn-anterior'); 
const btnProximo = document.getElementById('btn-proximo');   

// ELEMENTOS DO QUIZ VIEW
const quizManagementView = document.getElementById('quiz-management-view');
const btnIniciarQuiz = document.getElementById('btn-iniciar-quiz');
const quizCrudControls = document.getElementById('quiz-crud-controls');
const btnDeleteQuiz = document.getElementById('btn-delete-quiz');

// ELEMENTOS DO MODAL CRUD
const quizCrudModalElement = document.getElementById('quizCrudModal');
const quizCrudModal = quizCrudModalElement ? new bootstrap.Modal(quizCrudModalElement) : null;

const btnAddQuiz = document.getElementById('btn-add-quiz');
const quizQuestionList = document.getElementById('quiz-question-list');
const btnOpenAddForm = document.getElementById('btn-open-add-form');
const questionCrudForm = document.getElementById('question-crud-form');
const btnCancelForm = document.getElementById('btn-cancel-form');
const crudQuestionId = document.getElementById('crud-question-id');
const crudQuestionText = document.getElementById('crud-question-text');
const crudOptionA = document.getElementById('crud-option-a');
const crudOptionB = document.getElementById('crud-option-b');
const crudOptionC = document.getElementById('crud-option-c');
const crudOptionD = document.getElementById('crud-option-d');
const crudImageUrl = document.getElementById('crud-image-url');
const formTitle = document.getElementById('form-title');


// Estado
let topicos = [];
let quizQuestions = []; 
let aulaAtualIndex = 0; 
let isEditing = false;
let selectedEl = null;
let playerYT = null;
let usuarioIsAdmin = false;
let moduloId = null; 

// Variáveis de Movimento
let isDragging = false, isResizing = false;
let startX, startY, startLeft, startTop, startWidth;
let currentResizer = null;


// --- 9. DEFINIÇÕES DE LISTENERS (MOVIDAS PARA O TOPO PARA GARANTIR HOISTING) ---

function setupEventListenersQuiz() {
    if (btnIniciarQuiz) {
        btnIniciarQuiz.addEventListener('click', () => {
            window.location.href = `/index.html?modulo=${moduloId}`;
        });
    }

    // O botão de "Gerenciar Questões" abre o modal
    if (btnAddQuiz) btnAddQuiz.addEventListener('click', openQuizCrudModal);
    
    // O botão de exclusão do módulo
    if (btnDeleteQuiz) btnDeleteQuiz.addEventListener('click', handleModuleQuizDeletion);
}

function setupFormListeners() {
    // Abrir o formulário de adição DENTRO do modal
    if (btnOpenAddForm) btnOpenAddForm.addEventListener('click', () => {
        if(questionCrudForm) questionCrudForm.classList.remove('hidden');
        const quizListContainer = document.getElementById('quiz-list-container');
        if(quizListContainer) quizListContainer.classList.add('hidden');
        resetForm();
    });

    // Cancelar o formulário
    if (btnCancelForm) btnCancelForm.addEventListener('click', () => {
        if(questionCrudForm) questionCrudForm.classList.add('hidden');
        const quizListContainer = document.getElementById('quiz-list-container');
        if(quizListContainer) quizListContainer.classList.remove('hidden');
    });

    // Submeter o formulário (Criação/Edição)
    if (questionCrudForm) questionCrudForm.addEventListener('submit', handleFormSubmission);
}


// --- 1. INICIALIZAÇÃO E SETUP ---
document.addEventListener('DOMContentLoaded', async () => {
    // Setup do Youtube
    var tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    checkUser();
    
    const params = new URLSearchParams(window.location.search);
    moduloId = params.get('modulo'); 
    if (!moduloId) return alert("Erro: Módulo não especificado");

    await loadTopicos(moduloId);
    
    // CHAMADA CORRIGIDA: As funções agora estão declaradas e prontas para uso.
    setupEventListenersQuiz(); 
    setupFormListeners(); 
});

// --- FUNÇÕES DE LÓGICA (RESTANTE DO CÓDIGO) ---

// --- 2. AUTH & LOGOUT ---
function checkUser() {
    const user = JSON.parse(sessionStorage.getItem('usuarioCorrente'));
    const badge = document.getElementById('userInfo');
    
    if (user) {
        let html = `<i class="fas fa-user-circle"></i> ${user.login}`;
        if (user.perfil === 'admin') {
            usuarioIsAdmin = true;
            if(adminPanel) adminPanel.classList.remove('hidden');
            if(sidebarAdminArea) sidebarAdminArea.classList.remove('hidden');
            html += ' <span style="color:#FFB300">(Admin)</span>';
        }
        html += `<button onclick="fazerLogout()" class="btn-logout" title="Sair"><i class="fas fa-times-circle"></i></button>`;
        badge.innerHTML = html;
    } else {
        window.location.href = '/modulos/login/login.html'; 
    }
}

window.fazerLogout = function() {
    if(confirm("Sair do sistema?")) {
        sessionStorage.removeItem('usuarioCorrente');
        window.location.href = '/modulos/login/login.html'; 
    }
}

// --- 3. CARREGAMENTO E RENDERIZAÇÃO ---
async function loadTopicos(modId) {
    try {
        const res = await fetch(`${API_BASE}/topicos?modulo_id=${modId}`);
        topicos = await res.json();
        renderSidebar();
        
        const initialIndex = topicos.length === 0 ? topicos.length : 0;
        carregarConteudo(initialIndex);
        
    } catch (e) { console.error(e); }
}

function renderSidebar() {
    const lista = document.getElementById('lista-topicos');
    if(!lista) return; 
    
    lista.innerHTML = '';
    
    // Renderiza Aulas
    topicos.forEach((topico, index) => {
        const li = document.createElement('li');
        li.className = `topic-item ${index === aulaAtualIndex ? 'active' : ''}`;
        
        let html = `<div class="topic-title"><i class="fas fa-play" style="font-size:0.8rem"></i> <span>${topico.titulo}</span></div>`;
        
        if (usuarioIsAdmin) {
            html += `
                <div class="sidebar-actions">
                    <button class="btn-icon-sm" onclick="editarTituloAula(event, '${topico.id}', '${topico.titulo}')" title="Editar Título"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon-sm btn-del-topic" onclick="excluirAula(event, '${topico.id}')" title="Excluir Aula"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }
        
        li.innerHTML = html;
        li.onclick = (e) => { 
            if(e.target.closest('button')) return;
            if(!isEditing) carregarConteudo(index); 
            else alert("Salve a edição atual antes de mudar de aula!"); 
        };
        lista.appendChild(li);
    });
    
    // Renderiza o Item do Quiz
    const liQuiz = document.createElement('li');
    liQuiz.className = `topic-item quiz-item ${aulaAtualIndex === topicos.length ? 'active' : ''}`;
    liQuiz.innerHTML = `<div class="topic-title"><i class="fas fa-question-circle"></i> <span>Quiz Final</span></div>`;
    liQuiz.onclick = (e) => { 
        if(!isEditing) carregarConteudo(topicos.length); 
        else alert("Salve a edição atual antes de mudar de tela!"); 
    };
    lista.appendChild(liQuiz);
}

function carregarConteudo(index) {
    if (index < 0 || index > topicos.length) return;
    
    deselecionarTudo();
    if(isEditing) {
        alert("Salve a edição atual antes de mudar de tela!");
        return;
    }
    
    aulaAtualIndex = index;
    const isQuizTime = (index === topicos.length);

    if (isQuizTime) {
        carregarQuizView();
    } else {
        carregarAula(index);
    }
    
    document.querySelectorAll('.topic-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    btnAnterior.disabled = index === 0;
    btnProximo.disabled = isQuizTime; 
}

function carregarAula(index) {
    const aula = topicos[index];

    if(quizManagementView) quizManagementView.classList.add('hidden');
    areaConteudo.classList.remove('hidden-for-quiz');
    
    document.getElementById('titulo-aula').textContent = aula.titulo;
    areaConteudo.innerHTML = aula.conteudo || "";
    
    areaConteudo.querySelectorAll('.video-overlay').forEach(el => el.remove());
    
    const vidWrapper = document.getElementById('video-wrapper');
    if(aula.videoUrl) { vidWrapper.classList.remove('hidden'); setupVideoPlayer(aula.videoUrl); }
    else { vidWrapper.classList.add('hidden'); }
    
    if(adminPanel) adminPanel.classList.toggle('hidden', !usuarioIsAdmin);

    setTimeout(recalcularAltura, 300);
}

function carregarQuizView() {
    document.getElementById('titulo-aula').textContent = "Quiz Final do Módulo";
    
    areaConteudo.classList.add('hidden-for-quiz');
    if(quizManagementView) quizManagementView.classList.remove('hidden');
    
    if(adminPanel) adminPanel.classList.add('hidden');

    if (usuarioIsAdmin && quizCrudControls) {
        quizCrudControls.classList.remove('hidden');
    } else if (quizCrudControls) {
        quizCrudControls.classList.add('hidden');
    }
}


// --- 4. CRUD SIDEBAR (mantido original) ---

window.adicionarNovaAula = async function() {
    const titulo = prompt("Título da Nova Aula:");
    if (!titulo) return;
    
    if (!moduloId) return alert("Erro: ID do Módulo não disponível.");

    const novaAula = {
        modulo_id: moduloId,
        titulo: titulo,
        conteudo: "",
        videoUrl: ""
    };

    try {
        await fetch(`${API_BASE}/topicos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(novaAula) });
        await loadTopicos(moduloId);
    } catch(e) { alert("Erro ao criar aula"); }
}

window.editarTituloAula = async function(e, id, tituloAtual) {
    e.stopPropagation();
    const novoTitulo = prompt("Novo título:", tituloAtual);
    if (!novoTitulo || novoTitulo === tituloAtual) return;

    try {
        await fetch(`${API_BASE}/topicos/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ titulo: novoTitulo }) });
        
        const item = topicos.find(t => t.id == id);
        if(item) item.titulo = novoTitulo;
        renderSidebar();
        
        if(topicos[aulaAtualIndex].id == id) document.getElementById('titulo-aula').textContent = novoTitulo;
        
    } catch(e) { alert("Erro ao editar"); }
}

window.excluirAula = async function(e, id) {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta aula permanentemente?")) return;

    try {
        await fetch(`${API_BASE}/topicos/${id}`, { method: 'DELETE' });
        
        await loadTopicos(moduloId);
        
    } catch(e) { alert("Erro ao excluir"); }
}

// --- 5. YOUTUBE UTILS (mantido original) ---
function setupVideoPlayer(url) {
    if (playerYT) { playerYT.destroy(); playerYT = null; }
    document.getElementById('video-wrapper').innerHTML = '<div id="player-youtube"></div>';
    const id = extrairIDYoutube(url);
    if(window.YT) new YT.Player('player-youtube', { height: '100%', width: '100%', videoId: id });
}
function extrairIDYoutube(url) { 
    let id=''; 
    if(url.includes('v=')) id=url.split('v=')[1].split('&')[0]; 
    else if(url.includes('youtu.be/')) id=url.split('youtu.be/')[1]; 
    else if(url.includes('/embed/')) id=url.split('/embed/')[1]; 
    return id; 
}

// --- 6. AUTOGROW E EDIÇÃO CANVAS (mantido original) ---
function recalcularAltura() {
    const elementos = areaConteudo.querySelectorAll('.midia-wrapper');
    let maiorBottom = 0;
    elementos.forEach(el => {
        const bottom = el.offsetTop + el.offsetHeight;
        if (bottom > maiorBottom) maiorBottom = bottom;
    });
    const novaAltura = Math.max(800, maiorBottom + 200);
    areaConteudo.style.minHeight = novaAltura + 'px';
}

function toggleVideoOverlayAndHandles(isEditingActive) {
    document.querySelectorAll('.midia-wrapper').forEach(el => {
        let handles = el.querySelectorAll('.resize-handle');
        if (isEditingActive && handles.length === 0) {
            el.insertAdjacentHTML('afterbegin', `<div class="resize-handle handle-tl"></div><div class="resize-handle handle-tr"></div><div class="resize-handle handle-bl"></div><div class="resize-handle handle-br"></div>`);
        } else if (!isEditingActive && handles.length > 0) {
            handles.forEach(h => h.remove());
        }

        const iframe = el.querySelector('iframe');
        if (iframe) {
            let overlay = el.querySelector('.video-overlay');
            if (isEditingActive && !overlay) {
                iframe.insertAdjacentHTML('afterend', '<div class="video-overlay"></div>');
            } else if (!isEditingActive && overlay) {
                overlay.remove();
            }
        }
    });
    areaConteudo.contentEditable = isEditingActive ? "true" : "false";
}

function criarElementoFlutuante(tipo, url) {
    const wrapper = document.createElement('div');
    wrapper.className = 'midia-wrapper';
    wrapper.style.left = '50px'; 
    wrapper.style.top = (scrollArea.scrollTop + 100) + 'px'; 
    wrapper.contentEditable = "false";
    
    let content = tipo === 'img' 
        ? `<img src="${url}" onerror="this.src='https://placehold.co/300x200?text=Erro+Link';">`
        : `<iframe src="${url}"></iframe><div class="video-overlay"></div>`;

    wrapper.innerHTML = `<div class="resize-handle handle-tl"></div><div class="resize-handle handle-tr"></div><div class="resize-handle handle-bl"></div><div class="resize-handle handle-br"></div>${content}`;
    areaConteudo.appendChild(wrapper);
    selecionarElemento(wrapper);
    recalcularAltura();
}

// --- 7. INTERAÇÃO (mantido original) ---
areaConteudo.addEventListener('paste', (e) => {
    if (!isEditing) return;
    const clipboardData = e.clipboardData || window.clipboardData;
    if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (evt) => criarElementoFlutuante('img', evt.target.result);
            reader.readAsDataURL(file);
            return;
        }
    }
    const pastedData = clipboardData.getData('Text');
    if (pastedData) {
        const ytId = extrairIDYoutube(pastedData);
        if (ytId) { e.preventDefault(); criarElementoFlutuante('video', `https://www.youtube.com/embed/${ytId}`); return; }
        if (pastedData.match(/\.(jpeg|jpg|gif|png|webp)$/i)) { e.preventDefault(); criarElementoFlutuante('img', pastedData); return; }
    }
});

areaConteudo.addEventListener('mousedown', (e) => {
    if(!isEditing) return;
    if(e.target.classList.contains('resize-handle')) { iniciarRedimensionamento(e, e.target); return; }
    let target = e.target;
    if(target.classList.contains('video-overlay') || target.tagName === 'IMG') target = target.parentElement;
    if(target.classList.contains('midia-wrapper')) { selecionarElemento(target); iniciarArrasto(e, target); e.stopPropagation(); }
    else { deselecionarTudo(); }
});

function selecionarElemento(el) {
    if(selectedEl) selectedEl.classList.remove('midia-selected');
    selectedEl = el; selectedEl.classList.add('midia-selected');
    atualizarToolbar(el);
}
function deselecionarTudo() {
    if(selectedEl) selectedEl.classList.remove('midia-selected');
    selectedEl = null; toolbar.classList.add('hidden');
}

function iniciarArrasto(e, el) { isDragging = true; startX = e.clientX; startY = e.clientY; startLeft = el.offsetLeft; startTop = el.offsetTop; el.classList.add('is-dragging'); toolbar.classList.add('hidden'); }
function iniciarRedimensionamento(e, handle) { isResizing = true; currentResizer = handle; const el = handle.parentElement; el.classList.add('is-dragging'); startX = e.clientX; startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10); e.stopPropagation(); e.preventDefault(); }

window.addEventListener('mousemove', (e) => {
    if(!isEditing) return;
    if(isDragging && selectedEl) {
        e.preventDefault();
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        let newLeft = startLeft + dx; let newTop = startTop + dy;
        if(newLeft < 0) newLeft = 0; if(newTop < 0) newTop = 0;
        selectedEl.style.left = `${newLeft}px`; selectedEl.style.top = `${newTop}px`;
        if (newTop + selectedEl.offsetHeight > areaConteudo.offsetHeight - 100) recalcularAltura();
    }
    if(isResizing && selectedEl) {
        e.preventDefault();
        const dx = e.clientX - startX;
        let newWidth = startWidth + dx;
        if(newWidth < 50) newWidth = 50;
        selectedEl.style.width = `${newWidth}px`;
        recalcularAltura();
    }
});

window.addEventListener('mouseup', () => {
    if(isDragging || isResizing) {
        isDragging = false; isResizing = false;
        if(selectedEl) selectedEl.classList.remove('is-dragging');
        atualizarToolbar(selectedEl);
        recalcularAltura();
    }
});

function atualizarToolbar(el) {
    if(!el) return;
    toolbar.classList.remove('hidden');
    toolbar.style.top = (el.offsetTop - 40) + "px";
    toolbar.style.left = el.offsetLeft + "px";
}

window.redimensionarMidia = (size) => { if(selectedEl) { selectedEl.style.width = size; atualizarToolbar(selectedEl); recalcularAltura(); } };
window.deletarMidia = () => { if(selectedEl && confirm("Apagar?")) { selectedEl.remove(); deselecionarTudo(); recalcularAltura(); } };

// --- 8. SALVAR ---
btnEditar.addEventListener('click', async () => {
    if(!isEditing) {
        isEditing = true; 
        btnEditar.innerHTML = '<i class="fas fa-save"></i> Salvar Tudo'; btnEditar.style.backgroundColor = "#2E7D32";
        toggleVideoOverlayAndHandles(true);

    } else {
        deselecionarTudo(); isEditing = false; 

        const clone = areaConteudo.cloneNode(true);
        clone.querySelectorAll('.resize-handle, .video-overlay, .midia-selected').forEach(el => el.remove());

        const htmlLimpo = clone.innerHTML;

        try {
            await fetch(`${API_BASE}/topicos/${topicos[aulaAtualIndex].id}`, {
                method: 'PATCH', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ conteudo: htmlLimpo })
            });
            
            toggleVideoOverlayAndHandles(false);
            
            topicos[aulaAtualIndex].conteudo = htmlLimpo;
            btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar Tudo'; btnEditar.style.backgroundColor = "";
            alert("Salvo com sucesso!");
        } catch(e) { alert("Erro ao salvar"); }
    }
});

// Navegação
if (btnAnterior) btnAnterior.addEventListener('click', () => carregarConteudo(aulaAtualIndex - 1));
if (btnProximo) btnProximo.addEventListener('click', () => carregarConteudo(aulaAtualIndex + 1));


// --- 9. LÓGICA DO MODAL E CRUD DO QUIZ ---

async function loadQuizQuestions() {
    if (!quizQuestionList) return;

    quizQuestionList.innerHTML = '<li class="list-group-item text-center">Carregando questões...</li>';
    try {
        const res = await fetch(`${QUIZ_URL}?modulo_id=${moduloId}`);
        quizQuestions = await res.json();
        renderQuizQuestionsList();
    } catch (e) {
        console.error("Erro ao carregar quiz:", e);
        quizQuestionList.innerHTML = '<li class="list-group-item list-group-item-danger text-center">Erro ao carregar questões. Verifique o json-server.</li>';
    }
}

function renderQuizQuestionsList() {
    if (!quizQuestionList) return;

    if (quizQuestions.length === 0) {
        quizQuestionList.innerHTML = '<li class="list-group-item text-center text-muted">Nenhuma questão encontrada para este módulo.</li>';
        return;
    }

    quizQuestionList.innerHTML = '';
    quizQuestions.forEach(q => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <span>${q.question.substring(0, 70)}...</span>
            <div class="btn-group">
                <button class="btn btn-sm btn-info text-white" onclick="openEditForm('${q.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${q.id}')">Excluir</button>
            </div>
        `;
        quizQuestionList.appendChild(li);
    });
}

// O listener para 'Adicionar Nova Questão' foi movido para setupFormListeners.

function openQuizCrudModal() {
    if (!quizCrudModal) return;
    loadQuizQuestions(); 
    quizCrudModal.show();
    
    if(questionCrudForm) questionCrudForm.classList.add('hidden');
    const quizListContainer = document.getElementById('quiz-list-container');
    if(quizListContainer) quizListContainer.classList.remove('hidden');
}

function resetForm() {
    if(questionCrudForm) questionCrudForm.reset();
    if(crudQuestionId) crudQuestionId.value = '';
    if(formTitle) formTitle.textContent = 'Adicionar Nova Questão';
}

window.openEditForm = function(id) {
    const question = quizQuestions.find(q => q.id == id);
    if (!question) return alert("Questão não encontrada!");

    resetForm();
    formTitle.textContent = 'Editar Questão';
    crudQuestionId.value = id;
    crudQuestionText.value = question.question;
    crudImageUrl.value = question.image_url || '';
    
    // Preenchimento de Opções: Garantir que a correta vá para a Opção A
    const correctOption = question.correct_answer;
    
    const options = [...question.options];
    let correctIndex = options.findIndex(opt => opt === correctOption);
    
    if (correctIndex === -1) correctIndex = 0;
    
    crudOptionA.value = options[correctIndex];
    options.splice(correctIndex, 1);
    crudOptionB.value = options[0] || '';
    crudOptionC.value = options[1] || '';
    crudOptionD.value = options[2] || '';
    
    // Mostra o formulário
    if(questionCrudForm) questionCrudForm.classList.remove('hidden');
    const quizListContainer = document.getElementById('quiz-list-container');
    if(quizListContainer) quizListContainer.classList.add('hidden');
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const id = crudQuestionId.value;
    const isNew = !id;
    
    const options = [crudOptionA.value, crudOptionB.value, crudOptionC.value, crudOptionD.value].filter(Boolean);
    
    if (options.length < 2) return alert("O Quiz precisa de no mínimo 2 opções!");

    const questionData = {
        modulo_id: moduloId, 
        question: crudQuestionText.value,
        options: options,
        correct_answer: crudOptionA.value, // A primeira opção é sempre a correta
        image_url: crudImageUrl.value || ""
    };

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? QUIZ_URL : `${QUIZ_URL}/${id}`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        if (!res.ok) throw new Error(`Erro ao salvar: ${res.statusText}`);

        alert(`Questão ${isNew ? 'criada' : 'atualizada'} com sucesso!`);
        
        // Recarrega e volta para a lista
        if(questionCrudForm) questionCrudForm.classList.add('hidden');
        const quizListContainer = document.getElementById('quiz-list-container');
        if(quizListContainer) quizListContainer.classList.remove('hidden');
        loadQuizQuestions(); 

    } catch (error) {
        console.error("Erro no CRUD:", error);
        alert(`Falha ao salvar a questão: ${error.message}`);
    }
}

window.deleteQuestion = async function(id) {
    if (!confirm('Tem certeza que deseja EXCLUIR esta questão?')) return;

    try {
        const res = await fetch(`${QUIZ_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Erro ao deletar: ${res.statusText}`);

        loadQuizQuestions(); 
        alert('Questão excluída com sucesso!');
    } catch (error) {
        console.error("Erro no DELETE:", error);
        alert(`Falha ao excluir a questão: ${error.message}`);
    }
}

async function handleModuleQuizDeletion() {
    if (!confirm(`ATENÇÃO: Você realmente deseja excluir TODAS as ${quizQuestions.length} questões do Quiz para ESTE MÓDULO?`)) return;

    try {
        for (const q of quizQuestions) {
             await fetch(`${QUIZ_URL}/${q.id}`, { method: 'DELETE' });
        }
        
        alert('Quiz do Módulo excluído com sucesso!');
        loadQuizQuestions(); 

    } catch (error) {
        console.error("Erro ao deletar Quiz do Módulo:", error);
        alert('Falha ao excluir o Quiz do Módulo. Verifique o console.');
    }
}

if (btnDeleteQuiz) btnDeleteQuiz.addEventListener('click', handleModuleQuizDeletion);