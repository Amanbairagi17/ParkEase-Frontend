import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBase = environment.apiUrl.replace(/\/+$/, '');
  private readonly gatewayBase = (environment as { gatewayUrl?: string }).gatewayUrl
    ? (environment as { gatewayUrl: string }).gatewayUrl.replace(/\/+$/, '')
    : this.apiBase.replace(/\/api\/?$/, '');

  url(path: string): string {
    if (!path) {
      return this.apiBase;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${this.apiBase}/${path.replace(/^\/+/, '')}`;
  }

  gatewayUrl(path: string): string {
    if (!path) {
      return this.gatewayBase;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${this.gatewayBase}/${path.replace(/^\/+/, '')}`;
  }
}
