import { Component } from '@angular/core';
import { AppShellComponent, NavItem } from '../../../shared/components/app-shell.component';

const MANAGER_NAV: NavItem[] = [
  { href: '/manager/dashboard',     label: 'Dashboard',     icon: 'dashboard' },
  { href: '/manager/lots',          label: 'My lots',       icon: 'apartment' },
  { href: '/manager/bookings',      label: 'Bookings',      icon: 'event' },
  { href: '/manager/analytics',     label: 'Analytics',     icon: 'bar_chart' },
  { href: '/manager/reports',       label: 'Reports',       icon: 'description' },
  { href: '/manager/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/manager/profile',       label: 'Profile',       icon: 'person' },
];

@Component({
  selector: 'app-manager-shell',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './manager-shell.component.html',
  styleUrls: ['./manager-shell.component.css']
})
export class ManagerShellComponent {
  nav = MANAGER_NAV;
}
