import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Landmark, CreditCard, User, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api'; 
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const BankDetailsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [bankInfo, setBankInfo] = useState({
    accountHolder: '', // Note: Iske liye schema mein column hona chahiye
    bankAccountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '', 
  });

  // 1. Purani details load karein
  useEffect(() => {
    if (user) {
      setBankInfo({
        ...bankInfo,
        bankAccountNumber: user.bankAccountNumber || '',
        confirmAccountNumber: user.bankAccountNumber || '',
        ifscCode: user.ifscCode || '',
      });
      setInitialLoading(false);
    }
  }, [user]);

  const handleIFSCChange = async (val: string) => {
    const ifsc = val.toUpperCase();
    setBankInfo({ ...bankInfo, ifscCode: ifsc });

    if (ifsc.length === 11) {
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (response.ok) {
          const data = await response.json();
          setBankInfo(prev => ({ ...prev, bankName: data.BANK }));
        }
      } catch (err) {
        setBankInfo(prev => ({ ...prev, bankName: '' }));
      }
    }
  };

  const handleSave = async () => {
    if (!bankInfo.bankAccountNumber || !bankInfo.ifscCode) {
      Alert.alert("Missing Info", "Account Number aur IFSC Code zaroori hain.");
      return;
    }

    if (bankInfo.bankAccountNumber !== bankInfo.confirmAccountNumber) {
      Alert.alert("Error", "Account numbers match nahi ho rahe hain!");
      return;
    }

    setLoading(true);
    try {
      // ✅ Schema ke hisaab se payload
      const payload = {
        bankAccountNumber: bankInfo.bankAccountNumber,
        ifscCode: bankInfo.ifscCode,
      };

      // ✅ Update via profile endpoint
      await api.patch(`/api/sellers/update-profile/${user.id}`, payload);
      
      Alert.alert("Success ✅", "Bank details settlement ke liye save ho gayi hain!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save bank details");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#001B3A" /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#001B3A" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Setup</Text>
        <Text style={styles.subtitle}>Payouts seedha aapke isi account mein transfer kiye jayenge.</Text>
      </View>

      <View style={styles.form}>
        {/* Account Holder */}
        <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
        <View style={styles.inputWrapper}>
          <User color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="Passbook ke hisaab se naam"
            value={bankInfo.accountHolder}
            onChangeText={(val) => setBankInfo({...bankInfo, accountHolder: val})}
          />
        </View>

        {/* IFSC Code */}
        <Text style={styles.label}>IFSC CODE</Text>
        <View style={styles.inputWrapper}>
          <Landmark color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="SBIN0001234"
            maxLength={11}
            autoCapitalize="characters"
            value={bankInfo.ifscCode}
            onChangeText={handleIFSCChange}
          />
        </View>
        {bankInfo.bankName && <Text style={styles.bankTag}>✓ {bankInfo.bankName}</Text>}

        {/* Account Number */}
        <Text style={styles.label}>ACCOUNT NUMBER</Text>
        <View style={styles.inputWrapper}>
          <CreditCard color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="Bank account number dalein"
            keyboardType="number-pad"
            secureTextEntry // Suraksha ke liye hide rakhein
            value={bankInfo.bankAccountNumber}
            onChangeText={(val) => setBankInfo({...bankInfo, bankAccountNumber: val})}
          />
        </View>

        {/* Confirm Account Number */}
        <Text style={styles.label}>CONFIRM ACCOUNT NUMBER</Text>
        <View style={styles.inputWrapper}>
          <ShieldCheck color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="Account number dobara dalein"
            keyboardType="number-pad"
            value={bankInfo.confirmAccountNumber}
            onChangeText={(val) => setBankInfo({...bankInfo, confirmAccountNumber: val})}
          />
        </View>

        <TouchableOpacity 
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveBtn, loading && { backgroundColor: '#94a3b8' }]}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <Text style={styles.saveBtnText}>Save Bank Details</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Styles same rahenge, bas 'center' jodh diya Loading ke liye
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, paddingTop: 40 },
  backBtn: { marginBottom: 15, marginLeft: -5 },
  title: { fontSize: 32, fontWeight: '900', color: '#001B3A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 22, fontWeight: '500' },
  form: { paddingHorizontal: 25 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8, marginTop: 22 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1.5, 
    borderColor: '#f1f5f9', 
    paddingHorizontal: 15, 
    borderRadius: 18,
    height: 60
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#1e293b' },
  bankTag: { color: '#16a34a', fontWeight: '800', fontSize: 12, marginTop: 8, marginLeft: 5 },
  saveBtn: { 
    marginTop: 40, 
    backgroundColor: '#001B3A', 
    height: 65, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: '900' }
});

export default BankDetailsScreen;