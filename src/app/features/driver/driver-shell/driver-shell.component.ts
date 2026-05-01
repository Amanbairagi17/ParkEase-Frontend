import { Component } from '@angular/core';
import { AppShellComponent, NavItem } from '../../../shared/components/app-shell.component';

const DRIVER_NAV: NavItem[] = [
  { href: '/driver/dashboard',      label: 'Dashboard',      icon: 'dashboard' },
  { href: '/driver/lots',           label: 'Find parking',   icon: 'location_on' },
  { href: '/driver/bookings',       label: 'My bookings',    icon: 'event' },
  { href: '/driver/vehicles',       label: 'Vehicles',       icon: 'directions_car' },
  { href: '/driver/payments',       label: 'Payments',       icon: 'account_balance_wallet' },
  { href: '/driver/notifications',  label: 'Notifications',  icon: 'notifications' },
  { href: '/driver/profile',        label: 'Profile',        icon: 'person' },
];

@Component({
  selector: 'app-driver-shell',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './driver-shell.component.html',
  styleUrls: ['./driver-shell.component.css']
})
export class DriverShellComponent {
  nav = DRIVER_NAV;
}
