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
  Cpu, 
  ChevronRight, 
  Search, 
  Trash2, 
  RefreshCw, 
  User, 
  Send, 
  Check, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Layers, 
  HelpCircle,
  FolderPlus,
  ArrowRight,
  LogOut,
  Sliders,
  Maximize2,
  ExternalLink,
  Info
} from "lucide-react";
import { DEFAULT_SCRIPT, TEMPLATES } from "./data";
import { PuterFileItem, ChatMessage, WebSiteItem, KeyValueItem, LogLine } from "./types";

// For TypeScript compatibility with global puter SDK of browser
declare global {
  interface Window {
    puter: any;
  }
}

export default function App() {
  // --- STATE DECLARATIONS ---
  const [puterSDK, setPuterSDK] = useState<any>(null);
  const [isSdkLoading, setIsSdkLoading] = useState(true);
  const [isPuterAuthenticated, setIsPuterAuthenticated] = useState(false);
  const [puterUsername, setPuterUsername] = useState<string>("");
  const [puterUsage, setPuterUsage] = useState<any>(null);

  // Filesystem States
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [fileList, setFileList] = useState<PuterFileItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>("main.js");
  const [editorContent, setEditorContent] = useState<string>(() => {
    return localStorage.getItem("nexus_editor_draft") || DEFAULT_SCRIPT;
  });

  // Terminal & logs states
  const [activeTermTab, setActiveTermTab] = useState<"terminal" | "kv" | "hosting" | "log">("terminal");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Key-Value states
  const [kvStore, setKvStore] = useState<KeyValueItem[]>([]);
  // Hosting sites states
  const [hostedSites, setHostedSites] = useState<WebSiteItem[]>([]);

  // Agent chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAgentResponding, setIsAgentResponding] = useState<boolean>(false);
  const [isAgenteAuto, setIsAgenteAuto] = useState<boolean>(false);

  // UI status
  const [activeApiTab, setActiveApiTab] = useState<"chat" | "api" | "templates">("chat");
  const [notification, setNotification] = useState<string | null>(null);

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION & SDK BINDING ---
  useEffect(() => {
    // Poll to check if Puter.js is loaded from script in index.html
    const checkPuterInterval = setInterval(() => {
      if (window.puter) {
        clearInterval(checkPuterInterval);
        const sdk = window.puter;
        setPuterSDK(sdk);
        setIsSdkLoading(false);
        addLog("success", "Puter.js SDK cargado con éxito. Entorno operativo listo.");
        
        // Check if user is already authenticated
        if (sdk.auth && typeof sdk.auth.isSignedIn === "function") {
          setIsPuterAuthenticated(sdk.auth.isSignedIn());
          if (sdk.auth.isSignedIn()) {
            fetchUserInfo(sdk);
          }
        }
      }
    }, 200);

    // Initial log message
    addLog("info", "Iniciando Nexus Agent IDE v2 en puerto simetrizado.");
    addLog("info", "Conectando hilos de procesamiento local con micro-servidor de Gemini...");

    // Setup initial welcome messages for the chat history
    setChatHistory([
      {
        id: "wel-1",
        role: "system",
        content: "NEXUS AGENT IDE v2 — Claude & Gemini & Puter Core",
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: "wel-2",
        role: "assistant",
        content: "¡Hola! Soy NEXUS, tu copiloto inteligente de desarrollo. Tengo acceso de control directo a este espacio de trabajo Puter Lab.\n\nPuedo escribir scripts avanzados, crear sistemas de archivos, guardar persistencias clave-valor (KV), desplegar landing pages, o inspeccionar tu despliegue.\n\nPrueba pidiéndome: 'Genera un juego de Ta-Te-Ti elegante en una carpeta llamada tictactoe y despliégalo gratis en la web.'",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    return () => clearInterval(checkPuterInterval);
  }, []);

  // Save draft content to localStorage
  useEffect(() => {
    localStorage.setItem("nexus_editor_draft", editorContent);
  }, [editorContent]);

  // Handle logging scroll & Chat bottom scrolling
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const addLog = (type: LogLine["type"], text: string) => {
    const newLine: LogLine = {
      type,
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev, newLine]);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- PUTER API ACCESSORS ---
  const fetchUserInfo = async (sdkInstance = puterSDK) => {
    if (!sdkInstance) return;
    try {
      const user = await sdkInstance.auth.getUser();
      setPuterUsername(user.username);
      setIsPuterAuthenticated(true);
      addLog("success", `Autenticado en Puter como @${user.username}`);
      
      // Load current directory files, KV list, and Hosted sites
      refreshFilesystem(currentPath, sdkInstance);
      refreshKvStore(sdkInstance);
      refreshHostingSites(sdkInstance);
      
      // Get monthly usage if supported
      if (sdkInstance.auth.getMonthlyUsage) {
        const usage = await sdkInstance.auth.getMonthlyUsage();
        setPuterUsage(usage);
      }
    } catch (err: any) {
      addLog("info", "No hay sesión activa de Puter o requiere inicio de sesión.");
    }
  };

  const loginPuter = async () => {
    if (!puterSDK) {
      showNotification("Puter SDK no se ha cargado.");
      return;
    }
    try {
      addLog("info", "Abriendo ventana modal de autenticación de Puter...");
      await puterSDK.auth.signIn();
      await fetchUserInfo(puterSDK);
      showNotification("Sincronizado con Puter con éxito");
    } catch (err: any) {
      addLog("error", "Fallo al iniciar sesión en Puter: " + err.message);
    }
  };

  const logoutPuter = async () => {
    if (!puterSDK) return;
    try {
      addLog("info", "Cerrando sesión de Puter...");
      // For some versions of Puter SDK, signOut is auth.signOut() or simple storage clearance.
      if (puterSDK.auth && typeof puterSDK.auth.signOut === "function") {
        await puterSDK.auth.signOut();
      }
      setIsPuterAuthenticated(false);
      setPuterUsername("");
      setFileList([]);
      setKvStore([]);
      setHostedSites([]);
      addLog("info", "Sesión de Puter finalizada. Volviendo a sandbox anónimo.");
      showNotification("Sesión cerrada");
    } catch (err: any) {
      addLog("error", "Error al cerrar sesión: " + err.message);
    }
  };

  // --- FILESYSTEM MANAGEMENT ---
  const refreshFilesystem = async (path: string, sdkInstance = puterSDK) => {
    if (!sdkInstance || !isPuterAuthenticated) return;
    try {
      addLog("info", `Explorando directorio Puter FS: "${path}"...`);
      const items = await sdkInstance.fs.readdir(path);
      const formatted: PuterFileItem[] = items.map((i: any) => ({
        name: i.name,
        is_dir: i.is_dir,
        size: i.size,
        modified: i.modified
      }));
      setFileList(formatted);
    } catch (err: any) {
      addLog("error", `Error al leer directorio "${path}": ` + err.message);
    }
  };

  const handleCreateFile = async () => {
    if (!isPuterAuthenticated) {
      showNotification("Inicia sesión en Puter primero");
      return;
    }
    const name = prompt("Nombre del nuevo archivo:", "script.js");
    if (!name) return;
    
    try {
      const fullPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
      await puterSDK.fs.write(fullPath, `// Archivo: ${name}\n// Creado en Puter Lab\n`, { createMissingParents: true });
      addLog("success", `Archivo creado con éxito: ${fullPath}`);
      showNotification(`✓ Creado: ${name}`);
      refreshFilesystem(currentPath);
    } catch (err: any) {
      addLog("error", "Error al crear archivo: " + err.message);
    }
  };

  const handleCreateFolder = async () => {
    if (!isPuterAuthenticated) {
      showNotification("Inicia sesión en Puter primero");
      return;
    }
    const name = prompt("Nombre de la carpeta:", "proyecto-uno");
    if (!name) return;

    try {
      const fullPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
      await puterSDK.fs.mkdir(fullPath, { createMissingParents: true });
      addLog("success", `Directorio creado con éxito: ${fullPath}`);
      showNotification(`✓ Carpeta creada: ${name}`);
      refreshFilesystem(currentPath);
    } catch (err: any) {
      addLog("error", "Error al crear carpeta: " + err.message);
    }
  };

  const handleDeletePath = async (item: PuterFileItem) => {
    if (!isPuterAuthenticated) return;
    const confirmDel = window.confirm(`¿Estás seguro de que deseas eliminar "${item.name}"?`);
    if (!confirmDel) return;

    try {
      const fullPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      await puterSDK.fs.delete(fullPath, { recursive: true });
      addLog("success", `Eliminado de Puter FS: ${fullPath}`);
      showNotification(`Eliminado: ${item.name}`);
      refreshFilesystem(currentPath);
    } catch (err: any) {
      addLog("error", `Error al eliminar "${item.name}": ` + err.message);
    }
  };

  const handleReadFile = async (item: PuterFileItem) => {
    if (!isPuterAuthenticated) return;
    try {
      const fullPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      addLog("info", `Cargando archivo: ${fullPath}...`);
      const blob = await puterSDK.fs.read(fullPath);
      const text = await blob.text();
      setEditorContent(text);
      setCurrentFileName(item.name);
      addLog("success", `Archivo cargado en el editor: ${item.name}`);
      showNotification(`Cargado: ${item.name}`);
    } catch (err: any) {
      addLog("error", `Error al leer archivo: ` + err.message);
    }
  };

  const saveCurrentFile = async () => {
    if (!isPuterAuthenticated) {
      showNotification("Inicia sesión en Puter para guardar cambios en tu FS");
      return;
    }
    try {
      const fullPath = currentPath === "/" ? `/${currentFileName}` : `${currentPath}/${currentFileName}`;
      await puterSDK.fs.write(fullPath, editorContent, { overwrite: true, createMissingParents: true });
      addLog("success", `Archivo guardado en el servidor Puter: ${fullPath}`);
      showNotification(`✓ Guardado: ${currentFileName}`);
      refreshFilesystem(currentPath);
    } catch (err: any) {
      addLog("error", "Error al guardar archivo: " + err.message);
    }
  };

  const handleBackDirectory = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    setCurrentPath(parentPath);
    refreshFilesystem(parentPath);
  };

  const handleEntryFolder = (folderName: string) => {
    const nextPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;
    setCurrentPath(nextPath);
    refreshFilesystem(nextPath);
  };

  // --- KEY-VALUE STORE MANAGEMENT ---
  const refreshKvStore = async (sdkInstance = puterSDK) => {
    if (!sdkInstance || !isPuterAuthenticated) return;
    try {
      addLog("info", "Enumerando llaves activas de Puter.kv...");
      const keys = await sdkInstance.kv.list();
      const items: KeyValueItem[] = [];
      for (const k of keys) {
        const val = await sdkInstance.kv.get(k);
        items.push({ key: k, value: val || "" });
      }
      setKvStore(items);
    } catch (err: any) {
      addLog("error", "Fallo al refrescar Puter KV: " + err.message);
    }
  };

  const handleSetKvManual = async () => {
    if (!isPuterAuthenticated) return;
    const key = prompt("Ingresa el identificador de la clave (Key):");
    if (!key) return;
    const value = prompt(`Ingresa el valor para la clave "${key}":`);
    if (value === null) return;

    try {
      await puterSDK.kv.set(key, value);
      addLog("success", `Puter.kv registrado: "${key}" = "${value}"`);
      showNotification(`Clave guardada: ${key}`);
      refreshKvStore();
    } catch (err: any) {
      addLog("error", "Error en Puter KV: " + err.message);
    }
  };

  const handleDeleteKv = async (key: string) => {
    if (!isPuterAuthenticated) return;
    try {
      await puterSDK.kv.del(key);
      addLog("success", `Clave eliminada de Puter KV: "${key}"`);
      showNotification(`Eliminado: ${key}`);
      refreshKvStore();
    } catch (err: any) {
      addLog("error", `Error al eliminar clave "${key}": ` + err.message);
    }
  };

  // --- HOSTING DEPLOYMENT ---
  const refreshHostingSites = async (sdkInstance = puterSDK) => {
    if (!sdkInstance || !isPuterAuthenticated) return;
    try {
      addLog("info", "Listando dominios de alojamiento en puter.site...");
      const list = await sdkInstance.hosting.list();
      const formatted: WebSiteItem[] = list.map((l: any) => ({
        subdomain: l.subdomain,
        dirPath: l.dirpath || l.dir,
        url: l.url || `https://${l.subdomain}.puter.site`
      }));
      setHostedSites(formatted);
    } catch (err: any) {
      addLog("error", "Error al listar sitios de hosting: " + err.message);
    }
  };

  const handleHostingCreateManual = async () => {
    if (!isPuterAuthenticated) {
      showNotification("Inicia sesión en Puter primero");
      return;
    }
    const subdomain = prompt("Subdominio deseado (e.g., mi-juego-puter):");
    if (!subdomain) return;
    const folder = prompt("Carpeta de origen en Puter FS a publicar:", currentPath);
    if (!folder) return;

    try {
      addLog("info", `Iniciando despliegue de "${folder}" hacia "${subdomain}.puter.site"...`);
      const site = await puterSDK.hosting.create(subdomain, folder);
      addLog("success", `¡DESPLIEGUE EXCEPCIONAL! Tu sitio está disponible en vivo: ${site.url}`);
      showNotification(`SITIO LIVE: ${subdomain}.puter.site`);
      refreshHostingSites();
    } catch (err: any) {
      addLog("error", "Error de hosting: " + err.message);
    }
  };

  const handleHostingDelete = async (sub: string) => {
    if (!isPuterAuthenticated) return;
    const confirmDel = window.confirm(`¿Seguro que quieres dar de baja la web "${sub}.puter.site"?`);
    if (!confirmDel) return;

    try {
      await puterSDK.hosting.delete(sub);
      addLog("success", `Alojamiento web dado de baja con éxito: ${sub}.puter.site`);
      showNotification(`De-hosted: ${sub}`);
      refreshHostingSites();
    } catch (err: any) {
      addLog("error", `Error al dar de baja el hosting "${sub}": ` + err.message);
    }
  };

  // --- INTERACTIVE JAVASCRIPT RUNNER ENGINE ---
  const executeSandboxCode = async (customCode?: string) => {
    const codeToRun = customCode || editorContent;
    addLog("command", "Ejecutando script virtual de la consola...");
    
    // Backup native consoles to redirect them gracefully to our IDE Terminal output area
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const text = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
      addLog("info", text);
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const text = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
      addLog("error", text);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const text = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
      addLog("warning", text);
      originalWarn.apply(console, args);
    };

    try {
      // Setup dynamic run wrapper
      const asyncEval = new Function("puter", `
        return (async () => {
          try {
            ${codeToRun}
          } catch (execError) {
            console.error("Fallo de ejecución interno: " + execError.message);
          }
        })();
      `);

      await asyncEval(puterSDK || window.puter);
      addLog("success", "Ejecución completada.");
    } catch (err: any) {
      addLog("error", "Fallo al compilar Javascript: " + err.message);
    } finally {
      // Restore native consoles
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      // Sincronizar todos los estados de persistencia después de una corrida de script por si cambió el FS o KV!
      setTimeout(() => {
        if (isPuterAuthenticated) {
          refreshFilesystem(currentPath);
          refreshKvStore();
          refreshHostingSites();
        }
      }, 1000);
    }
  };

  // --- TERMINAL COMMAND SECTOR ---
  const handleTerminalKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = terminalInput.trim();
      if (!input) return;

      addLog("command", `$ ${input}`);
      const updatedHistory = [input, ...commandHistory];
      setCommandHistory(updatedHistory);
      setHistoryIndex(-1);
      setTerminalInput("");

      const parts = input.split(" ");
      const keyword = parts[0].toLowerCase();

      if (keyword === "clear" || keyword === "cls") {
        setLogs([]);
        return;
      }

      if (keyword === "help") {
        addLog("info", "Comandos soportados en la terminal de Nexus:");
        addLog("info", "  ls                    Listar archivos del directorio interactivo.");
        addLog("info", "  cd <ruta>             Cambiar el path de exploración de archivos.");
        addLog("info", "  mkdir <carpeta>       Crea una nueva carpeta en el sistema de archivos.");
        addLog("info", "  cat <nombre>          Imprime el contenido de un archivo.");
        addLog("info", "  rm <nombre>           Elimina un archivo o directorio.");
        addLog("info", "  kv.set <llave> <val>  Registra un valor clave en Puter Database.");
        addLog("info", "  kv.get <llave>        Recupera el valor de la clave especificada.");
        addLog("info", "  kv.list               Lista las llaves activas.");
        addLog("info", "  kv.del <llave>        Elimina una clave registrada de la DB.");
        addLog("info", "  hosting.list          Lista tus subdominios activos.");
        addLog("info", "  ai.chat <pregunta>    Consulta un modelo rápido a través de puter.ai.");
        addLog("info", "  run                   Ejecuta el código cargado actualmente en el editor.");
        return;
      }

      if (!isPuterAuthenticated && !["run", "clear", "cls", "help"].includes(keyword)) {
        addLog("warning", "Esta acción requiere inicio de sesión de Puter para invocar la API segura.");
        return;
      }

      try {
        switch (keyword) {
          case "ls":
            await refreshFilesystem(currentPath);
            break;
          case "cd":
            if (parts[1]) {
              const targetPath = parts[1];
              setCurrentPath(targetPath);
              await refreshFilesystem(targetPath);
            } else {
              setCurrentPath("/");
              await refreshFilesystem("/");
            }
            break;
          case "mkdir":
            if (parts[1]) {
              const fullPath = currentPath === "/" ? `/${parts[1]}` : `${currentPath}/${parts[1]}`;
              await puterSDK.fs.mkdir(fullPath, { createMissingParents: true });
              addLog("success", `Directorio creado: ${fullPath}`);
              refreshFilesystem(currentPath);
            } else {
              addLog("error", "Uso: mkdir <carpeta>");
            }
            break;
          case "cat":
            if (parts[1]) {
              const fileFullPath = currentPath === "/" ? `/${parts[1]}` : `${currentPath}/${parts[1]}`;
              const blob = await puterSDK.fs.read(fileFullPath);
              const txt = await blob.text();
              addLog("info", `--- Contenido de ${parts[1]} ---`);
              txt.split("\n").forEach((line: string) => addLog("info", line));
              addLog("info", `------------------------`);
            } else {
              addLog("error", "Uso: cat <archivo>");
            }
            break;
          case "rm":
            if (parts[1]) {
              const fileFullPath = currentPath === "/" ? `/${parts[1]}` : `${currentPath}/${parts[1]}`;
              await puterSDK.fs.delete(fileFullPath, { recursive: true });
              addLog("success", `Eliminado con éxito: ${fileFullPath}`);
              refreshFilesystem(currentPath);
            } else {
              addLog("error", "Uso: rm <archivo_o_directorio>");
            }
            break;
          case "kv.set":
            if (parts[1] && parts[2]) {
              await puterSDK.kv.set(parts[1], parts.slice(2).join(" "));
              addLog("success", `Puter KV de base de datos seteado.`);
              refreshKvStore();
            } else {
              addLog("error", "Uso: kv.set <llave> <valor>");
            }
            break;
          case "kv.get":
            if (parts[1]) {
              const v = await puterSDK.kv.get(parts[1]);
              addLog("info", `Puter KV valor para [${parts[1]}]: ${v || "(nulo)"}`);
            } else {
              addLog("error", "Uso: kv.get <llave>");
            }
            break;
          case "kv.list":
            await refreshKvStore();
            break;
          case "kv.del":
            if (parts[1]) {
              await puterSDK.kv.del(parts[1]);
              addLog("success", `Clave '${parts[1]}' eliminada.`);
              refreshKvStore();
            } else {
              addLog("error", "Uso: kv.del <llave>");
            }
            break;
          case "hosting.list":
            await refreshHostingSites();
            break;
          case "run":
            executeSandboxCode();
            break;
          case "ai.chat":
            if (parts[1]) {
              const promptMsg = parts.slice(1).join(" ");
              addLog("ai", "Consultando puter.ai.chat...");
              const resp = await puterSDK.ai.chat(promptMsg);
              addLog("ai", `Respuesta puter.ai: ${resp.message.content[0].text}`);
            } else {
              addLog("error", "Uso: ai.chat <pregunta>");
            }
            break;
          default:
            // Evaluate custom raw line in JS context
            addLog("info", "Invocando eval para código personalizado...");
            const res = await eval(input);
            if (res !== undefined) {
              addLog("info", `Retorno: ${String(res)}`);
            }
        }
      } catch (err: any) {
        addLog("error", "Fallo al interpretar comando: " + err.message);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    }
  };

  // --- KEYBOARD SHORTCUT HANDLING FOR THE EDITOR ---
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab inserts spacing
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const oldVal = editorContent;
      const newVal = oldVal.substring(0, start) + "  " + oldVal.substring(end);
      setEditorContent(newVal);
      
      // Reset cursor position
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
    // Ctrl+S to save
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      saveCurrentFile();
    }
    // Ctrl+Enter to run
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      executeSandboxCode();
    }
  };

  // --- THE CO-PILOT AGENT SYSTEM ---
  const handleSendAgentMessage = async () => {
    const textToSend = chatInput.trim();
    if (!textToSend) return;

    // Add user message to state
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsAgentResponding(true);
    addLog("ai", "Invocando inteligencia artificial Nexus con agente seguro...");

    try {
      // Collect last 10 messages as history context
      const chatContext = chatHistory.filter(c => c.role !== "system").map(c => ({
        role: c.role,
        content: c.content
      }));

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatContext
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Fallo HTTP detectado al llamar al agente.");
      }

      const data = await res.json();
      const reply = data.text || "No se ha devuelto contenido válido.";

      // Parse execute JS codes automatically inside [EXECUTE_JS] block
      const blocks: string[] = [];
      const regex = /\[EXECUTE_JS\]([\s\S]*?)\[\/EXECUTE_JS\]/g;
      let match;
      while ((match = regex.exec(reply)) !== null) {
        if (match[1]) {
          blocks.push(match[1].trim());
        }
      }

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: "ast-" + Date.now(),
        role: "assistant",
        content: reply.replace(/\[EXECUTE_JS\][\s\S]*?\[\/EXECUTE_JS\]/g, " [⚡ Código de Automatización Puter Generado y Listo] "),
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistory(prev => [...prev, assistantMsg]);
      setIsAgentResponding(false);

      // Auto execution of codes generated by the agent
      if (blocks.length > 0) {
        addLog("ai", `Detectado bloque de automatización de Nexus (${blocks.length} bloques). Ejecutando...`);
        showNotification("⚙ Ejecutando código del agente...");
        
        for (const codeBlock of blocks) {
          executeSandboxCode(codeBlock);
        }
      }

    } catch (err: any) {
      setIsAgentResponding(false);
      const errMessage = err.message || "Error desconocido en el motor.";
      addLog("error", "Agente fallo: " + errMessage);
      
      const assistantMsg: ChatMessage = {
        id: "ast-err-" + Date.now(),
        role: "assistant",
        content: `Disculpa, ha ocurrido un error al procesar tu instrucción con el servidor interno:

\`\`\`
${errMessage}
\`\`\`

Por favor, asegúrate de tener configurada tu **GEMINI_API_KEY** en la barra lateral de secrets del panel superior de Google AI Studio, o verifica la conexión con el backend de Node.js. Si aún no te has autenticado en Puter SDK, por favor pulsa el botón superior '🔑 CONECTAR PUTER' para activar temporalmente el filesystem.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    }
  };

  const handleTemplateSelect = (key: keyof typeof TEMPLATES) => {
    const selected = TEMPLATES[key];
    setEditorContent(selected);
    setCurrentFileName(key === "landing" ? "landing_autodeploy.js" : key === "kvdb" ? "kv_crud.js" : "prompt_ai_chat.js");
    addLog("info", `Plantilla cargada: ${key}. Puedes ejecutarla inmediatamente.`);
    showNotification(`Plantilla: ${key}`);
  };

  // Quick Action Auto Copilot Command
  const triggerAutoAudit = () => {
    setChatInput("Examina mi código escrito en la terminal, optimízalo y guárdalo en Puter con una estructura limpia, luego despliégalo gratis en Puter.site.");
    addLog("info", "Iniciando análisis automatizado del espacio de trabajo...");
    setActiveApiTab("chat");
  };

  // Line count calculator for the editor numbers display column
  const getLineCount = () => {
    return editorContent.split("\n").length;
  };

  // --- RENDER SECTOR ---
  return (
    <div className="flex flex-col h-screen text-[#c8d8e8] font-sans antialiased bg-[#050508]" id="nexus-ide-root">
      
      {/* 1. TOP MAIN NAV / STATUS BAR HUD */}
      <header className="flex items-center justify-between h-14 border-b border-[#1b1e2e] bg-[#08080c] px-4 gap-3 select-none flex-shrink-0" id="nexus-ide-topbar">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center glow-green">
            <Cpu className="h-5 w-5 text-[#00ff88]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-wider uppercase text-slate-100">NEXUS LAB</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151722] border border-[#1b1e2e] text-[#00ccff] font-bold">V2.0</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Puter Runtime Engine & Agent Environment</p>
          </div>
        </div>

        {/* Global Connection Stats HUD */}
        <div className="flex items-center gap-5">
          {/* Puter connection details */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Puter SDK:</span>
            {isSdkLoading ? (
              <span className="flex items-center gap-1 text-[#ff6b35]">
                <span className="h-2 w-2 rounded-full bg-[#ff6b35] animate-pulse"></span>
                Inyectando...
              </span>
            ) : isPuterAuthenticated ? (
              <span className="flex items-center gap-1.5 text-[#00ff88]">
                <span className="h-2 w-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse"></span>
                @<strong>{puterUsername}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                Invitado (Local)
              </span>
            )}
          </div>

          {/* Gemini context */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono border-l border-slate-900 pl-4">
            <span className="text-slate-500">Co-pilot AI:</span>
            <span className="flex items-center gap-1.5 text-[#00ccff]">
              <span className="h-2 w-2 rounded-full bg-[#00ccff] shadow-[0_0_8px_#00ccff] animate-pulse"></span>
              Gemini 2.5 Flash
            </span>
          </div>

          {/* Controls button actions */}
          <div className="flex items-center gap-2" id="nexus-topbar-actions">
            {!isPuterAuthenticated ? (
              <button 
                onClick={loginPuter}
                className="flex items-center gap-1.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/25 hover:border-[#00ff88]/50 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition duration-200 cursor-pointer"
                title="Autenticar cuenta gratuita de Puter.com en tu sandbox para acceder a bases de datos y hosting de manera ilimitada"
              >
                <span>🔑 CONECTAR PUTER</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden xl:inline text-[10px] font-mono text-slate-500 bg-[#0d0e15] border border-[#1b1e2e] px-2 py-1 rounded">
                  FS: {currentPath}
                </span>
                <button 
                  onClick={logoutPuter}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-400 border border-[#1b1e2e] hover:border-rose-950 px-2 py-1.5 rounded-md text-xs font-mono transition duration-200 cursor-pointer"
                  title="Cerrar sesión de Puter"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY WORKSPACE - THREE PANEL GRID */}
      <main className="flex flex-1 overflow-hidden" id="nexus-ide-body">
        
        {/* LEFT COLUMN: ACTIVE FILESYSTEM & TEMPLATE DECK */}
        <section className="w-64 border-r border-[#1b1e2e] bg-[#08080c] flex flex-col overflow-hidden select-none flex-shrink-0" id="nexus-sidebar-left">
          
          {/* Workspace Title bar */}
          <div className="h-10 border-b border-[#1b1e2e] px-3 flex items-center justify-between bg-[#0d0e15] flex-shrink-0">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-[#00ccff]" />
              Explorador FS
            </span>
            <div className="flex items-center gap-1 text-slate-500">
              <button 
                onClick={() => isPuterAuthenticated ? refreshFilesystem(currentPath) : null}
                className="p-1 hover:text-[#00ff88] transition rounded cursor-pointer"
                disabled={!isPuterAuthenticated}
                title="Sincronizar explorador"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Filesystem navigation context */}
          <div className="p-3 border-b border-[#1b1e2e] bg-[#0a0a0f] text-[11px] font-mono text-slate-400 flex flex-col gap-1.5 justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono bg-[#0d0e15] px-2 py-1 border border-[#1b1e2e] rounded text-slate-300">
              <span className="truncate">Ruta: {currentPath}</span>
              {currentPath !== "/" && (
                <button 
                  onClick={handleBackDirectory}
                  className="text-amber-400 hover:text-amber-300 font-bold ml-2 cursor-pointer"
                >
                  [Subir..]
                </button>
              )}
            </div>
            
            {/* Folder creation triggers */}
            {isPuterAuthenticated && (
              <div className="flex gap-1.5 mt-2">
                <button 
                  onClick={handleCreateFile}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-[#0d0e15] hover:bg-[#151722] border border-[#1b1e2e] text-slate-300 py-1 rounded transition cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-[#00ff88]" />
                  + File
                </button>
                <button 
                  onClick={handleCreateFolder}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-[#0d0e15] hover:bg-[#151722] border border-[#1b1e2e] text-slate-300 py-1 rounded transition cursor-pointer"
                >
                  <FolderPlus className="h-3 w-3 text-[#00ccff]" />
                  + Folder
                </button>
              </div>
            )}
          </div>

          {/* Directory lists container */}
          <div className="flex-1 overflow-y-auto p-2" id="nexus-file-explorer-tree">
            {!isPuterAuthenticated ? (
              <div className="py-12 px-4 text-center">
                <Database className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  El explorador de archivos seguro requiere de conexión de cuenta.
                </p>
                <button 
                  onClick={loginPuter} 
                  className="text-[11px] bg-[#00ccff]/10 hover:bg-[#00ccff]/20 text-[#00ccff] border border-[#00ccff]/25 px-3 py-1.5 rounded font-mono transition cursor-pointer"
                >
                  Autenticar Sandbox
                </button>
              </div>
            ) : fileList.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-600 text-[11px] font-mono uppercase tracking-wider">
                Directorio Vacío
              </div>
            ) : (
              <div className="space-y-0.5" id="nexus-file-explorer-items">
                {fileList.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`group flex items-center justify-between p-2 rounded text-xs font-mono transition duration-150 cursor-pointer ${
                      currentFileName === item.name ? "bg-emerald-950/20 border border-emerald-800/20 text-[#00ff88]" : "hover:bg-[#0d0e15] text-slate-300"
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 flex-1 truncate mr-2"
                      onClick={() => item.is_dir ? handleEntryFolder(item.name) : handleReadFile(item)}
                    >
                      {item.is_dir ? (
                        <Folder className="h-4 w-4 text-[#00ccff] flex-shrink-0" />
                      ) : (
                        <File className="h-4 w-4 text-[#00ff88] flex-shrink-0" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePath(item);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Action Command Shortcuts box */}
          <div className="p-3 border-t border-[#1b1e2e] bg-[#0a0a0f] flex-shrink-0" id="nexus-sidebar-quick-triggers">
            <span className="text-[10px] font-mono tracking-widest text-[#ff6b35] uppercase font-bold block mb-2">
              ⚡ Atajos Rápidos
            </span>
            <div className="space-y-1.5">
              <button 
                onClick={triggerAutoAudit}
                className="w-full flex items-center justify-between text-left text-xs text-[#00ff88] hover:bg-[#00ff88]/5 px-2.5 py-2 border border-[#00ff88]/15 hover:border-[#00ff88]/45 bg-[#050508] rounded transition duration-200 cursor-pointer"
              >
                <span className="font-mono text-[11px] font-semibold">AGENTE AUTO-AUDIT</span>
                <Sparkles className="h-3.5 w-3.5 text-[#00ff88]" />
              </button>
              <button 
                onClick={handleHostingCreateManual}
                className="w-full flex items-center justify-between text-left text-xs text-[#00ccff] hover:bg-[#00ccff]/5 px-2.5 py-2 border border-[#00ccff]/15 hover:border-[#00ccff]/45 bg-[#050508] rounded transition duration-200 cursor-pointer"
              >
                <span className="font-mono text-[11px] font-semibold">PUBLICAR HOSTING</span>
                <Globe className="h-3.5 w-3.5 text-[#00ccff]" />
              </button>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: CODE EDITOR & LOG INTERACTIVE CONSOLE */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#050508]" id="nexus-workspace-center">
          
          {/* Active editor header workspace bar */}
          <div className="h-10 border-b border-[#1b1e2e] px-4 flex items-center justify-between bg-[#0d0e15] flex-shrink-0 select-none">
            {/* Editor tab label */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5 bg-[#050508] border-t-2 border-emerald-400 px-3 py-1 border-x border-[#1b1e2e] rounded-t">
                <FileText className="h-3.5 w-3.5 text-[#00ff88]" />
                {currentFileName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Ctrl+S para guardar permanentemente</span>
            </div>

            {/* Run / Safe execution bar triggers */}
            <div className="flex items-center gap-2">
              <button 
                onClick={saveCurrentFile}
                className="flex items-center gap-1.5 border border-[#1b1e2e] hover:border-slate-500 bg-[#0d0e15] text-[#c8d8e8] hover:text-white px-3 py-1 rounded text-xs font-mono transition duration-150 cursor-pointer hover:bg-slate-900"
                title="Guardar código actual en FS de Puter"
              >
                <Save className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Guardar</span>
              </button>
              <button 
                onClick={() => executeSandboxCode()}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded text-xs font-mono font-bold transition duration-150 shadow-md shadow-emerald-500/10 cursor-pointer"
                title="Ejecutar código Javascript de este editor en la máquina virtual del cliente"
                id="nexus-btn-run"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>EJECUTAR</span>
              </button>
            </div>
          </div>

          {/* MAIN EDITOR TEXT FIELD GRID */}
          <div className="flex-1 flex overflow-hidden border-b border-[#1b1e2e] font-mono leading-relaxed text-sm bg-[#050508]" id="nexus-editor-wrapper">
            {/* Line numbers display decoration */}
            <div className="w-10 bg-[#08080c] text-slate-600 text-right pr-2 py-3 text-xs select-none border-r border-[#1b1e2e] font-mono leading-6">
              {Array.from({ length: getLineCount() }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor textarea itself */}
            <textarea
              ref={editorRef}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              className="flex-1 bg-transparent text-[#e4effa] p-3 outline-none resize-none font-mono text-[12px] leading-6 selection:bg-[#00ff88]/20 caret-[#00ff88]"
              spellCheck="false"
              id="nexus-editor-textarea"
              placeholder="// Escribe aquí tu script interactivo utilizando puter.js..."
            />
          </div>

          {/* CONSOLE TERMINAL & LOG MONITOR SECTOR */}
          <div className="h-64 bg-[#08080c] flex flex-col overflow-hidden flex-shrink-0" id="nexus-console-section">
            
            {/* Terminal Tab switcher */}
            <div className="h-8 border-b border-[#1b1e2e] bg-[#0d0e15] flex items-center px-4 gap-1 select-none flex-shrink-0">
              <button 
                onClick={() => setActiveTermTab("terminal")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition rounded-t border-b ${
                  activeTermTab === "terminal" ? "border-emerald-400 text-[#00ff88] bg-[#08080c]" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Terminal className="h-3 w-3" />
                TERMINAL
              </button>
              <button 
                onClick={() => {
                  setActiveTermTab("kv");
                  refreshKvStore();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition rounded-t border-b ${
                  activeTermTab === "kv" ? "border-emerald-400 text-[#00ff88] bg-[#08080c]" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Database className="h-3 w-3" />
                PUTER.KV ({kvStore.length})
              </button>
              <button 
                onClick={() => {
                  setActiveTermTab("hosting");
                  refreshHostingSites();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition rounded-t border-b ${
                  activeTermTab === "hosting" ? "border-emerald-400 text-[#00ff88] bg-[#08080c]" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="h-3 w-3" />
                HOSTING ({hostedSites.length})
              </button>
              <button 
                onClick={() => setActiveTermTab("log")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition rounded-t border-b ${
                  activeTermTab === "log" ? "border-emerald-400 text-[#00ff88] bg-[#08080c]" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="h-3 w-3" />
                AUDIT LOGS
              </button>

              <button 
                onClick={() => setLogs([])}
                className="ml-auto text-[10px] font-mono text-slate-500 hover:text-rose-400 px-1.5 py-0.5 border border-[#1b1e2e] hover:border-rose-950 rounded transition cursor-pointer"
              >
                CLR
              </button>
            </div>

            {/* TAB PANELS LAYOUT */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs font-light leading-relaxed select-text" id="nexus-console-panels">
              
              {/* Terminal / Logger display panel */}
              {activeTermTab === "terminal" && (
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic">Escribe help para ver el ecosistema o ejecuta tu código...</div>
                  ) : (
                    logs.map((logItem, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-slate-600 block flex-shrink-0">[{logItem.timestamp}]</span>
                        <span className={`block break-all font-mono leading-relaxed ${
                          logItem.type === "success" ? "text-[#00ff88]" : 
                          logItem.type === "error" ? "text-rose-400" : 
                          logItem.type === "warning" ? "text-amber-400 font-medium" : 
                          logItem.type === "ai" ? "text-[#00ccff] font-medium" : 
                          logItem.type === "command" ? "text-zinc-300 font-semibold" : "text-slate-300"
                        }`}>
                          {logItem.text}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={terminalBottomRef} />
                </div>
              )}

              {/* Puter Key-Value Store management panel */}
              {activeTermTab === "kv" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#151722] p-1.5 border border-[#1b1e2e] rounded mb-2">
                    <span className="text-[11px] text-slate-400 font-mono">Bases de datos indexadas en la nube a través de Puter.kv</span>
                    <button 
                      onClick={handleSetKvManual}
                      className="bg-emerald-500/10 text-[#00ff88] hover:bg-emerald-500/20 px-2 py-0.5 border border-emerald-500/20 text-[10px] rounded cursor-pointer transition font-mono"
                    >
                      + ADD REGISTRO
                    </button>
                  </div>
                  
                  {!isPuterAuthenticated ? (
                    <p className="text-slate-500 text-center py-4">Autentícate en Puter para listar bases de datos Key-Value.</p>
                  ) : kvStore.length === 0 ? (
                    <p className="text-slate-600 text-center py-4">No se han registrado datos persistentes aún en este espacio de nombres.</p>
                  ) : (
                    <div className="border border-[#1b1e2e] rounded overflow-hidden">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-[#0f0f18] text-slate-400 border-b border-[#1b1e2e]">
                          <tr>
                            <th className="p-2">Identificador (Key)</th>
                            <th className="p-2">Valor Asignado</th>
                            <th className="p-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1b1e2e]">
                          {kvStore.map((kv, i) => (
                            <tr key={i} className="hover:bg-[#0d0e15] text-slate-200">
                              <td className="p-2 font-semibold text-amber-400">{kv.key}</td>
                              <td className="p-2 select-all truncate max-w-xs">{kv.value}</td>
                              <td className="p-2 text-right">
                                <button 
                                  onClick={() => handleDeleteKv(kv.key)}
                                  className="text-rose-400 hover:text-rose-300 px-1 py-0.5 transition"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Hosting website deployments inspect panel */}
              {activeTermTab === "hosting" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#151722] p-1.5 border border-[#1b1e2e] rounded mb-2">
                    <span className="text-[11px] text-slate-400">Instancias de hosting CD para carpetas desplegadas</span>
                    <button 
                      onClick={handleHostingCreateManual}
                      className="bg-[#00ccff]/10 text-[#00ccff] hover:bg-[#00ccff]/20 px-2 py-0.5 border border-[#00ccff]/20 text-[10px] rounded cursor-pointer transition"
                    >
                      NUEVO DESPLIEGUE MANUAL
                    </button>
                  </div>

                  {!isPuterAuthenticated ? (
                    <p className="text-slate-500 text-center py-4">Autentícate en Puter para inspeccionar tus despliegues.</p>
                  ) : hostedSites.length === 0 ? (
                    <p className="text-slate-600 text-center py-4">No has desplegado ningún directorio a producción todavía.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {hostedSites.map((site, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-[#0d0e15] border border-[#1b1e2e] rounded gap-2 text-slate-300">
                          <div>
                            <span className="text-[#00ccff] font-bold text-xs select-all">{site.url}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">Contenido mapeado desde: "{site.dirPath}"</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={site.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded font-mono text-[10px]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              VER LIVE
                            </a>
                            <button 
                              onClick={() => handleHostingDelete(site.subdomain)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded text-[10px]"
                            >
                              BAJA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Audit Events logger panel */}
              {activeTermTab === "log" && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] text-slate-500 font-mono mb-2 uppercase select-none">Historial de Auditorías de Ejecución de la Sesión</span>
                  {logs.slice().reverse().map((lg, i) => (
                    <div key={i} className="py-1 border-b border-[#1b1e2e]/50 text-[11px] font-mono flex items-center justify-between text-slate-400">
                      <span>[{lg.timestamp}] - {lg.text.substring(0, 100)}{lg.text.length > 100 ? "..." : ""}</span>
                      <span className={`text-[9px] uppercase px-1 py-0.5 rounded ${
                        lg.type === "success" ? "bg-emerald-950 text-emerald-400" : 
                        lg.type === "error" ? "bg-rose-950 text-rose-400" : "bg-[#151722] text-slate-500"
                      }`}>{lg.type}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Interactive console shell command box input */}
            <div className="h-10 border-t border-[#1b1e2e] bg-[#050508] flex items-center px-3 gap-2 flex-shrink-0" id="nexus-console-input-row">
              <span className="text-[#00ff88] font-mono font-extrabold text-xs select-none">nexus@puter:{currentPath}$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyPress}
                className="flex-1 bg-transparent text-[#dfebf7] font-mono text-xs outline-none caret-[#00ff88]"
                placeholder="Escribe comandos rápidos (ls, mkdir, run, cat, help...) o código JS instantáneo..."
                id="nexus-terminal-input"
              />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE COPILOT CHAT PANEL */}
        <section className="w-80 border-l border-[#1b1e2e] bg-[#08080c] flex flex-col overflow-hidden flex-shrink-0" id="nexus-sidebar-right">
          
          {/* Header */}
          <div className="h-10 border-b border-[#1b1e2e] px-3 flex items-center bg-[#0d0e15] gap-2 flex-shrink-0 select-none">
            <Sparkles className="h-4 w-4 text-[#00ff88]" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Copiloto NEXUS
            </span>
          </div>

          {/* Sub Navigation controls tabs */}
          <div className="flex border-b border-[#1b1e2e] bg-[#0d0e15] flex-shrink-0 select-none">
            <button 
              onClick={() => setActiveApiTab("chat")}
              className={`flex-1 text-center py-2 text-[10px] font-mono tracking-wider font-semibold border-b-2 uppercase ${
                activeApiTab === "chat" ? "border-emerald-400 text-white" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              CHAT AGENTE
            </button>
            <button 
              onClick={() => setActiveApiTab("api")}
              className={`flex-1 text-center py-2 text-[10px] font-mono tracking-wider font-semibold border-b-2 uppercase ${
                activeApiTab === "api" ? "border-emerald-400 text-white" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              PUTER API
            </button>
            <button 
              onClick={() => setActiveApiTab("templates")}
              className={`flex-1 text-center py-2 text-[10px] font-mono tracking-wider font-semibold border-b-2 uppercase ${
                activeApiTab === "templates" ? "border-emerald-400 text-white" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              PLANTILLAS
            </button>
          </div>

          {/* CHAT PANEL SCREEN */}
          {activeApiTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden" id="nexus-panel-chat">
              {/* Messages deck */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" id="nexus-chat-message-deck">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    
                    {/* Role header stamp */}
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mb-1">
                      <span>{msg.role === "assistant" ? "🤖 NEXUS" : msg.role === "user" ? "🙋 USUARIO" : "⚙ AUDITORÍA"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Speech bubble */}
                    <div className={`p-2.5 rounded text-xs leading-relaxed max-w-[95%] text-left whitespace-pre-wrap ${
                      msg.role === "assistant" ? "bg-[#151722]/65 text-slate-200 border border-[#1b1e2e]" : 
                      msg.role === "user" ? "bg-emerald-950/20 text-[#00ff88] border border-emerald-500/25" : "bg-orange-950/10 text-[#ff6b35] border border-[#ff6b35]/20 font-bold"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {/* Loader status when generating answer */}
                {isAgentResponding && (
                  <div className="flex flex-col items-start">
                    <div className="text-[9px] font-mono text-[#00ccff] mb-1 flex items-center gap-1 animate-pulse">
                      <span>🤖 NEXUS PENSANDO...</span>
                    </div>
                    <div className="p-2.5 bg-[#151722]/65 text-slate-400 border border-[#1b1e2e] rounded text-xs flex items-center gap-2">
                      <span className="flex space-x-1">
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                      <span>Escaneando hilos...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat action message input form */}
              <div className="p-2.5 border-t border-[#1b1e2e] bg-[#0c0d13] flex flex-col gap-2 flex-shrink-0">
                <div className="flex gap-1.5">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAgentMessage();
                      }
                    }}
                    placeholder="Instrucción en lenguaje natural: 'Despliega una página de notas rápida...'"
                    className="flex-1 h-14 bg-[#050508] border border-[#1b1e2e] focus:border-emerald-500/80 rounded p-2 text-xs text-[#dfebf7] outline-none resize-none font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Shift+Enter para saltar de línea</span>
                  <button 
                    onClick={handleSendAgentMessage}
                    disabled={isAgentResponding}
                    className="bg-[#00ff88] hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>Enviar</span>
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK PUTER API REFERENCE VIEW */}
          {activeApiTab === "api" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-mono leading-relaxed" id="nexus-panel-api-docs">
              <div className="space-y-2">
                <span className="font-bold text-[#00ccff] text-[11px] uppercase block border-b border-[#1b1e2e] pb-1">
                  Filesystem API (fs)
                </span>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-[#00ff88] font-bold">fs.write(path, text, options)</p>
                  <p className="text-slate-400 text-[10px]">Guarda o sobrescribe un archivo en la ruta.</p>
                </div>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-[#00ff88] font-bold">fs.read(path) -&gt; Blob</p>
                  <p className="text-slate-400 text-[10px]">Consulta archivos devueltos como blobs de datos.</p>
                </div>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-[#00ff88] font-bold">fs.mkdir(path, options)</p>
                  <p className="text-slate-400 text-[10px]">Crea carpetas en el árbol lógico de Puter.</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#00ccff] text-[11px] uppercase block border-b border-[#1b1e2e] pb-1">
                  Key-Value Engine (kv)
                </span>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-amber-400 font-bold">kv.set(key, string_value)</p>
                  <p className="text-slate-400 text-[10px]">Almacena un dato de cadena accesible por su clave.</p>
                </div>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-amber-400 font-bold">kv.get(key) -&gt; Promise</p>
                  <p className="text-slate-400 text-[10px]">Retorna el valor resuelto.</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#00ccff] text-[11px] uppercase block border-b border-[#1b1e2e] pb-1">
                  Instant CD hosting (hosting)
                </span>
                <div className="p-2 bg-[#151722]/50 border border-[#1b1e2e] rounded space-y-1 text-[11px]">
                  <p className="text-cyan-400 font-bold">hosting.create(sub, folder)</p>
                  <p className="text-slate-400 text-[10px]">Activa el despliegue del directorio a puter.site gratuitamente.</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE DECK PANEL VIEW */}
          {activeApiTab === "templates" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3" id="nexus-panel-templates">
              <span className="text-[10px] text-slate-500 font-mono block uppercase select-none">Presiona una plantilla para rellenar instantáneamente el editor de tu código</span>
              
              <div 
                onClick={() => handleTemplateSelect("landing")}
                className="p-3 bg-[#0d0e15] border border-[#1b1e2e] hover:border-emerald-500/55 rounded-lg text-left cursor-pointer hover:bg-[#151722]/50 transition duration-150 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs font-mono text-emerald-400">🌐 Landing Auto-Deploy</span>
                  <ArrowRight className="h-3 w-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Esquematiza un diseño HTML5 moderno con Tailwind CSS CDN y lo sube inmediatamente a puter.site con subdominio dinámico.</p>
              </div>

              <div 
                onClick={() => handleTemplateSelect("kvdb")}
                className="p-3 bg-[#0d0e15] border border-[#1b1e2e] hover:border-emerald-500/55 rounded-lg text-left cursor-pointer hover:bg-[#151722]/50 transition duration-150 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs font-mono text-emerald-400">🗄 Puter KV DBMS</span>
                  <ArrowRight className="h-3 w-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Configura operaciones de registro, lectura, actualización y elimicanción (CRUD) en la base de datos distribuida Puter.kv.</p>
              </div>

              <div 
                onClick={() => handleTemplateSelect("aimodels")}
                className="p-3 bg-[#0d0e15] border border-[#1b1e2e] hover:border-emerald-500/55 rounded-lg text-left cursor-pointer hover:bg-[#151722]/50 transition duration-150 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs font-mono text-emerald-400">🤖 Prompt Chat Generador</span>
                  <ArrowRight className="h-3 w-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Prueba rápida de puter.ai para consultar múltiples LLMs en el navegador de manera gratuita y veloz.</p>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* 3. FLOATING STATUS / TOAST COMPONENT */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0d0e15] border border-emerald-500/30 font-mono text-xs py-2 px-4 rounded-lg shadow-xl shadow-black/80 flex items-center gap-2 z-50 animate-bounce">
          <Check className="h-4 w-4 text-[#00ff88]" />
          <span className="text-[#dfebf7]">{notification}</span>
        </div>
      )}

    </div>
  );
}
