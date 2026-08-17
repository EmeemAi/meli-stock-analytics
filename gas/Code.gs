/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - BACKEND EMPRESARIAL MULTI-CATEGORÍA CON IA
 * ==============================================================================
 * Desarrollado para: Darío (Seller ID: 231036407 | Client ID: 4488794762859008)
 * Motor IA: Google Gemini 1.5 Flash (Soporte Universal: Libros, Electrodomésticos, Digital)
 * Auto-Renovación de Tokens OAuth 2.0 + Lector de Descripción y Atributos MeLi
 */

const ACTIVE_CREDENTIALS = {
  CLIENT_ID: '4488794762859008',
  CLIENT_SECRET: 'lQZNoEJtnwlSGqLLyhDsFlKCwVXdgRqV',
  SELLER_ID: '231036407',
  INITIAL_ACCESS_TOKEN: 'APP_USR-4488794762859008-081310-890c022fd86e2721952d71d95158afc9-231036407'
};

// 🔑 CLAVE DE API OFICIAL DE GOOGLE GEMINI 1.5 FLASH DE DARÍO
const GEMINI_API_KEY = 'AIzaSyBan-EQVb41rGA2YWk_03nSjN88go4v7JE';

/**
 * GESTOR DE TOKENS OAUTH 2.0 CON AUTO-RENOVACIÓN AUTOMÁTICA
 */
function getValidAccessToken() {
  const props = PropertiesService.getUserProperties();
  let token = props.getProperty('ACCESS_TOKEN');
  if (!token) {
    token = ACTIVE_CREDENTIALS.INITIAL_ACCESS_TOKEN;
    props.setProperty('ACCESS_TOKEN', token);
  }
  return token;
}

function renovarAccessTokenAutomatico() {
  const props = PropertiesService.getUserProperties();
  const refreshToken = props.getProperty('REFRESH_TOKEN');
  
  if (!refreshToken) {
    Logger.log('⚠️ Usando token activo guardado.');
    return getValidAccessToken();
  }

  const url = 'https://api.mercadolibre.com/oauth/token';
  const payload = {
    grant_type: 'refresh_token',
    client_id: ACTIVE_CREDENTIALS.CLIENT_ID,
    client_secret: ACTIVE_CREDENTIALS.CLIENT_SECRET,
    refresh_token: refreshToken
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const json = JSON.parse(response.getContentText());
      props.setProperty('ACCESS_TOKEN', json.access_token);
      props.setProperty('REFRESH_TOKEN', json.refresh_token);
      Logger.log('✅ Access Token renovado exitosamente de forma automática.');
      return json.access_token;
    } else {
      Logger.log('Error renovando token: ' + response.getContentText());
      return getValidAccessToken();
    }
  } catch (e) {
    Logger.log('Excepción al renovar token: ' + e.toString());
    return getValidAccessToken();
  }
}

/**
 * CLIENTE API MERCADO LIBRE CON REINTENTO AUTOMÁTICO EN CASO DE TOKEN EXPIRADO (401)
 */
function fetchMeliApi(endpoint, method = 'get', payload = null, retryCount = 0) {
  let token = getValidAccessToken();
  const options = {
    method: method,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);

  let response = UrlFetchApp.fetch('https://api.mercadolibre.com' + endpoint, options);
  const status = response.getResponseCode();

  // Si el token expiró (401), renovamos de forma automática y reintentamos 1 vez
  if (status === 401 && retryCount === 0) {
    Logger.log('🔄 Token expirado (401). Ejecutando renovación automática...');
    token = renovarAccessTokenAutomatico();
    return fetchMeliApi(endpoint, method, payload, 1);
  }

  if (status !== 200 && status !== 201) {
    throw new Error(`Error MeLi (${status}): ` + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

/**
 * BUSCADOR Y RESPONDEDOR EN VIVO DE PREGUNTAS PENDIENTES REALES
 */
function responderPreguntasPendientesEnVivo() {
  Logger.log("🔎 Escaneando la cuenta de Mercado Libre en busca de preguntas pendientes...");
  try {
    const searchRes = fetchMeliApi(`/my/received_questions/search?status=UNANSWERED`);
    const questions = searchRes.questions || [];
    Logger.log(`📌 Se encontraron ${questions.length} preguntas pendientes sin responder.`);

    if (questions.length === 0) {
      Logger.log("✅ No hay preguntas pendientes en la cuenta.");
      return "Sin preguntas pendientes";
    }

    questions.forEach(q => {
      Logger.log(`🚀 Procesando pregunta real ID ${q.id}: "${q.text}" en el producto ${q.item_id}...`);
      responderPreguntaConGemini(q.id.toString(), q.text, q.item_id);
    });

    return `Se respondieron ${questions.length} preguntas reales en Mercado Libre.`;
  } catch (e) {
    Logger.log("Excepción buscando preguntas pendientes: " + e.toString());
    return "Error: " + e.toString();
  }
}

/**
 * CANJE AUTOMÁTICO DE CÓDIGO OAUTH
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
    const props = PropertiesService.getUserProperties();
    props.setProperty('ACCESS_TOKEN', json.access_token);
    props.setProperty('REFRESH_TOKEN', json.refresh_token);
    props.setProperty('SELLER_ID', json.user_id.toString());
    Logger.log('✅ Conexión completada. Access Token: ' + json.access_token);
    return json;
  } else {
    throw new Error('Error al canjear token: ' + response.getContentText());
  }
}

/**
 * MOTOR IA GOOGLE GEMINI 1.5 FLASH: MOTOR UNIVERSAL MULTI-CATEGORÍA
 * Lee automáticamente Descripción Completa y Atributos Técnicos para cualquier producto (Aspiradoras, Libros, etc.)
 */
function responderPreguntaConGemini(questionId, questionText, itemId) {
  let title = "Producto de Darío en Mercado Libre";
  let price = 0;
  let stock = 1;
  let conditionText = "Usado en muy buen estado";
  let descriptionText = "";
  let attributesText = "";

  try {
    const itemData = fetchMeliApi(`/items/${itemId}`);
    title = itemData.title || title;
    price = itemData.price || price;
    stock = itemData.available_quantity !== undefined ? itemData.available_quantity : stock;
    
    if (itemData.condition === 'new') {
      conditionText = "Nuevo en caja original";
    } else if (itemData.condition === 'used') {
      conditionText = "Usado en muy buen estado, muy bien conservado y probado";
    }

    // Extraer atributos técnicos oficiales (accesorios, marca, potencia, voltaje, etc.)
    if (itemData.attributes && Array.isArray(itemData.attributes)) {
      const usefulAttrs = itemData.attributes
        .filter(a => a.value_name && a.name)
        .map(a => `${a.name}: ${a.value_name}`)
        .slice(0, 10);
      if (usefulAttrs.length > 0) {
        attributesText = usefulAttrs.join('\n- ');
      }
    }

    // Extraer la Descripción Oficial redactada por Darío en la publicación
    try {
      const descData = fetchMeliApi(`/items/${itemId}/description`);
      if (descData && descData.plain_text) {
        descriptionText = descData.plain_text.substring(0, 1500);
      }
    } catch(eDesc) {}

  } catch(e) {
    Logger.log("Aviso: Usando ficha técnica básica para el ítem " + itemId);
  }

  const isDigital = itemId === 'MLA3552682426' || itemId === 'MLA2040505392' || itemId === 'MLA1458925371' || title.toLowerCase().includes('pdf') || title.toLowerCase().includes('imprimible');

  // 📝 SYSTEM PROMPT UNIVERSAL INTELIGENTE MULTI-CATEGORÍA
  const systemPrompt = `Eres el asesor oficial de ventas de Darío en Mercado Libre Argentina.
Tu objetivo es responder la consulta de un comprador utilizando ÚNICAMENTE los datos oficiales del producto a continuación.

FICHA OFICIAL DEL PRODUCTO:
- Título Oficial: "${title}"
- Precio Oficial: $ ${price.toLocaleString('es-AR')} ARS
- Stock Disponible: ${stock} unidades
- Estado / Condición: ${conditionText}
${attributesText ? '- Atributos Técnicos:\n- ' + attributesText : ''}
${descriptionText ? '- Descripción Oficial de la Publicación:\n' + descriptionText : ''}

REGLAS STRICTAS DE RESPUESTA:
1. Saludo cordial: Comienza siempre con "¡Hola! Muchas gracias por tu consulta."
2. RECONOCIMIENTO DE CATEGORÍA:
   - Identifica el tipo de producto por su título (ej: si es una Aspiradora o Electrodoméstico, responde sobre la aspiradora; si es un Libro, responde sobre el libro). NUNCA llames "libro" a un electrodoméstico o producto que no sea un libro.
3. CONSULTAS DE ACCESORIOS / ESPECIFICACIONES:
   - Si el comprador pregunta qué incluye, accesorios, potencia o detalles técnicos, busca la información en la Descripción Oficial y Atributos arriba provistos y responde con precisión exacta.
4. ESTADO Y CONDICIÓN:
   - Si es un producto Usado, aclara que está usado en muy buen estado y funcionando perfectamente. Si es Nuevo, confirma nuevo.
5. GESTIÓN DE STOCK Y ENVÍO:
   - Si el stock es 0 (Agotado), aclara amablemente que está temporalmente agotado.
   - Si es producto digital, aclara entrega e impresión digital inmediata en PDF.
   - Si hay stock físico, confirma precio ($ ${price.toLocaleString('es-AR')} ARS) y despacho en el día por Mercado Envíos a todo el país.
6. Cierre conciso (máximo 350 caracteres): "¡Esperamos tu compra! Saludos, Darío."`;

  let aiAnswer = "";

  // Llamada a Google Gemini 1.5 Flash con la API Key real de Darío
  if (GEMINI_API_KEY) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `Pregunta del Comprador: "${questionText}"` }
        ]
      }]
    };

    try {
      const response = UrlFetchApp.fetch(geminiUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        aiAnswer = json.candidates[0].content.parts[0].text.trim();
      }
    } catch(e) {
      Logger.log("Excepción llamando a Gemini: " + e.toString());
    }
  }

  // Fallback de respaldo universal
  if (!aiAnswer) {
    if (stock === 0) {
      aiAnswer = `¡Hola! Muchas gracias por tu consulta. Te comento que "${title}" se encuentra temporalmente AGOTADO. Saludos cordiales, Darío.`;
    } else if (isDigital) {
      aiAnswer = `¡Hola! Sí, tenemos stock disponible. El envío es digital e inmediato en formato PDF listo para descargar. ¡Esperamos tu compra! Saludos, Darío.`;
    } else {
      aiAnswer = `¡Hola! Muchas gracias por consultar. "${title}" se encuentra disponible por $ ${price.toLocaleString('es-AR')} ARS en excelente estado. Despachamos en el día por Mercado Envíos a todo el país. ¡Esperamos tu compra! Saludos, Darío.`;
    }
  }

  // 1. Publicar la respuesta EN VIVO en Mercado Libre mediante la API
  if (questionId && !questionId.startsWith('SIM_')) {
    try {
      fetchMeliApi('/answers', 'post', {
        question_id: questionId,
        text: aiAnswer
      });
      Logger.log(`✅ Respuesta publicada exitosamente en Mercado Libre para la pregunta ${questionId}: ${aiAnswer}`);
    } catch (e) {
      Logger.log('Aviso enviando respuesta a MeLi: ' + e.toString());
    }
  }

  // 2. Guardar en el Historial de Preguntas Recibidas en Vivo
  saveQuestionToHistory({
    id: questionId,
    item_id: itemId,
    item_title: title,
    question: questionText,
    answer: aiAnswer,
    timestamp: new Date().toISOString()
  });

  Logger.log('✅ Pregunta procesada e historial actualizado: ' + aiAnswer);
  return aiAnswer;
}

function saveQuestionToHistory(qObj) {
  let history = [];
  try {
    const raw = PropertiesService.getUserProperties().getProperty('MELI_QUESTIONS_HISTORY');
    if (raw) history = JSON.parse(raw);
  } catch (e) {}
  
  history = history.filter(h => h.id !== qObj.id);
  history.unshift(qObj);

  if (history.length > 30) history = history.slice(0, 30);
  PropertiesService.getUserProperties().setProperty('MELI_QUESTIONS_HISTORY', JSON.stringify(history));
}

/**
 * TEST DIRECTO: Ejecutar en Apps Script para verificar funcionamiento de Gemini y Notificaciones
 */
function simularNotificacionDePregunta() {
  const sampleQuestion = "¿Qué accesorios incluye la compra?";
  const sampleItemId = "MLA3511742000";
  const fakeQuestionId = "SIM_" + Math.floor(Math.random() * 1000000);

  Logger.log("🚀 Simulando pregunta entrante en tiempo real...");
  const respuesta = responderPreguntaConGemini(fakeQuestionId, sampleQuestion, sampleItemId);
  Logger.log("🤖 RESPUESTA GENERADA:\n" + respuesta);
  return respuesta;
}

/**
 * Webhook de Mercado Libre: Recibe notificaciones en tiempo real de nuevas preguntas
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    if (postData && (postData.topic === 'questions' || postData.topic === 'messages')) {
      const resource = postData.resource || '';
      const questionId = resource.split('/').pop();
      
      if (questionId) {
        let questionData = { text: "Consulta sobre producto", item_id: "MLA3511742000", status: "UNANSWERED" };
        try {
          questionData = fetchMeliApi(`/questions/${questionId}`);
        } catch(errQ) {}

        if (questionData && (questionData.status === 'UNANSWERED' || !questionData.status)) {
          responderPreguntaConGemini(questionId, questionData.text || "Consulta de stock", questionData.item_id || "MLA3511742000");
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncMeliData() {
  try {
    responderPreguntasPendientesEnVivo();
  } catch(e) {}

  const sellerId = ACTIVE_CREDENTIALS.SELLER_ID;
  let itemIds = [];
  let scrollOffset = 0;
  
  while (true) {
    try {
      const searchRes = fetchMeliApi(`/users/${sellerId}/items/search?offset=${scrollOffset}&limit=50`);
      const results = searchRes.results || [];
      itemIds = itemIds.concat(results);
      if (results.length < 50 || itemIds.length >= 1000) break;
      scrollOffset += 50;
    } catch(e) {
      break;
    }
  }

  let itemsData = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    try {
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
    } catch(e) {}
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

  let recentQuestions = [];
  try {
    const rawQ = PropertiesService.getUserProperties().getProperty('MELI_QUESTIONS_HISTORY');
    if (rawQ) recentQuestions = JSON.parse(rawQ);
  } catch (e) {}

  const payload = {
    status: 'success',
    updated_at: new Date().toISOString(),
    config: { lead_time_days: 15, safety_stock_days: 7, target_coverage_days: 45 },
    summary: { total_items: formattedItems.length, out_of_stock: 0, critical_stock: 0, ok_stock: 0, overstock: formattedItems.length },
    items: formattedItems.length > 0 ? formattedItems : null,
    recent_questions: recentQuestions
  };

  if (formattedItems.length > 0) {
    PropertiesService.getUserProperties().setProperty('MELI_ITEMS_JSON', JSON.stringify(payload));
  }

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

    let storedData = PropertiesService.getUserProperties().getProperty('MELI_ITEMS_JSON');
    let payload = storedData ? JSON.parse(storedData) : syncMeliData();
    
    let recentQuestions = [];
    try {
      const rawQ = PropertiesService.getUserProperties().getProperty('MELI_QUESTIONS_HISTORY');
      if (rawQ) recentQuestions = JSON.parse(rawQ);
    } catch (errQ) {}
    payload.recent_questions = recentQuestions;

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
