import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStatus } from '../../models/chat.models';

@Component({
  selector: 'app-status-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-indicator.component.html',
  styleUrl: './status-indicator.component.css'
})
export class StatusIndicatorComponent {
  @Input() status: ChatStatus = ChatStatus.IDLE;

  getStatusText(): string {
    switch (this.status) {
      case ChatStatus.GENERATING_SQL:
        return 'Generating SQL...';
      case ChatStatus.EXPORTING_CSV:
        return 'Exporting CSV...';
      case ChatStatus.UPLOADING_FILE:
        return 'Uploading file...';
      case ChatStatus.FETCHING_ANSWER:
        return 'Fetching answer from AI...';
      case ChatStatus.ERROR:
        return 'Error occurred';
      default:
        return '';
    }
  }
}