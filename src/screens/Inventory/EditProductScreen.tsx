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
    setLoading(true);
    const response = await api.get(`/api/products/${productId}`);

    // ✅ Fix 1: Wrap Check
    // Agar data seedha object hai (formatProductWithOffers ki wajah se), 
    // toh use hi formData bana do.
    const productData = response.data.product ? response.data.product : response.data;

    if (productData && productData.id) {
      setFormData(productData);
      setInitialPrice(String(productData.price || '0'));
    } else {
      // Agar yahan 200 OK aaya par data khali hai
      Alert.alert("Data Error", "Product ki jankari sahi format mein nahi mili.");
    }
  } catch (err: any) {
    // ✅ Fix 2: 404 Handle
    if (err.response?.status === 404) {
      Alert.alert(
        "Product Not Found (404)", 
        "Ya toh ID galat hai, ya product abhi Approved nahi hai (Backend logic)."
      );
    }
  } finally {
    setLoading(false);
  }
}, [productId]);

useEffect(() => {
  if (productId) {
    fetchData();
  }
}, [fetchData, productId]);
// 2. Updated Handle Update Logic

  const handleUpdate = async () => {
  if (!formData?.name || !formData?.price) {
    Alert.alert("Rukiye!", "Naam aur Price zaroori hain.");
    return;
  }

  setSaving(true);
  try {
    // 1. Destructure karke faltu fields ko bahar nikaal dein
    // category, version aur timestamps ko database update mein nahi bhejte
    const { 
      category, 
      version, 
      createdAt, 
      updatedAt, 
      id, 
      _id,
      ...rawPayload 
    } = formData;

    // 2. Final Payload taiyar karein
    let updatePayload = {
      ...rawPayload,
      price: String(formData.price), // Ensure string format
      stock: Number(formData.stock), // Ensure number format
    };

    // 3. Versioning Logic (Price change check)
    if (String(formData.price) !== initialPrice) {
      updatePayload.changeReason = "Price updated via Seller App";
      // Agar aapka backend 'version' field auto-increment karta hai toh use yahan mat bhejo
    }

    console.log("🚀 Sending Clean Payload:", updatePayload);

    // 4. API Call
    await api.patch(`/api/sellers/products/${productId}`, updatePayload);
    
    Alert.alert("Success ✅", "Product update ho gaya!", [
      { text: "Mast!", onPress: () => navigation.goBack() }
    ]);
  } catch (err: any) {
    console.error("Update Error Details:", err.response?.data || err.message);
    
    const errorMsg = err.response?.data?.message || "Server error. Details check karein.";
    Alert.alert("Update Failed ❌", errorMsg);
  } finally {
    setSaving(false);
  }
};
  // Agar loading ho rahi hai YA formData abhi tak null hai, toh gola dikhao
if (loading || !formData) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={{ marginTop: 10 }}>Data load ho raha hai...</Text>
    </View>
  );
}

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Product Image Preview - Safety added with formData && */}
<View style={styles.imageContainer}>
  {formData && (
    <Image 
      source={{ 
        uri: formData?.image 
          ? encodeURI(formData?.image.trim()) 
          : 'https://via.placeholder.com/150.png' 
      }} 
      style={styles.productImg} 
    />
  )}
  <View style={styles.imageOverlay}>
    <Text style={styles.imageHint}>Web dashboard se photo badlein</Text>
  </View>
</View>
     
        <View style={styles.form}>
          <Text style={styles.label}>Product Ka Naam</Text>
          <TextInput 
            style={styles.input}
            value={formData?.name}
            onChangeText={(v) => setFormData({...formData, name: v})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={String(formData?.price)}
                onChangeText={(v) => setFormData({...formData, price: v})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Stock</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={String(formData?.stock)}
                onChangeText={(v) => setFormData({...formData, stock: v})}
              />
            </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            value={formData?.description}
            onChangeText={(v) => setFormData({...formData, description: v})}
          />
<View style={{ flex: 1, marginRight: 10 }}>
  <Text style={styles.label}>Price (₹)</Text>
  <TextInput 
    style={[
      styles.input, 
      String(formData?.price) !== initialPrice && { borderColor: '#1e40af', borderWidth: 2 }
    ]}
    keyboardType="numeric"
    value={String(formData.price)}
    onChangeText={(v) => setFormData({...formData, price: v})}
  />
  {/* Price Change Indicator */}
  {String(formData?.price) !== initialPrice && (
    <Text style={{ fontSize: 10, color: '#1e40af', marginTop: -15, marginBottom: 10 }}>
      Price change detect hua hai (Versioning ON)
    </Text>
  )}
</View>
          {/* Status Toggle */}
          <View style={styles.statusBox}>
            <View>
              <Text style={styles.statusTitle}>Dukaan mein dikhayein?</Text>
              <Text style={styles.statusSub}>{formData?.isActive ? 'Abhi Customer ko dikh raha hai' : 'Abhi chupa hua hai'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, isActive: !formData?.isActive})}
              style={[styles.toggle, { backgroundColor: formData.isActive ? '#10b981' : '#cbd5e1' }]}
            >
              <View style={[styles.toggleCircle, { alignSelf: formData?.isActive ? 'flex-end' : 'flex-start' }]} />
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