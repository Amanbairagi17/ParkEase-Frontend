import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  template: `
    <div class="redirect-container">
      <div class="spinner"></div>
      <p>Completing login...</p>
    </div>
  `,
  styles: [`
    .redirect-container {
      height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1rem;
      background: var(--bg); color: var(--text);
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--surface);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OAuth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');
    const role = this.route.snapshot.queryParamMap.get('role');

    if (accessToken && refreshToken) {
      // Store tokens and process role from token
      this.authService.handleOAuthSuccess(accessToken, refreshToken);
      
      // Redirect based on role or default
      setTimeout(() => {
        const redirectUrl = this.authService.roleRedirect();
        this.router.navigate([redirectUrl]);
      }, 100);
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'OAuth2 login failed' } });
    }
  }
}
