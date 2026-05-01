# ParkEase – Angular Frontend

A fully-featured Angular 17 frontend for the ParkEase smart parking platform, converted from the original React/Vite project with all backend endpoints correctly mapped.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components) |
| HTTP | `HttpClient` with functional interceptors |
| Routing | `@angular/router` with lazy-loaded routes |
| Forms | Reactive Forms (`FormBuilder`) |
| Styling | Plain CSS-in-component + global SCSS variables |
| Auth | JWT stored in `localStorage`, auto-refresh on 401 |

---

## 📁 Project Structure

```
src/app/
├── core/
│   ├── models/          types.ts (all TS interfaces)
│   ├── services/        auth, user, vehicle, parking-lot,
│   │                    parking-spot, booking, payment
│   ├── guards/          authGuard, guestGuard, roleGuard
│   └── interceptors/    jwt.interceptor (Bearer token + refresh)
│
├── shared/
│   └── components/      app-shell (sidebar + topbar layout)
│
└── features/
    ├── public/          landing, auth (login/register/forgot/reset),
    │                    search-lots, lot-detail
    ├── driver/          shell, dashboard, vehicles, bookings,
    │                    new-booking, booking-detail, payments,
    │                    notifications, profile
    ├── manager/         shell, dashboard, lots, lot-form, spots,
    │                    bookings, analytics, reports
    └── admin/           shell, dashboard, users, lot-approval,
                         bookings, payments, analytics, audit-logs,
                         broadcast
```

---

## 🔌 Backend API Mapping

### API Gateway base: `http://localhost:8080/api`

| Service | Base Path | Key Endpoints |
|---|---|---|
| **Auth** | `/api/auth` | `POST /register`, `POST /login`, `POST /send-otp`, `POST /reset-password`, `POST /refresh`, `POST /logout` |
| **User** | `/api/user` | `GET /{userId}`, `GET /email/{email}` |
| **Vehicle** | `/api/vehicle` | `POST /register`, `GET /getById/{id}`, `GET /getVehiclesByOwner/{id}`, `PUT /update/{id}`, `DELETE /delete/{id}` |
| **Parking Lot** | `/api/parking-lots` | `POST /`, `GET /{id}`, `GET /city/{city}`, `GET /nearby`, `GET /manager/{id}`, `GET /search`, `PUT /{id}`, `PATCH /{id}/toggle-open`, `DELETE /{id}` |
| **Parking Spot** | `/api/parking-spots` | `POST /`, `POST /bulk`, `GET /{id}`, `GET /lot/{id}`, `GET /lot/{id}/available`, `PATCH /{id}/reserve`, `PATCH /{id}/occupy`, `PATCH /{id}/release`, `PUT /{id}`, `DELETE /{id}` |
| **Booking** | `/api/bookings` | `POST /`, `GET /{id}`, `GET /user/{id}`, `GET /lot/{id}`, `GET /active`, `PUT /{id}/cancel`, `PUT /{id}/checkIn`, `PUT /{id}/checkOut`, `PUT /{id}/extend` |
| **Payment** | `/api/payments` | `POST /`, `GET /booking/{id}`, `GET /user/{id}`, `POST /{id}/refund`, `GET /` (admin) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Production build
npm run build
```

### Environment config

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'   // ← change to your gateway URL
};
```

---

## 🔐 Authentication Flow

1. User registers (`POST /auth/register`) or logs in (`POST /auth/login`)
2. JWT stored in `localStorage` under key `parkease.auth`
3. `jwtInterceptor` attaches `Authorization: Bearer <token>` to every request
4. On 401 → attempts `POST /auth/refresh`, retries original request
5. On refresh failure → auto-logout + redirect to `/login`

---

## 👤 Role-Based Routing

| Role | Default Route | Guard |
|---|---|---|
| `DRIVER` | `/driver/dashboard` | `roleGuard(['DRIVER'])` |
| `MANAGER` | `/manager/dashboard` | `roleGuard(['MANAGER'])` |
| `ADMIN` | `/admin/dashboard` | `roleGuard(['ADMIN'])` |

---

## 🎨 Theming

All colours are CSS custom properties defined in `src/styles.scss`.  
Dark mode is automatically applied via `prefers-color-scheme: dark`.

Override any variable in `:root` to rebrand.

---

## 📦 Build for Production

```bash
npm run build
# Output: dist/parkease-angular/
```

Serve with any static host (Nginx, Vercel, S3+CloudFront, Firebase Hosting, etc.).
