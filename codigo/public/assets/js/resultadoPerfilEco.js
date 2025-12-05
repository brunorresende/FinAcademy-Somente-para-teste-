document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------- 
    // Seletores de Elementos DOM
    // -------------------------------
    const pieChart = document.getElementById('pieChart');
    const legendContainer = document.getElementById('legend-items-container');
    const updateButton = document.getElementById('updateButton');
    const idInput = document.getElementById('profileIdInput');
    const messageBox = document.getElementById('message-box');

    // -------------------------------------------------------
    // URL da API do jsonServer (ajuste a porta se necessário)
    // -------------------------------------------------------
    const API_URL = 'http://localhost:3000/perfilEconomico';

    // -------------------------------
    // Cores para as fatias do gráfico
    // -------------------------------
    const COLORS = {
        custoFixo: '#0d6efd',    // Azul (Bootstrap Primary)
        despesa: '#ffc107',      // Amarelo (Bootstrap Warning)
        dividaMensal: '#dc3545', // Vermelho (Bootstrap Danger)
        saldo: '#198754'         // Verde (Bootstrap Success)
    };

    /**
     * Lógica do Botão Atualizar
     */
    updateButton.addEventListener('click', () => {
        const id = idInput.value.trim();
        if (id) {
            fetchAndDisplayProfile(id);
        } else {
            showMessage('Por favor, insira um ID.', 'warning');
        }
    });

    /**
     * Busca dados do perfil na API
     * @param {string} id - O ID do perfil a ser buscado
     */
    async function fetchAndDisplayProfile(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            
            if (!response.ok) {
                throw new Error(`Perfil com ID "${id}" não encontrado.`);
            }
            
            const profile = await response.json();
            updateUI(profile);
            showMessage(`Perfil "${id}" carregado com sucesso.`, 'success');

        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            showMessage(error.message, 'danger');
            resetUI(); // Limpa a UI em caso de erro
        }
    }

    /**
     * Atualiza a UI (Gráfico e Legenda) com os dados do perfil
     * @param {object} profile - O objeto do perfil econômico
     */
    function updateUI(profile) {
        // Converte os dados para números
        const renda = Number(profile.renda) || 0;
        const custoFixo = Number(profile.custoFixo) || 0;
        const despesa = Number(profile.despesa) || 0;
        const dividaMensal = Number(profile.dividaMensal) || 0;

        // Calcula o saldo
        const saldo = renda - (custoFixo + despesa + dividaMensal);

        // Garante que o saldo não seja negativo para o gráfico
        const saldoPositivo = Math.max(0, saldo);
        
        // Total para cálculo de porcentagem (baseado na renda)
        const totalRenda = renda;

        // Prepara os dados para o gráfico e legenda
        const data = [
            { label: 'Despesas Fixas', value: custoFixo, color: COLORS.custoFixo },
            { label: 'Despesas Variáveis', value: despesa, color: COLORS.despesa },
            { label: 'Dívidas (Mensal)', value: dividaMensal, color: COLORS.dividaMensal },
            { label: 'Saldo Estimado', value: saldoPositivo, color: COLORS.saldo }
        ];
        
        // Atualiza o Gráfico de Pizza
        updatePieChart(data, totalRenda);
        
        // Atualiza a Legenda
        updateLegend(data, renda, saldo);
    }

    /**
     * Função para atualizar o gráfico conic-gradient
     */
    function updatePieChart(data, total) {
        if (total <= 0) {
            pieChart.style.backgroundImage = 'conic-gradient(#e9ecef 0% 100%)';
            pieChart.textContent = 'Sem Renda';
            return;
        }
        
        let gradientString = 'conic-gradient(';
        let currentPercentage = 0;

        data.forEach(item => {
            const percentage = (item.value / total) * 100;
            if (percentage > 0) {
                gradientString += `${item.color} ${currentPercentage}% ${currentPercentage + percentage}%`;
                currentPercentage += percentage;
                
                // Adiciona uma pequena borda se não for o último item
                if (currentPercentage < 100) {
                     gradientString += ', ';
                }
            }
        });

        // Preenche o restante se for menor que 100% (devido a arredondamentos)
        if (currentPercentage < 100 && currentPercentage > 0) {
            gradientString += `, #e9ecef ${currentPercentage}% 100%`; // Cor de fundo para o que sobra
        } else if (currentPercentage === 0) {
             gradientString += '#e9ecef 0% 100%';
        }

        gradientString += ')';
        
        pieChart.style.backgroundImage = gradientString;
        pieChart.textContent = ''; // Limpa o texto "Gráfico"
    }

    /**
     * Função para atualizar a legenda
     */
    function updateLegend(data, renda, saldo) {
        legendContainer.innerHTML = ''; // Limpa a legenda antiga
        
        // Adiciona a Renda Total primeiro
        const totalRendaItem = createLegendItem('Renda Total', renda, '#6c757d');
        legendContainer.appendChild(totalRendaItem);

        // Adiciona os outros itens
        data.forEach(item => {
            // O saldo da legenda deve mostrar o valor real (podendo ser negativo)
            const displayValue = (item.label === 'Saldo Estimado') ? saldo : item.value;
            const legendItem = createLegendItem(item.label, displayValue, item.color);
            legendContainer.appendChild(legendItem);
        });
    }

    /**
     * Helper para criar um item da legenda
     */
    function createLegendItem(label, value, color) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'legend-item';

        // Formata o valor para Reais (BRL)
        const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        itemDiv.innerHTML = `
            <div class="legend-color-box" style="background-color: ${color};"></div>
            <span class="legend-label">${label}:</span>
            <span class="legend-value ${value < 0 ? 'text-danger' : ''}">${formattedValue}</span>
        `;
        return itemDiv;
    }

    /**
     * Reseta a UI para o estado inicial ou de erro
     */
    function resetUI() {
        pieChart.style.backgroundImage = 'conic-gradient(#e9ecef 0% 100%)';
        pieChart.textContent = 'Gráfico';
        legendContainer.innerHTML = '<p class="text-muted">Nenhum dado para exibir.</p>';
    }

    /**
     * Exibe uma mensagem de feedback para o usuário
     * @param {string} message - A mensagem a ser exibida
     * @param {'success' | 'danger' | 'warning'} type - O tipo de alerta (Bootstrap)
     */
    function showMessage(message, type) {
        messageBox.textContent = message;
        // Reseta classes
        messageBox.className = 'alert'; 
        // Adiciona a classe correta
        messageBox.classList.add(`alert-${type}`);
        messageBox.style.display = 'block';

        // Esconde a mensagem após 3 segundos
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    }

    // Carrega o perfil inicial (ID "1") ao iniciar a página
    fetchAndDisplayProfile('1');
});