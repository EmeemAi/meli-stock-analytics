/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 */

const DEFAULT_CONFIG = {
  LEAD_TIME_DAYS: 15,
  SAFETY_STOCK_DAYS: 7,
  TARGET_COVERAGE_DAYS: 45,
  MELI_SITE_ID: 'MLA'
};

const ACTIVE_CREDENTIALS = {
  CLIENT_ID: '4488794762859008',
  CLIENT_SECRET: 'lQZNoEJtnwlSGqLLyhDsFlKCwVXdgRqV',
  ACCESS_TOKEN: 'APP_USR-4488794762859008-081310-890c022fd86e2721952d71d95158afc9-231036407',
  SELLER_ID: '231036407'
};

function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('⚡ Mercado Libre Analytics')
      .addItem('📊 Inicializar Estructura de Hojas', 'setupSpreadsheet')
      .addSeparator()
      .addItem('🔄 Sincronizar Datos Ahora', 'syncMeliData')
      .addToUi();
  } catch(e) {}
}

function setupSpreadsheet() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch(e) {}

  if (ss) {
    const sheets = [
      { name: 'Config', headers: ['Parametro', 'Valor', 'Descripcion'] },
      { name: 'Inventario', headers: ['ID Publicacion', 'SKU', 'Titulo', 'Precio', 'Stock Actual', 'Vendidos Total', 'Estado', 'Link', 'Imagen'] },
      { name: 'Analisis_Rotacion', headers: ['ID Publicacion', 'SKU', 'Titulo', 'Stock Actual', 'Ventas 30D', 'Ventas 7D', 'VPD (Venta Prom. Diaria)', 'Dias Cobertura', 'Punto Pedido (PP)', 'Sugerencia Reposicion', 'Estado Stock', 'Imagen'] }
    ];

    sheets.forEach(sh => {
      let sheet = ss.getSheetByName(sh.name);
      if (!sheet) sheet = ss.insertSheet(sh.name);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, sh.headers.length).setValues([sh.headers]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      }
    });
  }

  const props = PropertiesService.getUserProperties();
  props.setProperty('ACCESS_TOKEN', ACTIVE_CREDENTIALS.ACCESS_TOKEN);

  syncMeliData();
}

function getValidAccessToken() {
  const props = PropertiesService.getUserProperties();
  let token = props.getProperty('ACCESS_TOKEN');
  if (!token || token.length < 10) {
    token = ACTIVE_CREDENTIALS.ACCESS_TOKEN;
  }
  return token;
}

function fetchMeliApi(endpoint) {
  let token = getValidAccessToken();
  let url = 'https://api.mercadolibre.com' + endpoint;
  let options = {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  };

  let response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`Error MeLi (${response.getResponseCode()}): ` + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

function syncMeliData() {
  const sellerId = ACTIVE_CREDENTIALS.SELLER_ID;
  const leadTime = DEFAULT_CONFIG.LEAD_TIME_DAYS;
  const safetyStockDays = DEFAULT_CONFIG.SAFETY_STOCK_DAYS;
  const targetCoverageDays = DEFAULT_CONFIG.TARGET_COVERAGE_DAYS;

  let itemIds = [];
  let scrollOffset = 0;
  const limit = 50;
  
  while (true) {
    const searchRes = fetchMeliApi(`/users/${sellerId}/items/search?offset=${scrollOffset}&limit=${limit}`);
    const results = searchRes.results || [];
    itemIds = itemIds.concat(results);
    if (results.length < limit || itemIds.length >= 1000) break;
    scrollOffset += limit;
  }

  let itemsData = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    const batchIds = itemIds.slice(i, i + 20).join(',');
    const batchRes = fetchMeliApi(`/items?ids=${batchIds}`);
    batchRes.forEach(res => {
      if (res.code === 200 && res.body) {
        const b = res.body;
        let sku = b.seller_custom_field || '';
        if (!sku && b.attributes) {
          const skuAttr = b.attributes.find(a => a.id === 'SELLER_SKU' || a.id === 'SKU');
          if (skuAttr) sku = skuAttr.value_name || '';
        }

        itemsData.push({
          id: b.id,
          sku: sku || b.id,
          title: b.title,
          price: b.price,
          available_quantity: b.available_quantity,
          sold_quantity: b.sold_quantity,
          status: b.status,
          permalink: b.permalink,
          thumbnail: b.secure_thumbnail || b.thumbnail
        });
      }
    });
  }

  const now = new Date();
  const dateFrom = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
  
  let orders = [];
  let orderOffset = 0;
  
  try {
    while (true) {
      const orderRes = fetchMeliApi(`/orders/search?seller=${sellerId}&order.date_created.from=${dateFrom}&offset=${orderOffset}&limit=50`);
      const results = orderRes.results || [];
      orders = orders.concat(results);
      if (results.length < 50 || orders.length >= 2000) break;
      orderOffset += 50;
    }
  } catch(e) {
    Logger.log('Aviso consulta órdenes: ' + e.message);
  }

  const date7d = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const itemSales30d = {};
  const itemSales7d = {};

  orders.forEach(ord => {
    const orderDate = new Date(ord.date_created);
    const isLast7d = orderDate >= date7d;

    if (ord.order_items) {
      ord.order_items.forEach(oi => {
        const itemId = oi.item.id;
        const qty = oi.quantity || 1;

        itemSales30d[itemId] = (itemSales30d[itemId] || 0) + qty;
        if (isLast7d) {
          itemSales7d[itemId] = (itemSales7d[itemId] || 0) + qty;
        }
      });
    }
  });

  const formattedItems = itemsData.map(item => {
    const v30 = itemSales30d[item.id] || 0;
    const v7 = itemSales7d[item.id] || 0;
    const vpd = v30 / 30;
    const stock = item.available_quantity;

    let diasCobertura = vpd > 0 ? Math.round((stock / vpd) * 10) / 10 : (stock > 0 ? 999 : 0);
    const puntoPedido = Math.ceil(vpd * (leadTime + safetyStockDays));

    let sugerencia = 0;
    let estadoStock = 'ADECUADO';

    if (stock === 0) {
      estadoStock = 'AGOTADO';
      sugerencia = Math.ceil(vpd * targetCoverageDays);
    } else if (stock <= puntoPedido) {
      estadoStock = 'CRITICO';
      sugerencia = Math.ceil((vpd * targetCoverageDays) - stock);
    } else if (diasCobertura > 90) {
      estadoStock = 'SOBRESTOCK';
      sugerencia = 0;
    }

    if (sugerencia < 0) sugerencia = 0;

    return {
      id: item.id,
      sku: item.sku,
      title: item.title,
      stock: stock,
      sales_30d: v30,
      sales_7d: v7,
      vpd: Math.round(vpd * 100) / 100,
      coverage_days: diasCobertura === 999 ? '∞ (Sin Ventas)' : diasCobertura,
      reorder_point: puntoPedido,
      reorder_suggested: sugerencia,
      status: estadoStock,
      thumbnail: item.thumbnail
    };
  });

  const payload = {
    status: 'success',
    updated_at: new Date().toISOString(),
    config: {
      lead_time_days: leadTime,
      safety_stock_days: safetyStockDays,
      target_coverage_days: targetCoverageDays
    },
    summary: {
      total_items: formattedItems.length,
      out_of_stock: formattedItems.filter(i => i.status === 'AGOTADO').length,
      critical_stock: formattedItems.filter(i => i.status === 'CRITICO').length,
      ok_stock: formattedItems.filter(i => i.status === 'ADECUADO').length,
      overstock: formattedItems.filter(i => i.status === 'SOBRESTOCK').length
    },
    items: formattedItems
  };

  const props = PropertiesService.getUserProperties();
  props.setProperty('MELI_ITEMS_JSON', JSON.stringify(payload));

  return payload;
}

function doGet(e) {
  try {
    const props = PropertiesService.getUserProperties();
    const storedData = props.getProperty('MELI_ITEMS_JSON');

    let payload = null;
    if (storedData) {
      payload = JSON.parse(storedData);
    } else {
      payload = syncMeliData();
    }

    return responseOutput(payload, e);
  } catch (err) {
    return responseOutput({ error: err.toString() }, e);
  }
}

function responseOutput(payload, e) {
  const jsonString = JSON.stringify(payload);
  
  const cb = e && e.parameter && (e.parameter.callback || e.parameter.prefix);
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + jsonString + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
