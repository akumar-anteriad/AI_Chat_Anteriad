import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ChatMessage, ChatResponse, ChatStatus, DatabaseConfig } from '../models/chat.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly SCHEMA_FILE_ID = 'file-62TtsbfG2mZ7Bp1xFNTYNp';
  private readonly SCHEMA_FILE_DEV_PROMPT = `You are an assistant that can analyze txt files containing table schema and provides SQL queries for the user's questions. Respond in JSON format with the SQL Query having a key sql_query`;
  private readonly CSV_FILE_DEV_PROMPT = 'You are an assitant that can analyze CSV files and provide answers to questions based on the provided CSV file';
  private readonly IMPL_TYPE = 'openai';
  private readonly DB_CONFIG: DatabaseConfig = {
    host: "10.219.166.9",
    user: "root",
    password: "dgfueisrfDse9",
    database: "AMC_DEV_UAT_2025JUNE05"
  };

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private statusSubject = new BehaviorSubject<ChatStatus>(ChatStatus.IDLE);
  private currentFileIdSubject = new BehaviorSubject<string | null>(null);

  public messages$ = this.messagesSubject.asObservable();
  public status$ = this.statusSubject.asObservable();
  public currentFileId$ = this.currentFileIdSubject.asObservable();

  constructor(private apiService: ApiService) { }

  // async processUserMessage(userPrompt: string): Promise<void> {
  //   try {
  //     // Step 1: Add user message to chat and using schema file id generating sql query
  //     this.addMessage(userPrompt, true);
  //     this.statusSubject.next(ChatStatus.GENERATING_SQL);
  //     const response = await this.apiService.aiChat(userPrompt, this.SCHEMA_FILE_ID, this.SCHEMA_FILE_DEV_PROMPT, this.IMPL_TYPE).toPromise();
  //     const sqlQuery = this.getSqlQuery(response);
  //     if (!sqlQuery) {
  //       throw new Error('No SQL query generated');
  //     }

  //     // Step 2: Generate CSV using SQL Query
  //     this.statusSubject.next(ChatStatus.EXPORTING_CSV);
  //     const timestamp = new Date().getTime();
  //     const csvPath = `/app/sample-data/query_result_${timestamp}.csv`;
  //     const queryResponse = await this.apiService.executeQueryToCsv(this.DB_CONFIG, sqlQuery, csvPath).toPromise();

  //     if (!queryResponse?.csv_path) {
  //       throw new Error('No CSV file generated');
  //     }

  //     // Step 3: Upload CSV file
  //     this.statusSubject.next(ChatStatus.UPLOADING_FILE);
  //     const uploadResponse = await this.apiService.uploadFile(csvPath, this.IMPL_TYPE).toPromise();

  //     if (!uploadResponse?.file_id) {
  //       throw new Error('Failed to upload file');
  //     }

  //     // Update current file ID
  //     this.currentFileIdSubject.next(uploadResponse.file_id);

  //     // Step 4: Get AI response
  //     this.statusSubject.next(ChatStatus.FETCHING_ANSWER);
  //     const cResponse = await this.apiService.chatWithCsvFile(uploadResponse.file_id, userPrompt, this.CSV_FILE_DEV_PROMPT, this.IMPL_TYPE).toPromise();

  //     const chatResponse = this.getResponsefromCSV(cResponse);
  //     if (!chatResponse) {
  //       throw new Error('No response from AI');
  //     }

  //     // Add AI response to chat
  //     this.addMessage(chatResponse, false);
  //     this.statusSubject.next(ChatStatus.IDLE);

  //   } catch (error) {
  //     console.error('Error processing message:', error);
  //     this.statusSubject.next(ChatStatus.ERROR);

  //     const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  //     this.addMessage(`Sorry, there was an error processing your request: ${errorMessage}`, false);

  //     setTimeout(() => {
  //       this.statusSubject.next(ChatStatus.IDLE);
  //     }, 2000);
  //   }
  // }

  async processUserMessage(userPrompt: string): Promise<void> {
    try {
      this.addMessage(userPrompt, true);

      const currentFileId = this.currentFileIdSubject.value;

      this.statusSubject.next(ChatStatus.FETCHING_ANSWER);

      if (!currentFileId) {
        // FIRST MESSAGE or new chat — run full pipeline

        // this.statusSubject.next(ChatStatus.GENERATING_SQL);
        const response = await this.apiService.aiChat(
          userPrompt,
          this.SCHEMA_FILE_ID,
          this.SCHEMA_FILE_DEV_PROMPT,
          this.IMPL_TYPE
        ).toPromise();

        const sqlQuery = this.getSqlQuery(response);
        if (!sqlQuery) throw new Error('No SQL query generated');

        // this.statusSubject.next(ChatStatus.EXPORTING_CSV);
        const timestamp = new Date().getTime();
        const csvPath = `/app/sample-data/query_result_${timestamp}.csv`;

        const queryResponse = await this.apiService.executeQueryToCsv(this.DB_CONFIG, sqlQuery, csvPath).toPromise();
        if (!queryResponse?.csv_path) throw new Error('No CSV file generated');

        // this.statusSubject.next(ChatStatus.UPLOADING_FILE);
        const uploadResponse = await this.apiService.uploadFile(csvPath, this.IMPL_TYPE).toPromise();
        if (!uploadResponse?.file_id) throw new Error('Failed to upload file');

        this.currentFileIdSubject.next(uploadResponse.file_id);
      }

      // Use existing file_id or newly uploaded one
      const fileId = this.currentFileIdSubject.value;
      // this.statusSubject.next(ChatStatus.FETCHING_ANSWER);

      const cResponse = await this.apiService.chatWithCsvFile(
        fileId!,
        userPrompt,
        this.CSV_FILE_DEV_PROMPT,
        this.IMPL_TYPE
      ).toPromise();

      const chatResponse = this.getResponsefromCSV(cResponse);
      if (!chatResponse) throw new Error('No response from AI');

      this.addMessage(chatResponse, false);
      this.statusSubject.next(ChatStatus.IDLE);

    } catch (error) {
      console.error('Error processing message:', error);
      this.statusSubject.next(ChatStatus.ERROR);

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.addMessage(`Sorry, there was an error processing your request: ${errorMessage}`, false);

      setTimeout(() => this.statusSubject.next(ChatStatus.IDLE), 2000);
    }
  }


  private addMessage(content: string, isUser: boolean): void {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      isUser,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  newChat(): void {
    this.messagesSubject.next([]);
    this.statusSubject.next(ChatStatus.IDLE);
    this.currentFileIdSubject.next('');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  get isProcessing(): boolean {
    const currentStatus = this.statusSubject.value;
    return currentStatus !== ChatStatus.IDLE && currentStatus !== ChatStatus.ERROR;
  }

  private getSqlQuery(response: any): string {
    const outputs = response.raw_response.output;

    let sqlQuery: string = '';

    for (const item of outputs) {
      if (
        item.type === 'message' &&
        item.content &&
        Array.isArray(item.content)
      ) {
        for (const block of item.content) {
          if (
            block.type === 'output_text' &&
            typeof block.text === 'string' &&
            block.text.includes('"sql_query"')
          ) {
            // Try to parse JSON inside code block
            const match = block.text.match(/```json\n([\s\S]*?)```/);
            if (match && match[1]) {
              try {
                const parsed = JSON.parse(match[1]);
                sqlQuery = parsed.sql_query;
              } catch (err) {
                console.error('Failed to parse sql_query block', err);
              }
            }
          }
        }
      }
    }
    return sqlQuery;
  }

  private getResponsefromCSV(response: any): string {

    const outputs = response?.raw_response.output;

    const extractedTexts: string[] = [];

    for (const outputItem of outputs) {
      if (outputItem.type === 'message' && Array.isArray(outputItem.content)) {
        for (const contentBlock of outputItem.content) {
          if (contentBlock.type === 'output_text' && typeof contentBlock.text === 'string') {
            extractedTexts.push(contentBlock.text);
          }
        }
      }
    }

    return extractedTexts.join('<br><br>');
  }
}