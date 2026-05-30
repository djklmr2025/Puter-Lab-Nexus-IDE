export interface PuterFileItem {
  name: string;
  is_dir: boolean;
  size?: number;
  modified?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isExecuting?: boolean;
}

export interface WebSiteItem {
  subdomain: string;
  dirPath: string;
  url: string;
}

export interface KeyValueItem {
  key: string;
  value: string;
}

export interface LogLine {
  type: "info" | "success" | "warning" | "error" | "ai" | "command";
  text: string;
  timestamp: string;
}
