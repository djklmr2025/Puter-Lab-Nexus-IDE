import AIAssistant from './AIAssistant';
import AIAssistant from './AIAssistant';
import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, 
  File, 
  Play, 
  Save, 
  Terminal, 
  Database, 
  Globe, 
  Plus, 
  ChevronRight, 
  Trash2, 
  RefreshCw, 
  User, 
  Send, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  HelpCircle,
  ExternalLink,
  Code,
  Key,
  Shield,
  Cpu,
  Info
} from "lucide-react";
import { DEFAULT_SCRIPT, SNIPS, TPLS } from "./data";
import { PuterFileItem, ChatMessage, WebSiteItem, KeyValueItem, LogLine } from "./types";

// State structure for webhook logs
interface WebhookLog {
  ts: number;
  payload: any;
  response: any;
}

// State structure for ELEMIA audit logs
interface ElemiaLog {
  ts: number;
  event: string;
  source: string;
  authorized: boolean;
  result: any;
}

declare global {
  interface Window {
    puter: any;
    ARKAIOS: any;
  }
}

export default function App() {
  // --- STATE DECLARATIONS ---
  const [puterSDK, setPuterSDK] = useState<any>(null);
  const [isSdkLoading, setIsSdkLoading] = useState(true);
  const [isPuterAuthenticated, setIsPuterAuthenticated] = useState(false);
  const [puterUsername, setPuterUsername] = useState<string>("");
  
  // Filesystem Explorer
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [fileList, setFileList] = useState<PuterFileItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>("main.js");
  const [editorContent, setEditorContent] = useState<string>(() => {
    return localStorage.getItem("nexus_editor_draft") || DEFAULT_SCRIPT;
  });

  // UI Tabs & Configurations
  const [activeTermTab, setActiveTermTab] = useState<"terminal" | "arkaios" | "elemia" | "kv" | "hosting">("terminal");
  const [activeApiTab, setActiveApiTab] = useState<"chat" | "arkaios-cfg" | "snip">("chat");
  const [notification, setNotification] = useState<string | null>(null);

  // Custom Local Configuration Stores
  const [arkWebhook, setArkWebhook] = useState<string>(() => localStorage.getItem("nxark_webhook") || "https://arkaios-n8n.onrender.com/webhook/arkaios-gateway");
  const [arkToken, setArkToken] = useState<string>(() => localStorage.getItem("nxark_token") || "KaOQ1ZQ4gyF5bkgxkiwPEFgkrUMW31ZEwVhOITkLRO5jaImetmUlYJegOdwG");
  const [arkNexus, setArkNexus] = useState<string>(() => localStorage.getItem("nxark_nexus") || "https://ais-pre-2xr7vpfz3gpk7wd46kgea7-53917996317.us-west2.run.app");
  const [arkEndpoint, setArkEndpoint] = useState<string>(() => localStorage.getItem("nxark_endpoint") || "/api/agent");
  const [arkFuentes, setArkFuentes] = useState<string[]>(() => {
    const raw = localStorage.getItem("nxark_fuentes") || "gemini-lab\neduacion-libre-proyecto-arkaios.vercel.app\narkaios-n8n.onrender.com\nnexus-ide";
    return raw.split("\n").map(s => s.trim()).filter(Boolean);
  });
  const [claudeKey, setClaudeKey] = useState<string>(() => localStorage.getItem("nxark_ckey") || "");

  // Audit Histories and Log Boards
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAgentResponding, setIsAgentResponding] = useState<boolean>(false);
  
  // Terminal boards & queues
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Puter list stores
  const [kvStore, setKvStore] = useState<KeyValueItem[]>([]);
  const [hostedSites, setHostedSites] = useState<WebSiteItem[]>([]);

  // n8n event histories
  const [arkLog, setArkLog] = useState<WebhookLog[]>([]);
  const [elimiaLog, setElimiaLog] = useState<ElemiaLog[]>([]);

  // Boot Simulation Controls
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [bootMessage, setBootMessage] = useState<string>("Iniciando ecosistema...");

  // Refs for auto-scroll matching
  const terminalRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- BOOT SIMULATION LOADER ---
  useEffect(() => {
    const steps = [
      { p: 10, m: "Cargando Puter.js SDK..." },
      { p: 25, m: "Conectando ARKAIOS Gateway..." },
      { p: 45, m: "Inicializando ELEMIA..." },
      { p: 65, m: "Configurando Claude Agent..." },
      { p: 82, m: "Preparando terminal NEXUS..." },
      { p: 100, m: "Ecosistema listo." }
    ];
    let stepCount = 0;
    const interval = setInterval(() => {
      if (stepCount >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsBooting(false);
          addLog("info", "🚀 Ecosistema de desarrollo NEXUS Lab cargado con total éxito.");
        }, 400);
        return;
      }
      const st = steps[stepCount];
      setBootProgress(st.p);
      setBootMessage(st.m);
      stepCount++;
    }, 280);

    return () => clearInterval(interval);
  }, []);

  // --- SDK LOOKUP & INJECTION Fallbacks ---
  const checkAndBindPuter = async (sdk: any) => {
    setPuterSDK(sdk);
    setIsSdkLoading(false);
    if (sdk.auth && typeof sdk.auth.isSignedIn === "function") {
      const isSignedIn = sdk.auth.isSignedIn();
      setIsPuterAuthenticated(isSignedIn);
      if (isSignedIn) {
        try {
          const user = await sdk.auth.getUser();
          setPuterUsername(user.username);
          addLog("success", `✓ Sesión de Puter detectada: @${user.username}`);
          showNotification(`Contratado: @${user.username}`);
        } catch (e) {
          setPuterUsername("nexus");
        }
      }
    }
  };

  const forceLoadPuterSDK = () => {
    addLog("info", "Iniciando detección e inyección del SDK de Puter.js...");
    if (window.puter) {
      checkAndBindPuter(window.puter);
      return;
    }

    const scriptId = "dynamic-puter-sdk";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://js.puter.com/v2/";
      s.async = true;
      s.onload = () => {
        if (window.puter) {
          checkAndBindPuter(window.puter);
        }
      };
      s.onerror = () => {
        addLog("error", "Error crítico al inyectar CDN de Puter.js. Intente abrir en pestaña limpia/VPN.");
      };
      document.head.appendChild(s);
    }
  };

  useEffect(() => {
    // Initial welcomers
    setChatHistory([
      {
        id: "wel-1",
        role: "system",
        content: "NEXUS IDE v3 — ARKAIOS · ELEMIA · Puter · Claude",
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: "wel-2",
        role: "assistant",
        content: "¡Bienvenido! Soy tu agente Claude integrado en el ecosistema de control de Puter Lab.\n\nPuedo:\n• Generar imágenes con ImageGen ruteadas via n8n\n• Clasificar eventos y flujos de auditoría con ELEMIA\n• Desplegar landing pages en Puter Hosting (.site) de forma instantánea\n• Disparar webhooks de automatización robustos al gateway de ARKAIOS\n\n¿Qué construimos hoy?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const checkInterval = setInterval(() => {
      if (window.puter) {
        clearInterval(checkInterval);
        checkAndBindPuter(window.puter);
      }
    }, 150);

    const fallbackTimeout = setTimeout(() => {
      if (!window.puter) {
        forceLoadPuterSDK();
      }
    }, 1500);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // --- SAVE WORKSPACE DRAFT ---
  useEffect(() => {
    localStorage.setItem("nexus_editor_draft", editorContent);
  }, [editorContent]);

  // --- ATTACH window.ARKAIOS global variable dynamically ---
  useEffect(() => {
    window.ARKAIOS = {
      async fire(payload: any = {}) {
        if (!arkWebhook) {
          addLog("error", "ARKAIOS: Webhook n8n no configurado. Agrégalo en [ARKAIOS CFG]");
          throw new Error("Webhook no configurado");
        }
        const body = {
          EVENT_TYPE: payload.EVENT_TYPE || "NEXUS_IDE_EVENT",
          SOURCE_IP: "nexus-ide",
          NOTES: payload.NOTES || "",
          ...payload,
          _ts: new Date().toISOString()
        };
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (arkToken) {
          headers["Authorization"] = arkToken;
        }

        addLog("info", `[ARKAIOS Webhook] → POST ${arkWebhook}`);
        try {
          const res = await fetch(arkWebhook, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
          });
          const data = await res.json().catch(() => ({ ok: false, status: res.status }));
          
          setArkLog(prev => [{ ts: Date.now(), payload: body, response: data }, ...prev]);
          addLog("success", `[ARKAIOS Webhook] Respuesta: ${JSON.stringify(data).slice(0, 150)}`);
          return data;
        } catch (err: any) {
          addLog("error", `Error de comunicación con ARKAIOS: ${err.message}`);
          throw err;
        }
      },

      async imageGen(prompt: string, negativePrompt: string = "low quality, blurry") {
        addLog("info", `[ARKAIOS:IMAGE] prompt="${prompt.slice(0, 60)}"`);
        return await this.fire({
          EVENT_TYPE: "IMAGE_REQUEST",
          action: "generate_image",
          prompt,
          negativePrompt
        });
      },

      async edu(action: string, data: any = {}) {
        addLog("info", `[ARKAIOS:EDU] action=${action}`);
        return await this.fire({
          EVENT_TYPE: "EDU_REQUEST",
          action,
          apiKey: data.apiKey || "",
          subject: data.subject || "",
          grade: data.grade || "",
          topic: data.topic || "",
          ...data
        });
      },

      async elemia(eventType: string, source: string, notes: string = "") {
        addLog("info", `[ELEMIA] Clasificando evento: ${eventType} desde la fuente: ${source}`);
        const authorized = arkFuentes.includes(source);
        const result = await this.fire({
          EVENT_TYPE: eventType,
          SOURCE_IP: source,
          NOTES: notes || `Sincronización: ${eventType} desde ${source}`
        });

        setElimiaLog(prev => [{ ts: Date.now(), event: eventType, source, authorized, result }, ...prev]);
        return result;
      },

      async nexusAgent(message: string, context: any = {}) {
        if (!arkNexus) {
          addLog("error", "ARKAIOS: Nexus Lab URL no configurada.");
          throw new Error("Nexus Lab no configurada");
        }
        addLog("info", `[NEXUS TUNNEL] → ${arkNexus}${arkEndpoint}`);
        try {
          const res = await fetch(arkNexus + arkEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              context,
              source: "nexus-ide",
              ts: new Date().toISOString()
            })
          });
          const data = await res.json().catch(() => ({ ok: false }));
          addLog("success", `[NEXUS TUNNEL] Respuesta: ${JSON.stringify(data).slice(0, 150)}`);
          return data;
        } catch (err: any) {
          addLog("error", `Error en el Túnel Nexus: ${err.message}`);
          throw err;
        }
      }
    };
  }, [arkWebhook, arkToken, arkNexus, arkEndpoint, arkFuentes]);

  // --- REFRESH SIDEBAR TREE AND STORES ---
  useEffect(() => {
    if (isPuterAuthenticated && puterSDK) {
      refreshFileList();
      refreshKvStore();
      refreshHostingSites();
    }
  }, [currentPath, isPuterAuthenticated, puterSDK]);

  const refreshFileList = async () => {
    if (!puterSDK || !isPuterAuthenticated) return;
    try {
      const items = await puterSDK.fs.readdir(currentPath);
      const mapped: PuterFileItem[] = items.map((i: any) => ({
        name: i.name,
        is_dir: i.is_dir,
        size: i.size,
        modified: i.modified
      }));
      setFileList(mapped);
    } catch (e: any) {
      addLog("error", `Explorador: ${e.message}`);
    }
  };

  const goUpDir = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/");
    parts.pop();
    const up = parts.join("/") || "/";
    setCurrentPath(up);
  };

  const handleItemClick = async (item: PuterFileItem) => {
    if (item.is_dir) {
      const newPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    } else {
      const fullPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      try {
        addLog("info", `Abriendo ${item.name}...`);
        const blob = await puterSDK.fs.read(fullPath);
        const text = await blob.text();
        setEditorContent(text);
        setCurrentFileName(item.name);
        addLog("success", `✓ Archivo cargado: ${fullPath}`);
        showNotification(`📄 ${item.name}`);
      } catch (err: any) {
        addLog("error", `Error al abrir: ${err.message}`);
      }
    }
  };

  const refreshKvStore = async () => {
    if (!puterSDK || !isPuterAuthenticated) return;
    try {
      const keys = await puterSDK.kv.list();
      const list = await Promise.all(keys.map(async (k: string) => {
        const val = await puterSDK.kv.get(k);
        return { key: k, value: String(val) };
      }));
      setKvStore(list);
    } catch (e) {
      // Fail silently
    }
  };

  const refreshHostingSites = async () => {
    if (!puterSDK || !isPuterAuthenticated) return;
    try {
      const sites = await puterSDK.hosting.list();
      const list = sites.map((s: any) => ({
        subdomain: s.subdomain,
        dirPath: s.dir_path || s.dirPath || "/",
        url: `https://${s.subdomain}.puter.site`
      }));
      setHostedSites(list);
    } catch (e) {
      // Fail silently
    }
  };

  // --- POLING BACK-END COMMAND QUEUE FROM OTHERS ---
  useEffect(() => {
    const pollQueue = async () => {
      try {
        const res = await fetch("/api/agent/queue");
        if (res.ok) {
          const data = await res.json();
          if (data.commands && data.commands.length > 0) {
            for (const cmd of data.commands) {
              addLog("ai", `⚡ [AGENTE AUTOMÁTICO] Recibido: "${cmd.message}"`);
              showNotification("⚡ Ejecutando desde túnel remoto...");
              
              setChatHistory(prev => [
                ...prev,
                {
                  id: "remote-" + Date.now() + Math.random(),
                  role: "system",
                  content: `🤖 **[Inyección Remota]**\nEjecutando script de resolución automatizada para:\n_"${cmd.message}"_`,
                  timestamp: new Date().toLocaleTimeString()
                }
              ]);

              // Run sandbox
              executeSandboxCode(cmd.code);
            }
          }
        }
      } catch (err) {
        // consumes background failures silently
      }
    };

    const interval = setInterval(pollQueue, 3000);
    return () => clearInterval(interval);
  }, [puterSDK, isPuterAuthenticated, currentPath]);

  // --- TERMINAL SCROLL MONITOR ---
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // --- HELPER LOGS ---
  const addLog = (type: LogLine["type"], text: string) => {
    setLogs(prev => [
      ...prev,
      {
        type,
        text,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  // --- AUTHENTICATION INITIATOR ---
  const loginPuter = async () => {
    try {
      addLog("info", "Abriendo portal de autenticación seguro de Puter...");
      const sdk = window.puter;
      if (!sdk) throw new Error("Puter.js SDK no disponible.");
      await sdk.auth.signIn();
      const u = await sdk.auth.getUser();
      setPuterUsername(u.username);
      setIsPuterAuthenticated(true);
      setPuterSDK(sdk);
      addLog("success", `✓ Sincerado: @${u.username}`);
      showNotification(`@${u.username} conectado!`);
    } catch (err: any) {
      addLog("error", "Fallo al iniciar sesión en Puter: " + err.message);
    }
  };

  const setupClaudeKey = () => {
    const k = prompt("Anthropic API Key (sk-ant-...):\nSe guardará localmente en el navegador.", claudeKey || "");
    if (k && k.startsWith("sk-ant-")) {
      setClaudeKey(k);
      localStorage.setItem("nxark_ckey", k);
      addLog("success", "✓ Claude Anthropic API Key configurada con éxito.");
      showNotification("Claude Key OK");
    } else if (k === "") {
      setClaudeKey("");
      localStorage.removeItem("nxark_ckey");
      addLog("info", "API Key removida de la sesión local.");
    } else if (k !== null) {
      alert("La clave Anthropic ingresada no parece tener formato válido (sk-ant-...)");
    }
  };

  // --- CORE EXEC Sandbox runner ---
  const executeSandboxCode = async (code: string) => {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      addLog("command", args.join(" "));
      originalLog(...args);
    };

    try {
      // Evaluate within an async context carrying puter as namespace
      const runner = new Function(`
        return (async () => {
          ${code}
        })();
      `);
      await runner();
      refreshFileList();
      refreshKvStore();
      refreshHostingSites();
    } catch (err: any) {
      addLog("error", `Fallo de ejecución: ${err.message}`);
      throw err;
    } finally {
      console.log = originalLog;
    }
  };

  // --- SAVE AND RUN MANUALLY ---
  const saveEditorCode = async () => {
    if (!puterSDK || !isPuterAuthenticated) {
      addLog("error", "Pulse [🔑 PUTER] para iniciar sesión en tu explorador en la nube primero.");
      showNotification("Puter desconectado");
      return;
    }
    const fullPath = currentPath === "/" ? `/${currentFileName}` : `${currentPath}/${currentFileName}`;
    try {
      await puterSDK.fs.write(fullPath, editorContent, { overwrite: true, createMissingParents: true });
      addLog("success", `✓ Archivo '${currentFileName}' guardado exitosamente.`);
      showNotification(`💾 ${currentFileName}`);
      refreshFileList();
    } catch (err: any) {
      addLog("error", `Fallo al guardar: ${err.message}`);
    }
  };

  const execEditor = () => {
    addLog("info", "--- Ejecutando editor de código ---");
    executeSandboxCode(editorContent)
      .then(() => addLog("success", "--- Sincronización completada ---"))
      .catch((e) => addLog("error", `Fallo: ${e.message}`));
  };

  const deployToWeb = async () => {
    if (!puterSDK || !isPuterAuthenticated) {
      addLog("error", "Para publicar, conéctese con Puter primero.");
      return;
    }
    const sub = prompt("Subdominio (.puter.site):", `arkaios-${Date.now()}`);
    if (!sub) return;
    const dir = prompt("Carpeta a servir:", currentPath);
    if (!dir) return;

    try {
      addLog("info", `Desplegando '${dir}' hacia https://${sub}.puter.site...`);
      await puterSDK.hosting.create(sub, dir);
      addLog("success", `🌐 ¡Sitio en línea! https://${sub}.puter.site`);
      showNotification(`🌐 ${sub}.puter.site`);
      refreshHostingSites();
    } catch (err: any) {
      addLog("error", "Error de Hosting: " + err.message);
    }
  };

  // --- CONFIG MANAGERS ---
  const handleSaveArkConfig = () => {
    localStorage.setItem("nxark_webhook", arkWebhook);
    localStorage.setItem("nxark_token", arkToken);
    addLog("success", "✓ Configuración de ARKAIOS Webhook almacenada con éxito.");
    showNotification("Config ARKAIOS Guardada");
  };

  const handleSaveNexusConfig = () => {
    localStorage.setItem("nxark_nexus", arkNexus);
    localStorage.setItem("nxark_endpoint", arkEndpoint);
    addLog("success", "✓ Endpoint de Nexus Lab guardado con éxito.");
    showNotification("Túnel Nexus Sincronizado");
  };

  const handleSaveElemiaConfig = () => {
    localStorage.setItem("nxark_fuentes", arkFuentes.join("\n"));
    addLog("success", `✓ Elemia: ${arkFuentes.length} fuentes autorizadas guardadas.`);
    showNotification("Auditoría configurada");
  };

  const handleTestWebhook = async () => {
    addLog("info", "Verificando conexión con n8n gateway...");
    try {
      const res = await window.ARKAIOS.fire({
        EVENT_TYPE: "NEXUS_IDE_TEST",
        NOTES: "Prueba de canal seguro desde pantalla de configuración"
      });
      addLog("success", `Webhook activo: ${JSON.stringify(res).slice(0, 100)}`);
      showNotification("Conectado con n8n");
    } catch (e: any) {
      addLog("error", `Fallo en el webhook: ${e.message}`);
    }
  };

  const handleTestNexus = async () => {
    if (!arkNexus) return;
    addLog("info", `Probando túnel Nexus Lab: ${arkNexus}...`);
    try {
      const res = await fetch(arkNexus, { method: "GET" });
      addLog("success", `Nexus Lab OK (${res.status})`);
      showNotification("Nexus Lab accesible!");
    } catch (e: any) {
      addLog("error", `Inaccesible: ${e.message}`);
    }
  };

  const handleFireArkaios = async () => {
    const textToSend = chatInput.trim() || "Instrucción de control remete";
    try {
      const r = await window.ARKAIOS.fire({
        EVENT_TYPE: "NEXUS_IDE_COMMAND",
        NOTES: textToSend,
        SOURCE_IP: "nexus-ide"
      });
      addLog("success", `ARKAIOS ejecutó comando: ${JSON.stringify(r).slice(0, 150)}`);
      showNotification("ARKAIOS disparado ✓");
    } catch (e: any) {
      addLog("error", `Fallo ark.fire: ${e.message}`);
    }
  };

  const handleAskElemia = async () => {
    const evType = prompt("Tipo de evento a clasificar:", "NEXUS_QUERY") || "NEXUS_QUERY";
    const source = prompt("Fuente identificadora:", "nexus-ide") || "nexus-ide";
    try {
      const resp = await window.ARKAIOS.elemia(evType, source, "Verificación de integridad desde Nexus IDE");
      showNotification("ELEMIA clasificado");
    } catch (e: any) {
      addLog("error", `Fallo ELEMIA: ${e.message}`);
    }
  };

  const handleSidebarQA = async (act: string) => {
    switch (act) {
      case "nf": {
        const name = prompt("Nombre para el nuevo archivo:", "script_automatizado.js");
        if (!name) return;
        if (!puterSDK || !isPuterAuthenticated) {
          addLog("error", "Sesión de Puter no lista.");
          return;
        }
        const fullPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
        try {
          await puterSDK.fs.write(fullPath, "", { createMissingParents: true });
          addLog("success", `Creado archivo: ${fullPath}`);
          refreshFileList();
        } catch (e: any) {
          addLog("error", e.message);
        }
        break;
      }
      case "nd": {
        const dName = prompt("Nombre para la nueva carpeta:", "modulo_analisis");
        if (!dName) return;
        if (!puterSDK || !isPuterAuthenticated) {
          addLog("error", "Sesión de Puter no lista.");
          return;
        }
        const fullPath = currentPath === "/" ? `/${dName}` : `${currentPath}/${dName}`;
        try {
          await puterSDK.fs.mkdir(fullPath, { createMissingParents: true });
          addLog("success", `Creado directorio: ${fullPath}`);
          refreshFileList();
        } catch (e: any) {
          addLog("error", e.message);
        }
        break;
      }
      case "fire_arkaios":
        await handleFireArkaios();
        break;
      case "image_gen": {
        const promptText = prompt("¿Qué imagen deseas generar?", "asistente robotico futurista, cyberpunk, neon aesthetic, 4k, arte digital");
        if (!promptText) return;
        try {
          addLog("info", "Solicitando renderización de imagen...");
          const res = await window.ARKAIOS.imageGen(promptText);
          addLog("success", `Respuesta: ${JSON.stringify(res)}`);
        } catch (e: any) {
          addLog("error", e.message);
        }
        break;
      }
      case "edu_req": {
        const topicName = prompt("Tema para petición educativa:", "Avances de la Inteligencia Artificial");
        if (!topicName) return;
        try {
          const res = await window.ARKAIOS.edu("generate_essay", { topic: topicName, subject: "Tecnología", grade: "Secundaria" });
          addLog("success", `Respuesta EDU: ${JSON.stringify(res).slice(0, 150)}`);
        } catch (e: any) {
          addLog("error", e.message);
        }
        break;
      }
      case "elemia_classify":
        await handleAskElemia();
        break;
      case "agent_auto":
        setChatInput("Eres mi copitolo de n8n. Genera una imagen cyberpunk con ARKAIOS.imageGen(), guarda el resultado en Puter, crea un index.html con él y notifica con window.ARKAIOS.elemia() para clasificar que el despliegue es en vivo.");
        showNotification("Agente AUTO cargado");
        break;
    }
  };

  // --- TERMINAL COMMAND PARSER ENGINE ---
  const handleTerminalIn = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cmd = terminalInput;
      setTerminalInput("");
      
      const userPrompt = `${puterUsername || "nexus"}@arkaios:${currentPath}$`;
      addLog("command", `${userPrompt} ${cmd}`);

      setCommandHistory(prev => [cmd, ...prev]);
      setHistoryIndex(-1);

      const parts = cmd.trim().split(" ");
      const baseCmd = parts[0].toLowerCase();
      const rest = parts.slice(1).join(" ");

      if (!baseCmd) return;

      if (baseCmd === "clear") {
        setLogs([]);
        return;
      }

      if (baseCmd === "help") {
        const lines = [
          "NEXUS IDE v3 — Comandos ARKAIOS + Puter:",
          "  ark.fire [json]         Disparar webhook ARKAIOS",
          "  ark.img <prompt>        Generar imagen via ARKAIOS",
          "  ark.edu <topic>         Petición educativa",
          "  ark.elemia <event> <src> Clasificar con ELEMIA",
          "  ark.nexus <msg>         Hablar con el Nexus Lab",
          "  ls / cd / pwd / mkdir / write / cat / rm",
          "  kv.set <k> <v> / kv.get <k> / kv.list",
          "  ai.chat <msg>           IA sin API key (puter.ai)",
          "  hosting.list / hosting.create <s> <d>",
          "  deploy                  Desplegar editor en Puter Hosting",
          "  exec <js>               Ejecutar script JavaScript libre",
          "  agente <msg>            Enviar instrucción al copiloto inteligente",
          "  clear                   Limpiar terminal"
        ];
        lines.forEach(l => addLog("info", l));
        return;
      }

      if (baseCmd === "pwd") {
        addLog("info", currentPath);
        return;
      }

      // Webhook routing commands list
      if (baseCmd === "ark.fire") {
        try {
          const payload = rest ? JSON.parse(rest) : { EVENT_TYPE: "CLI_EVENT", NOTES: "Desde terminal NEXUS" };
          const resp = await window.ARKAIOS.fire(payload);
          addLog("success", `Webhook respondido: ${JSON.stringify(resp)}`);
        } catch (err: any) {
          addLog("error", `Fallo ark.fire: ${err.message}`);
        }
        return;
      }

      if (baseCmd === "ark.img") {
        if (!rest) {
          addLog("error", "Uso: ark.img <prompt>");
          return;
        }
        try {
          const res = await window.ARKAIOS.imageGen(rest);
          addLog("success", `Renderizado listo: ${JSON.stringify(res)}`);
        } catch (err: any) {
          addLog("error", err.message);
        }
        return;
      }

      if (baseCmd === "ark.edu") {
        if (!rest) {
          addLog("error", "Uso: ark.edu <tema>");
          return;
        }
        try {
          const res = await window.ARKAIOS.edu("generate_essay", { topic: rest, subject: "General", grade: "Secundaria" });
          addLog("success", `EDU: ${JSON.stringify(res)}`);
        } catch (err: any) {
          addLog("error", err.message);
        }
        return;
      }

      if (baseCmd === "ark.elemia") {
        const elParts = rest.split(" ");
        if (elParts.length < 2) {
          addLog("error", "Uso: ark.elemia <evento> <fuente>");
          return;
        }
        try {
          const res = await window.ARKAIOS.elemia(elParts[0], elParts[1], elParts.slice(2).join(" "));
          addLog("success", `Auditoría completada de ELEMIA.`);
        } catch (err: any) {
          addLog("error", err.message);
        }
        return;
      }

      if (baseCmd === "ark.nexus") {
        if (!rest) {
          addLog("error", "Uso: ark.nexus <mensaje>");
          return;
        }
        try {
          await window.ARKAIOS.nexusAgent(rest);
        } catch (err: any) {
          addLog("error", err.message);
        }
        return;
      }

      // Check puter authentication before running Puter operations
      if (!puterSDK || !isPuterAuthenticated) {
        addLog("error", "Conecte Puter primero antes de ordenar: [🔑 PUTER]");
        return;
      }

      switch (baseCmd) {
        case "ls":
          try {
            const items = await puterSDK.fs.readdir(currentPath);
            if (items.length === 0) {
              addLog("info", "(Directorio vacío)");
            } else {
              items.forEach((i: any) => {
                const prefix = i.is_dir ? "DIR " : "FILE";
                addLog("info", `${prefix}   ${i.name}`);
              });
            }
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;

        case "cd": {
          if (!rest || rest === "/") {
            setCurrentPath("/");
            addLog("success", "/");
            break;
          }
          const checkPath = rest.startsWith("/") ? rest : (currentPath === "/" ? `/${rest}` : `${currentPath}/${rest}`);
          try {
            await puterSDK.fs.readdir(checkPath);
            setCurrentPath(checkPath);
            addLog("success", checkPath);
          } catch (err) {
            addLog("error", `Directorio no encontrado: ${rest}`);
          }
          break;
        }

        case "mkdir": {
          if (!rest) {
            addLog("error", "Uso: mkdir <nombre_carpeta>");
            break;
          }
          const folderPath = currentPath === "/" ? `/${rest}` : `${currentPath}/${rest}`;
          try {
            await puterSDK.fs.mkdir(folderPath, { createMissingParents: true });
            addLog("success", `✓ Carpeta creada: ${folderPath}`);
            refreshFileList();
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "write": {
          const wParts = rest.split(" ");
          if (wParts.length < 2) {
            addLog("error", "Uso: write <archivo> <contenido...>");
            break;
          }
          const fileName = wParts[0];
          const textVal = wParts.slice(1).join(" ");
          const folderPath = currentPath === "/" ? `/${fileName}` : `${currentPath}/${fileName}`;
          try {
            await puterSDK.fs.write(folderPath, textVal, { overwrite: true, createMissingParents: true });
            addLog("success", `✓ Archivo escrito: ${folderPath}`);
            refreshFileList();
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "cat": {
          if (!rest) {
            addLog("error", "Uso: cat <archivo>");
            break;
          }
          const folderPath = rest.startsWith("/") ? rest : (currentPath === "/" ? `/${rest}` : `${currentPath}/${rest}`);
          try {
            const blob = await puterSDK.fs.read(folderPath);
            const content = await blob.text();
            addLog("info", content);
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "rm": {
          if (!rest) {
            addLog("error", "Uso: rm <archivo_o_carpeta>");
            break;
          }
          const target = rest.startsWith("/") ? rest : (currentPath === "/" ? `/${rest}` : `${currentPath}/${rest}`);
          try {
            await puterSDK.fs.delete(target, { recursive: true });
            addLog("success", `✓ Eliminado: ${target}`);
            refreshFileList();
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "kv.set": {
          const kvParts = rest.split(" ");
          if (kvParts.length < 2) {
            addLog("error", "Uso: kv.set <llave> <valor...>");
            break;
          }
          try {
            await puterSDK.kv.set(kvParts[0], kvParts.slice(1).join(" "));
            addLog("success", `KV set: [${kvParts[0]}]`);
            refreshKvStore();
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "kv.get": {
          if (!rest) {
            addLog("error", "Uso: kv.get <llave>");
            break;
          }
          try {
            const val = await puterSDK.kv.get(rest);
            addLog("info", `${rest} = ${val}`);
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "kv.list":
          try {
            const keys = await puterSDK.kv.list();
            addLog("info", "--- BASE DE DATOS KV ---");
            keys.forEach((k: string) => addLog("info", `  ${k}`));
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;

        case "ai.chat": {
          if (!rest) {
            addLog("error", "Uso: ai.chat <mensaje>");
            break;
          }
          addLog("info", "[Puter AI] Consultando modelo...");
          try {
            const response = await puterSDK.ai.chat(rest, { model: "claude-3-5-sonnet" });
            const rep = response.message?.content?.[0]?.text || response.message || "Sin respuesta";
            addLog("info", `[AI Gratuita]: ${rep}`);
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "hosting.list":
          try {
            const sites = await puterSDK.hosting.list();
            addLog("info", "--- HOSTING SITIOS WEB ---");
            sites.forEach((s: any) => addLog("info", `  https://${s.subdomain}.puter.site`));
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;

        case "hosting.create": {
          const hParts = rest.split(" ");
          if (hParts.length < 2) {
            addLog("error", "Uso: hosting.create <subdominio> <directorio>");
            break;
          }
          try {
            await puterSDK.hosting.create(hParts[0], hParts[1]);
            addLog("success", `✓ Desplegado! Visita: https://${hParts[0]}.puter.site`);
            refreshHostingSites();
          } catch (e: any) {
            addLog("error", e.message);
          }
          break;
        }

        case "deploy":
          deployToWeb();
          break;

        case "save":
          saveEditorCode();
          break;

        case "exec":
          if (!rest) {
            addLog("error", "Uso: exec <código-javascript>");
            break;
          }
          executeSandboxCode(rest);
          break;

        case "agente":
          if (!rest) {
            addLog("error", "Uso: agente <mensaje_copiloto>");
            break;
          }
          sendAgentWithText(rest);
          break;

        default:
          addLog("error", `Consola: Comando desconocido: "${baseCmd}". Consulta "help".`);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIdx);
      setTerminalInput(commandHistory[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIdx);
      setTerminalInput(nextIdx >= 0 ? commandHistory[nextIdx] : "");
    }
  };

  // --- CORE CHAT INVOCATION (Local fallback & Anthropic client) ---
  const convertHistoryToAnthropic = (hist: ChatMessage[], newMsg: string) => {
    // Converts history to the compliant Anthropic messages payload
    const output: any[] = [];
    hist.forEach(h => {
      if (h.content === "thinking") return;
      if (h.role === "system") return; // anthropic takes system separately
      output.push({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content
      });
    });
    output.push({ role: "user", content: newMsg });
    return output.slice(-10); // keep window small
  };

  const buildSysInstruction = () => {
    return `Eres NEXUS v3, un agente copiloto de desarrollo avanzado experto en el ecosistema ARKAIOS, ELEMIA, Puter.js y Claude.

APIs JavaScript globales completamente accesibles en este navegador:

=== window.ARKAIOS ===
- window.ARKAIOS.fire(payload)         → POST al n8n Webhook de ARKAIOS
- window.ARKAIOS.imageGen(prompt)      → Generación de imagen automática
- window.ARKAIOS.edu(action, data)     → Procesar solicitudes de recursos educativos
- window.ARKAIOS.elemia(event, src)    → Enviar logs a ELEMIA para clasificar auditoría
- window.ARKAIOS.nexusAgent(msg)       → Hablar directamente con el Túnel Nexus Lab

=== puter ===
- puter.fs.write(path, content, { overwrite: true, createMissingParents: true }) // Crear archivos
- puter.fs.read(path) -> Retorna Blob (.text() para string completo)
- puter.fs.mkdir(path, { createMissingParents: true })
- puter.fs.readdir(path)
- puter.fs.delete(path)
- puter.kv.set(key, val)
- puter.kv.get(key)
- puter.kv.list()
- puter.ai.chat(msg, { model }) // Modelos completamente gratuitos
- puter.hosting.create(sub, dir) // Publicar sitio web en https://<sub>.puter.site

=== CÓMO AUTOMATIZAR ACCIONES ===
Para que este IDE ejecute código JavaScript de forma 100% desatendida y nativa, envuelve el script estrictamente en estas etiquetas:
[EXECUTE_JS]
// Tu script async/await compatible con puter y window.ARKAIOS
[/EXECUTE_JS]

Y para disparar un evento de webhook ARKAIOS desde tu respuesta:
[ARK_PAYLOAD]
{"EVENT_TYPE": "CUALQUIERA", "NOTES": "Descripción"}
[/ARK_PAYLOAD]

Estado actual: Puter=${isPuterAuthenticated ? "SINCERADO" : "DESCONECTADO"}, ARKAIOS=${arkWebhook ? "ACTIVO" : "SIN CONFIGURAR"}.
Contenido actual del editor: ${editorContent.slice(0, 300)}...

Responde de forma concisa en español de manera profesional y optimiza la automatización del usuario generando los bloques [EXECUTE_JS] correspondientes.`;
  };

  const sendAgentWithText = async (userText: string) => {
    if (!userText.trim()) return;
    setIsAgentResponding(true);

    const formattedUserMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatHistory(prev => [...prev, formattedUserMsg]);

    const typingId = "thinking-" + Date.now();
    setChatHistory(prev => [...prev, {
      id: typingId,
      role: "system",
      content: "thinking",
      timestamp: ""
    }]);

    addLog("ai", `[Asistente] Consultando copiloto: "${userText.slice(0, 50)}..."`);

    try {
      let replyText = "";
      if (claudeKey && claudeKey.startsWith("sk-ant-")) {
        // Direct secure invocation to Anthropic Claude via browser
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2048,
            system: buildSysInstruction(),
            messages: convertHistoryToAnthropic(chatHistory, userText)
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        replyText = data.content.map((b: any) => b.text || "").join("");
      } else {
        // Safe backend fallback to Gemini Copiloto!
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: chatHistory.filter(h => h.content !== "thinking").map(h => ({
              role: h.role,
              content: h.content
            }))
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        replyText = data.text || "";
      }

      setChatHistory(prev => prev.filter(h => h.id !== typingId));

      const replyMsg: ChatMessage = {
        id: "reply-" + Date.now(),
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, replyMsg]);

      // parse and fire [EXECUTE_JS]
      const rx = /\[EXECUTE_JS\]([\s\S]*?)\[\/EXECUTE_JS\]/g;
      let match;
      while ((match = rx.exec(replyText)) !== null) {
        if (match[1]) {
          await executeSandboxCode(match[1].trim());
          showNotification("✓ Acción finalizada!");
        }
      }

      // parse and fire [ARK_PAYLOAD]
      const rxArk = /\[ARK_PAYLOAD\]([\s\S]*?)\[\/ARK_PAYLOAD\]/g;
      let matchArk;
      while ((matchArk = rxArk.exec(replyText)) !== null) {
        if (matchArk[1]) {
          await window.ARKAIOS.fire(JSON.parse(matchArk[1].trim()));
        }
      }

    } catch (err: any) {
      setChatHistory(prev => prev.filter(h => h.id !== typingId));
      setChatHistory(prev => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `❌ Conexión interrumpida: ${err.message}\n\nAsegúrate de configurar tu webhook o tu Claude sk-ant API Key si deseas utilizar Claude Sonnet de forma directa.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      addLog("error", `Error de copiloto: ${err.message}`);
    } finally {
      setIsAgentResponding(false);
    }
  };

  const triggerChatSubmit = () => {
    const raw = chatInput.trim();
    if (!raw) return;
    setChatInput("");
    sendAgentWithText(raw);
  };

  const getMsgClass = (role: string, content: string) => {
    if (role === "user") return "mu";
    if (role === "system") return "ms";
    if (content.includes("ELEMIA") || content.includes("🛡")) return "meli";
    if (content.includes("ARKAIOS") || content.includes("⚡")) return "mark";
    return "ma";
  };

  const formatMessageHTML = (text: string) => {
    let formatted = text.replace(/\n/g, "<br>");
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(0,255,136,.08);padding:0 3px;border-radius:2px;font-family:monospace;color:#00ff88">$1</code>');
    return formatted;
  };

  // --- KEYBOARD WRAPPER SHORTCUTS ---
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;
      setEditorContent(val.substring(0, start) + "  " + val.substring(end));
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      saveEditorCode();
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      execEditor();
    }
  };

  // --- RENDERING VIEWS ---
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden scanlines bg-[#030306] select-none text-[#c8d8e8]">
      <AIAssistant getCanvasContext={serializeCanvasState} />

      <AIAssistant getCanvasContext={serializeCanvasState} />

      
      {/* BOOT LOADING OVERLAY */}
      {isBooting && (
        <div id="boot">
          <div className="bl">NEXUS</div>
          <div className="bl2">ARKAIOS · ELEMIA · CLAUDE · PUTER</div>
          <div className="text-[9px] text-[#445566] tracking-[2px] leading-relaxed uppercase">AGENT IDE v3</div>
          <div className="bb">
            <div className="bbar text-xs" style={{ width: `${bootProgress}%` }}></div>
          </div>
          <div className="bm font-mono text-[9px] text-[#445566]">{bootMessage}</div>
        </div>
      )}

      {/* TOP DECORATIVE STATUS BAR */}
      <div id="topbar">
        <div className="logo cursor-pointer" onClick={() => showNotification("NEXUS IDE v3")}>NEXUS <em>v3</em></div>
        <button className="topbtn" onClick={loginPuter}>🔑 PUTER</button>
        <button className="topbtn" onClick={setupClaudeKey}>🤖 CLAUDE KEY</button>
        <button className="topbtn" onClick={saveEditorCode}>💾 SAVE</button>
        <button className="topbtn cursor-pointer" onClick={execEditor}>▶ RUN</button>
        <button className="topbtn arkaios cursor-pointer" onClick={handleFireArkaios}>⚡ → ARKAIOS</button>
        <button className="topbtn elemia cursor-pointer" onClick={handleAskElemia}>🛡 ELEMIA</button>
        <button className="topbtn cursor-pointer" onClick={deployToWeb}>🌐 DEPLOY</button>
        
        <div id="statusbar">
          <span><span className={`sdot ${isPuterAuthenticated ? "sg" : "doff"}`}></span>Puter</span>
          <span><span className={`sdot ${claudeKey ? "se" : "doff"}`}></span>Claude</span>
          <span><span className={`sdot ${arkWebhook ? "sa" : "doff"}`}></span>ARKAIOS</span>
          <span><span className={`sdot ${arkFuentes.length > 0 ? "se" : "doff"}`}></span>ELEMIA</span>
          <span className="text-[#00ff88] text-[9px] font-mono ml-1">
            {isPuterAuthenticated ? `@${puterUsername}` : ""}
          </span>
        </div>
      </div>

      {/* CORE WORKSPACE LAYOUT */}
      <div id="main" className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR */}
        <div id="sidebar">
          
          {/* Puter Filesystem Section */}
          <div className="sh sh-fs flex items-center justify-between" onClick={() => {
            if (isPuterAuthenticated) {
              refreshFileList();
              showNotification("Sincronizado");
            } else {
              loginPuter();
            }
          }}>
            <span>📁 PUTER FS</span>
            <span className="text-[8px] opacity-75">↺</span>
          </div>

          <div id="file-tree" className="max-h-[220px]">
            {!isPuterAuthenticated ? (
              <div className="ti text-slate-500 text-[9px] px-3 py-2 italic">
                [Inicie sesión en Puter]
              </div>
            ) : (
              <>
                {/* Back Link */}
                {currentPath !== "/" && (
                  <div className="ti dir font-bold flex items-center gap-1.5" onClick={goUpDir}>
                    <span>📁 .. (Atrás)</span>
                  </div>
                )}
                {/* Folder lists */}
                {fileList.map((item, index) => (
                  <div 
                    key={index} 
                    className={`ti ${item.is_dir ? "dir select-none text-[#00ccff]" : ""}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <span>{item.is_dir ? "📁" : "📄"} {item.name}</span>
                  </div>
                ))}
                {fileList.length === 0 && (
                  <div className="ti text-[#445566] text-[9px] font-mono italic px-3 py-1">
                    Directorio vacío
                  </div>
                )}
              </>
            )}
          </div>

          {/* n8n Status Board */}
          <div id="ark-status">
            <div className="cfg-title">ARKAIOS GATEWAY</div>
            
            <div className="flex items-center gap-1.5 text-[9px] mb-1 font-mono text-[#445566]">
              <span className={`sdot ${arkWebhook ? "sa animate-pulse" : "doff"}`}></span>
              <span className="truncate">W: {arkWebhook ? arkWebhook.replace("https://", "").slice(0, 18) + "..." : "sin configurar"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] mb-1 font-mono text-[#445566]">
              <span className={`sdot ${arkNexus ? "sg" : "doff"}`}></span>
              <span>L: {arkNexus ? arkNexus.replace("https://", "").slice(0, 18) + "..." : "sin configurar"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#445566]">
              <span className={`sdot ${arkToken ? "se" : "doff"}`}></span>
              <span>K: {arkToken ? "token activo ✓" : "sin token"}</span>
            </div>
          </div>

          {/* Workspace Quick Commands */}
          <div id="qactions">
            <button className="qa" onClick={() => handleSidebarQA("nf")}>+ Nuevo archivo</button>
            <button className="qa" onClick={() => handleSidebarQA("nd")}>+ Nueva carpeta</button>
            <button className="qa qa-ark" onClick={() => handleSidebarQA("fire_arkaios")}>⚡ n8n Webhook direct</button>
            <button className="qa qa-ark" onClick={() => handleSidebarQA("image_gen")}>🎨 ImageGen n8n</button>
            <button className="qa qa-ark" onClick={() => handleSidebarQA("edu_req")}>📚 Petición EDU</button>
            <button className="qa qa-eli" onClick={() => handleSidebarQA("elemia_classify")}>🛡 Clasificar con ELEMIA</button>
            <button className="qa qa-eli" onClick={() => handleSidebarQA("agent_auto")}>🤖 Cargar Agente AUTO</button>
          </div>
        </div>

        {/* CENTER CONSOLE AND EDITOR */}
        <div id="center">
          
          {/* Editor Sandbox Header tabs */}
          <div id="editor-area">
            <div id="editor-tabs">
              <div className="etab active">
                <span>📄 {currentFileName}</span>
                <span onClick={() => {
                  setEditorContent("");
                  setCurrentFileName("untitled.js");
                }} className="ml-1 cursor-pointer hover:text-red-500 font-bold">×</span>
              </div>
              <div className="etab opacity-50 font-mono text-[9px]" onClick={() => {
                const name = prompt("Nuevo nombre de archivo:", "index.html");
                if (name) {
                  setCurrentFileName(name);
                  showNotification(`Renombrado: ${name}`);
                }
              }}>
                [Renombrar]
              </div>
            </div>

            {/* Core editor text block */}
            <div id="editor-wrap">
              <div id="lnum" dangerouslySetInnerHTML={{ __html: editorContent.split("\n").map((_, i) => i + 1).join("<br>") }}></div>
              <textarea 
                id="editor"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck="false"
              />
            </div>
          </div>

          <div id="hdiv" />

          {/* LOWER TERMINAL CONSOLE */}
          <div id="term-area">
            <div id="term-tabs">
              <div 
                className={`ttab ${activeTermTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveTermTab("terminal")}
              >
                TERMINAL
              </div>
              <div 
                className={`ttab ${activeTermTab === "arkaios" ? "active" : ""}`}
                onClick={() => setActiveTermTab("arkaios")}
              >
                ARKAIOS LOG ({arkLog.length})
              </div>
              <div 
                className={`ttab ${activeTermTab === "elemia" ? "active" : ""}`}
                onClick={() => setActiveTermTab("elemia")}
              >
                ELEMIA LOG ({elimiaLog.length})
              </div>
              <div 
                className={`ttab ${activeTermTab === "kv" ? "active" : ""}`}
                onClick={() => setActiveTermTab("kv")}
              >
                KV STORE ({kvStore.length})
              </div>
              <div 
                className={`ttab ${activeTermTab === "hosting" ? "active" : ""}`}
                onClick={() => setActiveTermTab("hosting")}
              >
                HOSTING ({hostedSites.length})
              </div>
              
              <button 
                onClick={() => {
                  if (activeTermTab === "terminal") {
                    setLogs([]);
                  } else if (activeTermTab === "arkaios") {
                    setArkLog([]);
                  } else if (activeTermTab === "elemia") {
                    setElimiaLog([]);
                  }
                  showNotification("Log limpio");
                }} 
                className="ml-auto font-mono text-[9px] border border-[#151530] text-[#445566] hover:text-[#00ff88] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              >
                CLR
              </button>
            </div>

            <div id="term-out" ref={terminalRef}>
              {activeTermTab === "terminal" && (
                <>
                  <div className="lsys text-[#445566] text-[10px] mb-1 font-mono">=== NEXUS CONSOLE LOG ===</div>
                  {logs.map((log, index) => {
                    let logClass = "lout";
                    if (log.type === "error") logClass = "lerr";
                    if (log.type === "success") logClass = "lok";
                    if (log.type === "warning") logClass = "linf";
                    if (log.type === "ai") logClass = "lag";
                    if (log.type === "command") logClass = "lcmd";
                    
                    return (
                      <div key={index} className={logClass}>
                        {log.text}
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <div className="text-[10px] text-[#445566] font-mono italic">
                      Consola lista. Escribe 'help' para explorar comandos de automatización completa.
                    </div>
                  )}
                </>
              )}

              {activeTermTab === "arkaios" && (
                <>
                  <div className="lsys text-[#445566] text-[10px] mb-1 font-mono">=== HISTORIAL WEBHOOKS / n8n GATEWAY ===</div>
                  {arkLog.map((log, index) => (
                    <div key={index} className="mb-2 p-1 bg-[#0d0d1a] border border-[#151530] rounded">
                      <div className="text-[#ffcc00] font-bold text-[10px]">
                        [{new Date(log.ts).toLocaleTimeString()}] EVENT_TYPE: {log.payload.EVENT_TYPE}
                      </div>
                      <div className="text-slate-400 text-[9px] font-mono block pl-2 mt-0.5 truncate">
                        Payload: {JSON.stringify(log.payload)}
                      </div>
                      <div className="text-[#00ff88] text-[9px] font-mono block pl-2">
                        Respuesta: {JSON.stringify(log.response)}
                      </div>
                    </div>
                  ))}
                  {arkLog.length === 0 && (
                    <div className="text-[#445566] text-[9px] font-mono px-3 py-1 italic">
                      (Sin webhooks disparados en esta sesión)
                    </div>
                  )}
                </>
              )}

              {activeTermTab === "elemia" && (
                <>
                  <div className="lsys text-[#445566] text-[10px] mb-1 font-mono">=== REGISTRO DE AUDITORÍA ELEMIA ===</div>
                  {elimiaLog.map((log, index) => (
                    <div key={index} className="mb-2 p-1 bg-[#0d0d1a] border border-[#151530] rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#cc44ff] font-bold">Event: {log.event}</span>
                        <span className={`text-[9px] ${log.authorized ? "text-[#00ff88]" : "text-red-400"}`}>
                          {log.authorized ? "✓ AUTORIZADO" : "⚠ DESCONOCIDO"}
                        </span>
                      </div>
                      <div className="text-[#445566] text-[9px]">
                        Fuente: {log.source} | Horario: {new Date(log.ts).toLocaleTimeString()}
                      </div>
                      <div className="text-[#00ccff] text-[9px] pl-2 mt-0.5 truncate">
                        Clasificación: {JSON.stringify(log.result)}
                      </div>
                    </div>
                  ))}
                  {elimiaLog.length === 0 && (
                    <div className="text-[#445566] text-[9px] font-mono px-3 py-1 italic w-full text-center">
                      (Ningún evento auditado con ELEMIA actualmente)
                    </div>
                  )}
                </>
              )}

              {activeTermTab === "kv" && (
                <>
                  <div className="lsys text-[#445566] text-[10px] mb-1 font-mono">=== PUTER LITE KV DATABASE ===</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {kvStore.map((item, index) => (
                      <div key={index} className="p-1 px-2 font-mono bg-[#0d0d1a] border border-[#151530] rounded flex justify-between items-center text-[10px]">
                        <span className="text-[#ff6b35] font-bold">{item.key}:</span>
                        <span className="text-slate-300 font-bold truncate max-w-[120px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {kvStore.length === 0 && (
                    <div className="text-[#445566] text-[9px] font-mono px-3 py-1 italic w-full text-center">
                      (Base de datos local vacía. Registre llaves con 'kv.set' o mediante scripts)
                    </div>
                  )}
                </>
              )}

              {activeTermTab === "hosting" && (
                <>
                  <div className="lsys text-[#445566] text-[10px] mb-1 font-mono">=== SITIOS WEB ACTIVO EN PUTER HOSTING ===</div>
                  <div className="space-y-1.5 mt-1 select-all font-mono">
                    {hostedSites.map((item, index) => (
                      <div key={index} className="p-1.5 bg-[#0d0d1a] border border-[#151530] rounded flex justify-between items-center text-[10px]">
                        <div>
                          <span className="text-[#00ccff] font-bold">Sub: {item.subdomain}</span>
                          <span className="text-slate-500 text-[9px] block">Carpeta de origen: {item.dirPath}</span>
                        </div>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#00ff88] hover:underline flex items-center gap-1 font-bold"
                        >
                          OPEN <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                  {hostedSites.length === 0 && (
                    <div className="text-[#445566] text-[9px] font-mono px-3 py-1 italic w-full text-center">
                      (No hay landings creadas. Intente escribir 'deploy' o correr una automatización de hosting)
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Prompt command CLI */}
            <div id="term-in">
              <span className="ppfx" id="ppfx">
                {puterUsername || "nexus"}@arkaios:{currentPath}$
              </span>
              <input 
                id="cinput"
                type="text"
                placeholder="ark.fire / ark.img / cat / write / ls / kv.set / ai.chat / agente..."
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalIn}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        {/* RIGHT CONTROL PANEL */}
        <div id="rpanel">
          <div id="rhead">
            <span className={`sdot ${isAgentResponding ? "se" : "doff"}`}></span>
            <span className="rtitle">NEXUS CO-PILOTO</span>
            <span className="ml-auto font-mono text-[8px] text-slate-500 uppercase">gemini/claude</span>
          </div>

          {/* Right Area Tab Selectors */}
          <div id="api-tabs">
            <div 
              className={`aptab ${activeApiTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveApiTab("chat")}
            >
              CHAT
            </div>
            <div 
              className={`aptab ${activeApiTab === "arkaios-cfg" ? "active" : ""}`}
              onClick={() => setActiveApiTab("arkaios-cfg")}
            >
              ARKAIOS CFG
            </div>
            <div 
              className={`aptab ${activeApiTab === "snip" ? "active" : ""}`}
              onClick={() => setActiveApiTab("snip")}
            >
              SNIPPETS
            </div>
          </div>

          {/* TAB 1: CHATBOT CONTROLLER */}
          {activeApiTab === "chat" && (
            <div id="view-chat" className="flex-1 flex flex-col justify-between overflow-hidden min-height-0">
              <div id="chat-msgs">
                {chatHistory.map((msg, index) => {
                  if (msg.content === "thinking") {
                    return (
                      <div key={index} className="msg mth select-none">
                        <span className="sdot se" style={{ animation: 'pulse .8s infinite' }}></span>
                        ELEMIA + Copiloto pensando
                        <span className="dots"><span>.</span><span>.</span><span>.</span></span>
                      </div>
                    );
                  }
                  const dynamicClass = getMsgClass(msg.role, msg.content);
                  return (
                    <div 
                      key={msg.id || index}
                      className={`msg ${dynamicClass}`}
                      dangerouslySetInnerHTML={{ __html: formatMessageHTML(msg.content) }}
                    />
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input row */}
              <div id="ainput-area">
                <textarea 
                  id="ainput"
                  placeholder="Ej: genera una landing cyberpunk con Tailwind y despliégala en Puter..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      triggerChatSubmit();
                    }
                  }}
                />
                <div id="asend-row">
                  <button className="abtn" onClick={() => setChatHistory([])}>CLR</button>
                  <button className="abtn ark" onClick={handleFireArkaios}>→ ARK</button>
                  <button className="abtn pri" onClick={triggerChatSubmit}>COPILOTO ↵</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCED WEBHOOK CONFIGS */}
          {activeApiTab === "arkaios-cfg" && (
            <div id="view-arkaios-cfg" className="flex-1 overflow-y-auto p-3 space-y-4 font-mono text-[10px]">
              <div className="cfg-sec">
                <div className="cfg-title">🔗 ARKAIOS WEBHOOK (n8n)</div>
                <div className="cfg-row">
                  <div className="cfg-label">URL del Webhook n8n:</div>
                  <input 
                    className="cfg-input"
                    value={arkWebhook}
                    onChange={(e) => setArkWebhook(e.target.value)}
                    placeholder="https://tu-n8n.com/webhook/arkaios-gateway"
                  />
                </div>
                <div className="cfg-row">
                  <div className="cfg-label">Token de autenticación (Auth Header):</div>
                  <input 
                    className="cfg-input"
                    type="password"
                    value={arkToken}
                    onChange={(e) => setArkToken(e.target.value)}
                    placeholder="tu-token-secreto"
                  />
                </div>
                <button className="cfg-btn cursor-pointer" onClick={handleSaveArkConfig}>💾 GUARDAR CONFIG</button>
                <button className="cfg-btn cursor-pointer" onClick={handleTestWebhook}>🔧 PROBAR WEBHOOK</button>
              </div>

              <div className="cfg-sec">
                <div className="cfg-title">🚀 TUNEL LOCAL (Nexus Lab)</div>
                <div className="cfg-row">
                  <div className="cfg-label">Nexus Lab Base URL:</div>
                  <input 
                    className="cfg-input"
                    value={arkNexus}
                    onChange={(e) => setArkNexus(e.target.value)}
                    placeholder="https://ais-pre-xxx.us-west2.run.app"
                  />
                </div>
                <div className="cfg-row">
                  <div className="cfg-label">Endpoint de Control:</div>
                  <input 
                    className="cfg-input"
                    value={arkEndpoint}
                    onChange={(e) => setArkEndpoint(e.target.value)}
                    placeholder="/api/agent"
                  />
                </div>
                <button className="cfg-btn cursor-pointer" onClick={handleSaveNexusConfig}>💾 GUARDAR NEXUS</button>
                <button className="cfg-btn cursor-pointer" onClick={handleTestNexus}>🔧 PROBAR NEXUS LAB</button>
              </div>

              <div className="cfg-sec">
                <div className="cfg-title">🛡 INTRODUCCIÓN ELEMIA SOURCES</div>
                <div className="cfg-row">
                  <div className="cfg-label">Fuentes autorizadas (Una por línea):</div>
                  <textarea 
                    className="cfg-input font-mono min-h-[60px]"
                    value={arkFuentes.join("\n")}
                    onChange={(e) => setArkFuentes(e.target.value.split("\n"))}
                    placeholder="nexus-ide"
                  />
                </div>
                <button className="cfg-btn eli cursor-pointer" onClick={handleSaveElemiaConfig}>💾 GUARDAR ELEMIA</button>
              </div>
            </div>
          )}

          {/* TAB 3: SNIPPETS AND CODE TEMPLATES */}
          {activeApiTab === "snip" && (
            <div id="view-snip" className="flex-1 overflow-y-auto p-2 space-y-4">
              <div className="api-s">
                <div className="api-st">ARKAIOS WEBHOOK GATEWAYS</div>
                {Object.keys(SNIPS).slice(0, 5).map((k) => (
                  <button 
                    key={k} 
                    className="api-b font-mono"
                    onClick={() => {
                      setEditorContent(prev => prev + "\n" + SNIPS[k]);
                      setActiveApiTab("chat");
                      showNotification("Snippet cargado ✓");
                    }}
                  >
                    {k.replace("_", ".")} <span className="bf bark font-bold text-[8px]">ARK</span>
                  </button>
                ))}
              </div>

              <div className="api-s">
                <div className="api-st">PUTER CORE SYSTEMS</div>
                {Object.keys(SNIPS).slice(5).map((k) => (
                  <button 
                    key={k} 
                    className="api-b font-mono"
                    onClick={() => {
                      setEditorContent(prev => prev + "\n" + SNIPS[k]);
                      setActiveApiTab("chat");
                      showNotification("Snippet cargado ✓");
                    }}
                  >
                    {k.replace("_", ".")} <span className="bf bfree font-bold text-[8px]">FREE</span>
                  </button>
                ))}
              </div>

              <div className="api-s">
                <div className="api-st">TEMPLATES INTEGRADOS COMPLETOS</div>
                {Object.keys(TPLS).map((k) => (
                  <button 
                    key={k} 
                    className="api-b font-mono text-[9px] py-1.5"
                    onClick={() => {
                      setEditorContent(TPLS[k]);
                      setCurrentFileName(k === "bridge_python" ? "bridge.py" : "index.html");
                      setActiveApiTab("chat");
                      showNotification("Template cargado ✓");
                    }}
                  >
                    🚀 {k.replace(/_/g, " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FLOATING ACTION NOTIFICATION TOAST */}
      <div id="notif" className={notification ? "show font-bold border-[#00ff88]/30 shadow-[#00ff88]/5 font-mono" : ""}>
        {notification}
      </div>

    </div>
  );
}


const serializeCanvasState = () => {
  return {
    elements: [
      { id: 'start_node', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Inicio de Flujo' }, style: { backgroundColor: '#DDEEFF', borderColor: '#4CAF50' } },
      { id: 'process_a', type: 'default', position: { x: 300, y: 150 }, data: { label: 'Proceso de Datos A' }, style: { backgroundColor: '#FFEDCC', borderColor: '#FFC107' } },
      { id: 'decision_x', type: 'default', position: { x: 200, y: 300 }, data: { label: 'Decisión X' }, style: { backgroundColor: '#FFE0B2', borderColor: '#FF9800' } },
      { id: 'output_node', type: 'output', position: { x: 500, y: 250 }, data: { label: 'Salida Final' }, style: { backgroundColor: '#CCFFCC', borderColor: '#8BC34A' } }
    ],
    connections: [
      { id: 'e1-2', source: 'start_node', target: 'process_a', type: 'step', label: 'Iniciar' },
      { id: 'e2-3', source: 'process_a', target: 'decision_x', type: 'default', label: 'Resultado A' },
      { id: 'e3-4-yes', source: 'decision_x', target: 'output_node', type: 'smoothstep', label: 'Sí' },
      { id: 'e3-4-no', source: 'decision_x', target: 'start_node', type: 'straight', label: 'No (Reiniciar)' }
    ],
    viewport: {
      x: -50,
      y: -50,
      zoom: 1.1
    },
    customSettings: {
      gridEnabled: true,
      snapToGrid: true,
      backgroundColor: '#F5F5F5'
    },
    lastModified: new Date().toISOString()
  };
};


// In a real React application, you would typically use hooks provided by your
// diagramming library (e.g., `useReactFlow`, `useNodes`, `useEdges`, `useViewport` from `react-flow-renderer`)
// or a context API to access the current state of the canvas.

const serializeCanvasState = () => {
  // This is an illustrative implementation. In a live application,
  // you would retrieve the actual state from your canvas component.
  // For example, if you were using `react-flow-renderer`:
  // const { getNodes, getEdges, getViewport } = useReactFlow();
  // const nodes = getNodes();
  // const edges = getEdges();
  // const viewport = getViewport();

  // For demonstration purposes, we'll return a richer, but still static,
  // representation of a potential canvas state.
  return {
    // Example nodes (elements) with common properties
    elements: [
      { id: 'start_node', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Inicio de Flujo' }, style: { backgroundColor: '#DDEEFF', borderColor: '#4CAF50' } },
      { id: 'process_a', type: 'default', position: { x: 300, y: 150 }, data: { label: 'Proceso de Datos A' }, style: { backgroundColor: '#FFEDCC', borderColor: '#FFC107' } },
      { id: 'decision_x', type: 'default', position: { x: 200, y: 300 }, data: { label: 'Decisión X' }, style: { backgroundColor: '#FFE0B2', borderColor: '#FF9800' } },
      { id: 'output_node', type: 'output', position: { x: 500, y: 250 }, data: { label: 'Salida Final' }, style: { backgroundColor: '#CCFFCC', borderColor: '#8BC34A' } }
    ],
    // Example connections (edges) between elements
    connections: [
      { id: 'e1-2', source: 'start_node', target: 'process_a', type: 'step', label: 'Iniciar' },
      { id: 'e2-3', source: 'process_a', target: 'decision_x', type: 'default', label: 'Resultado A' },
      { id: 'e3-4-yes', source: 'decision_x', target: 'output_node', type: 'smoothstep', label: 'Sí' },
      { id: 'e3-4-no', source: 'decision_x', target: 'start_node', type: 'straight', label: 'No (Reiniciar)' }
    ],
    // Example viewport information
    viewport: {
      x: -50,
      y: -50,
      zoom: 1.1 // Current zoom level
    },
    // You might also include custom data or settings specific to your diagram
    customSettings: {
      gridEnabled: true,
      snapToGrid: true,
      backgroundColor: '#F5F5F5'
    },
    // Timestamps for last modification
    lastModified: new Date().toISOString()
  };
};

// Example of how you might call it (for debugging or direct use):
// console.log('Serialized Canvas State:', serializeCanvasState());


const serializeCanvasState = () => {
  return {
    elements: [
      { id: 'start_node', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Inicio de Flujo' }, style: { backgroundColor: '#DDEEFF', borderColor: '#4CAF50' } },
      { id: 'process_a', type: 'default', position: { x: 300, y: 150 }, data: { label: 'Proceso de Datos A' }, style: { backgroundColor: '#FFEDCC', borderColor: '#FFC107' } },
      { id: 'decision_x', type: 'default', position: { x: 200, y: 300 }, data: { label: 'Decisión X' }, style: { backgroundColor: '#FFE0B2', borderColor: '#FF9800' } },
      { id: 'output_node', type: 'output', position: { x: 500, y: 250 }, data: { label: 'Salida Final' }, style: { backgroundColor: '#CCFFCC', borderColor: '#8BC34A' } }
    ],
    connections: [
      { id: 'e1-2', source: 'start_node', target: 'process_a', type: 'step', label: 'Iniciar' },
      { id: 'e2-3', source: 'process_a', target: 'decision_x', type: 'default', label: 'Resultado A' },
      { id: 'e3-4-yes', source: 'decision_x', target: 'output_node', type: 'smoothstep', label: 'Sí' },
      { id: 'e3-4-no', source: 'decision_x', target: 'start_node', type: 'straight', label: 'No (Reiniciar)' }
    ],
    viewport: {
      x: -50,
      y: -50,
      zoom: 1.1
    },
    customSettings: {
      gridEnabled: true,
      snapToGrid: true,
      backgroundColor: '#F5F5F5'
    },
    lastModified: new Date().toISOString()
  };
};
