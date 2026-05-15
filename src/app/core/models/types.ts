
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
  lotName?: string;
  spotId: string;
  vehiclePlate: string;
  vehicleType: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'THREE_WHEELER' | 'HEAVY';
  bookingType: 'PRE_BOOKING' | 'WALK_IN_BOOKING';
  pricingType: 'HOURLY' | 'DAILY';
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isPaid: boolean;
  duration?: string;
  totalAmount: number;
  amount?: number;
  paidAmount?: number;
  finalAmount?: number;
  remainingAmount?: number;
  pendingAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  userId: number | string;
  lotId: number | string;
  spotId: number | string;
  vehiclePlate: string;
  vehicleType: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'THREE_WHEELER' | 'HEAVY';
  bookingType: 'PRE_BOOKING' | 'WALK_IN_BOOKING';
  pricingType: 'HOURLY' | 'DAILY';
  startTime?: string; // Optional for WALK_IN_BOOKING
  endTime: string;
}

export interface BookingEstimate {
  lotId: number;
  spotId: number;
  startTime: string;
  endTime: string;
  totalAmount: number;
  hourlyRate: number;
  durationMinutes: number;
}

export interface Payment {
  paymentId: number;
  bookingId: number;
  userId: number;
  amount: number;
  // Payment statuses are intentionally kept as generic strings to avoid coupling UI logic to legacy literals.
  status: string;
  mode: 'CARD' | 'UPI' | 'WALLET' | 'CASH';
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  currency: string;
  paidAt?: string;
  refundedAt?: string;
  description?: string;
  idempotencyKey?: string;
}

export interface RazorpayOrder {
  orderId: string;
  currency: string;
  amount: number;
  key: string;
}

export interface Receipt {
  receiptId: string;
  receiptNumber: string;
  bookingId: number;
  paymentId: number;
  userId: number;
  vehicleNumber: string;
  parkingName: string;
  slotNumber: string;
  checkInTime?: string;
  checkOutTime?: string;
  duration?: string;
  bookingType?: Booking['bookingType'] | string;
  pricingType?: Booking['pricingType'] | string;
  baseAmount?: number;
  serviceCharge?: number;
  gstAmount?: number;
  amountPaid: number;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  downloadUrl?: string;
  paymentTime?: string;
  generatedAt: string;
}

export interface ReceiptHistoryResponse {
  items: Receipt[];
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  channel: 'APP' | 'IN_APP' | 'EMAIL' | 'SMS';
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
