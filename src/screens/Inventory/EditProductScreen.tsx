import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState<any>(null);
  const [initialPrice, setInitialPrice] = useState<string>('');
  // 1. Fetch Data (Product + Categories)
  // 1. Upar formData ke sath ek originalPrice state bhi rakhein


// fetchData mein price set karein
const fetchData = useCallback(async () => {
  try {
    const [prodRes, catRes] = await Promise.all([
      api.get(`/api/products/${productId}`),
      api.get('/api/categories/all')
    ]);
    const product = prodRes.data.product;
    setFormData(product);
    setInitialPrice(String(product.price)); // Save initial price
    setCategories(catRes.data.categories || []);
  } catch (err) {
    Alert.alert("Error", "Data load nahi ho paya.");
  } finally {
    setLoading(false);
  }
}, [productId]);

// 2. Updated Handle Update Logic
const handleUpdate = async () => {
  if (!formData.name || !formData.price) {
    Alert.alert("Rukiye!", "Naam aur Price zaroori hain.");
    return;
  }

  // Versioning Logic Check
  let updatePayload = { ...formData };
  if (String(formData.price) !== initialPrice) {
    // Agar price badla hai, toh reason puchein (Optional par Pro lagta hai)
    updatePayload.changeReason = "Price updated via Seller App";
  }

  setSaving(true);
  try {
    // Backend service ko call karein (Jo humne ProductService mein banaya tha)
    await api.patch(`/api/products/${productId}`, updatePayload);
    
    Alert.alert("Success ✅", "Product update ho gaya aur history save ho gayi!", [
      { text: "Mast!", onPress: () => navigation.goBack() }
    ]);
  } catch (err) {
    Alert.alert("Update Failed", "Server error. Check inventory.");
  } finally {
    setSaving(false);
  }
};
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Product Image Preview */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: formData.image }} style={styles.productImg} />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageHint}>Web dashboard se photo badlein</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Product Ka Naam</Text>
          <TextInput 
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => setFormData({...formData, name: v})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.price)}
                onChangeText={(v) => setFormData({...formData, price: v})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Stock</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.stock)}
                onChangeText={(v) => setFormData({...formData, stock: v})}
              />
            </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            value={formData.description}
            onChangeText={(v) => setFormData({...formData, description: v})}
          />
<View style={{ flex: 1, marginRight: 10 }}>
  <Text style={styles.label}>Price (₹)</Text>
  <TextInput 
    style={[
      styles.input, 
      String(formData.price) !== initialPrice && { borderColor: '#1e40af', borderWidth: 2 }
    ]}
    keyboardType="numeric"
    value={String(formData.price)}
    onChangeText={(v) => setFormData({...formData, price: v})}
  />
  {/* Price Change Indicator */}
  {String(formData.price) !== initialPrice && (
    <Text style={{ fontSize: 10, color: '#1e40af', marginTop: -15, marginBottom: 10 }}>
      Price change detect hua hai (Versioning ON)
    </Text>
  )}
</View>
          {/* Status Toggle */}
          <View style={styles.statusBox}>
            <View>
              <Text style={styles.statusTitle}>Dukaan mein dikhayein?</Text>
              <Text style={styles.statusSub}>{formData.isActive ? 'Abhi Customer ko dikh raha hai' : 'Abhi chupa hua hai'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, isActive: !formData.isActive})}
              style={[styles.toggle, { backgroundColor: formData.isActive ? '#10b981' : '#cbd5e1' }]}
            >
              <View style={[styles.toggleCircle, { alignSelf: formData.isActive ? 'flex-end' : 'flex-start' }]} />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="save" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 250, backgroundColor: '#f1f5f9' },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  imageOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 5 },
  imageHint: { color: '#fff', fontSize: 10 },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    marginBottom: 20,
    color: '#1e293b'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 12,
    marginTop: 10 
  },
  statusTitle: { fontWeight: 'bold', color: '#1e293b' },
  statusSub: { fontSize: 12, color: '#64748b' },
  toggle: { width: 50, height: 28, borderRadius: 14, padding: 4 },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  saveBtn: { 
    backgroundColor: '#1e40af', 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});