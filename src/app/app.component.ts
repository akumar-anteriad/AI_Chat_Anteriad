import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage, ChatStatus } from './models/chat.models';
import { ChatService } from './services/chat.service';
import { CommonModule } from '@angular/common';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { StatusIndicatorComponent } from './components/status-indicator/status-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessageComponent,
    ChatInputComponent,
    StatusIndicatorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  messages$: Observable<ChatMessage[]>;
  status$: Observable<ChatStatus>;
  public ChatStatus: typeof ChatStatus = ChatStatus;

  constructor(private chatService: ChatService) {
    this.messages$ = this.chatService.messages$;
    this.status$ = this.chatService.status$;
  }

  get isProcessing(): boolean {
    return this.chatService.isProcessing;
  }

  async onMessageSubmitted(message: string): Promise<void> {
    await this.chatService.processUserMessage(message);
  }

  newChat(): void {
    this.chatService.newChat();
  }
}
