import { PaymentType } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: { screen?: keyof HomeStackParamList } | undefined;
  AddPayment: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  PaymentDetails: { payment: PaymentType };
  EditPayment: { payment: PaymentType };
  AllPayments: { type: 'upcoming' | 'past', payments: PaymentType[] };
  NotificationSettings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
}; 