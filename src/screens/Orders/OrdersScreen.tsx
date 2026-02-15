import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions, ScrollView, Alert 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

// Status Colors & Hindi Labels
const statusConfig: any = {
  pending: { label: 'नया ऑर्डर', color: '#f59e0b', bg: '#fef3c7', icon: 'bell' },
  accepted: { label: 'स्वीकृत', color: '#3b82f6', bg: '#dbeafe', icon: 'thumbs-up' },
  ready_for_pickup: { label: 'पैक हो गया', color: '#8b5cf6', bg: '#ede9fe', icon: 'package' },
  picked_up: { label: 'रास्ते में', color: '#10b981', bg: '#d1fae5', icon: 'truck' },
  delivered: { label: 'डिलीवर हुआ', color: '#059669', bg: '#ecfdf5', icon: 'check-circle' },
  cancelled: { label: 'रद्द', color: '#ef4444', bg: '#fee2e2', icon: 'x-circle' },
};

export default function OrdersScreen({ navigation }: any) {
 const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
  try {
    // ✅ URL को बैकएंड के राउट से मैच किया (api/sellers/orders)
    const response = await api.get('/api/sellers/orders'); 
    
    // ✅ आपका बैकएंड सीधा Array भेज रहा है, इसलिए response.data का उपयोग करें
    const rawData = Array.isArray(response.data) ? response.data : [];

    // Latest orders ऊपर दिखाने के लिए (createdat को चेक करें, आपके DB में createdAt हो सकता है)
    const sortedOrders = rawData.sort((a: any, b: any) => 
      new Date(b.createdAt || b.createdat).getTime() - new Date(a.createdAt || a.createdat).getTime()
    );
    
    setOrders(sortedOrders);
  } catch (err: any) {
  // यह लाइन आपको बताएगी कि मोबाइल ऐप ने किस URL पर रिक्वेस्ट भेजी थी
  console.log("❌ Full Request URL:", err.config?.baseURL + err.config?.url);
  console.log("❌ Status Code:", err.response?.status);
  console.error('Failed to fetch orders:', err);

  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Status Update Function
  const updateStatus = async (orderId: string, newStatus: string) => {
  try {
    // URL ko /api prefix ke saath consistent rakhein
    await api.patch(`/api/suborders/${orderId}/status`, { status: newStatus });
    
    // ✅ High-Class Feedback: Sound ya Haptic feedback yahan add kar sakte hain
    Alert.alert("सफलता", `ऑर्डर अब ${statusConfig[newStatus].label} है।`);
    fetchOrders(); 
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || "Status update nahi ho paya.";
    Alert.alert("Error", errorMsg);
  }
};

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter((o: any) => o.status === filter);

// 2. Optimized renderOrderItem for multiple items
const renderOrderItem = ({ item }: any) => {
  const config = statusConfig[item.status] || statusConfig.pending;
  
  // Maan lijiye backend se orderItems ka array aa raha hai
  const itemsCount = item.items?.length || 0;
  const firstItemName = item.items?.[0]?.productName || item.productName || 'Order Item';

  return (
    <View style={[styles.orderCard, { borderLeftColor: config.color }]}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            {/* SubOrderNumber handling */}
            <Text style={styles.orderNo}>{item.subOrderNumber || item.subordernumber}</Text>
            <Text style={styles.orderDate}>
              {/* null check for date */}
              {item.createdAt || item.createdat ? format(new Date(item.createdAt || item.createdat), 'dd MMM, hh:mm a') : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Feather name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.productName} numberOfLines={2}>
            {firstItemName} {itemsCount > 1 ? `+ ${itemsCount - 1} more items` : ''}
          </Text>
          <View style={styles.customerRow}>
             <Feather name="map-pin" size={14} color="#64748b" />
             <Text style={styles.customerInfo}>{item.deliveryCity || 'Local Delivery'}</Text>
          </View>
        </View>

        {/* Action Buttons Logic */}
        <View style={styles.cardFooter}>
          <Text style={styles.orderTotal}>₹{Number(item.total).toLocaleString()}</Text>
          
          <View style={styles.actionRow}>
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.miniBtn, { backgroundColor: '#10b981' }]} // Accept green behtar hai
                onPress={() => updateStatus(item.id, 'accepted')}
              >
                <Text style={styles.miniBtnText}>Accept</Text>
              </TouchableOpacity>
            )}
              {item.status === 'accepted' && (
                <TouchableOpacity 
                  style={[styles.miniBtn, { backgroundColor: '#8b5cf6' }]}
                  onPress={() => updateStatus(item.id, 'ready_for_pickup')}
                >
                  <Text style={styles.miniBtnText}>Pack Done</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.detailBtn}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
              >
                <Feather name="chevron-right" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {['all', 'pending', 'accepted', 'ready_for_pickup', 'delivered', 'cancelled'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.chip, filter === f && styles.activeChip]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.activeChipText]}>
                {f === 'all' ? 'सभी ऑर्डर' : statusConfig[f]?.label || f}
              </Text>
              {filter === f && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchOrders(); }} 
            tintColor="#1e40af"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>इस श्रेणी में कोई ऑर्डर नहीं है।</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filterWrapper: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1 },
  filterBar: { paddingVertical: 12, paddingLeft: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', marginRight: 10, alignItems: 'center' },
  activeChip: { backgroundColor: '#eff6ff' },
  chipText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  activeChipText: { color: '#1e40af' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1e40af', marginTop: 4 },
  
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#e2e8f0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNo: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  orderDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', marginLeft: 5 },
  
  cardBody: { paddingVertical: 5 },
  productName: { fontSize: 16, fontWeight: '700', color: '#334155', lineHeight: 22 },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  customerInfo: { fontSize: 13, color: '#64748b', marginLeft: 5 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 10 },
  orderTotal: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 10 },
  miniBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  detailBtn: { padding: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 10, fontWeight: '500' }
});