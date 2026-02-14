import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  FileText, 
  ShieldCheck, 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle,
  Hash
} from 'lucide-react-native';
import api from '../../services/api';

const TaxInfoScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [taxInfo, setTaxInfo] = useState({
    panNumber: '',
    gstNumber: '',
    businessType: 'Proprietorship', // Default value
  });

  const handleSave = async () => {
    // Basic Validation
    if (taxInfo.panNumber.length < 10) {
      Alert.alert("Invalid PAN", "Kripya 10-digit ka sahi PAN number bharein.");
      return;
    }

    setLoading(true);
    try {
      // API Call Placeholder
      // await api.put('/api/sellers/update-tax', taxInfo);
      
      setTimeout(() => {
        Alert.alert("Success", "Tax & GST details submitted for verification! ✅");
        setLoading(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      Alert.alert("Error", "Failed to save details.");
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Tax & GST Info</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* SECURITY BADGE */}
          <View style={styles.securityBanner}>
            <ShieldCheck color="#10b981" size={24} />
            <Text style={styles.securityText}>
              Aapka Tax data encrypted hai aur sirf compliance ke liye use kiya jayega.
            </Text>
          </View>

          {/* PAN CARD SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Tax Details</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PERMANENT ACCOUNT NUMBER (PAN)</Text>
              <View style={styles.inputWrapper}>
                <FileText color="#64748b" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={taxInfo.panNumber}
                  onChangeText={(txt) => setTaxInfo({...taxInfo, panNumber: txt.toUpperCase()})}
                  placeholder="ABCDE1234F"
                  placeholderTextColor="#cbd5e1"
                  maxLength={10}
                  autoCapitalize="characters"
                />
                {taxInfo.panNumber.length === 10 && (
                  <CheckCircle2 color="#10b981" size={20} />
                )}
              </View>
              <Text style={styles.helperText}>10-digit Alphanumeric code printed on PAN card.</Text>
            </View>
          </View>

          {/* GST SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goods & Services Tax</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>GSTIN (OPTIONAL)</Text>
              <View style={styles.inputWrapper}>
                <Hash color="#64748b" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={taxInfo.gstNumber}
                  onChangeText={(txt) => setTaxInfo({...taxInfo, gstNumber: txt.toUpperCase()})}
                  placeholder="08AAAAA0000A1Z5"
                  placeholderTextColor="#cbd5e1"
                  maxLength={15}
                  autoCapitalize="characters"
                />
              </View>
              <Text style={styles.helperText}>GSTIN is required for inter-state sales and claiming ITC.</Text>
            </View>
          </View>

          {/* COMPLIANCE NOTE */}
          <View style={styles.noteBox}>
            <AlertCircle color="#f59e0b" size={20} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.noteTitle}>Important Note</Text>
              <Text style={styles.noteText}>
                Galat details bharne par payouts hold kiye ja sakte hain. Kripya apne legal documents se match karke hi bharein.
              </Text>
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
              <Text style={styles.saveBtnText}>Verify & Save Details</Text>
            )}
          </TouchableOpacity>
          
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#001B3A' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 25 },
  securityBanner: { 
    flexDirection: 'row', 
    backgroundColor: '#ecfdf5', 
    padding: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    marginBottom: 30
  },
  securityText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#065f46', fontWeight: '500', lineHeight: 18 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#f1f5f9', 
    paddingHorizontal: 15,
    height: 60
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b', letterSpacing: 1 },
  helperText: { fontSize: 12, color: '#94a3b8', marginTop: 8, marginLeft: 4 },
  noteBox: { 
    flexDirection: 'row', 
    backgroundColor: '#fffbeb', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#fef3c7',
    marginBottom: 40
  },
  noteTitle: { fontSize: 14, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#b45309', lineHeight: 18, fontWeight: '500' },
  saveBtn: { 
    backgroundColor: '#001B3A', 
    height: 65, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#001B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default TaxInfoScreen;