import React, { useState, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, RefreshControl, 
  TouchableOpacity, Dimensions, ActivityIndicator, Switch, Alert, StatusBar
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user, refreshUserStatus } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Stats (Backend se connect hone par actual data dikhega)
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/sellers/dashboard-stats');
        return res.data;
      } catch (err) {
        // Fallback for UI testing
        return { 
          todaySales: 0, pendingOrders: 0, activeProducts: 0, newReviews: 0, 
          isOpen: user?.sellerProfile?.isOpen ?? false, recentOrders: [] 
        };
      }
    },
  });

  // 2. Toggle Store Mutation (Zomato style quick toggle)
  const toggleStore = useMutation({
    mutationFn: async (status: boolean) => {
      return await api.patch('/api/sellers/toggle-status', { isOpen: status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });
      Alert.alert("Store Updated", variables ? "Aapki dukaan ab live hai! 🚀" : "Dukaan band kar di gayi hai.");
    },
    onError: () => Alert.alert("Error", "Action failed. Check internet.")
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#001B3A" />
      </View>
    );
  }

  const metrics = [
    { title: 'Today Sales', value: `₹${Number(dashboardData?.todaySales || 0).toLocaleString('en-IN')}`, icon: 'trending-up', color: '#10b981', bg: '#ecfdf5' },
    { title: 'Pending Orders', value: dashboardData?.pendingOrders || 0, icon: 'clock', color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Active Items', value: dashboardData?.activeProducts || 0, icon: 'package', color: '#3b82f6', bg: '#eff6ff' },
    { title: 'New Reviews', value: dashboardData?.newReviews || 0, icon: 'star', color: '#D4AF37', bg: '#fefce8' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001B3A" />
      
      {/* 🚀 Premium Top Bar (Fixed) */}
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
          onValueChange={(val) => toggleStore.mutate(val)}
          value={dashboardData?.isOpen}
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#001B3A" />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.businessName}>{user?.sellerProfile?.businessName || 'Elite Seller'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
             <Feather name="settings" size={22} color="#001B3A" />
          </TouchableOpacity>
        </View>

        {/* Sales Hero Card (Shopnish Navy Blue) */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Revenue (Today)</Text>
          <Text style={styles.heroValue}>₹{Number(dashboardData?.todaySales || 0).toLocaleString('en-IN')}</Text>
          <View style={styles.heroFooter}>
            <Feather name="arrow-up-right" size={16} color="#D4AF37" />
            <Text style={styles.heroTrend}>Real-time tracking enabled</Text>
          </View>
        </View>

        {/* Metrics Grid */}
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

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {dashboardData?.recentOrders?.length > 0 ? (
          dashboardData.recentOrders.map((order: any) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>#{order.orderNumber}</Text>
                <Text style={styles.orderCustomer}>{order.customerName}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                <Text style={[styles.orderStatus, { color: '#f59e0b' }]}>{order.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Orders will appear here once received.</Text>
          </View>
        )}

        {/* Quick Actions Footer */}
        <View style={styles.quickActions}>
          <ActionButton 
            onPress={() => navigation.navigate('AddProduct')} 
            icon="plus-circle" label="Add Item" color="#001B3A" bg="#eef2ff" 
          />
          <ActionButton 
            onPress={() => navigation.navigate('Inventory')} 
            icon="list" label="Stock" color="#ea580c" bg="#fff7ed" 
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Reusable Action Button
const ActionButton = ({ icon, label, onPress, color, bg }: any) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: bg }]}>
      <Feather name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

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
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 10 }
});