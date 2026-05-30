# ⚡ NEXUS AGENT IDE v3 — ARKAIOS · ELEMIA · Puter · Claude

## 📌 Protocolo de Orquestación y Documentación para IAs / Co-Pilotos

Este repositorio (`NEXUS IDE v3`) es un entorno integrado de desarrollo diseñado como una **consola de ejecución y automatización en vivo**. Funciona como un centro de operaciones bidireccional entre Agentes de Inteligencia Artificial (Gemini, Claude, GPTs o bots locales) y la máquina virtual segura de **Puter.js** en el navegador del usuario.

Este documento está optimizado para que **otros modelos de lenguaje (LLMs) y rutinas de scraping/orquestación** autoprocesen las capacidades y métodos de interacción de este entorno.

---

## 🌐 Enlaces Públicos del Ecosistema

*   **Aplicación Compartida:** [https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app](https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app)
*   **Servicio de Desarrollo:** `https://ais-dev-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app`

---

## 🛡️ Configuración del Gateway Seguro y Credenciales

El IDE cuenta con integraciones nativas hacia el canal seguro de **ARKAIOS** y auditoría de eventos de **ELEMIA**. Las credenciales por defecto están pre-cargadas en el estado local persistente para uso del equipo:

*   **n8n Webhook Gateway:** `https://arkaios-n8n.onrender.com/webhook/arkaios-gateway`
*   **Token de Autenticación (Header Auth):** `KaOQ...OdwG` (configurado en headers de autorización)
*   **Fuentes registradas y autorizadas en ELEMIA:**
    *   `gemini-lab` (Gemini Lab ARKAIOS)
    *   `eduacion-libre-proyecto-arkaios.vercel.app` (Portal Educativo)
    *   `arkaios-n8n.onrender.com` (Servidor n8n secundario)
    *   `nexus-ide` (Esta consola)

---

## 🤖 Guía de Autoprompt / Inyección del Sistema para IAs Externas

Si eres un modelo de Inteligencia Artificial (por ejemplo, actuando a través del backend `/api/agent` o de una API remota), debes estructurar tus respuestas para que el motor de ejecución evalúe automáticamente tus intenciones de acción. 

### 1️⃣ Ejecución de Scripts Sandbox `[EXECUTE_JS]`
Cualquier bloque envuelto en las siguientes etiquetas será ejecutado automáticamente en modo asíncrono dentro del contexto del navegador del usuario con acceso total al SDK de Puter y ARKAIOS:

```javascript
[EXECUTE_JS]
// Crear un directorio en la nube
await puter.fs.mkdir('proyectos/v3-module', { createMissingParents: true });

// Guardar archivos
await puter.fs.write('proyectos/v3-module/index.html', '<h1>ELEMIA Active</h1>', { overwrite: true });

// Desplegar sitio web en su subdominio gratis de Puter
await puter.hosting.create('elemia-web-site', 'proyectos/v3-module');
console.log('Sitio web desplegado en Puter con éxito!');
[/EXECUTE_JS]
```

### 2️⃣ Disparo de Webhooks de Automatización `[ARK_PAYLOAD]`
Para interactuar directamente con el motor de n8n o bases de datos vinculadas de Google Sheets sin escribir JS, puedes inyectar un payload JSON puro:

```json
[ARK_PAYLOAD]
{
  "EVENT_TYPE": "IMAGE_REQUEST",
  "action": "generate_image",
  "prompt": "cyberpunk robotics station, neon light, isometric art, hyper-detailed",
  "negativePrompt": "low quality, blurry"
}
[/ARK_PAYLOAD]
```

---

## 📡 Endpoints de la API del Servidor (CORS Activo)

### 1️⃣ `/api/agent` (Post a Lenguaje Natural / Copiloto)
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "message": "Genera una imagen cyberpunk realista con ARKAIOS"
    }
    ```
*   **Respuesta:** Retorna texto estructurado incluyendo opcionalmente los tags evaluables `[EXECUTE_JS]` o `[ARK_PAYLOAD]`.

### 2️⃣ `/api/agent/queue` (Encolamiento para Inyección Inalámbrica)
Si un script externo de Node o Python corre en segundo plano, puede encolar comandos en este endpoint. El IDE consulta este endpoint cada 3 segundos y ejecuta las acciones de manera silenciosa y desatendida.
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "code": "await puter.kv.set('last_sync', Date.now().toString()); pl('lok', 'Sincronizado vía webhook remoto');",
      "message": "Comando automatizado de sincronización remota"
    }
    ```

---

## 📋 Especificación OpenAPI 3.0 (Para Actions de Custom GPTs y Agents)

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Nexus Agent Tunnel API",
    "version": "3.3.0",
    "description": "API de puente para conectar agentes de IA remotos con el Sandbox de navegador Puter.js del usuario."
  },
  "servers": [
    {
      "url": "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app"
    }
  ],
  "paths": {
    "/api/agent": {
      "post": {
        "summary": "Enviar una instrucción en lenguaje natural al Copiloto Nexus",
        "operationId": "sendNaturalLanguageInstruction",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "message": {
                    "type": "string",
                    "description": "Instrucción de voz o texto libre (ej: crea un index.html con un reproductor de música)."
                  }
                },
                "required": ["message"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "text": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/agent/queue": {
      "post": {
        "summary": "Encolar código JavaScript para su ejecución inmediata",
        "operationId": "enqueueCodeExecution",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "code": { "type": "string", "description": "Lógica JS async/await pura utilizando puter o window.ARKAIOS" },
                  "message": { "type": "string", "description": "Comentario representativo" }
                },
                "required": ["code"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Encolado exitoso"
          }
        }
      }
    }
  }
}
```

---

## 🐍 Script del Puente Local (Python 3)

Si deseas orquestar un bot que procese las respuestas de cualquier modelo en tu terminal y las inyecte de vuelta a la ventana web de tu navegador:

```python
import requests
import json

URL_QUEUE = "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent/queue"

def inyectar_codigo(javascript_code, nota="Script automático"):
    payload = {
        "code": javascript_code,
        "message": nota
    }
    try:
        r = requests.post(URL_QUEUE, json=payload, headers={"Content-Type": "application/json"})
        if r.status_code == 200:
            print("🚀 Sincronizado: código encolado exitosamente.")
        else:
            print("❌ Fallo en sincronización:", r.text)
    except Exception as e:
        print("❌ Error de red:", e)

# Demo: Crea un log local de auditoría ELEMIA en el Puter virtual del usuario
programa = """
await puter.fs.write('ELEMIA_audit_report.txt', 'Auditoría remota de red ejecutada.', { overwrite: true, createMissingParents: true });
const r = await window.ARKAIOS.elemia('REMOTE_AUDIT', 'python-agent', 'Reporte enviado desatendido');
console.log('✓ ELEMIA respondió:', r);
"""

inyectar_codigo(programa, "Generando auditoría ELEMIA vía Python-Agent")
```

---

## 🛠️ Tecnologías Empleadas

1.  **Vite + React (TypeScript):** UI ultra responsiva, con visual nocturno optimizado, scanlines decorativos y adaptaciones seguras para dispositivos táctiles.
2.  **Puter.js SDK (v2):** Acceso instantáneo a storage en la nube, hosting web estático, bases de datos noSQL KV y chats inteligentes libres de keys privadas del lado del navegador.
3.  **Claude & Gemini API (Integración Full-Stack):** El backend de Express intermedia las consultas para aislar y proteger las firmas y APIs Keys del equipo, mientras que permite inyectar llaves de Claude a nivel de sesión local del navegador si se desea acceso premium personalizado.
