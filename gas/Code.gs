/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 */

const ACTIVE_CREDENTIALS = {
  CLIENT_ID: '4488794762859008',
  CLIENT_SECRET: 'lQZNoEJtnwlSGqLLyhDsFlKCwVXdgRqV',
  ACCESS_TOKEN: 'APP_USR-4488794762859008-081310-890c022fd86e2721952d71d95158afc9-231036407',
  SELLER_ID: '231036407'
};

function getValidAccessToken() {
  return ACTIVE_CREDENTIALS.ACCESS_TOKEN;
}

function fetchMeliApi(endpoint) {
  let token = getValidAccessToken();
  let response = UrlFetchApp.fetch('https://api.mercadolibre.com' + endpoint, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error(`Error MeLi (${response.getResponseCode()}): ` + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

function syncMeliData() {
  const sellerId = ACTIVE_CREDENTIALS.SELLER_ID;
  let itemIds = [];
  let scrollOffset = 0;
  
  while (true) {
    const searchRes = fetchMeliApi(`/users/${sellerId}/items/search?offset=${scrollOffset}&limit=50`);
    const results = searchRes.results || [];
    itemIds = itemIds.concat(results);
    if (results.length < 50 || itemIds.length >= 1000) break;
    scrollOffset += 50;
  }

  let itemsData = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    const batchRes = fetchMeliApi(`/items?ids=` + itemIds.slice(i, i + 20).join(','));
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

  const formattedItems = itemsData.map(item => {
    const stock = item.available_quantity;
    return {
      id: item.id,
      sku: item.sku,
      title: item.title,
      stock: stock,
      sales_30d: 0,
      sales_7d: 0,
      vpd: 0,
      coverage_days: '∞ (Sin Ventas)',
      reorder_point: 0,
      reorder_suggested: 0,
      status: 'SOBRESTOCK',
      thumbnail: item.thumbnail
    };
  });

  const payload = {
    status: 'success',
    updated_at: new Date().toISOString(),
    config: { lead_time_days: 15, safety_stock_days: 7, target_coverage_days: 45 },
    summary: { total_items: formattedItems.length, out_of_stock: 0, critical_stock: 0, ok_stock: 0, overstock: formattedItems.length },
    items: formattedItems
  };

  PropertiesService.getUserProperties().setProperty('MELI_ITEMS_JSON', JSON.stringify(payload));
  PropertiesService.getUserProperties().setProperty('ACCESS_TOKEN', ACTIVE_CREDENTIALS.ACCESS_TOKEN);

  return payload;
}

function doGet(e) {
  try {
    const storedData = PropertiesService.getUserProperties().getProperty('MELI_ITEMS_JSON');
    const payload = storedData ? JSON.parse(storedData) : syncMeliData();
    return responseOutput(payload, e);
  } catch (err) {
    return responseOutput({ error: err.toString() }, e);
  }
}

function responseOutput(payload, e) {
  const jsonString = JSON.stringify(payload);
  const cb = e && e.parameter && (e.parameter.callback || e.parameter.prefix);
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + jsonString + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
}
