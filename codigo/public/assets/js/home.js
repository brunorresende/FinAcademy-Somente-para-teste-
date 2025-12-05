// home.js

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderControls();
});

function updateHeaderControls() {
    const userControlsDiv = document.getElementById('user-controls');
    const ctaButton = document.getElementById('btn-cta-header'); // Busca o botão CTA pelo novo ID
    const user = JSON.parse(sessionStorage.getItem('usuarioCorrente'));

    if (!userControlsDiv) return;

    if (user && user.login) {
        // Usuário logado: Mostra nome e Logout
        const profileHtml = `
            <span class="user-info-text">Olá, ${user.login}!</span>
            <button onclick="fazerLogout()" class="btn-login-header btn-logout-action">
                Sair <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        userControlsDiv.innerHTML = profileHtml;
        
        // Esconde o botão CTA se estiver logado
        if (ctaButton) {
            ctaButton.style.display = 'none';
        }
        
    } else {
        // Usuário deslogado: Mostra botão de Entrar
        userControlsDiv.innerHTML = `
            <a href="/modulos/login/login.html" class="btn-login-header">
                Entrar <i class="fas fa-sign-in-alt"></i>
            </a>
        `;
        // Garante que o botão CTA esteja visível se estiver deslogado
        if (ctaButton) {
            ctaButton.style.display = ''; // Volta ao padrão (flex ou block, definido no CSS)
        }
    }
}

// Global function para logout (chamada pelo botão gerado no JS)
window.fazerLogout = function() {
    if(confirm("Tem certeza que deseja sair?")) {
        sessionStorage.removeItem('usuarioCorrente');
        // Redireciona para a página de login ou recarrega a home
        window.location.reload(); 
    }
}