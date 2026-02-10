import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, Linking, Platform, Dimensions 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/suborders/${orderId}/details`);
      setOrder(res.data.subOrder);
    } catch (err) {
      Alert.alert("Error", "Details load nahi ho payi.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/suborders/${orderId}/status`, { status: newStatus });
      Alert.alert("Status Updated", `Order ab ${newStatus} status mein hai.`);
      fetchOrderDetails();
    } catch (err) {
      Alert.alert("Error", "Update fail ho gaya.");
    } finally {
      setUpdating(false);
    }
  };

  const openMap = (address: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`
    });
    if (url) Linking.openURL(url);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={{ marginTop: 10, color: '#64748b' }}>Fetching Order...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Status Tracker Header */}
        <View style={styles.statusHeader}>
           <View style={styles.statusCircle}>
             <Feather name="package" size={30} color="#1e40af" />
           </View>
           <Text style={styles.statusMainText}>Order {order?.status?.replace('_', ' ').toUpperCase()}</Text>
           <Text style={styles.subText}>Sub-Order: #{order?.subordernumber}</Text>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer & Delivery</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order?.customerName || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{order?.customerPhone || '+91 00000 00000'}</Text>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity style={[styles.circleBtn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${order?.customerPhone}`)}>
                <Feather name="phone" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circleBtn, { backgroundColor: '#3b82f6' }]} onPress={() => Linking.openURL(`whatsapp://send?phone=91${order?.customerPhone}`)}>
                <Feather name="message-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.addressBox} 
            onPress={() => openMap(`${order?.deliveryAddress?.addressLine1}, ${order?.deliveryAddress?.city}`)}
          >
            <View style={styles.mapIconBox}>
              <Feather name="map" size={18} color="#1e40af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText} numberOfLines={2}>
                {order?.deliveryAddress?.addressLine1}, {order?.deliveryAddress?.city} - {order?.deliveryAddress?.pincode}
              </Text>
              <Text style={styles.mapLinkText}>Tap to open Maps</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Items Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items in this Order</Text>
          {order?.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.unitText}>{item.unit || 'per unit'}</Text>
              </View>
              <Text style={styles.priceText}>₹{item.itemTotal}</Text>
            </View>
          ))}
          
          <View style={styles.billContainer}>
            <View style={styles.billRow}><Text style={styles.billLabel}>Item Total</Text><Text style={styles.billValue}>₹{order?.total}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={[styles.billValue, { color: '#10b981' }]}>FREE</Text></View>
            <View style={[styles.billRow, { marginTop: 10 }]}><Text style={styles.grandTotalLabel}>Grand Total</Text><Text style={styles.grandTotalValue}>₹{order?.total}</Text></View>
          </View>
        </View>

        {/* Order Info */}
        <View style={[styles.card, { backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }]}>
            <Text style={styles.infoText}>Placed on: {format(new Date(order?.createdat), 'PPPP, hh:mm a')}</Text>
            <Text style={styles.infoText}>Payment Method: {order?.paymentMethod || 'Online'}</Text>
        </View>

      </ScrollView>

      {/* Modern Fixed Action Footer */}
      <View style={styles.footer}>
        {order?.status === 'pending' && (
          <View style={styles.footerRow}>
             <TouchableOpacity style={styles.rejectBtn} onPress={() => updateStatus('rejected')}>
                <Text style={styles.rejectBtnText}>Reject</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.acceptBtn} onPress={() => updateStatus('accepted')}>
                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Accept Order</Text>}
             </TouchableOpacity>
          </View>
        )}
        
        {order?.status === 'accepted' && (
          <TouchableOpacity style={styles.fullWidthBtn} onPress={() => updateStatus('ready_for_pickup')}>
            <Feather name="package" size={20} color="#fff" />
            <Text style={[styles.btnText, { marginLeft: 10 }]}>Mark as Ready for Pickup</Text>
          </TouchableOpacity>
        )}
        
        {order?.status === 'ready_for_pickup' && (
          <View style={styles.waitingBox}>
             <ActivityIndicator color="#8b5cf6" size="small" />
             <Text style={styles.waitingText}>Waiting for Delivery Partner to pick up...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusHeader: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  statusCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statusMainText: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  subText: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, padding: 18, borderRadius: 20, elevation: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  customerPhone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  iconRow: { flexDirection: 'row' },
  circleBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  addressBox: { flexDirection: 'row', marginTop: 15, padding: 12, backgroundColor: '#f8fafc', borderRadius: 15, alignItems: 'center' },
  mapIconBox: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 1 },
  addressText: { fontSize: 13, color: '#475569', flex: 1, fontWeight: '500' },
  mapLinkText: { fontSize: 11, color: '#1e40af', fontWeight: 'bold', marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  qtyBadge: { backgroundColor: '#1e293b', width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  productName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  unitText: { fontSize: 12, color: '#94a3b8' },
  priceText: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  billContainer: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { color: '#64748b', fontSize: 14 },
  billValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  grandTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#1e40af' },
  infoText: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  acceptBtn: { flex: 2, height: 55, backgroundColor: '#1e40af', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  rejectBtn: { flex: 1, height: 55, backgroundColor: '#fee2e2', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: 'bold' },
  fullWidthBtn: { height: 55, backgroundColor: '#8b5cf6', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  waitingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
  waitingText: { marginLeft: 10, color: '#8b5cf6', fontWeight: '600' }
});