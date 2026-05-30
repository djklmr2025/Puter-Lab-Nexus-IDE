import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI client to prevent startup failure if apiKey is delayed
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Set it under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// REST API endpoint for the Nexus Gemini Agent
app.post("/api/agent", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "El mensaje es obligatorio." });
      return;
    }

    const gemini = getGemini();

    const systemInstruction = `Eres NEXUS, un agente de desarrollo avanzado integrado con el SDK de Puter.com en el navegador.

Como copiloto con control directo de la estación Puter Lab, puedes interactuar directamente con el filesystem (puter.fs), la base de datos (puter.kv), el hosting (puter.hosting) o realizar consultas inteligentes de IA (puter.ai) o serverless (puter.workers).

Para indicarle al entorno interactivo de Nexus que ejecute código JavaScript en la máquina virtual del cliente, genera bloques de código de JavaScript válido envueltos estrictamente en la etiqueta:
[EXECUTE_JS]
// Tu código de automatización aquí
[/EXECUTE_JS]

En la máquina virtual del navegador existe una variable global 'puter' completamente disponible y autenticada. Métodos clave recomendados:
- puter.fs.write(path, content, { overwrite: true, createMissingParents: true }) // Guarda un archivo. El contenido puede ser HTML/CSS/JS.
- puter.fs.read(path) -> Retorna un Blob. Puedes invocar .text() para examinar el string.
- puter.fs.mkdir(path, { createMissingParents: true }) // Crea carpetas.
- puter.fs.readdir(path) // Lista archivos.
- puter.fs.delete(path, { recursive: true }) // Borra archivos o dirs.
- puter.fs.getReadURL(path) -> Obtiene la URL pública de lectura.
- puter.kv.set(key, value) // Llave-valor rápida.
- puter.kv.get(key)
- puter.kv.list() // Retorna llaves registradas.
- puter.kv.del(key)
- puter.ai.chat(prompt, { model }) // Modelos gratuitos de alta fidelidad.
- puter.ai.txt2img(prompt)
- puter.hosting.create(subdomain, dirPath) // Despliega la carpeta dada a la web gratis en: https://<subdomain>.puter.site
- puter.hosting.list() // Sitios activos.
- puter.hosting.delete(subdomain)

Reglas de respuesta de NEXUS:
1. Proporciona explicaciones breves, entusiastas y orientadas a la programación en español. Elige siempre nombres lógicos, profesionales y limpios para tus aplicaciones.
2. Identifica si el usuario desea desplegar una página, crear un módulo, almacenar un valor o explorar un directorio.
3. Genera bloques [EXECUTE_JS] autocontenidos y listos para ejecutarse para agilizar el trabajo del usuario. 
4. Si construyes landing pages o aplicaciones HTML, diséñalas con interfaces oscuras elegantes, tipografías Space Grotesk o Inter, y Tailwind CSS importado mediante CDN (script de tailwind o un link css moderno de alta gama) para que se vean deslumbrantes.`;

    // Map history to model-compliant structure
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }]
        });
      }
    }
    
    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in Agent API Route:", error);
    res.status(500).json({ error: error.message || "Ocurrió un error inesperado al invocar al Agente." });
  }
});

// Configure Vite in development mode or serve distribution package in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ NEXUS Servidor web listo en: http://localhost:${PORT}`);
  });
}

startServer();
