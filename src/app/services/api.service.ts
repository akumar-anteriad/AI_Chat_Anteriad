import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, QueryResponse, FileUploadResponse, ChatResponse, AiChatRequest, AiChatResponse } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://10.219.166.188:9051';
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  aiChat(userPrompt: string, fileId: string, devPrompt: string, implType: string): Observable<AiChatResponse> {
    const request: AiChatRequest = {
      user_prompt: userPrompt,
      implType: implType,
      developer_prompt: devPrompt,
      file_id: fileId
    };

    return this.http.post<AiChatResponse>(`${this.baseUrl}/ai_chat`, request)
      .pipe(catchError(this.handleError));
  }

  executeQueryToCsv(dbConfig: any, aiQuery: string, csvPath: string): Observable<QueryResponse> {
    const payload = {
      db_config: dbConfig,
      query: aiQuery,
      output_csv_path: csvPath
    };

    return this.http.post<QueryResponse>(`${this.baseUrl}/execute_query_to_csv`, payload, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  uploadFile(filePath: string, implType: string): Observable<FileUploadResponse> {
    const payload = {
      implType: implType,
      file_path: filePath
    };

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload_file`, payload, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  chatWithCsvFile(fileId: string, userPrompt: string, devPrompt: string, implType: string): Observable<ChatResponse> {
    const payload = {
      implType: implType,
      file_id: fileId,
      user_prompt: userPrompt,
      developer_prompt: devPrompt
    };

    return this.http.post<ChatResponse>(`${this.baseUrl}/ai_chat`, payload, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check if the API is running.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = 'Invalid request. Please check your input.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  }
}