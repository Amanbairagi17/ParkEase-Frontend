import { Component } from '@angular/core';
import { AppShellComponent, NavItem } from '../../../shared/components/app-shell.component';

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard',     label: 'Dashboard',     icon: 'dashboard' },
  { href: '/admin/users',         label: 'Users',         icon: 'group' },
  { href: '/admin/lots-approval', label: 'Lot approvals', icon: 'verified' },
  { href: '/admin/bookings',      label: 'Bookings',      icon: 'event' },
  { href: '/admin/payments',      label: 'Payments',      icon: 'account_balance_wallet' },
  { href: '/admin/analytics',     label: 'Analytics',     icon: 'bar_chart' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/admin/broadcast',     label: 'Broadcast',     icon: 'campaign' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css']
})
export class AdminShellComponent {
  nav = ADMIN_NAV;
}
