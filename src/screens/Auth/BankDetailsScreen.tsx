import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Landmark, CreditCard, User, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api'; 

const { width } = Dimensions.get('window');

const BankDetailsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    bankName: '', 
  });

  const handleIFSCChange = async (val: string) => {
    const ifsc = val.toUpperCase();
    setBankInfo({ ...bankInfo, ifsc });

    if (ifsc.length === 11) {
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (response.ok) {
          const data = await response.json();
          setBankInfo(prev => ({ ...prev, ifsc, bankName: data.BANK }));
        }
      } catch (err) {
        console.log("IFSC Fetch Error");
      }
    }
  };

  const handleSave = async () => {
    if (!bankInfo.accountHolder || !bankInfo.accountNumber || !bankInfo.ifsc) {
      Alert.alert("Missing Info", "Kripya sabhi details bharein.");
      return;
    }

    if (bankInfo.accountNumber !== bankInfo.confirmAccountNumber) {
      Alert.alert("Error", "Account numbers do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/seller/update-bank', bankInfo);
      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Bank details updated for weekly settlements!");
        navigation.goBack();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to save bank details";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#001B3A" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Setup</Text>
        <Text style={styles.subtitle}>Sahi details bharein taaki aapka payout bina ruke aap tak pahunche.</Text>
      </View>

      {/* FORM SECTION */}
      <View style={styles.form}>
        
        {/* Account Holder */}
        <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
        <View style={styles.inputWrapper}>
          <User color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="As per bank passbook"
            placeholderTextColor="#cbd5e1"
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
            placeholderTextColor="#cbd5e1"
            maxLength={11}
            autoCapitalize="characters"
            value={bankInfo.ifsc}
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
            placeholder="Enter account number"
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            secureTextEntry
            value={bankInfo.accountNumber}
            onChangeText={(val) => setBankInfo({...bankInfo, accountNumber: val})}
          />
        </View>

        {/* Confirm Account Number */}
        <Text style={styles.label}>CONFIRM ACCOUNT NUMBER</Text>
        <View style={styles.inputWrapper}>
          <ShieldCheck color="#94a3b8" size={20} />
          <TextInput 
            style={styles.input}
            placeholder="Re-enter account number"
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            value={bankInfo.confirmAccountNumber}
            onChangeText={(val) => setBankInfo({...bankInfo, confirmAccountNumber: val})}
          />
        </View>

        {/* SAVE BUTTON */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    shadowColor: '#001B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: '900' }
});

export default BankDetailsScreen;