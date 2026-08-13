/**
 * ==============================================================================
 * MERCADO LIBRE STOCK & ROTATION ANALYTICS - GOOGLE APPS SCRIPT BACKEND
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
  ACCESS_TOKEN: 'APP_USR-4488794762859008-081219-1f8cbeab389b5e0f4e08e9ff5624bc76-231036407',
  REFRESH_TOKEN: 'TG-6a7d0236111a55000182f1e5-231036407',
  SELLER_ID: '231036407'
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Mercado Libre Analytics')
    .addItem('📊 Inicializar Estructura de Hojas', 'setupSpreadsheet')
    .addSeparator()
    .addItem('🔄 Sincronizar Datos Ahora', 'syncMeliData')
    .addToUi();
}

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = [
    { name: 'Config', headers: ['Parametro', 'Valor', 'Descripcion'] },
    { name: 'Inventario', headers: ['ID Publicacion', 'SKU', 'Titulo', 'Precio', 'Stock Actual', 'Vendidos Total', 'Estado', 'Link', 'Imagen'] },
    { name: 'Ventas_Historial', headers: ['ID Orden', 'Fecha', 'ID Publicacion', 'SKU', 'Titulo', 'Cantidad', 'Precio Unitario', 'Total'] },
    { name: 'Analisis_Rotacion', headers: ['ID Publicacion', 'SKU', 'Titulo', 'Stock Actual', 'Ventas 30D', 'Ventas 7D', 'VPD (Venta Prom. Diaria)', 'Dias Cobertura', 'Punto Pedido (PP)', 'Sugerencia Reposicion', 'Estado Stock', 'Imagen'] }
  ];

  sheets.forEach(sh => {
    let sheet = ss.getSheetByName(sh.name);
    if (!sheet) {
      sheet = ss.insertSheet(sh.name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, sh.headers.length).setValues([sh.headers]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    }
  });

  const configSheet = ss.getSheetByName('Config');
  configSheet.clear();
  configSheet.getRange(1, 1, 1, 3).setValues([['Parametro', 'Valor', 'Descripcion']]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

  const defaultConfigRows = [
    ['CLIENT_ID', ACTIVE_CREDENTIALS.CLIENT_ID, 'ID de la aplicación Mercado Libre Developers'],
    ['CLIENT_SECRET', ACTIVE_CREDENTIALS.CLIENT_SECRET, 'Secret Key de la aplicación Mercado Libre'],
    ['ACCESS_TOKEN', ACTIVE_CREDENTIALS.ACCESS_TOKEN, 'Token activo de acceso a MeLi'],
    ['REFRESH_TOKEN', ACTIVE_CREDENTIALS.REFRESH_TOKEN, 'Refresh token de Mercado Libre'],
    ['SELLER_ID', ACTIVE_CREDENTIALS.SELLER_ID, 'ID numérico de tu usuario vendedor de MeLi'],
    ['LEAD_TIME_DAYS', DEFAULT_CONFIG.LEAD_TIME_DAYS, 'Días de demora del proveedor'],
    ['SAFETY_STOCK_DAYS', DEFAULT_CONFIG.SAFETY_STOCK_DAYS, 'Días adicionales para stock de seguridad'],
    ['TARGET_COVERAGE_DAYS', DEFAULT_CONFIG.TARGET_COVERAGE_DAYS, 'Días de cobertura objetivo al comprar']
  ];

  configSheet.getRange(2, 1, defaultConfigRows.length, 3).setValues(defaultConfigRows);

  const props = PropertiesService.getUserProperties();
  props.setProperty('ACCESS_TOKEN', ACTIVE_CREDENTIALS.ACCESS_TOKEN);

  SpreadsheetApp.getUi().alert('✅ Estructura e inicialización completadas con éxito.');
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) throw new Error("No se encontró la hoja 'Config'. Ejecuta primero 'Inicializar Estructura de Hojas'.");

  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = String(data[i][1]).trim();
    if (key) config[key] = val;
  }
  return config;
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
    throw new Error(`Error API MeLi (${response.getResponseCode()}): ` + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

function syncMeliData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let config = {};
  try { config = getConfig(); } catch (e) {}

  const sellerId = config.SELLER_ID || ACTIVE_CREDENTIALS.SELLER_ID;
  const leadTime = parseFloat(config.LEAD_TIME_DAYS) || DEFAULT_CONFIG.LEAD_TIME_DAYS;
  const safetyStockDays = parseFloat(config.SAFETY_STOCK_DAYS) || DEFAULT_CONFIG.SAFETY_STOCK_DAYS;
  const targetCoverageDays = parseFloat(config.TARGET_COVERAGE_DAYS) || DEFAULT_CONFIG.TARGET_COVERAGE_DAYS;

  Logger.log('Obteniendo listado de ítems para seller: ' + sellerId);
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

  Logger.log(`Total publicaciones encontradas: ${itemIds.length}`);

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
  
  Logger.log('Consultando ventas desde: ' + dateFrom);
  let orders = [];
  let orderOffset = 0;
  
  while (true) {
    const orderRes = fetchMeliApi(`/orders/search?seller=${sellerId}&order.date_created.from=${dateFrom}&offset=${orderOffset}&limit=50`);
    const results = orderRes.results || [];
    orders = orders.concat(results);
    if (results.length < 50 || orders.length >= 2000) break;
    orderOffset += 50;
  }

  const date7d = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const itemSales30d = {};
  const itemSales7d = {};
  const salesHistoryRows = [];

  orders.forEach(ord => {
    const orderDate = new Date(ord.date_created);
    const isLast7d = orderDate >= date7d;

    if (ord.order_items) {
      ord.order_items.forEach(oi => {
        const itemId = oi.item.id;
        const qty = oi.quantity || 1;
        const unitPrice = oi.unit_price || 0;

        itemSales30d[itemId] = (itemSales30d[itemId] || 0) + qty;
        if (isLast7d) {
          itemSales7d[itemId] = (itemSales7d[itemId] || 0) + qty;
        }

        salesHistoryRows.push([
          ord.id,
          ord.date_created,
          itemId,
          oi.item.seller_custom_field || itemId,
          oi.item.title,
          qty,
          unitPrice,
          qty * unitPrice
        ]);
      });
    }
  });

  const inventoryRows = itemsData.map(item => [
    item.id,
    item.sku,
    item.title,
    item.price,
    item.available_quantity,
    item.sold_quantity,
    item.status,
    item.permalink,
    item.thumbnail
  ]);

  const rotationRows = itemsData.map(item => {
    const v30 = itemSales30d[item.id] || 0;
    const v7 = itemSales7d[item.id] || 0;
    const vpd = v30 / 30;
    const stock = item.available_quantity;

    let diasCobertura = vpd > 0 ? Math.round((stock / vpd) * 10) / 10 : (stock > 0 ? 999 : 0);
    const puntoPedido = Math.ceil(vpd * (leadTime + safetyStockDays));

    let sugerencia = 0;
    let estadoStock = 'OK';

    if (stock === 0) {
      estadoStock = 'AGOTADO';
      sugerencia = Math.ceil(vpd * targetCoverageDays);
    } else if (stock <= puntoPedido) {
      estadoStock = 'CRITICO';
      sugerencia = Math.ceil((vpd * targetCoverageDays) - stock);
    } else if (diasCobertura > 90) {
      estadoStock = 'SOBRESTOCK';
      sugerencia = 0;
    } else {
      estadoStock = 'ADECUADO';
      sugerencia = 0;
    }

    if (sugerencia < 0) sugerencia = 0;

    return [
      item.id,
      item.sku,
      item.title,
      stock,
      v30,
      v7,
      Math.round(vpd * 100) / 100,
      diasCobertura === 999 ? '∞ (Sin Ventas)' : diasCobertura,
      puntoPedido,
      sugerencia,
      estadoStock,
      item.thumbnail
    ];
  });

  writeToSheet(ss, 'Inventario', inventoryRows);
  writeToSheet(ss, 'Ventas_Historial', salesHistoryRows);
  writeToSheet(ss, 'Analisis_Rotacion', rotationRows);

  Logger.log('✅ Sincronización completada exitosamente.');
  if (SpreadsheetApp.getActiveSpreadsheet()) {
    SpreadsheetApp.getUi().alert(`✅ Sincronización de ${itemsData.length} publicaciones completada exitosamente.`);
  }
}

function writeToSheet(ss, sheetName, rows) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return responseOutput({ error: 'Spreadsheet no activo' }, e);
    }

    const rotationSheet = ss.getSheetByName('Analisis_Rotacion');

    if (!rotationSheet) {
      return responseOutput({ error: "La hoja 'Analisis_Rotacion' no ha sido creada. Ejecuta la sincronización." }, e);
    }

    const data = rotationSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseOutput({ items: [], config: {}, updated: new Date().toISOString() }, e);
    }

    const headers = data[0];
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      items.push({
        id: row[0],
        sku: row[1],
        title: row[2],
        stock: Number(row[3]) || 0,
        sales_30d: Number(row[4]) || 0,
        sales_7d: Number(row[5]) || 0,
        vpd: Number(row[6]) || 0,
        coverage_days: row[7],
        reorder_point: Number(row[8]) || 0,
        reorder_suggested: Number(row[9]) || 0,
        status: row[10],
        thumbnail: row[11] || ''
      });
    }

    let config = {};
    try { config = getConfig(); } catch (err) {}

    const payload = {
      status: 'success',
      updated_at: new Date().toISOString(),
      config: {
        lead_time_days: Number(config.LEAD_TIME_DAYS) || 15,
        safety_stock_days: Number(config.SAFETY_STOCK_DAYS) || 7,
        target_coverage_days: Number(config.TARGET_COVERAGE_DAYS) || 45
      },
      summary: {
        total_items: items.length,
        out_of_stock: items.filter(i => i.status === 'AGOTADO').length,
        critical_stock: items.filter(i => i.status === 'CRITICO').length,
        ok_stock: items.filter(i => i.status === 'ADECUADO').length,
        overstock: items.filter(i => i.status === 'SOBRESTOCK').length
      },
      items: items
    };

    return responseOutput(payload, e);

  } catch (err) {
    return responseOutput({ error: err.toString() }, e);
  }
}

function responseOutput(payload, e) {
  const jsonString = JSON.stringify(payload);
  
  // Soporte JSONP (Supera restricciones CORS de cualquier navegador)
  const cb = e && e.parameter && (e.parameter.callback || e.parameter.prefix);
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + jsonString + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
