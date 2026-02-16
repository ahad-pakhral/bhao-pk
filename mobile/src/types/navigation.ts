// Navigation types for React Navigation - NO 'any' TYPES!

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { ProductCardData } from './models';

// Root Stack (Auth + Main + Admin)
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  ProductDetail: { product: ProductCardData };
  Wishlist: undefined;
  Alerts: undefined;
  Settings: undefined;
  SearchHistory: undefined;
  EditProfile: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
};

// Main Tab Navigator (Bottom Tabs)
export type MainTabParamList = {
  Home: undefined;
  Search: { query?: string } | undefined;
  Profile: undefined;
};

// Navigation Props for Screens
export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

export type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type SearchScreenRouteProp = RouteProp<MainTabParamList, 'Search'>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProductDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

export type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

export type AdminLoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminLogin'
>;

export type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminDashboard'
>;

// Screen Props (combines navigation and route)
export interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

export interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

export interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export interface ProductDetailScreenProps {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export interface AdminLoginScreenProps {
  navigation: AdminLoginScreenNavigationProp;
}

export interface AdminDashboardScreenProps {
  navigation: AdminDashboardScreenNavigationProp;
}
