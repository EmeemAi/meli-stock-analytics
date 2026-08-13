/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - FRONTEND APP ENGINE
 * ==============================================================================
 */

const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyK0LZ0mmU9vE9oV2Xo6C2Ca6a0yDD_WfJK2RO9CSfz1_I6y7joeyiSiSxR9dA6E7XT/exec';

const state = {
  items: [],
  filteredItems: [],
  config: {
    lead_time_days: 15,
    safety_stock_days: 7,
    target_coverage_days: 45
  },
  activeFilter: 'ALL',
  searchQuery: '',
  gasUrl: DEFAULT_ENDPOINT,
  charts: {
    status: null,
    topSuggested: null
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Limpiar cualquier URL vacía guardada previamente en el navegador
  const savedUrl = localStorage.getItem('MELI_GAS_URL');
  if (savedUrl && savedUrl.trim() !== '') {
    state.gasUrl = savedUrl.trim();
  } else {
    state.gasUrl = DEFAULT_ENDPOINT;
  }

  initEventListeners();
  loadData();
});

function initEventListeners() {
  const leadTimeInput = document.getElementById('leadTimeInput');
  const safetyStockInput = document.getElementById('safetyStockInput');
  const targetCoverageInput = document.getElementById('targetCoverageInput');

  leadTimeInput.addEventListener('input', (e) => {
    state.config.lead_time_days = parseFloat(e.target.value);
    document.getElementById('leadTimeVal').textContent = `${state.config.lead_time_days} días`;
    recalculateMetrics();
  });

  safetyStockInput.addEventListener('input', (e) => {
    state.config.safety_stock_days = parseFloat(e.target.value);
    document.getElementById('safetyStockVal').textContent = `${state.config.safety_stock_days} días`;
    recalculateMetrics();
  });

  targetCoverageInput.addEventListener('input', (e) => {
    state.config.target_coverage_days = parseFloat(e.target.value);
    document.getElementById('targetCoverageVal').textContent = `${state.config.target_coverage_days} días`;
    recalculateMetrics();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    applyFilters();
  });

  document.querySelectorAll('.filter-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  const modal = document.getElementById('configModal');
  document.getElementById('btnConfigModal').addEventListener('click', () => {
    document.getElementById('gasUrlInput').value = state.gasUrl;
    modal.classList.add('active');
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('btnSaveConfig').addEventListener('click', () => {
    const url = document.getElementById('gasUrlInput').value.trim() || DEFAULT_ENDPOINT;
    state.gasUrl = url;
    localStorage.setItem('MELI_GAS_URL', url);
    modal.classList.remove('active');
    loadData();
  });

  document.getElementById('btnUseMock').addEventListener('click', () => {
    state.gasUrl = 'mock-data.json';
    localStorage.setItem('MELI_GAS_URL', 'mock-data.json');
    modal.classList.remove('active');
    loadData();
  });

  document.getElementById('btnExportCsv').addEventListener('click', exportToCsv);
}

async function loadData() {
  const syncText = document.getElementById('lastSyncText');
  syncText.textContent = 'Cargando publicaciones reales de MeLi...';

  let fetchUrl = state.gasUrl;
  if (!fetchUrl || fetchUrl.trim() === '') {
    fetchUrl = DEFAULT_ENDPOINT;
    state.gasUrl = DEFAULT_ENDPOINT;
  }

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (data.error) {
      console.warn('Google Apps Script message:', data.error);
    }

    state.items = data.items || [];
    if (data.config) {
      state.config.lead_time_days = data.config.lead_time_days || 15;
      state.config.safety_stock_days = data.config.safety_stock_days || 7;
      state.config.target_coverage_days = data.config.target_coverage_days || 45;

      document.getElementById('leadTimeInput').value = state.config.lead_time_days;
      document.getElementById('leadTimeVal').textContent = `${state.config.lead_time_days} días`;

      document.getElementById('safetyStockInput').value = state.config.safety_stock_days;
      document.getElementById('safetyStockVal').textContent = `${state.config.safety_stock_days} días`;

      document.getElementById('targetCoverageInput').value = state.config.target_coverage_days;
      document.getElementById('targetCoverageVal').textContent = `${state.config.target_coverage_days} días`;
    }

    syncText.textContent = `🟢 Conectado: ${state.items.length} publicaciones cargadas`;
    recalculateMetrics();

  } catch (err) {
    console.warn('Error fetching live API, loading backup mock data', err);
    syncText.textContent = 'Modo Prueba (Mock Data)';
    const response = await fetch('mock-data.json');
    const data = await response.json();
    state.items = data.items || [];
    recalculateMetrics();
  }
}

function recalculateMetrics() {
  const { lead_time_days, safety_stock_days, target_coverage_days } = state.config;

  state.items.forEach(item => {
    const vpd = item.sales_30d / 30;
    item.vpd = Math.round(vpd * 100) / 100;
    
    item.coverage_days = vpd > 0 ? Math.round((item.stock / vpd) * 10) / 10 : (item.stock > 0 ? 999 : 0);
    item.reorder_point = Math.ceil(vpd * (lead_time_days + safety_stock_days));

    if (item.stock === 0) {
      item.status = 'AGOTADO';
      item.reorder_suggested = Math.ceil(vpd * target_coverage_days);
    } else if (item.stock <= item.reorder_point) {
      item.status = 'CRITICO';
      item.reorder_suggested = Math.max(0, Math.ceil((vpd * targetCoverageDays) - item.stock));
    } else if (item.coverage_days > 90) {
      item.status = 'SOBRESTOCK';
      item.reorder_suggested = 0;
    } else {
      item.status = 'ADECUADO';
      item.reorder_suggested = 0;
    }
  });

  applyFilters();
}

function applyFilters() {
  let filtered = state.items;

  if (state.searchQuery) {
    filtered = filtered.filter(item => 
      (item.title && item.title.toLowerCase().includes(state.searchQuery)) ||
      (item.sku && item.sku.toLowerCase().includes(state.searchQuery)) ||
      (item.id && item.id.toLowerCase().includes(state.searchQuery))
    );
  }

  if (state.activeFilter !== 'ALL') {
    filtered = filtered.filter(item => item.status === state.activeFilter);
  }

  state.filteredItems = filtered;
  renderUI();
}

function renderUI() {
  renderKpis();
  renderTable();
  renderCharts();
}

function renderKpis() {
  const totalItems = state.items.length;
  const outOfStock = state.items.filter(i => i.status === 'AGOTADO').length;
  const criticalStock = state.items.filter(i => i.status === 'CRITICO').length;
  const okStock = state.items.filter(i => i.status === 'ADECUADO').length;
  const overstock = state.items.filter(i => i.status === 'SOBRESTOCK').length;
  const totalSuggested = state.items.reduce((acc, i) => acc + (i.reorder_suggested || 0), 0);

  document.getElementById('kpiTotalItems').textContent = totalItems;
  document.getElementById('kpiOutOfStock').textContent = outOfStock;
  document.getElementById('kpiCriticalStock').textContent = criticalStock;
  document.getElementById('kpiTotalSuggestedQty').textContent = totalSuggested.toLocaleString();

  document.getElementById('countAll').textContent = totalItems;
  document.getElementById('countAgotado').textContent = outOfStock;
  document.getElementById('countCritico').textContent = criticalStock;
  document.getElementById('countAdecuado').textContent = okStock;
  document.getElementById('countSobrestock').textContent = overstock;
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (state.filteredItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center" style="padding: 40px; color: var(--text-muted);">
          🔍 No se encontraron publicaciones con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  state.filteredItems.forEach(item => {
    const tr = document.createElement('tr');

    const coverageText = item.coverage_days === 999 ? '∞ (Sin Ventas 30d)' : `${item.coverage_days} días`;
    const suggestedHtml = item.reorder_suggested > 0
      ? `<span class="qty-highlight">+${item.reorder_suggested} un.</span>`
      : `<span style="color: var(--text-dim);">0</span>`;

    tr.innerHTML = `
      <td>
        <div class="item-cell">
          <img src="${item.thumbnail || 'https://via.placeholder.com/44'}" alt="Thumb" class="item-thumb">
          <div class="item-info">
            <span class="item-title" title="${item.title}">${item.title}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="item-info">
          <span class="item-sku">${item.sku || 'N/A'}</span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">${item.id}</span>
        </div>
      </td>
      <td class="text-center" style="font-weight: 700;">${item.stock}</td>
      <td class="text-center">${item.sales_30d}</td>
      <td class="text-center">${item.vpd} / día</td>
      <td class="text-center">${coverageText}</td>
      <td class="text-center" style="font-weight: 600; color: var(--amber);">${item.reorder_point}</td>
      <td class="text-center">${suggestedHtml}</td>
      <td class="text-center">
        <span class="badge-status ${item.status}">${item.status}</span>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function renderCharts() {
  const outOfStock = state.items.filter(i => i.status === 'AGOTADO').length;
  const criticalStock = state.items.filter(i => i.status === 'CRITICO').length;
  const okStock = state.items.filter(i => i.status === 'ADECUADO').length;
  const overstock = state.items.filter(i => i.status === 'SOBRESTOCK').length;

  const ctxStatus = document.getElementById('chartStockStatus').getContext('2d');
  if (state.charts.status) {
    state.charts.status.data.datasets[0].data = [outOfStock, criticalStock, okStock, overstock];
    state.charts.status.update();
  } else {
    state.charts.status = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Agotado', 'Stock Crítico', 'Adecuado', 'Sobrestock'],
        datasets: [{
          data: [outOfStock, criticalStock, okStock, overstock],
          backgroundColor: ['#f43f5e', '#f59e0b', '#10b981', '#64748b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  const topItems = [...state.items]
    .sort((a, b) => (b.reorder_suggested || b.stock) - (a.reorder_suggested || a.stock))
    .slice(0, 8);

  const ctxTop = document.getElementById('chartTopSuggested').getContext('2d');
  const labels = topItems.map(i => i.sku || i.title.substring(0, 15) + '...');
  const dataQty = topItems.map(i => i.reorder_suggested || i.stock);

  if (state.charts.topSuggested) {
    state.charts.topSuggested.data.labels = labels;
    state.charts.topSuggested.data.datasets[0].data = dataQty;
    state.charts.topSuggested.update();
  } else {
    state.charts.topSuggested = new Chart(ctxTop, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Unidades en Stock / Sugerencia',
          data: dataQty,
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

function exportToCsv() {
  const itemsToExport = state.items;
  
  if (itemsToExport.length === 0) {
    alert('No hay publicaciones para exportar.');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID Publicacion,SKU,Titulo,Stock Actual,Ventas 30d,Promedio Diario,Punto Pedido,Sugerencia Comprar,Estado\n";

  itemsToExport.forEach(i => {
    const titleClean = `"${(i.title || '').replace(/"/g, '""')}"`;
    const row = [i.id, i.sku, titleClean, i.stock, i.sales_30d, i.vpd, i.reorder_point, i.reorder_suggested, i.status];
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Analisis_Stock_Meli_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
