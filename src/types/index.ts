export type UserType = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  photoURL?: string;
  createdAt: string;
};

export type PaymentType = {
  id: string;
  userId: string;
  cardName: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  date: string;
  note?: string;
  ownerName?: string;
  isRecurring: boolean;
  recurringType?: 'weekly' | 'monthly' | 'yearly';
  isAutoPayment: boolean;
  completed: boolean;
};

export type NotificationType = {
  id: string;
  userId: string;
  paymentId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}; 