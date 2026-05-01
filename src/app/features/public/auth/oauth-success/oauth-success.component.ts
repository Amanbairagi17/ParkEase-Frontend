import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  template: `
    <div class="processing-container">
      <div class="spinner"></div>
      <h2>Authenticating...</h2>
      <p>Please wait while we set up your session.</p>
    </div>
  `,
  styles: [`
    .processing-container {
      height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0f172a; color: white;
      font-family: 'Inter', sans-serif;
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }
    h2 { font-weight: 600; margin-bottom: 0.5rem; }
    p { color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OAuthSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (accessToken && refreshToken) {
      // 1. Process and Save tokens using AuthService
      this.authService.handleOAuthSuccess(accessToken, refreshToken);
      
      // 2. Short delay to ensure session state is updated
      setTimeout(() => {
        const redirectUrl = this.authService.roleRedirect();
        this.router.navigate([redirectUrl]);
      }, 300);
    } else {
      console.error('Tokens missing in redirect URL');
      this.router.navigate(['/login'], { queryParams: { error: 'OAuth2 authentication failed' } });
    }
  }
}
