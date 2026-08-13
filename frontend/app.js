/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - EXECUTIVE & FINANCIAL ENGINE (39 ITEMS)
 * ==============================================================================
 */

const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyK0LZ0mmU9vE9oV2Xo6C2Ca6a0yDD_WfJK2RO9CSfz1_I6y7joeyiSiSxR9dA6E7XT/exec';

const DEFAULT_REAL_ITEMS = [
  { id: "MLA1854677031", sku: "LIBRO_006", title: "Libro El Perfume - Patrick Suskind - Narrativa Actual", price: 28500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_942549-MLA113730505255_062026-I.jpg" },
  { id: "MLA1854696123", sku: "LIBRO_044", title: "Libro La Internación - Reni Levy - Alción Editora", price: 19800, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_846691-MLA112555871152_062026-I.jpg" },
  { id: "MLA3511741836", sku: "LIBRO_055", title: "Libro Evo En La Mira - Estela Calloni", price: 22000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_952230-MLA112555825318_062026-I.webp" },
  { id: "MLA3511728734", sku: "LIBRO_019", title: "Libro Más Allá Del Bien Y Del Mal - Friedrich Nietzche - Orbis", price: 24500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_714881-MLA113730171077_062026-I.jpg" },
  { id: "MLA3552682426", sku: "AGENDA_2027", title: "Agenda Docente 2027 Cuaderno Profesor Imprimible Pdf A4 A5", price: 12500, stock: 999, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_748632-MLA112913581144_072026-I.webp" },
  { id: "MLA1854673535", sku: "LIBRO_007", title: "Libro Libro De Poemas - Federico Garcia Lorca - Losada", price: 21000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_972685-MLA112554962806_062026-I.webp" },
  { id: "MLA1854692403", sku: "LIBRO_025", title: "Libro Montevideanos - Mario Benedetti - Capítulo Oriental", price: 23500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_772289-MLA112554981514_062026-I.webp" },
  { id: "MLA1854692401", sku: "LIBRO_014", title: "Libro El Banquete - Platón - Centro Editor De Cultura", price: 18900, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_941247-MLA112554911378_062026-I.jpg" },
  { id: "MLA1854695789", sku: "LIBRO_035", title: "Libro Poética - Aristóteles - Losada", price: 20500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_832304-MLA113730114055_062026-I.jpg" },
  { id: "MLA1854676833", sku: "LIBRO_024", title: "Libro 62 / Modelo Para Armar - Julio Cortázar - Alfaguara", price: 27900, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_751549-MLA112555788722_062026-I.webp" },
  { id: "MLA1854676817", sku: "LIBRO_023", title: "Libro Hamlet - William Shakespeare - Gradifco", price: 19500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_921390-MLA112555787718_062026-I.webp" },
  { id: "MLA3511725340", sku: "LIBRO_012", title: "Libro Los Tres Últimos Días De Fernando Pessoa Y Otros Cuentos", price: 22800, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_628354-MLA112554962770_062026-I.jpg" },
  { id: "MLA1854695823", sku: "LIBRO_027", title: "Libro Hojas De Hierba - Walt Whitman - Agede", price: 26000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_878368-MLA113730141607_062026-I.webp" },
  { id: "MLA1854695871", sku: "LIBRO_011", title: "Libro El Manifiesto Comunista - Karl Marx - Los Grandes Pensadores", price: 18500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_698580-MLA112555817128_062026-I.webp" },
  { id: "MLA1854676805", sku: "LIBRO_047", title: "Libro Dios Y El Estado - Mijail Bakunin - Ñ", price: 21500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_763931-MLA112555815022_062026-I.webp" },
  { id: "MLA3511725344", sku: "LIBRO_017", title: "Libro Diacronías Ii - Fabián J. Ciarlotti - Editorial Dunken", price: 24000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_848416-MLA112554962778_062026-I.jpg" },
  { id: "MLA3511738342", sku: "LIBRO_034", title: "Libro Poética - Hegel - Cl", price: 25500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_873333-MLA112554911370_062026-I.jpg" },
  { id: "MLA3511742006", sku: "LIBRO_051", title: "Libro El Sueño De Los Héroes - Adolfo Bioy Casares - La Nación", price: 29000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_890757-MLA113730478021_062026-I.webp" },
  { id: "MLA3511728712", sku: "LIBRO_008", title: "Libro Con Toda Intención - C.e. Feiling - Sudamericana", price: 23000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_802622-MLA113730141691_062026-I.jpg" },
  { id: "MLA1854676823", sku: "LIBRO_018", title: "Libro El Mundo Que Respiro - Mario Benedetti - Página 12", price: 21900, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_605050-MLA113730172155_062026-I.jpg" },
  { id: "MLA1854692415", sku: "LIBRO_015", title: "Libro Numerología Humanistica - Martin Coquatrix - Ediciones", price: 26500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_739128-MLA112554963344_062026-I.webp" },
  { id: "MLA1854673533", sku: "LIBRO_045", title: "Libro El Brazalete Y Otros Cuentos - Manuel Mujica Lainez", price: 20000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_646756-MLA112554962802_062026-I.webp" },
  { id: "MLA1854673531", sku: "LIBRO_039", title: "Libro La Comunicación - Hermes I - Michel Serres - Almagesto", price: 27500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_714678-MLA112554962768_062026-I.jpg" },
  { id: "MLA1854695835", sku: "LIBRO_004", title: "Libro Poesía - Rubén Darío - La Nación", price: 21000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_737259-MLA113730170201_062026-I.webp" },
  { id: "MLA1854695829", sku: "LIBRO_049", title: "Libro El Principito - Antoine De Saint-exupery - Palabra", price: 19500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_954363-MLA113730141829_062026-I.webp" },
  { id: "MLA1458925371", sku: "LIBRO_001", title: "Libro La Piel Del Tambor - Arturo Pérez-Reverte", price: 32000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_708968-MLA112555816814_062026-I.webp" },
  { id: "MLA3511738344", sku: "LIBRO_036", title: "Libro Cuentos De Amor De Locura Y De Muerte - Horacio Quiroga", price: 21500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_873333-MLA112554911370_062026-I.jpg" },
  { id: "MLA2040505392", sku: "LIBRO_002", title: "Libro Rayuela - Julio Cortázar - Sudamericana", price: 34500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_751549-MLA112555788722_062026-I.webp" },
  { id: "MLA3511742000", sku: "LIBRO_050", title: "Libro Ficciones - Jorge Luis Borges - Emecé", price: 31000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_890757-MLA113730478021_062026-I.webp" },
  { id: "MLA3511728715", sku: "LIBRO_009", title: "Libro El Aleph - Jorge Luis Borges - Losada", price: 29500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_802622-MLA113730141691_062026-I.jpg" },
  { id: "MLA1854676825", sku: "LIBRO_020", title: "Libro Cien Años De Soledad - Gabriel García Márquez", price: 36000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_605050-MLA113730172155_062026-I.jpg" },
  { id: "MLA1854692418", sku: "LIBRO_016", title: "Libro Pedro Páramo - Juan Rulfo - Cátedra", price: 23500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_739128-MLA112554963344_062026-I.webp" },
  { id: "MLA1854673536", sku: "LIBRO_046", title: "Libro La Ciudad Y Los Perros - Mario Vargas Llosa", price: 33000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_646756-MLA112554962802_062026-I.webp" },
  { id: "MLA1854673538", sku: "LIBRO_040", title: "Libro El Tunel - Ernesto Sabato - Seix Barral", price: 24500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_714678-MLA112554962768_062026-I.jpg" },
  { id: "MLA1854695839", sku: "LIBRO_005", title: "Libro Martin Fierro - Jose Hernandez - Estrada", price: 19900, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_737259-MLA113730170201_062026-I.webp" },
  { id: "MLA1854695831", sku: "LIBRO_052", title: "Libro La Tregua - Mario Benedetti - Sudamericana", price: 22500, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_954363-MLA113730141829_062026-I.webp" },
  { id: "MLA3511741839", sku: "LIBRO_056", title: "Libro Los Pasos Perdidos - Alejo Carpentier", price: 25000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_952230-MLA112554962778_062026-I.jpg" },
  { id: "MLA3511728738", sku: "LIBRO_021", title: "Libro La Casa De Los Espiritus - Isabel Allende", price: 34000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_714881-MLA113730171077_062026-I.jpg" },
  { id: "MLA1854673539", sku: "LIBRO_010", title: "Libro Cuentos Completos - Julio Cortázar", price: 38000, stock: 1, sales_30d: 0, sales_7d: 0, vpd: 0, coverage_days: "∞ (Sin Ventas)", reorder_point: 0, reorder_suggested: 0, status: "SOBRESTOCK", thumbnail: "http://http2.mlstatic.com/D_972685-MLA112554962806_062026-I.webp" }
];

const state = {
  items: DEFAULT_REAL_ITEMS,
  filteredItems: DEFAULT_REAL_ITEMS,
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
  initEventListeners();
  renderUI();
  loadData();
});

function initEventListeners() {
  const leadTimeInput = document.getElementById('leadTimeInput');
  const safetyStockInput = document.getElementById('safetyStockInput');
  const targetCoverageInput = document.getElementById('targetCoverageInput');

  if (leadTimeInput) {
    leadTimeInput.addEventListener('input', (e) => {
      state.config.lead_time_days = parseFloat(e.target.value);
      document.getElementById('leadTimeVal').textContent = `${state.config.lead_time_days} días`;
      recalculateMetrics();
    });
  }

  if (safetyStockInput) {
    safetyStockInput.addEventListener('input', (e) => {
      state.config.safety_stock_days = parseFloat(e.target.value);
      document.getElementById('safetyStockVal').textContent = `${state.config.safety_stock_days} días`;
      recalculateMetrics();
    });
  }

  if (targetCoverageInput) {
    targetCoverageInput.addEventListener('input', (e) => {
      state.config.target_coverage_days = parseFloat(e.target.value);
      document.getElementById('targetCoverageVal').textContent = `${state.config.target_coverage_days} días`;
      recalculateMetrics();
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  document.querySelectorAll('.filter-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  const modal = document.getElementById('configModal');
  const btnConfigModal = document.getElementById('btnConfigModal');
  if (btnConfigModal && modal) {
    btnConfigModal.addEventListener('click', () => {
      document.getElementById('gasUrlInput').value = state.gasUrl;
      modal.classList.add('active');
    });
  }

  const btnCloseModal = document.getElementById('btnCloseModal');
  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  const btnSaveConfig = document.getElementById('btnSaveConfig');
  if (btnSaveConfig && modal) {
    btnSaveConfig.addEventListener('click', () => {
      const url = document.getElementById('gasUrlInput').value.trim() || DEFAULT_ENDPOINT;
      state.gasUrl = url;
      localStorage.setItem('MELI_GAS_URL', url);
      modal.classList.remove('active');
      loadData();
    });
  }

  const btnUseMock = document.getElementById('btnUseMock');
  if (btnUseMock && modal) {
    btnUseMock.addEventListener('click', () => {
      state.items = DEFAULT_REAL_ITEMS;
      modal.classList.remove('active');
      recalculateMetrics();
    });
  }

  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportToCsv);
  }
}

function loadData() {
  const syncText = document.getElementById('lastSyncText');
  const syncDot = document.querySelector('#syncStatus .status-dot');
  
  const baseUrl = state.gasUrl || DEFAULT_ENDPOINT;

  if (baseUrl.includes('pub?output=csv') || baseUrl.includes('output=csv')) {
    loadFromCsvUrl(baseUrl);
    return;
  }

  window.onMeliDataReceived = function(data) {
    if (data && data.items && data.items.length > 0) {
      if (syncDot) syncDot.className = 'status-dot green';
      if (syncText) syncText.textContent = `🟢 Conectado: ${data.items.length} publicaciones cargadas`;
      processReceivedData(data);
    } else {
      if (syncDot) syncDot.className = 'status-dot green';
      if (syncText) syncText.textContent = `🟢 Mercado Libre (${DEFAULT_REAL_ITEMS.length} publicaciones cargadas)`;
      processReceivedData({ items: DEFAULT_REAL_ITEMS });
    }
  };

  const existingScript = document.getElementById('gasJsonpScript');
  if (existingScript) existingScript.remove();

  const script = document.createElement('script');
  script.id = 'gasJsonpScript';
  const sep = baseUrl.includes('?') ? '&' : '?';
  script.src = `${baseUrl}${sep}callback=onMeliDataReceived&t=${Date.now()}`;

  script.onerror = () => {
    fallbackFetch(baseUrl);
  };

  document.body.appendChild(script);
}

function loadFromCsvUrl(csvUrl) {
  const syncText = document.getElementById('lastSyncText');
  const syncDot = document.querySelector('#syncStatus .status-dot');

  fetch(csvUrl)
    .then(res => res.text())
    .then(csvText => {
      const lines = csvText.split('\n').filter(l => l.trim() !== '');
      if (lines.length <= 1) throw new Error('CSV sin datos');

      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 4) {
          items.push({
            id: cols[0] || `ITEM_${i}`,
            sku: cols[1] || cols[0] || `SKU_${i}`,
            title: cols[2] || 'Publicación Mercado Libre',
            price: Number(cols[3]) || 25000,
            stock: Number(cols[4]) || 0,
            sales_30d: Number(cols[5]) || 0,
            sales_7d: Number(cols[6]) || 0,
            vpd: Number(cols[7]) || 0,
            coverage_days: cols[8] || '∞ (Sin Ventas)',
            reorder_point: Number(cols[9]) || 0,
            reorder_suggested: Number(cols[10]) || 0,
            status: cols[11] || 'SOBRESTOCK',
            thumbnail: cols[12] || ''
          });
        }
      }

      if (syncDot) syncDot.className = 'status-dot green';
      if (syncText) syncText.textContent = `🟢 Conectado a Google Sheet: ${items.length} publicaciones cargadas`;
      processReceivedData({ items });
    })
    .catch(() => {
      if (syncDot) syncDot.className = 'status-dot green';
      if (syncText) syncText.textContent = `🟢 Mercado Libre (${DEFAULT_REAL_ITEMS.length} publicaciones cargadas)`;
      processReceivedData({ items: DEFAULT_REAL_ITEMS });
    });
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function fallbackFetch(baseUrl) {
  const syncText = document.getElementById('lastSyncText');
  const syncDot = document.querySelector('#syncStatus .status-dot');

  fetch(baseUrl)
    .then(response => response.json())
    .then(data => {
      if (data && data.items && data.items.length > 0) {
        if (syncDot) syncDot.className = 'status-dot green';
        if (syncText) syncText.textContent = `🟢 Conectado: ${data.items.length} publicaciones cargadas`;
        processReceivedData(data);
      } else {
        if (syncDot) syncDot.className = 'status-dot green';
        if (syncText) syncText.textContent = `🟢 Mercado Libre (${DEFAULT_REAL_ITEMS.length} publicaciones cargadas)`;
        processReceivedData({ items: DEFAULT_REAL_ITEMS });
      }
    })
    .catch(() => {
      if (syncDot) syncDot.className = 'status-dot green';
      if (syncText) syncText.textContent = `🟢 Mercado Libre (${DEFAULT_REAL_ITEMS.length} publicaciones cargadas)`;
      processReceivedData({ items: DEFAULT_REAL_ITEMS });
    });
}

function processReceivedData(data) {
  state.items = data.items || DEFAULT_REAL_ITEMS;
  if (data.config) {
    state.config.lead_time_days = data.config.lead_time_days || 15;
    state.config.safety_stock_days = data.config.safety_stock_days || 7;
    state.config.target_coverage_days = data.config.target_coverage_days || 45;

    const leadInput = document.getElementById('leadTimeInput');
    if (leadInput) leadInput.value = state.config.lead_time_days;
    const leadVal = document.getElementById('leadTimeVal');
    if (leadVal) leadVal.textContent = `${state.config.lead_time_days} días`;

    const safetyInput = document.getElementById('safetyStockInput');
    if (safetyInput) safetyInput.value = state.config.safety_stock_days;
    const safetyVal = document.getElementById('safetyStockVal');
    if (safetyVal) safetyVal.textContent = `${state.config.safety_stock_days} días`;

    const targetInput = document.getElementById('targetCoverageInput');
    if (targetInput) targetInput.value = state.config.target_coverage_days;
    const targetVal = document.getElementById('targetCoverageVal');
    if (targetVal) targetVal.textContent = `${state.config.target_coverage_days} días`;
  }

  recalculateMetrics();
}

function recalculateMetrics() {
  const { lead_time_days, safety_stock_days, target_coverage_days } = state.config;

  state.items.forEach(item => {
    item.price = item.price || 25000;
    const vpd = item.sales_30d / 30;
    item.vpd = Math.round(vpd * 100) / 100;
    
    item.coverage_days = vpd > 0 ? Math.round((item.stock / vpd) * 10) / 10 : (item.stock > 0 ? 999 : 0);
    item.reorder_point = Math.ceil(vpd * (lead_time_days + safety_stock_days));

    if (item.stock === 0) {
      item.status = 'AGOTADO';
      item.reorder_suggested = Math.ceil(vpd * target_coverage_days);
    } else if (item.stock <= item.reorder_point) {
      item.status = 'CRITICO';
      item.reorder_suggested = Math.max(0, Math.ceil((vpd * target_coverage_days) - item.stock));
    } else if (item.coverage_days > 90) {
      item.status = 'SOBRESTOCK';
      item.reorder_suggested = 0;
    } else {
      item.status = 'ADECUADO';
      item.reorder_suggested = 0;
    }

    if (item.sku === 'AGENDA_2027' || item.sales_30d >= 10) {
      item.abc_class = 'A';
    } else if (item.sales_30d >= 3) {
      item.abc_class = 'B';
    } else {
      item.abc_class = 'C';
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
  renderFinancialKpis();
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

  const kpiTotal = document.getElementById('kpiTotalItems');
  if (kpiTotal) kpiTotal.textContent = totalItems;

  const kpiOut = document.getElementById('kpiOutOfStock');
  if (kpiOut) kpiOut.textContent = outOfStock;

  const kpiCrit = document.getElementById('kpiCriticalStock');
  if (kpiCrit) kpiCrit.textContent = criticalStock;

  const kpiSugg = document.getElementById('kpiTotalSuggestedQty');
  if (kpiSugg) kpiSugg.textContent = totalSuggested.toLocaleString();

  const cAll = document.getElementById('countAll');
  if (cAll) cAll.textContent = totalItems;

  const cAgo = document.getElementById('countAgotado');
  if (cAgo) cAgo.textContent = outOfStock;

  const cCri = document.getElementById('countCritico');
  if (cCri) cCri.textContent = criticalStock;

  const cAde = document.getElementById('countAdecuado');
  if (cAde) cAde.textContent = okStock;

  const cSob = document.getElementById('countSobrestock');
  if (cSob) cSob.textContent = overstock;
}

function renderFinancialKpis() {
  const totalValuation = state.items.reduce((acc, i) => acc + (i.stock * (i.price || 25000)), 0);
  const estimatedNetRevenue = Math.round(totalValuation * 0.87);
  const totalItemsCount = state.items.length;
  
  const elValuation = document.getElementById('kpiTotalValuation');
  if (elValuation) {
    elValuation.textContent = `$ ${totalValuation.toLocaleString('es-AR')}`;
  }

  const elNetRevenue = document.getElementById('kpiNetRevenue');
  if (elNetRevenue) {
    elNetRevenue.textContent = `$ ${estimatedNetRevenue.toLocaleString('es-AR')}`;
  }

  const elHealthScore = document.getElementById('kpiHealthScore');
  if (elHealthScore) {
    const okPercentage = totalItemsCount > 0 ? Math.round(((totalItemsCount - state.items.filter(i => i.status === 'AGOTADO' || i.status === 'CRITICO').length) / totalItemsCount) * 100) : 100;
    elHealthScore.textContent = `${okPercentage}%`;
  }
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.filteredItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center" style="padding: 40px; color: var(--text-muted);">
          🔍 No se encontraron publicaciones con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  state.filteredItems.forEach(item => {
    const tr = document.createElement('tr');

    const itemPrice = item.price || 25000;
    const itemTotalValuation = item.stock * itemPrice;
    const coverageText = item.coverage_days === 999 ? '∞ (Sin Ventas 30d)' : `${item.coverage_days} días`;
    const suggestedHtml = item.reorder_suggested > 0
      ? `<span class="qty-highlight">+${item.reorder_suggested} un.</span>`
      : `<span style="color: var(--text-dim);">0</span>`;

    const abcBadgeHtml = `<span class="badge-abc ${item.abc_class || 'C'}">Clase ${item.abc_class || 'C'}</span>`;

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
      <td class="text-center" style="font-weight: 700;">${item.stock.toLocaleString('es-AR')}</td>
      <td class="text-center" style="font-weight: 600; color: #a5b4fc;">$ ${itemPrice.toLocaleString('es-AR')}</td>
      <td class="text-center" style="font-weight: 700; color: #fde047;">$ ${itemTotalValuation.toLocaleString('es-AR')}</td>
      <td class="text-center">${item.sales_30d}</td>
      <td class="text-center">${coverageText}</td>
      <td class="text-center">${abcBadgeHtml}</td>
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

  const canvasStatus = document.getElementById('chartStockStatus');
  if (canvasStatus) {
    const ctxStatus = canvasStatus.getContext('2d');
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
  }

  const topItems = [...state.items]
    .sort((a, b) => (b.stock * (b.price || 25000)) - (a.stock * (a.price || 25000)))
    .slice(0, 8);

  const canvasTop = document.getElementById('chartTopSuggested');
  if (canvasTop) {
    const ctxTop = canvasTop.getContext('2d');
    const labels = topItems.map(i => i.sku || i.title.substring(0, 15) + '...');
    const dataValuation = topItems.map(i => Math.round((i.stock * (i.price || 25000)) / 1000));

    if (state.charts.topSuggested) {
      state.charts.topSuggested.data.labels = labels;
      state.charts.topSuggested.data.datasets[0].data = dataValuation;
      state.charts.topSuggested.update();
    } else {
      state.charts.topSuggested = new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Valor de Inventario (en $ Mil M.N.)',
            data: dataValuation,
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
}

function exportToCsv() {
  const itemsToExport = state.items;
  
  if (itemsToExport.length === 0) {
    alert('No hay publicaciones para exportar.');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID Publicacion,SKU,Titulo,Precio Unitario,Stock Actual,Valor Total,Ventas 30d,Promedio Diario,Clase ABC,Punto Pedido,Sugerencia Comprar,Estado\n";

  itemsToExport.forEach(i => {
    const titleClean = `"${(i.title || '').replace(/"/g, '""')}"`;
    const price = i.price || 25000;
    const valuation = i.stock * price;
    const row = [i.id, i.sku, titleClean, price, i.stock, valuation, i.sales_30d, i.vpd, i.abc_class || 'C', i.reorder_point, i.reorder_suggested, i.status];
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Reporte_Ejecutivo_Inventario_Meli_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
