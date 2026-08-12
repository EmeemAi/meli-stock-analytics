/**
 * ==============================================================================
 * MERCADO LIBRE STOCK & ROTATION ANALYTICS - GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 * Desarrollado para automatizar la sincronización de publicaciones, inventario y 
 * ventas de Mercado Libre en Google Sheets y alimentar un Dashboard en GitHub Pages.
 */

// Configuración global por defecto
const DEFAULT_CONFIG = {
  LEAD_TIME_DAYS: 15,          // Días de tiempo de entrega del proveedor
  SAFETY_STOCK_DAYS: 7,        // Días de stock de seguridad deseados
  TARGET_COVERAGE_DAYS: 45,    // Cobertura deseada al reponer
  MELI_SITE_ID: 'MLA'          // MLA: Argentina, MLM: México, MLB: Brasil, MLC: Chile, MCO: Colombia, etc.
};

/**
 * Añade un menú personalizado a la interfaz de Google Sheets al abrir el documento.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Mercado Libre Analytics')
    .addItem('📊 Inicializar Estructura de Hojas', 'setupSpreadsheet')
    .addSeparator()
    .addItem('🔄 Sincronizar Datos Ahora', 'syncMeliData')
    .addItem('🔑 Renovar Access Token (OAuth)', 'refreshAccessToken')
    .addToUi();
}

/**
 * Inicializa y valida la estructura de hojas necesarias en Google Sheets.
 */
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

  // Cargar valores de configuración por defecto si la hoja Config está vacía después del encabezado
  const configSheet = ss.getSheetByName('Config');
  if (configSheet.getLastRow() <= 1) {
    const defaultConfigRows = [
      ['CLIENT_ID', 'TU_APP_CLIENT_ID', 'ID de la aplicación Mercado Libre Developers'],
      ['CLIENT_SECRET', 'TU_APP_CLIENT_SECRET', 'Secret Key de la aplicación Mercado Libre'],
      ['REFRESH_TOKEN', 'TU_REFRESH_TOKEN', 'Refresh token obtenido en la autorización OAuth'],
      ['SELLER_ID', 'TU_SELLER_ID', 'ID numérico de tu usuario vendedor de MeLi'],
      ['LEAD_TIME_DAYS', DEFAULT_CONFIG.LEAD_TIME_DAYS, 'Días de demora del proveedor'],
      ['SAFETY_STOCK_DAYS', DEFAULT_CONFIG.SAFETY_STOCK_DAYS, 'Días adicionales para stock de seguridad'],
      ['TARGET_COVERAGE_DAYS', DEFAULT_CONFIG.TARGET_COVERAGE_DAYS, 'Días de cobertura objetivo al comprar']
    ];
    configSheet.getRange(2, 1, defaultConfigRows.length, 3).setValues(defaultConfigRows);
  }

  SpreadsheetApp.getUi().alert('✅ Estructura inicializada con éxito en Google Sheets.');
}

/**
 * Obtiene la configuración desde la pestaña 'Config' como un objeto Clave-Valor.
 */
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

/**
 * Renueva el Access Token utilizando el Refresh Token guardado en la hoja Config o UserProperties.
 */
function refreshAccessToken() {
  const config = getConfig();
  const props = PropertiesService.getUserProperties();
  const refreshToken = props.getProperty('REFRESH_TOKEN') || config.REFRESH_TOKEN;
  const clientId = config.CLIENT_ID;
  const clientSecret = config.CLIENT_SECRET;

  if (!clientId || clientId.includes('TU_APP') || !clientSecret || clientSecret.includes('TU_APP')) {
    throw new Error('Por favor configura CLIENT_ID y CLIENT_SECRET en la pestaña Config de Google Sheets.');
  }

  const url = 'https://api.mercadolibre.com/oauth/token';
  const payload = {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    Logger.log('Error refrescando token: ' + response.getContentText());
    throw new Error('Error al refrescar token de MeLi: ' + (json.message || response.getContentText()));
  }

  // Guardar nuevos tokens
  props.setProperty('ACCESS_TOKEN', json.access_token);
  props.setProperty('REFRESH_TOKEN', json.refresh_token);
  
  // Actualizar también en la hoja Config si existe la fila
  updateConfigValue('REFRESH_TOKEN', json.refresh_token);

  Logger.log('Access Token renovado correctamente.');
  return json.access_token;
}

/**
 * Actualiza un valor en la hoja Config.
 */
function updateConfigValue(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
}

/**
 * Obtiene un Access Token válido (lo renueva si no existe o genera error).
 */
function getValidAccessToken() {
  const props = PropertiesService.getUserProperties();
  let token = props.getProperty('ACCESS_TOKEN');
  if (!token) {
    token = refreshAccessToken();
  }
  return token;
}

/**
 * Realiza peticiones autenticadas a la API de Mercado Libre.
 */
function fetchMeliApi(endpoint) {
  let token = getValidAccessToken();
  let url = 'https://api.mercadolibre.com' + endpoint;
  let options = {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  };

  let response = UrlFetchApp.fetch(url, options);
  
  // Si el token expiró (401), intentamos refrescarlo automáticamente 1 vez
  if (response.getResponseCode() === 401) {
    Logger.log('Token expirado, renovando...');
    token = refreshAccessToken();
    options.headers['Authorization'] = 'Bearer ' + token;
    response = UrlFetchApp.fetch(url, options);
  }

  if (response.getResponseCode() !== 200) {
    throw new Error(`Error API MeLi (${response.getResponseCode()}): ` + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

/**
 * FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
 * Descarga items e historial de órdenes, calcula métricas de rotación y actualiza Google Sheets.
 */
function syncMeliData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  
  let sellerId = config.SELLER_ID;
  if (!sellerId || sellerId.includes('TU_SELLER')) {
    // Si no está seteado, consultar el endpoint /users/me
    const me = fetchMeliApi('/users/me');
    sellerId = me.id;
    updateConfigValue('SELLER_ID', String(sellerId));
  }

  const leadTime = parseFloat(config.LEAD_TIME_DAYS) || DEFAULT_CONFIG.LEAD_TIME_DAYS;
  const safetyStockDays = parseFloat(config.SAFETY_STOCK_DAYS) || DEFAULT_CONFIG.SAFETY_STOCK_DAYS;
  const targetCoverageDays = parseFloat(config.TARGET_COVERAGE_DAYS) || DEFAULT_CONFIG.TARGET_COVERAGE_DAYS;

  // 1. Obtener todas las publicaciones del vendedor
  Logger.log('Obteniendo listado de ítems para seller: ' + sellerId);
  let itemIds = [];
  let scrollOffset = 0;
  const limit = 50;
  
  while (true) {
    const searchRes = fetchMeliApi(`/users/${sellerId}/items/search?offset=${scrollOffset}&limit=${limit}`);
    const results = searchRes.results || [];
    itemIds = itemIds.concat(results);
    if (results.length < limit || itemIds.length >= 1000) break; // Limite de seguridad
    scrollOffset += limit;
  }

  Logger.log(`Total publicaciones encontradas: ${itemIds.length}`);

  // 2. Obtener detalle de items en lotes de a 20 (Multi-get /items?ids=)
  let itemsData = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    const batchIds = itemIds.slice(i, i + 20).join(',');
    const batchRes = fetchMeliApi(`/items?ids=${batchIds}`);
    batchRes.forEach(res => {
      if (res.code === 200 && res.body) {
        const b = res.body;
        // Obtener SKU de attributes o seller_custom_field
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

  // 3. Obtener órdenes de venta de los últimos 30 días
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

  Logger.log(`Total órdenes obtenidas (30d): ${orders.length}`);

  // 4. Procesar ventas por item ID (ultimos 30d y ultimos 7d)
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

  // 5. Generar filas para la hoja Inventario
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

  // 6. Calcular Rotación, Punto de Pedido y Sugerencia de Reposición
  const rotationRows = itemsData.map(item => {
    const v30 = itemSales30d[item.id] || 0;
    const v7 = itemSales7d[item.id] || 0;
    const vpd = v30 / 30; // Venta promedio diaria en los últimos 30 días
    const stock = item.available_quantity;

    // Días de Cobertura
    let diasCobertura = vpd > 0 ? Math.round((stock / vpd) * 10) / 10 : (stock > 0 ? 999 : 0);

    // Punto de Pedido = (VPD * LeadTime) + (VPD * SafetyStockDays)
    const puntoPedido = Math.ceil(vpd * (leadTime + safetyStockDays));

    // Sugerencia de Reposición
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

  // 7. Escribir resultados en Google Sheets
  writeToSheet(ss, 'Inventario', inventoryRows);
  writeToSheet(ss, 'Ventas_Historial', salesHistoryRows);
  writeToSheet(ss, 'Analisis_Rotacion', rotationRows);

  Logger.log('✅ Sincronización completada exitosamente.');
  if (SpreadsheetApp.getActiveSpreadsheet()) {
    SpreadsheetApp.getUi().alert(`✅ Sincronización de ${itemsData.length} publicaciones completada exitosamente.`);
  }
}

/**
 * Auxiliar para reemplazar el contenido de una hoja conservando los encabezados.
 */
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

/**
 * HTTP ENDPOINT (doGet)
 * Expone un servicio JSON que el Dashboard Frontend (GitHub Pages) puede consumir de forma transparente.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return responseJson({ error: 'Spreadsheet no activo' });
    }

    const rotationSheet = ss.getSheetByName('Analisis_Rotacion');
    const configSheet = ss.getSheetByName('Config');

    if (!rotationSheet) {
      return responseJson({ error: "La hoja 'Analisis_Rotacion' no ha sido creada. Ejecuta la sincronización." });
    }

    const data = rotationSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJson({ items: [], config: {}, updated: new Date().toISOString() });
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

    // Configuración actual
    const config = getConfig();

    return responseJson({
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
    });

  } catch (err) {
    return responseJson({ error: err.toString() });
  }
}

function responseJson(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
