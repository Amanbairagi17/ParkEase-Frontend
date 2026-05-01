import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manager-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-reports.component.html',
  styleUrls: ['./manager-reports.component.css']
})
export class ManagerReportsComponent {
  reports = [
    { icon: 'bar_chart', title: 'Occupancy report', desc: 'Daily/weekly occupancy across all your lots.' },
    { icon: 'payments', title: 'Revenue report', desc: 'Earnings breakdown by lot, date range, and vehicle type.' },
    { icon: 'event', title: 'Bookings report', desc: 'All bookings with status, duration, and payer details.' },
    { icon: 'directions_car', title: 'Vehicle type report', desc: 'Distribution of vehicle types using your lots.' },
  ];
}
