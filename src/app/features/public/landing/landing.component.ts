import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  year = new Date().getFullYear();
  features = [
    { icon: 'search', title: 'Find spots instantly', desc: 'Search by city, keyword, or location — see real-time availability.' },
    { icon: 'qr_code_2', title: 'Digital check-in', desc: 'No queues, no paper. Check in and out with a tap.' },
    { icon: 'bar_chart', title: 'Operator analytics', desc: 'Managers get live occupancy, revenue, and booking insights.' },
  ];
}
