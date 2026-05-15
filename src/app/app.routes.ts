import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/public/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/public/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/public/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/public/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'oauth-success',
    loadComponent: () => import('./features/public/auth/oauth-success/oauth-success.component').then(m => m.OAuthSuccessComponent)
  },
  {
    path: 'lots',
    loadComponent: () => import('./features/public/search-lots/search-lots.component').then(m => m.SearchLotsComponent)
  },
  {
    path: 'lots/:id',
    loadComponent: () => import('./features/public/lot-detail/lot-detail.component').then(m => m.LotDetailComponent)
  },

  // ─── Driver ───────────────────────────────────────────────
  {
    path: 'driver',
    canActivate: [roleGuard(['DRIVER'])],
    loadComponent: () => import('./features/driver/driver-shell/driver-shell.component').then(m => m.DriverShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/driver/dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent)
      },
      {
        path: 'lots',
        loadComponent: () => import('./features/public/search-lots/search-lots.component').then(m => m.SearchLotsComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/driver/bookings/driver-bookings.component').then(m => m.DriverBookingsComponent)
      },
      {
        path: 'bookings/new',
        loadComponent: () => import('./features/driver/new-booking/new-booking.component').then(m => m.NewBookingComponent)
      },
      {
        path: 'bookings/:id',
        loadComponent: () => import('./features/driver/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent)
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./features/driver/vehicles/driver-vehicles.component').then(m => m.DriverVehiclesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/driver/payments/driver-payments.component').then(m => m.DriverPaymentsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/driver/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/driver/profile/profile.component').then(m => m.ProfileComponent)
      },
    ]
  },

  // ─── Manager ──────────────────────────────────────────────
  {
    path: 'manager',
    canActivate: [roleGuard(['MANAGER'])],
    loadComponent: () => import('./features/manager/manager-shell/manager-shell.component').then(m => m.ManagerShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'lots',
        loadComponent: () => import('./features/manager/lots/manager-lots.component').then(m => m.ManagerLotsComponent)
      },
      {
        path: 'lots/new',
        loadComponent: () => import('./features/manager/lot-form/lot-form.component').then(m => m.LotFormComponent)
      },
      {
        path: 'lots/:id/edit',
        loadComponent: () => import('./features/manager/lot-form/lot-form.component').then(m => m.LotFormComponent)
      },
      {
        path: 'lots/:id/spots',
        loadComponent: () => import('./features/manager/spots/manager-spots.component').then(m => m.ManagerSpotsComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/manager/bookings/manager-bookings.component').then(m => m.ManagerBookingsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/manager/analytics/manager-analytics.component').then(m => m.ManagerAnalyticsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/manager/reports/manager-reports.component').then(m => m.ManagerReportsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/driver/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/driver/profile/profile.component').then(m => m.ProfileComponent)
      },
    ]
  },

  // ─── Admin ────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'lots-approval',
        loadComponent: () => import('./features/admin/lot-approval/lot-approval.component').then(m => m.LotApprovalComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/admin/bookings/admin-bookings.component').then(m => m.AdminBookingsComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/admin/payments/admin-payments.component').then(m => m.AdminPaymentsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'broadcast',
        loadComponent: () => import('./features/admin/broadcast/broadcast.component').then(m => m.BroadcastComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/driver/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/driver/profile/profile.component').then(m => m.ProfileComponent)
      },
    ]
  },

  // ─── Fallback ─────────────────────────────────────────────
  {
    path: 'receipts',
    loadChildren: () => import('./features/receipt/receipt.routes').then(m => m.receiptRoutes)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
