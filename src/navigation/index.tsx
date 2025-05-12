import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList, AuthStackParamList, MainTabParamList, HomeStackParamList } from './types';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

import DashboardScreen from '../screens/home/DashboardScreen';
import PaymentDetailsScreen from '../screens/home/PaymentDetailsScreen';
import EditPaymentScreen from '../screens/home/EditPaymentScreen';
import AddPaymentScreen from '../screens/payments/AddPaymentScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AllPaymentsScreen from '../screens/home/AllPaymentsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';


import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../styles/colors';
import LinearGradient from 'react-native-linear-gradient';


import HomeIcon from '../assets/icons/home';
import HomeActiveIcon from '../assets/icons/home-active';
import AddIcon from '../assets/icons/add';
import AddActiveIcon from '../assets/icons/add-active';
import NotificationIcon from '../assets/icons/notification';
import ProfileIcon from '../assets/icons/profile';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

const HomeNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="PaymentDetails" component={PaymentDetailsScreen} />
      <HomeStack.Screen name="EditPayment" component={EditPaymentScreen} />
      <HomeStack.Screen name="AllPayments" component={AllPaymentsScreen} />
      <HomeStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </HomeStack.Navigator>
  );
};

const MainNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return focused ? <HomeActiveIcon size={size} color={COLORS.white} /> : <HomeIcon size={size} color={COLORS.grey400} />;
          } else if (route.name === 'AddPayment') {
            return focused ? <AddActiveIcon size={size} color={COLORS.white} /> : <AddIcon size={size} color={COLORS.grey400} />;
          } else if (route.name === 'Notifications') {
            return <NotificationIcon size={size} color={focused ? COLORS.white : COLORS.grey400} />;
          } else if (route.name === 'Profile') {
            return <ProfileIcon size={size} color={focused ? COLORS.white : COLORS.grey400} />;
          }
          return <View />;
        },
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.grey400,
        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'ios' ? 100 : 85,
          paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={[COLORS.gradientEnd, COLORS.gradientStart]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              ...styles.tabBarGradient,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
            }}
          />
        ),
        tabBarIconStyle: styles.tabIconStyle,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
        safeAreaInsets: { bottom: Platform.OS === 'ios' ? 40 : 25 },
      })}
      screenListeners={({ route }) => ({
        tabPress: (e) => {
          setActiveTab(route.name);
        },
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeNavigator} 
        options={{ 
          headerShown: false,
          title: 'Ana Sayfa',
          tabBarItemStyle: activeTab === 'Home' ? styles.activeTabItem : styles.tabBarItem,
        }} 
      />
      <MainTab.Screen 
        name="AddPayment" 
        component={AddPaymentScreen} 
        options={{ 
          title: 'Ödeme Ekle',
          headerShown: false,
          tabBarItemStyle: activeTab === 'AddPayment' ? styles.activeTabItem : styles.tabBarItem,
        }} 
      />
      <MainTab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Bildirimler',
          headerShown: false,
          tabBarItemStyle: activeTab === 'Notifications' ? styles.activeTabItem : styles.tabBarItem,
        }} 
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profil',
          headerShown: false,
          tabBarItemStyle: activeTab === 'Profile' ? styles.activeTabItem : styles.tabBarItem,
        }} 
      />
    </MainTab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Return a loading screen if needed
    return null;
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  tabBarGradient: {
    flex: 1,
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  activeTabItem: {
    paddingVertical: 8,
    borderTopWidth: 3,
    borderTopColor: '#FFFFFF',
    marginTop: 4,
  },
  tabIconStyle: {
    marginTop: 5,
  },
  tabBarLabel: {
    fontWeight: '600',
    fontSize: 12,
  }
});

export default AppNavigator;