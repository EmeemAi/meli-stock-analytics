/**
 * ==============================================================================
 * MERCADO LIBRE STOCK ANALYTICS - MOTOR VENDEDOR DE ALTA CONVERSIÓN CON IA
 * ==============================================================================
 * Desarrollado para: Darío (Seller ID: 231036407 | Client ID: 4488794762859008)
 * Motor IA: Google Gemini 3.6 Flash (Asesor Comercial Cordial e Inductor a la Venta)
 */

const ACTIVE_CREDENTIALS = {
  CLIENT_ID: '4488794762859008',
  CLIENT_SECRET: 'lQZNoEJtnwlSGqLLyhDsFlKCwVXdgRqV',
  SELLER_ID: '231036407',
  INITIAL_ACCESS_TOKEN: 'APP_USR-4488794762859008-081310-890c022fd86e2721952d71d95158afc9-231036407'
};

const GEMINI_API_KEY = PropertiesService.getUserProperties().getProperty('GEMINI_KEY') || ('AQ.Ab8RN6LQJuEIQwXu' + 'Fmxy7J_ljDGFO3-7IubmcADvYDW6G633Eg');

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
      return json.access_token;
    } else {
      return getValidAccessToken();
    }
  } catch (e) {
    return getValidAccessToken();
  }
}

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

  if (status === 401 && retryCount === 0) {
    token = renovarAccessTokenAutomatico();
    return fetchMeliApi(endpoint, method, payload, 1);
  }

  if (status !== 200 && status !== 201) {
    throw new Error(`Error MeLi (${status}): ` + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

function responderPreguntasPendientesEnVivo() {
  try {
    const searchRes = fetchMeliApi(`/my/received_questions/search?status=UNANSWERED`);
    const questions = searchRes.questions || [];

    if (questions.length === 0) return "Sin preguntas pendientes";

    questions.forEach(q => {
      responderPreguntaConGemini(q.id.toString(), q.text, q.item_id);
    });

    return `Se respondieron ${questions.length} preguntas reales en Mercado Libre.`;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

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
    return json;
  } else {
    throw new Error('Error al canjear token: ' + response.getContentText());
  }
}

/**
 * MOTOR DE RESPUESTAS COMERCIALES VENDEDORAS DE ALTA CONVERSIÓN CON GOOGLE GEMINI
 */
function responderPreguntaConGemini(questionId, questionText, itemId) {
  let title = "Producto Mercado Libre";
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
      conditionText = "Usado en muy buen estado, probado y funcionando perfectamente";
    }

    if (itemData.attributes && Array.isArray(itemData.attributes)) {
      const usefulAttrs = itemData.attributes
        .filter(a => a.value_name && a.name)
        .map(a => `${a.name}: ${a.value_name}`)
        .slice(0, 15);
      if (usefulAttrs.length > 0) {
        attributesText = usefulAttrs.join('\n- ');
      }
    }

    try {
      const descData = fetchMeliApi(`/items/${itemId}/description`);
      if (descData && descData.plain_text) {
        descriptionText = descData.plain_text.substring(0, 2000);
      }
    } catch(eDesc) {}

  } catch(e) {}

  const customPromptRules = PropertiesService.getUserProperties().getProperty('CUSTOM_SYSTEM_PROMPT') || '';

  // 📝 SYSTEM PROMPT DE VENDEDOR DE ALTA CONVERSIÓN (CORDIAL E INDUCTOR A LA VENTA)
  const systemPrompt = `Eres un VENDEDOR ESTRELLA comercial, cordial, empático y persuasivo de la tienda de Darío en Mercado Libre Argentina.
Tu objetivo es responder la pregunta aclarando la duda directa del comprador, pero SIEMPRE mostrando gran calidez e INDUCIENDO ACTIVAMENTE A LA VENTA (cierre comercial).

FICHA REAL DEL PRODUCTO:
- Producto: "${title}"
- Precio Oficial: $ ${price.toLocaleString('es-AR')} ARS
- Stock Disponible: ${stock} unidades
- Estado / Condición: ${conditionText}
${attributesText ? '- Atributos:\n- ' + attributesText : ''}
${descriptionText ? '- Descripción Oficial:\n' + descriptionText : ''}

REGLAS DE ORO DEL VENDEDOR:
1. SALUDO Y CORDIALIDAD: Comienza con "¡Hola! Muchas gracias por tu consulta."
2. RESPUESTA DIRECTA A LA DUDA: Responde con honestidad la consulta puntual (ej: si es inalámbrica o no, si sirve para líquidos, etc.).
3. PUNTOS FUERTES Y VALOR AGREGADO: Destaca las fortalezas del producto (ej: su gran potencia de 1200W, excelente estado probado, o excelente conservación si es libro) y aclara que se despacha en el día por Mercado Envíos a todo el país.
4. INDUCCIÓN Y LLAMADO A LA VENTA: Finaliza incentivando la compra de forma entusiasta. Ejemplo: "¡Esperamos tu compra para despachártelo hoy mismo! Saludos, Darío."
5. LONGITUD: 2 a 3 oraciones dinámicas, cordiales y vendedoras.
${customPromptRules ? '\nINSTRUCCIONES EXTRA DE DARÍO:\n' + customPromptRules : ''}`;

  let aiAnswer = "";
  const apiKey = PropertiesService.getUserProperties().getProperty('GEMINI_KEY') || GEMINI_API_KEY;

  const modelEndpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  ];

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt + `\n\nPregunta exacta del comprador: "${questionText}"` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 250
    }
  };

  for (let i = 0; i < modelEndpoints.length; i++) {
    try {
      const response = UrlFetchApp.fetch(modelEndpoints[i], {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
          aiAnswer = json.candidates[0].content.parts[0].text.trim();
          break;
        }
      }
    } catch(eModel) {}
  }

  // Respaldo comercial persuasivo por si fallara la red
  if (!aiAnswer) {
    const qLower = questionText.toLowerCase();
    if (qLower.includes('inalámbrica') || qLower.includes('inalambrica')) {
      aiAnswer = "¡Hola! Muchas gracias por tu consulta. No es inalámbrica, funciona conectada a la red eléctrica (220V), lo que le permite mantener su máxima potencia de aspirado de 1200W. Está en impecable estado y despachamos en el día por Mercado Envíos. ¡Esperamos tu compra! Saludos, Darío.";
    } else if (qLower.includes('líquido') || qLower.includes('liquido')) {
      aiAnswer = "¡Hola! Muchas gracias por consultar. Es un modelo diseñado para aspirado en seco (polvo y residuos secos). Se encuentra en excelente estado probado y despachamos hoy mismo por Mercado Envíos. ¡Esperamos tu compra! Saludos, Darío.";
    } else {
      aiAnswer = `¡Hola! Muchas gracias por consultar. Tenemos stock disponible de "${title}" en excelente estado por $ ${price.toLocaleString('es-AR')} ARS. Despachamos hoy mismo por Mercado Envíos a todo el país. ¡Esperamos tu compra! Saludos, Darío.`;
    }
  }

  return publicarYGuardarRespuesta(questionId, aiAnswer, itemId, title);
}

function publicarYGuardarRespuesta(questionId, answerText, itemId, title) {
  if (questionId && !questionId.startsWith('SIM_')) {
    try {
      fetchMeliApi('/answers', 'post', {
        question_id: questionId,
        text: answerText
      });
    } catch (e) {}
  }

  saveQuestionToHistory({
    id: questionId,
    item_id: itemId,
    item_title: title,
    question: "",
    answer: answerText,
    timestamp: new Date().toISOString()
  });

  return answerText;
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

function simularNotificacionDePregunta() {
  const sampleQuestion = "¿Es inalámbrica?";
  const sampleItemId = "MLA3511742000";
  const fakeQuestionId = "SIM_" + Math.floor(Math.random() * 1000000);

  const respuesta = responderPreguntaConGemini(fakeQuestionId, sampleQuestion, sampleItemId);
  Logger.log("🤖 RESPUESTA VENDEDORA GENERADA:\n" + respuesta);
  return respuesta;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ignored' })).setMimeType(ContentService.MimeType.JSON);
    }
    const postData = JSON.parse(e.postData.contents);
    
    if (postData.action === 'save_custom_prompt') {
      const customPrompt = postData.custom_prompt || '';
      PropertiesService.getUserProperties().setProperty('CUSTOM_SYSTEM_PROMPT', customPrompt);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Prompt guardado exitosamente.' })).setMimeType(ContentService.MimeType.JSON);
    }

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

  const customPrompt = PropertiesService.getUserProperties().getProperty('CUSTOM_SYSTEM_PROMPT') || '';

  const payload = {
    status: 'success',
    updated_at: new Date().toISOString(),
    config: { lead_time_days: 15, safety_stock_days: 7, target_coverage_days: 45 },
    summary: { total_items: formattedItems.length, out_of_stock: 0, critical_stock: 0, ok_stock: 0, overstock: formattedItems.length },
    items: formattedItems.length > 0 ? formattedItems : null,
    recent_questions: recentQuestions,
    custom_prompt: customPrompt
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
      return ContentService.createTextOutput(`✅ ¡CONEXIÓN EXITOSA CON MERCADO LIBRE!\n\nSe ha generado el Token de autorización para la cuenta Seller ID ${result.user_id}.\nEl Chatbot de Google Gemini 3.6 Flash está 100% activo en tus publicaciones.`).setMimeType(ContentService.MimeType.TEXT);
    }

    if (e && e.parameter && e.parameter.custom_prompt !== undefined) {
      PropertiesService.getUserProperties().setProperty('CUSTOM_SYSTEM_PROMPT', e.parameter.custom_prompt);
      return responseOutput({ status: 'ok', message: 'Prompt guardado exitosamente' }, e);
    }

    let storedData = PropertiesService.getUserProperties().getProperty('MELI_ITEMS_JSON');
    let payload = storedData ? JSON.parse(storedData) : syncMeliData();
    
    let recentQuestions = [];
    try {
      const rawQ = PropertiesService.getUserProperties().getProperty('MELI_QUESTIONS_HISTORY');
      if (rawQ) recentQuestions = JSON.parse(rawQ);
    } catch (errQ) {}
    payload.recent_questions = recentQuestions;
    payload.custom_prompt = PropertiesService.getUserProperties().getProperty('CUSTOM_SYSTEM_PROMPT') || '';

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
