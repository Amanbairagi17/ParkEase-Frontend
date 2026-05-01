import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Audit Logs ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent {}
