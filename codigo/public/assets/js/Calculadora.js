// Elementos do DOM
const principalInput = document.getElementById('principal');
const rateInput = document.getElementById('rate');
const yearsInput = document.getElementById('years');
const freqSelect = document.getElementById('freq');
const resetBtn = document.getElementById('reset');
const exportBtn = document.getElementById('exportCSV');
const saveBtn = document.getElementById('saveSimulation');
const graphBtn = document.getElementById('showGraph');

const finalAmountSpan = document.getElementById('finalAmount');
const detailPrincipal = document.getElementById('detailPrincipal');
const detailRate = document.getElementById('detailRate');
const detailYears = document.getElementById('detailYears');
const detailFreq = document.getElementById('detailFreq');
const detailInterest = document.getElementById('detailInterest');
const tableBody = document.getElementById('tableBody');

// Função para formatar valores em reais
function formatMoney(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função principal de cálculo
function calculate() {
  let P = parseFloat(principalInput.value) || 0;
  let annualRate = parseFloat(rateInput.value) || 0;
  let years = parseInt(yearsInput.value) || 0;
  let freq = parseInt(freqSelect.value);

  if (P <= 0 || annualRate < 0 || years < 1) return;

  let rate = annualRate / 100 / freq;
  let periods = years * freq;
  let finalAmount = P * Math.pow(1 + rate, periods);
  let interest = finalAmount - P;

  // Atualiza resumo
  finalAmountSpan.textContent = `R$ ${formatMoney(finalAmount)}`;
  detailPrincipal.textContent = formatMoney(P);
  detailRate.textContent = `${annualRate}%`;
  detailYears.textContent = `${years} anos`;
  detailFreq.textContent = freq;
  detailInterest.textContent = formatMoney(interest);

  // Limpa e preenche tabela
  tableBody.innerHTML = '';
  for (let year = 1; year <= years; year++) {
    let amountAtYear = P * Math.pow(1 + rate, year * freq);
    let row = `<tr><td>${year}</td><td>${formatMoney(amountAtYear)}</td></tr>`;
    tableBody.innerHTML += row;
  }

  // Armazena dados para exportar/gráfico
  window.lastSimulation = { P, annualRate, years, freq, finalAmount, interest, tableData: [] };
  for (let year = 1; year <= years; year++) {
    let amount = P * Math.pow(1 + rate, year * freq);
    window.lastSimulation.tableData.push({ year, amount });
  }
}

// Calcula ao carregar e sempre que mudar
window.addEventListener('load', calculate);
principalInput.addEventListener('input', calculate);
rateInput.addEventListener('input', calculate);
yearsInput.addEventListener('input', calculate);
freqSelect.addEventListener('change', calculate);

// Reset
resetBtn.addEventListener('click', () => {
  principalInput.value = 1000;
  rateInput.value = 5;
  yearsInput.value = 5;
  freqSelect.value = 12;
  calculate();
});

// Exportar CSV
exportBtn.addEventListener('click', () => {
  if (!window.lastSimulation) return;
  let csv = "Ano,Saldo (R$)\n";
  window.lastSimulation.tableData.forEach(d => {
    csv += `${d.year},${formatMoney(d.amount)}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "juros_compostos.csv";
  a.click();
});

// Salvar Simulação (no localStorage)
saveBtn.addEventListener('click', () => {
  if (!window.lastSimulation) return;
  localStorage.setItem('savedSimulation', JSON.stringify({
    principal: principalInput.value,
    rate: rateInput.value,
    years: yearsInput.value,
    freq: freqSelect.value,
    date: new Date().toLocaleString('pt-BR')
  }));
  alert('Simulação salva! (você pode recuperá-la ao recarregar a página)');
});

// Carregar simulação salva ao abrir
if (localStorage.getItem('savedSimulation')) {
  const saved = JSON.parse(localStorage.getItem('savedSimulation'));
  principalInput.value = saved.principal;
  rateInput.value = saved.rate;
  yearsInput.value = saved.years;
  freqSelect.value = saved.freq;
  calculate();
}

// Gráfico (usando Chart.js via CDN)
graphBtn.addEventListener('click', () => {
  if (!window.lastSimulation) return;

  // Cria modal simples
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';

  const content = document.createElement('div');
  content.style.background = 'white';
  content.style.padding = '20px';
  content.style.borderRadius = '10px';
  content.style.maxWidth = '90%';
  content.innerHTML = `
    <h2 style="text-align:center;">Evolução do Saldo</h2>
    <canvas id="growthChart" height="300"></canvas>
    <button onclick="this.closest('.modal').remove()">Fechar</button>
  `;
  modal.className = 'modal';
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Carrega Chart.js se ainda não estiver carregado
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = drawChart;
    document.head.appendChild(script);
  } else {
    drawChart();
  }

  function drawChart() {
    const ctx = content.querySelector('#growthChart').getContext('2d');
    const labels = window.lastSimulation.tableData.map(d => `Ano ${d.year}`);
    const data = window.lastSimulation.tableData.map(d => d.amount);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Saldo (R$)',
          data: data,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
});

// Calcula na primeira carga
calculate();