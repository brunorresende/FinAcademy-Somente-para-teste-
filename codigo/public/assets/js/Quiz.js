// Quiz.js (COMPLETO E AJUSTADO PARA ADMIN/ALUNO)

const TEMPO_POR_PERGUNTA = 15;
const TEMPO_ESPERA_RESPOSTA = 1500;
const ENDPOINT_URL = 'http://localhost:3000/questions'; 

// CONSTANTES DOM EXISTENTES
const quizView = document.getElementById('quiz-view');
const resultadoView = document.getElementById('resultado-view');
const numeroQuestaoTexto = document.getElementById('numero-questao-texto');
const barraProgresso = document.getElementById('barra-progresso');
const contadorTempo = document.getElementById('contador-tempo');
const perguntaTexto = document.getElementById('pergunta-texto');
const imagemContainer = document.getElementById('imagem-container');
const imagemPergunta = document.getElementById('imagem-pergunta');
const opcoesContainer = document.getElementById('opcoes-container');
const resultadoTexto = document.getElementById('resultado-texto');
const textoTopicos = document.getElementById('texto-topicos');
const reiniciarBtn = document.getElementById('reiniciar-btn');
const overlayErro = document.getElementById('overlay-erro');
const overlayStreak = document.getElementById('overlay-streak');
const audioVitoria = document.getElementById('audio-vitoria');
const audioDerrota = document.getElementById('audio-derrota');
const audioAcertoMaximo = document.getElementById('audio-acerto-maximo');
const audioDerrotaMaxima = document.getElementById('audio-derrota-maxima');

// NOVAS CONSTANTES DOM DO ADMIN
const adminToolsView = document.getElementById('admin-tools-view');
const crudLinkBtn = document.getElementById('crud-link-btn');
const adminQuizBtn = document.getElementById('admin-quiz-btn');

let quizData = []; 
let perguntaAtualIndex;
let acertos;
let erros;
let streakAtual;
let totalPerguntas;
let intervaloTimer;

// Variável para o perfil do usuário (padrão é aluno)
let usuarioPerfil = 'aluno'; 

// --- FUNÇÕES DE ÁUDIO E VISUAIS ---

function playAudio(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
    }
}

function desabilitarBotoes() {
    document.querySelectorAll('.opcao-btn').forEach(btn => {
        btn.disabled = true;
    });
}

function resetarEstadoBotoes() {
    document.querySelectorAll('.opcao-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correta', 'errada');
    });
}

// Adaptação dos visuais para feedback rápido
function atualizarVisuais(tipo) {
    const overlay = tipo === 'erro' ? overlayErro : overlayStreak;
    
    // Evita quebra se o elemento for null
    if (!overlay) return; 

    overlay.classList.remove('hidden');
    overlay.style.opacity = '0.5'; 
    
    // Remove o overlay após um curto período
    setTimeout(() => {
        overlay.style.opacity = '0'; 
        setTimeout(() => overlay.classList.add('hidden'), 500);
    }, 500); 
}

// --- LÓGICA DE PERFIL E VIEW ---

function verificarPerfil() {
    try {
        const usuarioCorrente = JSON.parse(sessionStorage.getItem('usuarioCorrente'));
        if (usuarioCorrente && usuarioCorrente.perfil === 'admin') {
            usuarioPerfil = 'admin';
        } else {
            usuarioPerfil = 'aluno';
        }
    } catch (e) {
        // Se houver erro ou não estiver logado, assume aluno.
        usuarioPerfil = 'aluno';
    }
}

/**
 * Inicia o Quiz. Se for admin e não for forçado, mostra o painel admin.
 * @param {boolean} forcarInicioQuiz - Se true, ignora o painel admin e inicia o jogo.
 */
function startQuiz(forcarInicioQuiz = false) {
    
    // 1. Limpa timers e esconde todas as telas
    if (intervaloTimer) clearInterval(intervaloTimer);
    quizView.classList.add('hidden');
    resultadoView.classList.add('hidden');
    
    // Verifica se a tela admin existe e a esconde
    if (adminToolsView) adminToolsView.classList.add('hidden'); 
    
    // 2. Decide a tela a mostrar
    if (usuarioPerfil === 'admin' && !forcarInicioQuiz && adminToolsView) {
        // Se for admin e não clicou em "Jogar o Quiz", mostra o painel admin
        adminToolsView.classList.remove('hidden');
        return; // Pára aqui, não inicia o jogo
    }

    // 3. Lógica padrão do Quiz
    perguntaAtualIndex = 0;
    acertos = 0;
    erros = 0;
    streakAtual = 0;
    totalPerguntas = quizData.length;

    if (totalPerguntas === 0) {
        // Se não houver perguntas
        perguntaTexto.textContent = "Nenhuma pergunta para jogar.";
        quizView.classList.remove('hidden');
        opcoesContainer.innerHTML = '<p style="text-align:center;">Volte mais tarde ou peça a um administrador para cadastrar.</p>';
        return;
    }
    
    quizView.classList.remove('hidden');
    mostrarPergunta();
}


// --- FUNÇÕES DE JOGO DO QUIZ ---

function mostrarPergunta() {
    if (intervaloTimer) clearInterval(intervaloTimer);
    resetarEstadoBotoes();

    const pergunta = quizData[perguntaAtualIndex];
    numeroQuestaoTexto.textContent = `Questão ${perguntaAtualIndex + 1} de ${totalPerguntas}`;
    perguntaTexto.textContent = pergunta.question;
    
    // Imagem
    if (pergunta.image_url && pergunta.image_url !== "") {
        imagemPergunta.src = pergunta.image_url;
        imagemContainer.classList.remove('hidden');
    } else {
        imagemContainer.classList.add('hidden');
        imagemPergunta.src = '';
    }

    // Opções (Botoes)
    opcoesContainer.innerHTML = '';
    
    // Cria um array de índices para embaralhar as opções
    const indicesEmbaralhados = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    
    indicesEmbaralhados.forEach(index => {
        const textoOpcao = pergunta.options[index];
        const botao = document.createElement('button');
        botao.classList.add('opcao-btn');
        botao.textContent = textoOpcao;
        botao.dataset.index = index; // Guarda o índice da opção
        botao.addEventListener('click', selecionarResposta);
        opcoesContainer.appendChild(botao);
    });

    iniciarContador();
}

function iniciarContador() {
    let tempoRestante = TEMPO_POR_PERGUNTA;
    contadorTempo.textContent = tempoRestante;

    intervaloTimer = setInterval(() => {
        tempoRestante--;
        contadorTempo.textContent = tempoRestante;

        if (tempoRestante <= 0) {
            clearInterval(intervaloTimer);
            selecionarResposta(null); // Resposta automática como errada
        }
    }, 1000);
}

function selecionarResposta(event) {
    clearInterval(intervaloTimer);
    desabilitarBotoes();

    const pergunta = quizData[perguntaAtualIndex];
    const corretaIndex = pergunta.correta; 
    let acertou = false;

    if (event && event.target) {
        const selectedIndex = parseInt(event.target.dataset.index);
        
        if (selectedIndex === corretaIndex) {
            acertou = true;
            acertos++;
            streakAtual++;
            event.target.classList.add('correta');
            playAudio(audioVitoria);
            // if (streakAtual > 1) atualizarVisuais('streak');
        } else {
            erros++;
            streakAtual = 0;
            event.target.classList.add('errada');
            playAudio(audioDerrota);
            // atualizarVisuais('erro');
        }
        
        // Marca a correta
        document.querySelectorAll('.opcao-btn').forEach(btn => {
            if (parseInt(btn.dataset.index) === corretaIndex) {
                btn.classList.add('correta');
            }
        });

    } else {
        // Sem resposta (tempo esgotado)
        erros++;
        streakAtual = 0;
        playAudio(audioDerrota);
        // atualizarVisuais('erro');

        // Marca a correta
        document.querySelectorAll('.opcao-btn').forEach(btn => {
            if (parseInt(btn.dataset.index) === corretaIndex) {
                btn.classList.add('correta');
            }
        });
    }

    setTimeout(proximaPergunta, TEMPO_ESPERA_RESPOSTA);
}

function proximaPergunta() {
    perguntaAtualIndex++;
    if (perguntaAtualIndex < totalPerguntas) {
        mostrarPergunta();
    } else {
        finalizarQuiz();
    }
}

function finalizarQuiz() {
    if (intervaloTimer) clearInterval(intervaloTimer);
    
    quizView.classList.add('hidden');
    resultadoView.classList.remove('hidden');

    resultadoTexto.textContent = `Você acertou ${acertos} de ${totalPerguntas} questões!`;
    textoTopicos.textContent = "Topicos e de outro integrante"; 

    if (erros === totalPerguntas) {
        playAudio(audioDerrotaMaxima);
    } else if (acertos === totalPerguntas) {
        playAudio(audioAcertoMaximo);
    }
}

// --- FUNÇÃO DE CARREGAMENTO (Chamada inicial) ---

async function carregarPerguntas() {
    verificarPerfil(); // 1. Verifica o perfil do usuário

    try {
        const response = await fetch(ENDPOINT_URL);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const data = await response.json();
        quizData = data; 
        
        // Processa os dados para encontrar o índice correto
        quizData.forEach(pergunta => {
            const textoCorreto = pergunta.correct_answer;
            const indexCorreta = pergunta.options.findIndex(opt => opt === textoCorreto);
            pergunta.correta = indexCorreta !== -1 ? indexCorreta : 0; // fallback para a primeira opção
        });

        startQuiz(); // Inicia o processo (que levará para a tela correta)
        
    } catch (error) {
        console.error("Falha ao carregar perguntas:", error);
        
        // Mensagem de erro padrão para o usuário
        perguntaTexto.textContent = "Erro ao carregar as perguntas.";
        contadorTempo.textContent = "X";
        opcoesContainer.innerHTML = "<p>Verifique se o 'json-server' está rodando ou se o db.json está correto.</p>";

        // Se for admin, mostra o painel admin mesmo com erro de carga
        if (usuarioPerfil === 'admin' && adminToolsView) {
             quizView.classList.add('hidden');
             adminToolsView.classList.remove('hidden');
        } else {
            quizView.classList.remove('hidden');
        }
    }
}


// --- EVENT LISTENERS ---

// O botão "Reiniciar Quiz" chama o quiz para ser jogado
if (reiniciarBtn) {
    reiniciarBtn.addEventListener('click', () => startQuiz(true)); 
}

// NOVO: O botão "Jogar o Quiz" no painel admin inicia o quiz
if (adminQuizBtn) {
    adminQuizBtn.addEventListener('click', () => startQuiz(true)); 
}

// NOVO: O botão "Gerenciar Questões" simula a navegação para a aba separada
if (crudLinkBtn) {
    crudLinkBtn.addEventListener('click', () => {
        // Redireciona para o arquivo CRUD na aba separada (exemplo: admin.html)
        window.location.href = 'admin.html'; 
    });
}

// Inicia o carregamento das perguntas e a verificação do perfil
carregarPerguntas();