export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN' | 'LOT_MANAGER';
  address?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  profilePicUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Vehicle {
  vehicleId: string;
  ownerId: string;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'THREE_WHEELER' | 'HEAVY';
  isEV: boolean;
  isActive: boolean;
  registeredAt: string;
}

export interface ParkingLot {
  lotId: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  availableSpots: number;
  managerId: string;
  open: boolean;
  approved: boolean;
  openTime: string;
  closeTime: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSpot {
  spotId: string;
  lotId: string;
  spotNumber: string;
  floor: string;
  spotType: 'CAR' | 'BIKE' | 'TRUCK' | 'EV' | 'HANDICAPPED';
  vehicleType: 'TWO_WHEELER' | 'THREE_WHEELER' | 'FOUR_WHEELER' | 'HEAVY';
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';
  handicapped: boolean;
  EVCharging: boolean;
  pricePerHour: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  bookingId: string;
  userId: string;
  lotId: string;
  spotId: string;
  vehiclePlate: string;
  vehicleType: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'THREE_WHEELER' | 'HEAVY';
  bookingType: 'PRE_BOOKING' | 'WALK_IN';
  startTime: string;
  endTime: string;
  status: 'RESERVED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  mode: 'CARD' | 'UPI' | 'WALLET' | 'CASH';
  transactionId?: string;
  currency: string;
  paidAt?: string;
  refundedAt?: string;
  description?: string;
}

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  sentAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
}

export interface AdminUser {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone: string;
  createdAt: string;
  provider?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalDrivers: number;
  totalLotManagers: number;
  totalAdmins: number;
}

export interface BroadcastRequest {
  title: string;
  message: string;
}

export interface WarnUserRequest {
  title: string;
  message: string;
}
