export interface AiChatRequest {
  user_prompt: string;
  implType: string;
  developer_prompt: string;
  file_id: string;
}

export interface AiChatResponse {
  sql_query?: string;
  response?: string;
  images?: string[];
  files?: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QueryResponse {
  csv_path: string;
}

export interface FileUploadResponse {
  file_id: string;
}

export interface ChatResponse {
  response: string;
}

export enum ChatStatus {
  IDLE = 'idle',
  GENERATING_SQL = 'Generating SQL...',
  EXPORTING_CSV = 'Exporting CSV...',
  UPLOADING_FILE = 'Uploading file...',
  FETCHING_ANSWER = 'Fetching answer from AI...',
  ERROR = 'error'
}

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}