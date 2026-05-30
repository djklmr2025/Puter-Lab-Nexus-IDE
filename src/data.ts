export const DEFAULT_SCRIPT = `// NEXUS IDE v3 — ARKAIOS + ELEMIA + Puter + Claude
// ==============================================
// INTEGRACIÓN ARKAIOS:
//   window.ARKAIOS.fire(payload)       → dispara webhook n8n
//   window.ARKAIOS.imageGen(prompt)    → genera imagen via ARKAIOS
//   window.ARKAIOS.edu(action, data)   → petición educativa
//   window.ARKAIOS.elemia(event, src)  → clasifica con ELEMIA
//
// PUTER FS (sin API key propia):
//   puter.fs.write / read / mkdir / readdir
//   puter.kv.set / get / list
//   puter.ai.chat (500+ modelos GRATIS)
//   puter.hosting.create → .puter.site
//
// Ctrl+S = guardar | Ctrl+Enter = ejecutar
// ==============================================

// Ejemplo: generar imagen via ARKAIOS y guardarla en Puter
async function ejemplo() {
  console.log("Iniciando flujo de prueba de API...");

  // 1. Clasificar el inicio del evento con ELEMIA
  const ev = await window.ARKAIOS.elemia('IMAGE_REQUEST_START', 'nexus-ide');
  console.log('ELEMIA clasificó inicio:', ev.classification || 'Evento encolado');

  // 2. Generar imagen via webhook ARKAIOS → ELEMIA → ImageGen
  const img = await window.ARKAIOS.imageGen(
    'ciudad cyberpunk al amanecer, neon violet, arte digital, 4k'
  );
  console.log('Imagen generada:', img.ok || img.success ? 'OK' : 'ERROR/MOCK');

  // 3. Si hay base64 o respuesta exitosa, registrar en Puter KV
  await puter.kv.set('ultimo_status_remoto', 'completado_sin_errores');
  console.log('Sincronización de Puter KV completada.');
}

ejemplo();`;

export const SNIPS: Record<string, string> = {
  ark_fire: `// Disparar webhook ARKAIOS directamente
const resp = await window.ARKAIOS.fire({
  EVENT_TYPE: 'CUSTOM_EVENT',
  NOTES: 'Enviado desde NEXUS IDE',
  data: { clave: 'valor' }
});
console.log('ARKAIOS respondió:', resp);`,

  ark_image: `// Generar imagen via ARKAIOS → n8n → ImageGen API
const img = await window.ARKAIOS.imageGen(
  'ciudad cyberpunk al amanecer, neon violet, arte digital, 4k',
  'low quality, blurry, distorted'
);
if (img.ok && img.image_base64) {
  await puter.fs.write('img_resultado.b64', img.image_base64, { overwrite: true, createMissingParents: true });
  console.log('Imagen guardada en Puter FS');
  console.log('Autostart URL:', img.autostart_url);
}`,

  ark_edu: `// Petición educativa via ARKAIOS → EduPortal
const resp = await window.ARKAIOS.edu('generate_essay', {
  apiKey: 'aek_tu-clave',
  subject: 'Historia',
  grade: '6to primaria',
  topic: 'La Revolución Industrial'
});
console.log('EDU response:', resp);`,

  ark_elemia: `// Clasificar evento con ELEMIA via ARKAIOS/n8n
const ev = await window.ARKAIOS.elemia(
  'CUSTOM_EVENT',
  'nexus-ide',
  'Evento generado desde el IDE'
);
console.log('ELEMIA clasificó:', ev);`,

  ark_nexus: `// Hablar directamente con el Nexus Lab en Render
const resp = await window.ARKAIOS.nexusAgent(
  'Crea un archivo test.html con un contador en JavaScript',
  { projectPath: '/mi-proyecto' }
);
console.log('Nexus Lab respondió:', resp);`,

  fs_write: `await puter.fs.write('archivo.txt', 'Contenido del archivo', { overwrite: true, createMissingParents: true });`,

  fs_read: `const blob = await puter.fs.read('archivo.txt');
console.log(await blob.text());`,

  fs_mkdir: `await puter.fs.mkdir('carpeta', { createMissingParents: true });`,

  kv_set: `await puter.kv.set('clave', JSON.stringify({ dato: 'valor', ts: Date.now() }));`,

  ai_chat: `const r = await puter.ai.chat('Hola', { model: 'claude-3-5-sonnet' });
console.log(r.message.content[0].text);`,

  host_create: `await puter.hosting.create('mi-app', 'ruta/carpeta');
console.log('LIVE: https://mi-app.puter.site');`
};

export const TPLS: Record<string, string> = {
  full_pipeline: `// PIPELINE COMPLETO: ARKAIOS → ImageGen → Puter FS → Deploy
(async () => {
  console.log('🚀 Iniciando pipeline...');
  
  // 1. Generar imagen via ARKAIOS
  const img = await window.ARKAIOS.imageGen(
    'portada de app cyberpunk, gradiente púrpura y cyan, futurista, profesional'
  );
  console.log('ImageGen ARKAIOS:', img.ok ? '✅ OK' : '❌ ERROR');
  
  // 2. Crear proyecto en Puter FS
  const proj = 'arkaios-app-' + Date.now();
  await puter.fs.mkdir(proj, { createMissingParents: true });
  
  // 3. Guardar imagen si existe
  if (img.image_base64) {
    await puter.fs.write(proj + '/hero.b64', img.image_base64, { overwrite: true });
    console.log('✅ Imagen guardada en Puter FS');
  }
  
  // 4. Generar HTML con puter.ai (sin API key)
  const html = await puter.ai.chat(
    'Escribe solo el HTML+CSS de una landing page cyberpunk para una app de IA. Usa cyan y purple. Sin JS externo.',
    { model: 'claude-3-5-sonnet' }
  );
  const htmlContent = html.message.content[0].text.replace(/\\\`\\\`\\\`html?/g,'').replace(/\\\`\\\`\\\`/g,'').trim();
  await puter.fs.write(proj + '/index.html', htmlContent, { overwrite: true });
  
  // 5. Guardar metadata en KV
  await puter.kv.set('ark:' + proj, JSON.stringify({
    ts: new Date().toISOString(), imageOk: img.ok, autostartUrl: img.autostart_url
  }));
  
  // 6. Deploy
  await puter.hosting.create(proj, proj);
  console.log('🌐 LIVE: https://' + proj + '.puter.site');
  
  // 7. Notificar a ELEMIA
  await window.ARKAIOS.elemia('DEPLOY_COMPLETADO', 'nexus-ide', 'App desplegada: ' + proj);
  console.log('✅ Pipeline completado.');
})();`,

  image_to_web: `// ImageGen ARKAIOS → guardar en Puter → crear página con la imagen
(async () => {
  const prompt = prompt('¿Qué imagen generar?', 'ciudad futurista con IA, neon, 4k') || 'ciudad futurista';
  
  // Generar via ARKAIOS
  const img = await window.ARKAIOS.imageGen(prompt);
  if (!img.ok) { console.error('ImageGen falló:', img); return; }
  
  // Crear HTML que muestra la imagen
  const html = \`<!DOCTYPE html><html>
<head><meta charset="UTF-8"><title>\${prompt}</title>
<style>body{margin:0;background:#030306;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;font-family:monospace;color:#00ff88}
img{max-width:90vw;max-height:80vh;border:1px solid #00ff8833;border-radius:4px}
p{font-size:.8rem;color:#445566}\${''}</style></head>
<body><img src="data:image/png;base64,\${img.image_base64}" alt="\${prompt}">
<p>Generado por ARKAIOS · \${new Date().toLocaleString()}</p></body></html>\`;
  
  const slug = 'img-' + Date.now();
  await puter.fs.mkdir(slug, { createMissingParents: true });
  await puter.fs.write(slug + '/index.html', html, { overwrite: true });
  await puter.hosting.create(slug, slug);
  console.log('🌐 Imagen online: https://' + slug + '.puter.site');
})();`,

  elemia_monitor: `// Monitor ELEMIA: registrar y clasificar eventos en tiempo real
const SOURCES_AUTH = ['gemini-lab','eduacion-libre-proyecto-arkaios.vercel.app','arkaios-n8n.onrender.com','nexus-ide'];

async function monitorear(event, source, notes) {
  const authorized = SOURCES_AUTH.includes(source);
  console.log(\`[\${authorized ? '✅ AUTH' : '⚠️ DESCONOCIDO'}] \${event} desde \${source}\`);
  
  // Enviar a ELEMIA via ARKAIOS
  const result = await window.ARKAIOS.elemia(event, source, notes);
  
  // Guardar en KV para historial
  const key = 'elemia:' + Date.now();
  await puter.kv.set(key, JSON.stringify({ event, source, authorized, result, ts: new Date().toISOString() }));
  return result;
}

// Simular eventos
(async () => {
  await monitorear('USER_LOGIN', 'nexus-ide', 'Login desde IDE');
  await monitorear('IMAGE_REQUEST', 'gemini-lab', 'Petición imagen');
  await monitorear('UNKNOWN_ACCESS', 'ip-externa-123', 'Acceso no autorizado');
  const keys = await puter.kv.list();
  console.log('Eventos ELEMIA en KV:', keys.filter(k => k.startsWith('elemia:')).length);
})();`,

  bridge_python: `#!/usr/bin/env python3
# ============================================================
# NEXUS BRIDGE — Puente Python local para ARKAIOS
# Escucha tus respuestas de Claude y las reenvía al webhook
# ============================================================
# Uso: python3 nexus_bridge.py
# Luego pon el texto de Claude en el prompt, ctrl+D para enviar
# ============================================================
import re, sys, json, requests

ARKAIOS_WEBHOOK = "TU_WEBHOOK_URL"  # Pega la URL aquí
ARKAIOS_TOKEN   = "TU_TOKEN"        # Tu Header Auth token

def extract_payload(text):
    """Extrae bloques [ARK_PAYLOAD]...[/ARK_PAYLOAD] del texto de Claude"""
    matches = re.findall(r'\\[ARK_PAYLOAD\\]([\\s\\S]*?)\\[/ARK_PAYLOAD\\]', text)
    payloads = []
    for m in matches:
        try:
            payloads.append(json.loads(m.strip()))
        except:
            payloads.append({"raw": m.strip(), "EVENT_TYPE": "RAW_COMMAND"})
    return payloads

def fire(payload):
    headers = {
        "Content-Type": "application/json",
        "Authorization": ARKAIOS_TOKEN
    }
    r = requests.post(ARKAIOS_WEBHOOK, json=payload, headers=headers, timeout=30)
    return r.json()

if __name__ == "__main__":
    print("NEXUS BRIDGE activo. Pega respuesta de Claude (ctrl+D para enviar):")
    text = sys.stdin.read()
    payloads = extract_payload(text)
    if not payloads:
        print("No se encontraron bloques [ARK_PAYLOAD] en el texto.")
    for p in payloads:
        print(f"Disparando: {json.dumps(p)[:80]}...")
        result = fire(p)
        print(f"Respuesta ARKAIOS: {result}")`,

  n8n_node: `// NODO n8n ADICIONAL: recibir instrucciones del NEXUS IDE → reenviar al Nexus Lab
// Agregar este nodo al workflow ARKAIOS v3.3
// Posición sugerida: después del Router ARKAIOS, rama para EVENT_TYPE = 'NEXUS_IDE_EVENT'
{
  "parameters": {
    "jsCode": "// Nodo: Proxy NEXUS IDE → Nexus Lab\\\\nconst body = $('Router ARKAIOS').first().json;\\\\nconst nexusUrl = 'https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app';\\\\n\\\\n// Solo procesar si viene del IDE\\\\nif (body._source !== 'nexus-ide') return [];\\\\n\\\\nreturn [{ json: {\\\\n  _nexusUrl: nexusUrl + '/api/agent',\\\\n  _nexusPayload: {\\\\n    message: body.NOTES || body.message || '',\\\\n    context: body.data || {},\\\\n    source: 'nexus-ide-via-arkaios',\\\\n    ts: new Date().toISOString()\\\\n  }\\\\n}}];",
    "type": "n8n-nodes-base.code",
    "name": "NEXUS IDE → Nexus Lab Proxy"
  }
}`
};
