# ⚡ NEXUS AGENT IDE v2 — Puter Lab & Agent Direct Bridge

Nexus Agent IDE v2 es un entorno de desarrollo integrado interactivo y altamente pulido que funciona como un **puente de ejecución en vivo**. Permite a cualquier Agente de IA externo (como una instancia separada de Gemini, Claude, ChatGPT, Custom GPTs o scripts en Python/Node.js) actuar directamente sobre el navegador de un usuario en tiempo real mediante el SDK seguro de **Puter.js**.

---

## 🔗 Dirección Pública de la Aplicación

Puedes abrir tu Nexus Lab en pantalla completa o integrarlo en cualquier navegador utilizando el siguiente enlace público:
*   **Enlace de la App:** [https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app](https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app)

---

## 🚀 ¿Debe ser Humano el Orquestador o la IA puede Conectarse Sola?

### ¡La IA puede conectarse de forma 100% Autónoma!

Si estás chateando en la interfaz web estándar (como Gemini Advanced, Claude.ai, ChatGPT Plus gratis o similar sin plugins de desarrollo), estas plataformas por seguridad imponen un sandbox al navegador de la IA que les impide hacer descargas de red salientes ("outbound requests"). En ese escenario, **tú sirves como el Orquestador/Canal Seguro** (simplemente copiando los bloques `[EXECUTE_JS]` que la IA genera y pegándolos en la interfaz de Nexus).

**SIN EMBARGO**, si usas un entorno con capacidad de ejecución de herramientas ("Tool Calling" / "Function Calling"), puedes conectar a la IA automáticamente sin intermediarios:

1.  **Custom GPTs (ChatGPT):** Puedes crear un ChatGPT personalizado ("GPT") e importar la especificación OpenAPI (que te dejamos abajo) en la sección **Actions**. Con esto, la IA llamará a tu Nexus IDE directamente en segundo plano cada vez que le pidas estructurar tu proyecto.
2.  **Agentes Locales / Gemini API / Claude API:** Si usas un script local de Python o Node.js con el SDK oficial, puedes proveerle a la IA la función `enviar_comando_nexus` como una herramienta nativa (Function Calling). El modelo decidirá cuándo ejecutar el código y la app de tu navegador se actualizará sola en 3 segundos.

---

## 📡 Endpoints de la API Segura (CORS Habilitado)

### 1️⃣ Canal de Mensajes en Lenguaje Natural (Copiloto AI)
Ideal para que una IA con acceso a red te envíe comandos abstractos y el backend de Nexus compile y ejecute el código resultante por ti.

*   **Método:** `POST`
*   **URL:** `https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent`
*   **Encabezados:** `Content-Type: application/json`
*   **Cuerpo (JSON):**
    ```json
    {
      "message": "Crea una carpeta llamada ELEMIA-v4, escribe un log de auditoría adentro, y despliégala en vivo"
    }
    ```

---

### 2️⃣ Canal de Inyección Directa de JavaScript (Control Remoto)
Ideal para que el bot inyecte un bloque exacto de código JavaScript para ejecutar en la máquina virtual (Puter.js) de tu navegador.

*   **Método:** `POST`
*   **URL:** `https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent/queue`
*   **Encabezados:** `Content-Type: application/json`
*   **Cuerpo (JSON):**
    ```json
    {
      "code": "await puter.fs.mkdir('ELEMIA-v4/memoria', {createMissingParents: true});\nawait puter.kv.set('elemia_status', 'iniciando_modulo_memoria_v2');\nawait puter.fs.write('ELEMIA-v4/memoria/log.txt', 'Sistema de memoria inicializado.');\nconsole.log('✓ Memoria configurada exitosamente!');",
      "description": "Configurando estructura lógica"
    }
    ```

---

## 📄 Especificación OpenAPI 3.0 (Para Custom GPTs / Claude Projects / LangChain Agents)

Copia y pega este JSON en el editor de acciones de tu Agente Autónomo externo para otorgarle capacidades de control de hardware de forma inalámbrica sobre Puter.js:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Nexus Agent Tunnel API",
    "version": "2.0.0",
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
                    "description": "La instrucción en texto libre que define el objetivo del proyecto (ej. Crear una landing minimalista y desplegar)."
                  }
                },
                "required": ["message"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Instrucción recibida y procesada con éxito por el compilador secundario de Nexus.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "text": {
                      "type": "string",
                      "description": "La respuesta textual redactada por la IA co-piloto secundaria de Nexus."
                    }
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
        "summary": "Inyectar código JavaScript puro directamente en la máquina virtual Puter del usuario",
        "operationId": "injectDirectCode",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "code": {
                    "type": "string",
                    "description": "Código de JavaScript compatible con el SDK global de puter (ej. await puter.fs.write('doc.txt', 'hola');)."
                  },
                  "description": {
                    "type": "string",
                    "description": "Resumen representativo de lo que realiza esta acción."
                  }
                },
                "required": ["code"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Comando encolado con éxito. Se ejecutará en la pantalla del usuario en menos de 3 segundos.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "command": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 🛠️ Script de Automatización Local en Python

Si quieres un asistente autónomo rápido que se ejecute desde tu consola y lea tus archivos para enviarselos a tu Nexus Lab, crea este archivo `bridge.py` y ejecútalo:

```python
import requests
import json
import time

API_BASE = "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app"

def inyectar_asistente(codigo, descripcion="Comando automático"):
    url = f"{API_BASE}/api/agent/queue"
    payload = {"code": codigo, "description": descripcion}
    
    try:
        r = requests.post(url, json=payload)
        if r.status_code == 200:
            print(f"⚡ [Nexus] Ejecutando de forma remota: '{descripcion}'")
            print(r.json())
        else:
            print("Error:", r.text)
    except Exception as e:
        print("Fallo de red:", e)

# Ejemplo de uso: Inyectar un saludo y crear directorios automáticamente
codigo_puter_js = """
await puter.fs.mkdir('ELEMIA-ModuloDeAsistencias', {createMissingParents: true});
await puter.fs.write('ELEMIA-ModuloDeAsistencias/config.json', JSON.stringify({ activo: true, version: '4.0.0' }, null, 2));
await puter.kv.set('elemia_asistencia_estatus', 'sincronizado');
console.log('✓ Módulo de ELEMIA inyectado inalámbricamente!');
"""

inyectar_asistente(codigo_puter_js, "Instalando Módulo de Asistencias de ELEMIA")
```

---

## 🎨 Especificaciones Tecnológicas de Nexus Lab
*   **Vite + React (TypeScript):** UI de alta gama con paleta de color Cosmic Slate, contrastes seguros y animaciones fluidas.
*   **Gemini 2.5 Flash / 1.5 Pro Server-Side integration:** Gestión integrada en el backend para resguardar la firma secreta de las API keys sin exponerlas al cliente web.
*   **Express Server + CORS:** Backend configurado específicamente con control de acceso global para admitir conexiones cruzadas desde entornos externos externos.
*   **Puter.js SDK Integrado:** Integración nativa que corre en el contexto de seguridad del usuario en el navegador para resguardar la privacidad e integridad de sus archivos.
