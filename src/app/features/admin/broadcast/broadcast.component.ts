import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { BroadcastRequest } from '../../../core/models/types';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './broadcast.component.html',
  styleUrls: ['./broadcast.component.css']
})
export class BroadcastComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  form = this.fb.group({
    target: ['ALL', Validators.required],
    title: ['', [Validators.required, Validators.minLength(5)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  sending = false;

  sendBroadcast(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    const { target, title, message } = this.form.value;
    const request: BroadcastRequest = { title: title!, message: message! };

    let obs;
    if (target === 'ALL') obs = this.adminService.broadcastAll(request);
    else if (target === 'DRIVER') obs = this.adminService.broadcastDrivers(request);
    else if (target === 'LOT_MANAGER') obs = this.adminService.broadcastManagers(request);
    else return;

    obs.pipe(
      finalize(() => this.sending = false)
    ).subscribe({
      next: () => {
        this.toast.success('Broadcast sent successfully');
        this.form.reset({ target: 'ALL' });
      },
      error: (err) => {
        console.error('Broadcast failed', err);
        this.toast.error('Failed to send broadcast');
      }
    });
  }
}
