/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS BACKEND + CHATBOT IA GEMINI 1.5 FLASH
 * ==============================================================================
 */

const ACTIVE_CREDENTIALS = {
  CLIENT_ID: '4488794762859008',
  CLIENT_SECRET: 'lQZNoEJtnwlSGqLLyhDsFlKCwVXdgRqV',
  ACCESS_TOKEN: 'APP_USR-4488794762859008-081310-890c022fd86e2721952d71d95158afc9-231036407',
  SELLER_ID: '231036407'
};

const GEMINI_API_KEY = 'TU_API_KEY_DE_GEMINI_AQUI';

function getValidAccessToken() {
  const savedToken = PropertiesService.getUserProperties().getProperty('ACCESS_TOKEN');
  return savedToken || ACTIVE_CREDENTIALS.ACCESS_TOKEN;
}

function fetchMeliApi(endpoint, method = 'get', payload = null) {
  let token = getValidAccessToken();
  const options = {
    method: method,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);

  let response = UrlFetchApp.fetch('https://api.mercadolibre.com' + endpoint, options);
  if (response.getResponseCode() !== 200 && response.getResponseCode() !== 201) {
    throw new Error(`Error MeLi (${response.getResponseCode()}): ` + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

/**
 * CANJE AUTOMÁTICO DE CÓDIGO OAUTH: Genera y renueva Tokens de por vida
 */
function intercambiarCodigoPorTokens(code, redirectUri) {
  const url = 'https://api.mercadolibre.com/oauth/token';
  const payload = {
    grant_type: 'authorization_code',
    client_id: ACTIVE_CREDENTIALS.CLIENT_ID,
    client_secret: ACTIVE_CREDENTIALS.CLIENT_SECRET,
    code: code,
    redirect_uri: redirectUri
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 200) {
    const json = JSON.parse(response.getContentText());
    PropertiesService.getUserProperties().setProperty('ACCESS_TOKEN', json.access_token);
    PropertiesService.getUserProperties().setProperty('REFRESH_TOKEN', json.refresh_token);
    PropertiesService.getUserProperties().setProperty('SELLER_ID', json.user_id.toString());
    Logger.log('✅ Token renovado exitosamente: ' + json.access_token);
    return json;
  } else {
    throw new Error('Error al canjear token: ' + response.getContentText());
  }
}

/**
 * MOTOR IA GOOGLE GEMINI 1.5 FLASH: Responde y publica automáticamente en Mercado Libre
 */
function responderPreguntaConGemini(questionId, questionText, itemId) {
  const itemData = fetchMeliApi(`/items/${itemId}`);
  const title = itemData.title || '';
  const price = itemData.price || 0;
  const stock = itemData.available_quantity || 0;

  const systemPrompt = `Eres el asesor de ventas oficial de la librería de Darío en Mercado Libre Argentina.
Tu objetivo es responder la consulta de un comprador usando SOLO los datos del producto a continuación.

FICHA OFICIAL DEL PRODUCTO:
- Título: "${title}"
- Precio: $ ${price.toLocaleString('es-AR')} ARS
- Stock Disponible: ${stock} unidades

REGLAS DE RESPUESTA:
- Sé amable, cortés y profesional. Saluda con "¡Hola! Muchas gracias por tu consulta."
- Si el stock es 0 (Agotado), aclara amablemente que está temporalmente agotado y que gestionas el reingreso con la editorial.
- Si hay stock, confirma disponibilidad, precio oficial y aclara envíos por Mercado Envíos despachando en el día.
- Mantén la respuesta concisa (máximo 350 caracteres).`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { text: `Pregunta del Comprador: "${questionText}"` }
      ]
    }]
  };

  const response = UrlFetchApp.fetch(geminiUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 200) {
    const json = JSON.parse(response.getContentText());
    const aiAnswer = json.candidates[0].content.parts[0].text.trim();
    
    // Publicar la respuesta en Mercado Libre a través de la API
    fetchMeliApi('/answers', 'post', {
      question_id: questionId,
      text: aiAnswer
    });

    Logger.log('✅ Pregunta respondida y enviada a Mercado Libre: ' + aiAnswer);
    return aiAnswer;
  } else {
    Logger.log('Error Gemini API: ' + response.getContentText());
    return null;
  }
}

/**
 * Webhook de Mercado Libre: Recibe notificaciones en tiempo real de nuevas preguntas
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    if (postData && postData.topic === 'questions') {
      const questionId = postData.resource.split('/').pop();
      const questionData = fetchMeliApi(`/questions/${questionId}`);
      
      if (questionData && questionData.status === 'UNANSWERED') {
        responderPreguntaConGemini(questionId, questionData.text, questionData.item_id);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
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
      price: item.price,
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
  return payload;
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.code) {
      const code = e.parameter.code;
      const redirectUri = 'https://script.google.com/macros/s/AKfycbyK0LZ0mmU9vE9oV2Xo6C2Ca6a0yDD_WfJK2RO9CSfz1_I6y7joeyiSiSxR9dA6E7XT/exec';
      const result = intercambiarCodigoPorTokens(code, redirectUri);
      return ContentService.createTextOutput(`✅ ¡CONEXIÓN EXITOSA CON MERCADO LIBRE!\n\nSe ha generado el Token de autorización para la cuenta Seller ID ${result.user_id}.\nEl Chatbot de Google Gemini 1.5 Flash está 100% activo en tus publicaciones.`).setMimeType(ContentService.MimeType.TEXT);
    }

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
