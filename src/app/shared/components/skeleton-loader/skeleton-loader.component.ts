import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'skeleton ' + type" [style.width]="width" [style.height]="height"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--bg) 25%, var(--surface-border) 50%, var(--bg) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 8px;
    }

    .text { height: 1rem; margin-bottom: 0.5rem; }
    .title { height: 1.5rem; margin-bottom: 1rem; width: 60%; }
    .avatar { width: 40px; height: 40px; border-radius: 12px; }
    .card { height: 200px; width: 100%; }
    .circle { border-radius: 50%; }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'title' | 'avatar' | 'card' | 'circle' = 'text';
  @Input() width: string = '100%';
  @Input() height: string = 'auto';
}
