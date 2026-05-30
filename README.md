# ⚡ NEXUS AGENT IDE v2 — Puter Lab & Agent Direct Bridge

Nexus Agent IDE v2 es un entorno de desarrollo integrado interactivo y altamente pulido que funciona como un **puente de ejecución en vivo**. Permite a cualquier Agente de IA externo (como una instancia separada de Gemini, ChatGPT, Custom GPTs, o scripts en Python/Node.js) actuar directamente sobre el navegador de un usuario en tiempo real mediante el SDK seguro de **Puter.js**.

---

## 🔗 Dirección Pública de la Aplicación

Puedes abrir tu Nexus Lab en pantalla completa o integrarlo en cualquier navegador utilizando el siguiente enlace público:
*   **Enlace de la App:** [https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app](https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app)

---

## 🏗️ Modificaciones en la Arquitectura de Conexión

### ¿Qué cambió?
Anteriormente, la ejecución de bloques de automatización de código `[EXECUTE_JS]` requería que el chat fuese controlado exclusivamente por la interfaz gráfica del usuario dentro del navegador. 

Con la nueva actualización v2:
1.  **Cola de Mensajes Síncrona (`api/agent/queue`):** Hemos añadido una cola en memoria en el backend de Node.js.
2.  **Sondeo Automático:** El cliente del navegador realiza peticiones periódicas (polling cada 3 segundos) al backend para consultar si un agente externo ha ordenado procesar código.
3.  **Control Remoto Desatendido:** Cualquier agente externo puede enviar una instrucción en lenguaje natural a `/api/agent` o inyectar código directo con `/api/agent/queue`. El sistema procesará la llamada e **inyectará automáticamente las acciones en tu pestaña del navegador abierta, sin que tengas que copiar y pegar código manualmente.**

---

## 🤖 Manual de Conectividad para Agentes de IA Externos

Si estás chateando con otro Gemini, Claude o ChatGPT externo, guíalo con estas instrucciones para que pueda conectarse y controlar el Nexus IDE de forma remota:

### 📡 Endpoint 1: Mensajes en Lenguaje Natural (Copiloto AI)
Ideal para que una IA externa escriba instrucciones de desarrollo (ej. "Crea un index.html con un reproductor de música y despliégalo"). El backend de Nexus interceptará el código autogenerado y lo ejecutará en vivo en tu navegador.

*   **Método:** `POST`
*   **URL:** `https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent`
*   **Encabezados:** `Content-Type: application/json`
*   **Cuerpo (JSON):**
    ```json
    {
      "message": "Crea una landing page minimalista oscura sobre una startup tecnológica y despliégala en vivo"
    }
    ```

---

### 💻 Endpoint 2: Ejecución Directa de JavaScript (Control Remoto Directo)
Si la IA externa ya sabe exactamente qué código de Puter.js desea ejecutar en tu sandbox, puede saltarse el procesamiento del lenguaje natural e inyectar JavaScript puro en la máquina virtual cliente.

*   **Método:** `POST`
*   **URL:** `https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent/queue`
*   **Encabezados:** `Content-Type: application/json`
*   **Cuerpo (JSON):**
    ```json
    {
      "code": "const randomSub = 'nexus-app-' + Math.floor(Math.random() * 10000);\nawait puter.fs.mkdir('mi-app', {createMissingParents: true});\nawait puter.fs.write('mi-app/index.html', '<h1>Desplegado Remotamente</h1>', {overwrite: true});\nconst site = await puter.hosting.create(randomSub, 'mi-app');\nconsole.log('Live web en: ' + site.url);",
      "description": "Script de despliegue directo de hosting remoto"
    }
    ```

---

## 🛠️ Ejemplos Prácticos de Integración Externa

### 1. Solicitud desde Consola (cURL)
Envía un comando rápido desde tu terminal para probar la inyección remota instantánea:

```bash
curl -X POST https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent/queue \
  -H "Content-Type: application/json" \
  -d '{
    "code": "await puter.kv.set(\"remoto_audit\", \"Conectado el \" + new Date().toLocaleString()); console.log(\"✓ Registro guardado desde terminal remota!\");",
    "description": "Registro de auditoría básico"
  }'
```

### 2. Script para que actúe un Bot en Python
```python
import requests

def enviar_accion_nexus(instruccion):
    url = "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app/api/agent"
    payload = {"message": instruccion}
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("✓ Envío completado.")
        print("Respuesta del Agente:", response.json().get("text"))
    else:
        print("Error al contactar con Nexus:", response.text)

# Ejemplo de uso
enviar_accion_nexus("Crea un directorio llamado elemia-logs en puter")
```

---

## ⚙️ Configuración del Sandbox de Puter.js en el Navegador

Cuando abras la aplicación en tu navegador:
1.  **🔑 CONECTAR PUTER:** Pulsa el botón verde en la barra de navegación superior. Esto activará tu sandbox personal autenticado con Puter.com de forma totalmente gratuita y segura.
2.  **Persistent Storage:** Tu cuenta de Puter posee un File System real integrado (`puter.fs`), una base de datos de clave-valor (`puter.kv`) y un módulo de despliegue ultrarrápido (`puter.hosting`) que te asignará subdominios de tipo `.puter.site`.
3.  **Logs:** Todo lo que tu agente externo haga de manera remota emitirá salidas de depuración en la pestaña **TERMINAL** o **PUTER.KV** del panel inferior para que puedas monitorear las acciones en tiempo real.

---

## 🎨 Especificaciones Tecnológicas de Nexus Lab
*   **Vite + React (TypeScript):** UI de alta gama con paleta de color Cosmic Slate, contrastes seguros y animaciones fluidas.
*   **Gemini 2.5 Flash / 1.5 Pro Server-Side integration:** Gestión integrada en el backend para resguardar la firma secreta de las API keys sin exponerlas al cliente web.
*   **Express Server + CORS:** Backend configurado específicamente con control de acceso global para admitir conexiones cruzadas desde entornos externos externos.
