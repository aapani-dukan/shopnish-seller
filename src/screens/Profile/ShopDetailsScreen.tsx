import React, { useState } from 'react';
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
} from 'react-native';
import { 
  Store, 
  MapPin, 
  Clock, 
  Tag, 
  ChevronLeft, 
  Save, 
  Info,
  ChevronRight
} from 'lucide-react-native';
import api from '../../services/api';

const ShopDetailsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [isAutoAccept, setIsAutoAccept] = useState(false);

  // Form States
  const [shopInfo, setShopInfo] = useState({
    businessName: '',
    category: '',
    description: '',
    address: '',
    pincode: '',
    openTime: '09:00 AM',
    closeTime: '10:00 PM',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // यहाँ आपका API कॉल आएगा
      // const response = await api.put('/api/sellers/update-profile', shopInfo);
      
      setTimeout(() => {
        Alert.alert("Success", "Shop details updated successfully! ✨");
        setLoading(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      Alert.alert("Error", "Failed to update details.");
      setLoading(false);
    }
  };

  const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, multiline = false }: any) => (
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
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
    >
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
          {/* BASIC INFO SECTION */}
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
              label="CATEGORY" 
              icon={Tag} 
              value={shopInfo.category}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, category: txt})}
              placeholder="e.g. Grocery, Bakery"
            />
            <InputField 
              label="SHOP DESCRIPTION" 
              icon={Info} 
              value={shopInfo.description}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, description: txt})}
              placeholder="Tell customers about your shop..."
              multiline={true}
            />
          </View>

          {/* LOCATION SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <InputField 
              label="FULL ADDRESS" 
              icon={MapPin} 
              value={shopInfo.address}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, address: txt})}
              placeholder="Shop No, Building, Street..."
              multiline={true}
            />
            <InputField 
              label="PINCODE" 
              icon={MapPin} 
              value={shopInfo.pincode}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, pincode: txt})}
              placeholder="323001"
            />
          </View>

          {/* TIMINGS SECTION */}
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

          {/* SETTINGS SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Settings</Text>
            <View style={styles.settingCard}>
              <View>
                <Text style={styles.settingTitle}>Auto-Accept Orders</Text>
                <Text style={styles.settingSub}>Automatically accept incoming orders</Text>
              </View>
              <Switch 
                value={isAutoAccept} 
                onValueChange={setIsAutoAccept}
                trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              />
            </View>
          </View>

          {/* SAVE BUTTON */}
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
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#001B3A' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 15,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  textAreaWrapper: { height: 100, alignItems: 'flex-start', paddingTop: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b' },
  textArea: { textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  settingCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  settingSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  saveBtn: { 
    backgroundColor: '#001B3A', 
    height: 60, 
    borderRadius: 18, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#001B3A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default ShopDetailsScreen;