const https = require('https');

const data = JSON.stringify({
  contents: [
    {
      role: 'user',
      parts: [
        { text: 'Eres el vendedor oficial en Mercado Libre. El producto es Aspiradora Trineo Top House 1200 W (Uso con cable de red eléctrica 220V). Pregunta: "¿Es inalámbrica?". Responde directo en 1 frase.' }
      ]
    }
  ]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBan-EQVb41rGA2YWk_03nSjN88go4v7JE',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', error => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
