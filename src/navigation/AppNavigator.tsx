import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';

// Context & Hooks
import { useAuth } from '../context/AuthContext';

// Screens
import AuthScreen from '../screens/Auth/AuthScreen';
import SellerStatusScreen from '../screens/Auth/SellerStatusScreen';
import SellerApplyScreen from '../screens/Auth/SellerApplyScreen';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen'; // Folder case matching

import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import AddProductScreen from '../screens/Inventory/AddProductScreen';
import EditProductScreen from '../screens/Inventory/EditProductScreen';
import SellerWalletScreen from '../screens/SellerWalletScreen';
import BankDetailsScreen from '../screens/Auth/BankDetailsScreen';
import ShopDetailsScreen from '../screens/Profile/ShopDetailsScreen';
import TaxInfoScreen from '../screens/Profile/TaxInfoScreen';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- SELLER TAB NAVIGATION ---
function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'circle';
          if (route.name === 'Dashboard') iconName = 'grid';
          else if (route.name === 'Orders') iconName = 'shopping-bag';
          else if (route.name === 'Inventory') iconName = 'box';
          else if (route.name === 'Profile') iconName = 'user';
          
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#001B3A', // Shopnish Dark Blue
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
export default function AppNavigator() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  // 1. Loading State
  if (isLoadingAuth) {
    return null; // Yahan Splash Screen loading indicator daal sakte hain
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {!isAuthenticated ? (
          // 2. Auth Flow
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            {/* 3. Logical Flow based on Approval Status */}
            {user?.role === 'seller' && user?.sellerProfile?.approvalStatus === 'approved' ? (
              // Case A: Approved Seller - Main App
              <>
                <Stack.Screen name="SellerMain" component={SellerTabs} />
                <Stack.Screen 
                  name="OrderDetails" 
                  component={OrderDetailsScreen} 
                  options={{ 
                    headerShown: true, 
                    title: 'Order Details',
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerBackTitle: "",
                  }} 
                />
                <Stack.Screen 
                  name="AddProduct" 
                  component={AddProductScreen} 
                  options={{ headerShown: true, title: 'Add New Product', headerBackTitle: "" }} 
                />
                <Stack.Screen 
  name="SellerWallet" 
  component={SellerWalletScreen} 
  options={{ 
    headerShown: true, 
    title: 'My Wallet',
    headerStyle: { backgroundColor: '#fff' },
    headerTitleStyle: { fontWeight: '800', color: '#001B3A' },
    headerShadowVisible: false, // क्लीन लुक के लिए
  }} 
/>
                <Stack.Screen 
  name="BankDetails" 
  component={BankDetailsScreen} 
  options={{ 
    title: 'Bank Account Setup',
    headerTitleStyle: { fontWeight: '900', color: '#000' },
    headerShadowVisible: false,
  }} 
/>

<Stack.Screen 
    name="TaxInfo" 
    component={TaxInfoScreen} 
  />
<Stack.Screen name="ShopDetails" component={ShopDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen 
                  name="EditProduct" 
                  component={EditProductScreen} 
                  options={{ headerShown: true, title: 'Edit Product', headerBackTitle: "" }} 
                />
              </>
            ) : user?.role === 'seller' && user?.sellerProfile?.approvalStatus === 'pending' ? (
              // Case B: Review State
              <Stack.Screen name="SellerStatus" component={SellerStatusScreen} />
            ) : (
              // Case C: New/Rejected (Registration/Application Flow)
              <Stack.Screen name="SellerApply" component={SellerApplyScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}