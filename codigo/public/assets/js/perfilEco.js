// ===============================
// PERFIL ECONÔMICO - JSON SERVER
// ===============================

const API_URL = "http://localhost:3000/perfilEconomico";
let db_perfilEco = [];

// -------------------------------
// 1. Carregar perfis econômicos
// -------------------------------
function carregarPerfis() {
  fetch(API_URL)
    .then(response => response.json())
    .then(data => {
      db_perfilEco = data;
      console.log("Perfis carregados:", db_perfilEco);
    })
    .catch(err => console.error("Erro ao carregar dados:", err));
}

// -------------------------------
// 2. Adicionar novo perfil
// -------------------------------
function adicionarPerfil() {
  const perfil = coletarDadosFormulario();

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perfil)
  })
    .then(res => res.json())
    .then(data => {
      db_perfilEco.push(data);
      alert(`Perfil adicionado com sucesso! ID: ${data.id}`);
      limparFormulario();
    })
    .catch(err => {
      console.error("Erro ao adicionar perfil:", err);
      alert("Erro ao adicionar perfil!");
    });
}

// -------------------------------
// 3. Atualizar perfil existente
// -------------------------------
function atualizarPerfil() {
  const id = prompt("Digite o ID do perfil que deseja atualizar:");
  if (!id) {
    alert("⚠️ ID não informado!");
    return;
  }

  const perfil = coletarDadosFormulario();

  fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perfil)
  })
    .then(res => res.json())
    .then(data => {
      alert("Perfil atualizado com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao atualizar perfil:", err);
      alert("Erro ao atualizar perfil!");
    });
}

// -------------------------------
// 4. Excluir perfil
// -------------------------------
function excluirPerfil() {
  const id = prompt("Digite o ID do perfil que deseja excluir:");
  if (!id) {
    alert("ID não informado!");
    return;
  }

  fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
    .then(() => {
      alert("Perfil excluído com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao excluir perfil:", err);
      alert("Erro ao excluir perfil!");
    });
}

// -------------------------------
// 5. Coletar dados do formulário
// -------------------------------
function coletarDadosFormulario() {
  return {
    data: document.getElementById("data").value,
    renda: parseFloat(document.getElementById("renda").value) || 0,
    fonteRenda: document.querySelector('input[name="fonteRenda"]:checked')?.value || "",
    rendaExtra: document.querySelector('input[name="rendaExtra"]:checked')?.value || "nao",
    custoFixo: parseFloat(document.getElementById("custoFixo").value) || 0,
    despesa: parseFloat(document.getElementById("despesa").value) || 0,
    dividaMensal: parseFloat(document.getElementById("dividaMensal").value) || 0,
    dividaParcelas: parseInt(document.getElementById("dividaParcelas").value) || 0,
    rendaMeta: parseFloat(document.getElementById("rendaMeta").value) || 0
  };
}

// -------------------------------
// 6. Limpar formulário
// -------------------------------
function limparFormulario() {
  document.getElementById("perfilForm").reset();
}

// -------------------------------
// 7. Inicialização automática
// -------------------------------
document.addEventListener("DOMContentLoaded", carregarPerfis);
