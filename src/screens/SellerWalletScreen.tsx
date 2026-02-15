import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import api from '../services/api'; 
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Info, Landmark, ChevronRight } from 'lucide-react-native';
import { getNextSettlementDate } from '../services/settlementService';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SellerWallet = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingAmount: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const nextPayoutDate = getNextSettlementDate();
  const navigation = useNavigation<any>();

  const fetchWalletData = useCallback(async () => {
    try {
      // ✅ Backend route: /api/wallet/my-wallet
      const response = await api.get('/api/wallet/my-wallet');
      
      setWalletData({
        balance: response.data.balance || 0,
        pendingAmount: response.data.pendingAmount || 0,
        transactions: response.data.transactions || []
      });
    } catch (error: any) {
      console.error("❌ Wallet Sync Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#001B3A" />
      <Text style={{ marginTop: 10, color: '#64748b' }}>Hisaab load ho raha hai...</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#001B3A" />}
    >
      {/* 💳 PREMIUM WALLET CARD */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.cardAmount}>₹{Number(walletData.balance).toLocaleString('en-IN')}</Text>
            
            {/* 🔥 Pending Amount Logic */}
            <View style={styles.pendingContainer}>
              <Clock color="#94a3b8" size={12} />
              <Text style={styles.pendingText}>
                Processing: ₹{Number(walletData.pendingAmount).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.iconContainer}>
            <Wallet color="white" size={28} strokeWidth={2} />
          </View>
        </View>
        
        <View style={styles.statusBadge}>
          <Clock color="#D4AF37" size={14} />
          <Text style={styles.statusText}>Settlements: Every Monday</Text>
        </View>
      </View>

      {/* 🗓️ SETTLEMENT INFO BOX */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Info color="#0369A1" size={18} />
            <Text style={styles.infoTitle}>Settlement Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BankDetails')} style={styles.manageBtn}>
            <Landmark color="#0369A1" size={12} />
            <Text style={styles.manageText}>BANK SETTINGS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoDesc}>
          Delivered orders ka paisa 7 din ke return period ke baad automatic transfer hota hai.
        </Text>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.payoutRow} onPress={() => navigation.navigate('BankDetails')}>
          <View>
            <Text style={styles.payoutLabel}>NEXT PAYOUT DATE</Text>
            <Text style={styles.payoutDate}>{nextPayoutDate}</Text>
          </View>
          <ChevronRight color="#0369A1" size={24} />
        </TouchableOpacity>
      </View>

      {/* 📊 TRANSACTIONS */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Activity</Text>
        <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
      </View>
      
      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {walletData.transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Koi transaction nahi mili.</Text>
          </View>
        ) : (
          walletData.transactions.map((tx: any) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* ✅ Type check matching backend: 'credit' or 'debit' */}
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#f0fdf4' : '#fef2f2' }]}>
                  {tx.type === 'credit' ? <ArrowUpRight color="#16a34a" size={20} /> : <ArrowDownLeft color="#dc2626" size={20} />}
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.purpose}</Text>
                  <Text style={styles.txDate}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#16a34a' : '#dc2626' }]}>
                {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainCard: { backgroundColor: '#001B3A', margin: 20, padding: 30, borderRadius: 30, elevation: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  cardAmount: { color: 'white', fontSize: 34, fontWeight: '900', marginTop: 5 },
  pendingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pendingText: { color: '#94a3b8', fontSize: 12, marginLeft: 6, fontWeight: '600' },
  iconContainer: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 100, marginTop: 10 },
  statusText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  infoBox: { marginHorizontal: 20, marginBottom: 25, backgroundColor: '#eff6ff', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#dbeafe' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoTitle: { color: '#1e3a8a', fontWeight: '800', marginLeft: 8, fontSize: 14 },
  manageBtn: { backgroundColor: 'rgba(3, 105, 161, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  manageText: { color: '#0369a1', fontSize: 10, fontWeight: '900', marginLeft: 5 },
  infoDesc: { color: '#64748b', fontSize: 12, lineHeight: 18, marginBottom: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#dbeafe', marginVertical: 12 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { color: '#1e3a8a', fontSize: 10, fontWeight: '700', opacity: 0.6 },
  payoutDate: { color: '#1e3a8a', fontSize: 18, fontWeight: '900' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  historyTitle: { fontSize: 20, fontWeight: '900', color: '#001B3A' },
  viewAll: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  txItem: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2, marginHorizontal: 2 },
  txIcon: { padding: 10, borderRadius: 15 },
  txDesc: { color: '#1e293b', fontWeight: '700', fontSize: 14 },
  txDate: { color: '#94a3b8', fontSize: 10, fontWeight: '600', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '900' },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }
});

export default SellerWallet;