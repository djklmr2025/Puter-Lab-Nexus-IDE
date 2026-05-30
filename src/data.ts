export const DEFAULT_SCRIPT = `// NEXUS AGENT IDE — Puter.js Script
// ===================================
// Pruebas directas de Puter.js SDK.
// Para ejecutar, pulsa el botón "▶ EJECUTAR" o (Ctrl + Enter)
// ===================================

async function testPuter() {
  console.log("¡Inicializando entorno Puter Lab! 🚀");
  
  // 1. Crear carpeta de pruebas
  const folderName = "puter-lab-docs";
  await puter.fs.mkdir(folderName, { createMissingParents: true });
  console.log("✓ Carpeta creada: " + folderName);
  
  // 2. Escribir un archivo
  const filePath = folderName + "/welcome.txt";
  await puter.fs.write(filePath, "Hola mundo desde Puter Lab & Nexus IDE. " + new Date().toISOString(), { overwrite: true });
  console.log("✓ Archivo welcome.txt escrito en: " + filePath);
  
  // 3. Registrar un valor en KV store
  await puter.kv.set("ultimo_test", new Date().toLocaleString());
  const actualVal = await puter.kv.get("ultimo_test");
  console.log("✓ Key-Value registrado con éxito: ultimo_test = " + actualVal);
  
  console.log("--- ¡Entorno de prueba listo! ---");
}

testPuter();`;

export const TEMPLATES = {
  landing: `// TEMPLATE: Landing Page + Deploy Automático
(async () => {
  console.log("Generando Landing Page...");
  const appFolder = "landing-app-" + Date.now();
  
  // Crear carpeta
  await puter.fs.mkdir(appFolder, { createMissingParents: true });
  
  // Escribir HTML + CSS (Tailwind CSS integrado)
  const htmlContent = \`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Puter Lab Startup Hub</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Space Grotesk', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
    
    <header class="max-w-6xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div class="text-emerald-400 font-bold text-xl tracking-wider">⚡ PUTER_LAB</div>
        <a href="https://puter.com" target="_blank" class="text-slate-400 hover:text-white transition text-sm">Puter Homepage</a>
    </header>

    <main class="max-w-4xl mx-auto px-6 text-center py-20 flex-1 flex flex-col justify-center">
        <span class="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400 mb-4 inline-block bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">LIVE HOSTED ON PUTER.SITE</span>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            La Próxima Era del Hosting Descentralizado
        </h1>
        <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Esta landing page fue creada, guardada en un sistema de archivos en la nube y puesta en producción directamente mediante Puter.js SDK.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button onclick="alert('¡Gracias por registrarte! Puter.kv persistirá tu interés.')" class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-8 py-3 rounded-lg transition shadow-lg shadow-emerald-500/20 cursor-pointer">
                Comenzar de Inmediato
            </button>
            <a href="https://developer.puter.com" target="_blank" class="border border-slate-700 hover:border-slate-500 text-slate-200 px-8 py-3 rounded-lg transition flex items-center justify-center">
                Documentación SDK
            </a>
        </div>
    </main>

    <footer class="max-w-6xl mx-auto w-full px-6 py-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-4">
        <div>© \${new Date().getFullYear()} Puter Lab & Nexus IDE. Creado con amor.</div>
        <div class="flex gap-4">
            <span>Power of Sandbox filesystem</span>
            <span>•</span>
            <span>Instant CD</span>
        </div>
    </footer>

</body>
</html>\`;

  await puter.fs.write(appFolder + "/index.html", htmlContent, { overwrite: true });
  console.log("✓ Archivo HTML guardado en Puter FS.");

  // Configurar Hosting Gratuito instantáneo
  const sub = "startup-" + Math.floor(Math.random() * 9000 + 1000);
  const site = await puter.hosting.create(sub, appFolder);
  
  console.log("🚀 ¡DEPLEGADO CON ÉXITO!");
  console.log("URL de tu sitio web: " + site.url);
})();`,

  kvdb: `// TEMPLATE: Base de Datos KV CRUD con Puter.kv
(async () => {
  console.log("--- Inicializando Base de Datos Key-Value ---");
  
  // Definir clave principal de nuestra base de datos
  const DB_KEY = "nexus_db_tasks";
  
  // 1. Crear un estado de tareas inicial
  const demoTasks = [
    { id: 1, text: "Configurar conexión Puter.js", done: true },
    { id: 2, text: "Habilitar soporte Gemini AI", done: true },
    { id: 3, text: "Desplegar primera landing", done: false }
  ];
  
  // Guardar en la KV
  await puter.kv.set(DB_KEY, JSON.stringify(demoTasks));
  console.log("✓ Tareas predeterminadas inicializadas en: " + DB_KEY);
  
  // 2. Leer datos nuevamente para confirmar escritura
  const rawData = await puter.kv.get(DB_KEY);
  const tasks = JSON.parse(rawData);
  console.log("✓ Datos recuperados de KV Store:");
  tasks.forEach(t => {
    console.log(\`  [\${t.done ? "✓" : " "}] \${t.text} (ID: \${t.id})\`);
  });
  
  // 3. Editar una tarea (marcar ID 3 como completado)
  const updatedTasks = tasks.map(t => t.id === 3 ? { ...t, done: true } : t);
  await puter.kv.set(DB_KEY, JSON.stringify(updatedTasks));
  console.log("✓ Tarea 3 modificada y guardada en KV.");
  
  // 4. Mostrar estado final
  const rawFinal = await puter.kv.get(DB_KEY);
  console.log("✓ Listado Actualizado: " + rawFinal);
})();`,

  aimodels: `// TEMPLATE: Puter.ai API (Chat multi-modelo gratis)
(async () => {
  console.log("Consultando con puter.ai...");
  
  try {
    const prompt = "¿Cuáles son las 3 ventajas principales de usar Puter.js en aplicaciones frontend?";
    console.log("Enviando Prompt: '" + prompt + "' a claude-3-5-sonnet...");
    
    // Puter.ai permite acceder a múltiples modelos libremente usando tu propia cuenta Puter.
    const response = await puter.ai.chat(prompt, {
      model: "claude-3-5-sonnet"
    });
    
    console.log("--- RESPUESTA DE LA IA ---");
    console.log(response.message.content[0].text);
    console.log("------------------------");
    
  } catch (err) {
    console.error("Error al consultar puter.ai:", err);
  }
})();`
};
