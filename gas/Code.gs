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

// 🔑 COLOCA AQUÍ TU API KEY GRATUITA DE GOOGLE AI STUDIO:
const GEMINI_API_KEY = 'COLOCAR_AQUI_TU_API_KEY_DE_GEMINI';

function getValidAccessToken() {
  return ACTIVE_CREDENTIALS.ACCESS_TOKEN;
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
 * MOTOR IA GOOGLE GEMINI 1.5 FLASH: Generación de Respuestas Vendedoras Automatizadas
 */
function responderPreguntaConGemini(questionId, questionText, itemId) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('COLOCAR_AQUI')) {
    Logger.log('⚠️ Configura tu GEMINI_API_KEY en la línea 13 de Code.gs');
    return null;
  }

  // 1. Obtener la ficha actualizada del ítem de MeLi
  const itemData = fetchMeliApi(`/items/${itemId}`);
  const title = itemData.title || '';
  const price = itemData.price || 0;
  const stock = itemData.available_quantity || 0;

  // 2. Construir el Prompt Vendedor con RAG Context
  const systemPrompt = `Eres el asesor de ventas oficial de Darío en Mercado Libre Argentina.
Tu objetivo es responder la consulta de un comprador usando SOLO los datos del producto a continuación.

FICHA OFICIAL DEL PRODUCTO:
- Título: "${title}"
- Precio: $ ${price.toLocaleString('es-AR')} ARS
- Stock Disponible: ${stock} unidades

REGLAS DE RESPUESTA:
- Sé amable, cortés y profesional. Saluda con "¡Hola! Muchas gracias por tu consulta."
- Si el stock es 0 (Agotado), aclara amablemente que está temporalmente agotado y que gestionas el reingreso con la editorial, invitándolo a consultar por otros libros.
- Si hay stock, confirma la disponibilidad, el precio oficial y aclara que realizas envíos a todo el país mediante Mercado Envíos despachando en el día.
- Mantén la respuesta concisa (máximo 350 caracteres) lista para enviar a Mercado Libre.`;

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
    
    // 3. Publicar la respuesta en Mercado Libre a través de la API
    fetchMeliApi('/answers', 'post', {
      question_id: questionId,
      text: aiAnswer
    });

    Logger.log('✅ Pregunta respondida con IA exitosamente: ' + aiAnswer);
    return aiAnswer;
  } else {
    Logger.log('Error Gemini API: ' + response.getContentText());
    return null;
  }
}

/**
 * Webhook de Mercado Libre: Recibe notificaciones de nuevas preguntas
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
