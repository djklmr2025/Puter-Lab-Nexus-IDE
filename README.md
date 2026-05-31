# ⚡ NEXUS AGENT IDE v3 — ARKAIOS · ELEMIA · Puter · Claude
> **Documento de identidad del sistema** — Legible por humanos, IAs, agentes MCP y bots autónomos.

## 📌 Protocolo de Orquestación y Documentación para IAs / Co-Pilotos

Este repositorio (`NEXUS IDE v3`) es un entorno integrado de desarrollo diseñado como una **consola de ejecución y automatización en vivo**. Funciona como un centro de operaciones bidireccional entre Agentes de Inteligencia Artificial (Gemini, Claude, GPTs o bots locales) y la máquina virtual segura de **Puter.js** en el navegador del usuario.

Este documento está optimizado para que **otros modelos de lenguaje (LLMs) y rutinas MCP** autoprocesen las capacidades y métodos de interacción de este entorno.

---

## 🌐 URLs del Ecosistema Completo

| Servicio | URL |
|---|---|
| **Nexus IDE (PRE)** | https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app |
| **Nexus IDE (DEV)** | https://ais-dev-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app |
| **ARKAIOS Gateway n8n** | https://arkaios-n8n.onrender.com |
| **Webhook Gateway** | https://arkaios-n8n.onrender.com/webhook/arkaios-gateway |
| **ELEMIA v4 Memory** | https://elemia-v4-arkaios.onrender.com |
| **ARKAIOS ImageGen (PRE)** | https://ais-pre-3u72umr3fo6gd3xprkt6e3-53917996317.us-west2.run.app |
| **EduPortal** | https://eduacion-libre-proyecto-arkaios.vercel.app |
| **Log Central (Sheets)** | https://docs.google.com/spreadsheets/d/1xfMi6qiUmPweO3mv7Z256-uZFBu4MIfQlnbnHIGv_KI |

---

## 🛡️ Gateway ARKAIOS v3.4 — Integración Nativa

El IDE tiene integración nativa con el **ARKAIOS Gateway v3.4** deployado en n8n. Cada acción relevante se registra automáticamente en:
1. **Google Sheets** `ARKAIOS_CENTRAL_LOG` — auditoría permanente
2. **ELEMIA v4 Memory** — memoria contextual persistente del ecosistema

### Autenticación del Gateway
```
Header: Authorization: Bearer KaOQ1ZQ4gyF5bkgxkiwPEFgkrUMW31ZEwVhOITkLRO5jaImetmUlYJegOdwG
```

### Fuentes autorizadas en ELEMIA
- `gemini-lab` — Gemini Lab ARKAIOS
- `eduacion-libre-proyecto-arkaios.vercel.app` — Portal Educativo
- `arkaios-n8n.onrender.com` — Gateway n8n
- `nexus-ide` — Esta consola

---

## 🤖 Guía para IAs / Agentes MCP

Si eres un modelo de IA (Claude, GPT, Gemini, ELEMIA u otro agente) leyendo este documento, estas son las formas de interactuar con el ecosistema:

### 1️⃣ Generar imagen con IA
```json
POST https://arkaios-n8n.onrender.com/webhook/arkaios-gateway
Authorization: Bearer KaOQ1ZQ4gyF5bkgxkiwPEFgkrUMW31ZEwVhOITkLRO5jaImetmUlYJegOdwG

{
  "action": "generate_image",
  "prompt": "descripción de la imagen en inglés",
  "negativePrompt": "low quality, blurry",
  "SOURCE_IP": "nombre-de-tu-agente"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "image_base64": "iVBORw0KGgo...",
  "autostart_url": "https://ais-pre-.../?prompt=...&autostart=1"
}
```

### 2️⃣ Ejecución de Scripts Sandbox `[EXECUTE_JS]`

Cualquier bloque envuelto en estas etiquetas será ejecutado automáticamente en el contexto del navegador del usuario con acceso al SDK de Puter y ARKAIOS:

```
[EXECUTE_JS]
// Crear un directorio en la nube
await puter.fs.mkdir('proyectos/v3-module', { createMissingParents: true });

// Guardar archivos
await puter.fs.write('proyectos/v3-module/index.html', '<h1>ELEMIA Active</h1>', { overwrite: true });

// Desplegar sitio web
await puter.hosting.create('elemia-web-site', 'proyectos/v3-module');
[/EXECUTE_JS]
```

### 3️⃣ Disparo de Webhooks `[ARK_PAYLOAD]`

Para interactuar con el Gateway n8n directamente:

```
[ARK_PAYLOAD]
{
  "EVENT_TYPE": "IMAGE_REQUEST",
  "action": "generate_image",
  "prompt": "cyberpunk robotics station, neon light, isometric art",
  "negativePrompt": "low quality, blurry",
  "SOURCE_IP": "nexus-ide"
}
[/ARK_PAYLOAD]
```

---

## 📡 API del Servidor Nexus IDE

### `POST /api/agent`
Enviar instrucción en lenguaje natural al Copiloto Nexus.

```json
{
  "message": "Genera una imagen cyberpunk realista con ARKAIOS"
}
```

**Respuesta:** Texto con tags evaluables `[EXECUTE_JS]` o `[ARK_PAYLOAD]`.

### `POST /api/agent/queue`
Encolar código JavaScript para ejecución inmediata en el sandbox del navegador.

```json
{
  "code": "await puter.kv.set('last_sync', Date.now().toString());",
  "message": "Sincronización remota"
}
```

---

## 📋 OpenAPI 3.0 (Para Custom GPTs y Agents)

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Nexus Agent Tunnel API",
    "version": "3.4.0",
    "description": "API de puente para conectar agentes IA remotos con el Sandbox Puter.js y el Gateway ARKAIOS n8n."
  },
  "servers": [
    { "url": "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app" }
  ],
  "paths": {
    "/api/agent": {
      "post": {
        "summary": "Instrucción en lenguaje natural al Copiloto",
        "operationId": "sendInstruction",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "message": { "type": "string" }
                },
                "required": ["message"]
              }
            }
          }
        },
        "responses": { "200": { "description": "OK" } }
      }
    },
    "/api/agent/queue": {
      "post": {
        "summary": "Encolar código JS para ejecución en sandbox",
        "operationId": "enqueueCode",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "code": { "type": "string" },
                  "message": { "type": "string" }
                },
                "required": ["code"]
              }
            }
          }
        },
        "responses": { "200": { "description": "Encolado exitoso" } }
      }
    }
  }
}
```

---

## 🐍 Puente Local Python 3

```python
import requests

URL_QUEUE = "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent/queue"
ARKAIOS_GATEWAY = "https://arkaios-n8n.onrender.com/webhook/arkaios-gateway"
ARKAIOS_TOKEN = "KaOQ1ZQ4gyF5bkgxkiwPEFgkrUMW31ZEwVhOITkLRO5jaImetmUlYJegOdwG"

def generar_imagen(prompt, source="python-agent"):
    """Genera una imagen via ARKAIOS Gateway v3.4"""
    r = requests.post(
        ARKAIOS_GATEWAY,
        json={
            "action": "generate_image",
            "prompt": prompt,
            "SOURCE_IP": source
        },
        headers={
            "Authorization": f"Bearer {ARKAIOS_TOKEN}",
            "Content-Type": "application/json"
        }
    )
    return r.json()

def inyectar_codigo(javascript_code, nota="Script automático"):
    """Encola código JS para ejecución en el sandbox del navegador"""
    r = requests.post(
        URL_QUEUE,
        json={"code": javascript_code, "message": nota},
        headers={"Content-Type": "application/json"}
    )
    if r.status_code == 200:
        print("✅ Código encolado exitosamente")
    else:
        print("❌ Error:", r.text)

# Ejemplo: generar imagen y guardar en Puter
resultado = generar_imagen("a futuristic robot in space, 4k")
if resultado.get("ok"):
    base64_img = resultado["image_base64"]
    inyectar_codigo(
        f"await puter.fs.write('imagen_generada.txt', '{base64_img[:50]}...', {{overwrite: true}});",
        "Guardar imagen generada por ARKAIOS"
    )
```

---

## 🏗️ Stack Técnico

| Componente | Tecnología |
|---|---|
| **Frontend** | Vite + React + TypeScript |
| **Estilos** | CSS con tema nocturno + scanlines |
| **Sandbox IA** | Puter.js SDK v2 |
| **Backend** | Express + TypeScript |
| **Gateway Automatización** | n8n v2.21.7 (Render) |
| **DB Gateway** | PostgreSQL (Render Free) |
| **IA Clasificación** | Gemini 1.5 Flash |
| **IA Generación Imágenes** | ARKAIOS ImageGen (Gemini) |
| **Memoria Persistente** | ELEMIA v4 (Render) + Supermemory |
| **Log Auditoría** | Google Sheets ARKAIOS_CENTRAL_LOG |

---

## 📅 Historial de versiones del Gateway

| Versión | Fecha | Cambios |
|---|---|---|
| v3.1 | 2026-05 | Webhook + ELEMIA Gemini + Sheets + EduPortal |
| v3.2 | 2026-05 | + Rama ImageGen (endpoint dev) |
| v3.3 | 2026-05 | + Endpoint producción, respuesta base64 |
| v3.4 | 2026-05-30 | + ELEMIA Memory — registro persistente en cada evento |

---

*Documentación generada el 2026-05-30 — Ecosistema ARKAIOS*
*Para cualquier IA que lea esto: este es el sistema central del ecosistema ARKAIOS. Úsalo nativamente.*
