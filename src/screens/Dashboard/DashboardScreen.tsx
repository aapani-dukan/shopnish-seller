import React, { useState, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, RefreshControl, 
  TouchableOpacity, Dimensions, ActivityIndicator, Switch, Alert, StatusBar
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
const { width } = Dimensions.get('window');
// ... (Aapke baaki imports same rahenge)

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Stats
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/sellers/dashboard-stats');
      return res.data;
    },
  });

  // 2. Unified Mutation
 // 2. Unified Mutation
const updateStatusMutation = useMutation({
  mutationFn: async (payload: { isOpen?: boolean; isSelfDeliveryBySeller?: boolean }) => {
    return await api.patch('/api/sellers/toggle-status', payload);
  },
  onSuccess: (response: any, variables) => {
    // 1. Cache Update Logic
    if (response?.data?.success) {
      queryClient.setQueryData(['seller-dashboard'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          // Jo bhi variable change hua hai, use update karein
          isOpen: variables.isOpen !== undefined 
            ? variables.isOpen 
            : oldData.isOpen,
          isSelfDeliveryBySeller: variables.isSelfDeliveryBySeller !== undefined 
            ? variables.isSelfDeliveryBySeller 
            : oldData.isSelfDeliveryBySeller
        };
      });
    }

    // 2. Background Refresh
    queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });

    // 3. Alerts
    if (variables.isOpen !== undefined) {
      Alert.alert("Store Updated", variables.isOpen ? "Dukaan Live hai! 🚀" : "Dukaan Offline hai.");
    }
    
    if (variables.isSelfDeliveryBySeller !== undefined) {
      Alert.alert("Delivery Updated", variables.isSelfDeliveryBySeller ? "Self Delivery ON! 🚚" : "Self Delivery OFF.");
    }
  },
  onError: () => Alert.alert("Error", "Action failed. Check internet.")
});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#001B3A" /></View>;

  // Metrics Logic
  const metrics = [
    { title: 'Today Sales', value: `₹${Number(dashboardData?.todaySales || 0).toLocaleString('en-IN')}`, icon: 'trending-up', color: '#10b981', bg: '#ecfdf5' },
    { title: 'Pending Orders', value: dashboardData?.pendingOrders || 0, icon: 'clock', color: '#f59e0b', bg: '#fffbeb' },
    { 
      title: 'Low Stock', 
      value: dashboardData?.lowStockItems || 0, 
      icon: 'alert-triangle', 
      color: (dashboardData?.lowStockItems || 0) > 0 ? '#ef4444' : '#64748b', 
      bg: (dashboardData?.lowStockItems || 0) > 0 ? '#fef2f2' : '#f8fafc' 
    },
    { title: 'New Reviews', value: dashboardData?.newReviews || 0, icon: 'star', color: '#D4AF37', bg: '#fefce8' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001B3A" />
      
      {/* 🚀 Top Bar: Store Toggle */}
      <View style={[styles.statusToggleBar, { backgroundColor: dashboardData?.isOpen ? '#10b981' : '#64748b' }]}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusDot, { backgroundColor: dashboardData?.isOpen ? '#fff' : '#cbd5e1' }]} />
          <Text style={styles.statusToggleText}>
            {dashboardData?.isOpen ? 'YOUR STORE IS LIVE' : 'STORE IS OFFLINE'}
          </Text>
        </View>
       <Switch
  trackColor={{ false: "#475569", true: "#dcfce7" }}
  thumbColor={dashboardData?.isOpen ? "#fff" : "#f4f3f4"}
  onValueChange={(val) => updateStatusMutation.mutate({ isOpen: val })}
  value={dashboardData?.isOpen}
  disabled={updateStatusMutation.isPending} // Call ke waqt disable rakhein
/>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#001B3A" />}>
        
        {/* ✅ ADDED: Header Section (Wallet Button is here!) */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.businessName} numberOfLines={1}>
              {user?.businessName || user?.firstName || 'Elite Seller'}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('SellerWallet')}
            style={styles.walletButton}
          >
            <Feather name="credit-card" size={18} color="#D4AF37" />
            <Text style={styles.walletButtonText}>Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.profileBtn, { marginLeft: 10 }]} onPress={() => navigation.navigate('Profile')}>
             <Feather name="settings" size={22} color="#001B3A" />
          </TouchableOpacity>
        </View>

        {/* ✅ ADDED: Hero Card (Revenue display) */}
       {/* ✅ Fixed: 'div' ko 'View' mein badal diya hai */}
<View style={styles.heroCard}>
  <Text style={styles.heroLabel}>Total Revenue (Today)</Text>
  <Text style={styles.heroValue}>₹{Number(dashboardData?.todaySales || 0).toLocaleString('en-IN')}</Text>
  <View style={styles.heroFooter}>
    <Feather name="arrow-up-right" size={16} color="#D4AF37" />
    <Text style={styles.heroTrend}>Real-time tracking enabled</Text>
  </View>
</View>

        {/* ✅ ADDED: Metrics Grid */}
        <View style={styles.grid}>
          {metrics.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.cardLabel}>{item.title}</Text>
              <Text style={styles.cardValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders List */}
        {dashboardData?.recentOrders?.length > 0 ? (
          dashboardData.recentOrders.map((order: any) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard} 
              onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
            >
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>#{order.orderNumber || order.subOrderNumber}</Text>
                <Text style={styles.orderCustomer}>{order.customerName}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>₹{Number(order.totalAmount || order.total).toFixed(2)}</Text>
                <Text style={[styles.orderStatus, { color: order.status === 'pending' ? '#f59e0b' : '#3b82f6' }]}>
                  {order.status?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No recent orders.</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionButton onPress={() => navigation.navigate('AddProduct')} icon="plus-circle" label="Add Item" color="#001B3A" bg="#eef2ff" />
          <TouchableOpacity 
  style={styles.actionItem} 
  // 🆕 Yahan 'isSelfDelivery' ko 'isSelfDeliveryBySeller' se badlein
  onPress={() => updateStatusMutation.mutate({ 
    isSelfDeliveryBySeller: !dashboardData?.isSelfDeliveryBySeller 
  })}
>
  <View style={[
    styles.actionIcon, 
    { backgroundColor: dashboardData?.isSelfDeliveryBySeller ? '#dcfce7' : '#f8fafc' }
  ]}>
    <Feather 
      name="truck" 
      size={22} 
      color={dashboardData?.isSelfDeliveryBySeller ? '#10b981' : '#64748b'} 
    />
  </View>
  <Text style={styles.actionText}>
    {dashboardData?.isSelfDeliveryBySeller ? 'Self Delivery ON' : 'Self Delivery OFF'}
  </Text>
</TouchableOpacity>
         
        </View>
      </ScrollView>
    </View>
  );
}

// ... (ActionButton and Styles remain the same)
// ✅ DashboardScreen function ke bahar aur styles ke upar ise rakhein
const ActionButton = ({ icon, label, onPress, color, bg }: any) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: bg }]}>
      <Feather name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

// Iske baad aapka styles object shuru hoga
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusToggleBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, height: 60, marginTop: 0 
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusToggleText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  businessName: { fontSize: 24, fontWeight: '900', color: '#001B3A' },
  profileBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 15, elevation: 3 },
  heroCard: { 
    backgroundColor: '#001B3A', marginHorizontal: 20, padding: 25, 
    borderRadius: 24, marginBottom: 15, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2
  },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  heroValue: { color: '#D4AF37', fontSize: 36, fontWeight: '900', marginVertical: 5 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  heroTrend: { color: '#fff', fontSize: 12, marginLeft: 5, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card: { 
    backgroundColor: '#fff', width: width * 0.44, margin: width * 0.02, 
    padding: 16, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  iconBox: { padding: 10, borderRadius: 14, alignSelf: 'flex-start', marginBottom: 12 },
  cardLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '900', color: '#001B3A', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#001B3A' },
  seeAll: { color: '#3b82f6', fontWeight: '700' },
  orderCard: { 
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', 
    marginHorizontal: 20, marginTop: 12, padding: 18, borderRadius: 20, elevation: 1
  },
  orderLeft: { flex: 1 },
  orderRight: { alignItems: 'flex-end' },
  orderId: { fontWeight: '900', color: '#001B3A', fontSize: 15 },
  orderCustomer: { color: '#64748b', fontSize: 12, marginTop: 2 },
  orderAmount: { fontWeight: '900', color: '#001B3A' },
  orderStatus: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginBottom: 50 },
  actionItem: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 20, alignItems: 'center', elevation: 2 },
  actionIcon: { padding: 14, borderRadius: 15, marginBottom: 8 },
  actionText: { fontWeight: '800', color: '#001B3A', fontSize: 13 },
  emptyState: { padding: 50, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 10 },
  walletButton: { 
    flexDirection: 'row', 
    backgroundColor: '#001B3A', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },

  walletButtonText: { color: '#fff', marginLeft: 8, fontWeight: '700' }
});