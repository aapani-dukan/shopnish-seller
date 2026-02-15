import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { 
  Store, 
  MapPin, 
  Clock, 
  Tag, 
  ChevronLeft, 
  Save, 
  Info 
} from 'lucide-react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ShopDetailsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // --- States ---
  const [pincodeInput, setPincodeInput] = useState('');
  const [deliveryPincodes, setDeliveryPincodes] = useState<string[]>([]);
  const [isAutoAccept, setIsAutoAccept] = useState(false);

  const [shopInfo, setShopInfo] = useState({
    businessName: '',
    description: '',
    businessAddress: '',
    pincode: '',
    openTime: '09:00 AM',
    closeTime: '10:00 PM',
  });

  // 1. Load Data on Mount
  useEffect(() => {
    if (user) {
      setShopInfo({
        businessName: user.businessName || '',
        description: user.description || '',
        businessAddress: user.businessAddress || '',
        pincode: user.pincode || '',
        openTime: user.openTime || '09:00 AM',
        closeTime: user.closeTime || '10:00 PM',
      });
      
      if (user.deliveryPincodes) {
        setDeliveryPincodes(user.deliveryPincodes);
      }
      
      setIsAutoAccept(user.isAutoAccept || false);
      setInitialLoading(false);
    }
  }, [user]);

  // 2. Pincode Handlers
  const addPincode = () => {
    const code = pincodeInput.trim();
    if (code.length === 6 && !isNaN(Number(code))) {
      if (!deliveryPincodes.includes(code)) {
        setDeliveryPincodes([...deliveryPincodes, code]);
        setPincodeInput('');
      } else {
        Alert.alert("Error", "Ye pincode pehle se juda hua hai.");
      }
    } else {
      Alert.alert("Invalid", "Kripya 6-digit ka sahi pincode dalein.");
    }
  };

  const removePincode = (code: string) => {
    setDeliveryPincodes(deliveryPincodes.filter(item => item !== code));
  };

  // 3. Save Handler
  const handleSave = async () => {
    if (!shopInfo.businessName || !shopInfo.pincode) {
      Alert.alert("Error", "Business Name aur Pincode zaroori hain.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...shopInfo,
        deliveryPincodes,
        isAutoAccept,
      };

      await api.patch(`/api/sellers/update-profile/${user.id}`, payload);
      
      Alert.alert("Success ✅", "Shop details updated successfully!", [
        { text: "Mast!", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Update fail ho gaya.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Reusable Input Component
  const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
        <Icon color="#64748b" size={20} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#cbd5e1"
          multiline={multiline}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#001B3A" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Loading Shop Data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#001B3A" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. BASIC INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InputField 
              label="BUSINESS NAME" 
              icon={Store} 
              value={shopInfo.businessName}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, businessName: txt})}
              placeholder="e.g. Royal Fresh Mart"
            />
            <InputField 
              label="SHOP DESCRIPTION" 
              icon={Info} 
              value={shopInfo.description}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, description: txt})}
              placeholder="Tell customers about your items..."
              multiline={true}
            />
          </View>

          {/* 2. LOCATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <InputField 
              label="FULL ADDRESS" 
              icon={MapPin} 
              value={shopInfo.businessAddress}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, businessAddress: txt})}
              placeholder="Shop No, Street, Landmark..."
              multiline={true}
            />
            <InputField 
              label="MY PINCODE" 
              icon={MapPin} 
              value={shopInfo.pincode}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, pincode: txt})}
              placeholder="323001"
              keyboardType="numeric"
            />
          </View>

          {/* 3. DELIVERY PINCODES (Tag System) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Areas (Pincodes)</Text>
            <View style={styles.pincodeInputRow}>
              <TextInput
                style={styles.pincodeInput}
                value={pincodeInput}
                onChangeText={setPincodeInput}
                placeholder="Type Pincode"
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addPincode}>
                <Text style={styles.addBtnText}>Add Area</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {deliveryPincodes.map((code) => (
                <View key={code} style={styles.tag}>
                  <Text style={styles.tagText}>{code}</Text>
                  <TouchableOpacity onPress={() => removePincode(code)}>
                    <Feather name="x" size={14} color="#1e40af" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* 4. TIMINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <InputField label="OPENING" icon={Clock} value={shopInfo.openTime} placeholder="09:00 AM" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <InputField label="CLOSING" icon={Clock} value={shopInfo.closeTime} placeholder="10:00 PM" />
              </View>
            </View>
          </View>

          {/* 5. SHOP SETTINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Settings</Text>
            <View style={styles.settingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Auto-Accept Orders</Text>
                <Text style={styles.settingSub}>Accept orders without manual review</Text>
              </View>
              <Switch 
                value={isAutoAccept} 
                onValueChange={setIsAutoAccept}
                trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              />
            </View>
          </View>

          {/* 6. SAVE BUTTON */}
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save color="white" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.saveBtnText}>Save All Changes</Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#001B3A' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#64748b', letterSpacing: 1.2, marginBottom: 18, textTransform: 'uppercase' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 15,
    height: 58,
  },
  textAreaWrapper: { height: 110, alignItems: 'flex-start', paddingTop: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
  textArea: { height: '100%' },
  row: { flexDirection: 'row' },
  pincodeInputRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    paddingRight: 8,
    alignItems: 'center',
    height: 58
  },
  pincodeInput: { flex: 1, height: '100%', paddingHorizontal: 15, fontWeight: '700', fontSize: 16 },
  addBtn: { backgroundColor: '#001B3A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    marginRight: 10, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  tagText: { color: '#1e40af', fontWeight: '800', fontSize: 14 },
  settingCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 22, 
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  settingTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  settingSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  saveBtn: { 
    backgroundColor: '#001B3A', 
    height: 65, 
    borderRadius: 20, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
    shadowColor: '#001B3A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 19, fontWeight: '900' }
});

export default ShopDetailsScreen;