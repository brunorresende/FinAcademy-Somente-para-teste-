const API_BASE_URL = 'http://localhost:3000';
const USERS_URL = `${API_BASE_URL}/usuarios`;

// --- CORREÇÃO AQUI ---
// Use o caminho ABSOLUTO (começando com /). 
// Baseado na sua imagem de erro, o caminho correto parece ser este:
const HOME_URL = '/modulo-conteudo/conteudo.html'; 

// SE não funcionar, tente apenas: const HOME_URL = '/conteudo.html'; 
// (Depende de onde você salvou o arquivo conteudo.html no seu computador)

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.querySelector('.btn-login');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            btn.disabled = true;

            const userLogin = document.getElementById('username').value;
            const userPass = document.getElementById('password').value;

            try {
                const response = await fetch(`${USERS_URL}?login=${userLogin}&senha=${userPass}`);
                const users = await response.json();

                if (users.length > 0) {
                    const usuario = users[0];
                    sessionStorage.setItem('usuarioCorrente', JSON.stringify({
                        id: usuario.id,
                        nome: usuario.nome,
                        login: usuario.login,
                        email: usuario.email,
                        perfil: usuario.perfil || 'aluno'
                    }));

                    setTimeout(() => {
                        window.location.href = HOME_URL; // Vai usar o caminho corrigido
                    }, 800);
                } else {
                    alert('Usuário ou senha incorretos!');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao conectar com o servidor.');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    const btnRegistrar = document.getElementById('btn_salvar_registro');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', async () => {
            const nome = document.getElementById('reg_nome').value;
            const login = document.getElementById('reg_login').value;
            const email = document.getElementById('reg_email').value;
            const senha = document.getElementById('reg_senha').value;
            const senha2 = document.getElementById('reg_senha2').value;

            if (!nome || !login || !senha) { alert('Preencha os campos obrigatórios'); return; }
            if (senha !== senha2) { alert('As senhas não conferem!'); return; }

            try {
                const check = await fetch(`${USERS_URL}?login=${login}`);
                const exists = await check.json();

                if (exists.length > 0) {
                    alert('Este login já está em uso.');
                    return;
                }

                const novoUsuario = {
                    id: Date.now().toString(),
                    login: login,
                    senha: senha,
                    nome: nome,
                    email: email,
                    perfil: 'aluno'
                };

                await fetch(USERS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoUsuario)
                });

                alert('Conta criada com sucesso! Faça login.');
                
                const modalEl = document.getElementById('registroModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                modalInstance.hide();

            } catch (error) {
                alert('Erro ao registrar.');
            }
        });
    }
});

function togglePassword() {
    const passInput = document.getElementById('password');
    const icon = document.querySelector('.toggle-pass');
    
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}