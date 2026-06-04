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


// 🎯 फिक्स 1: डेटाबेस से वैरिएंट्स का डेटा निकालकर स्टेट में बाइंड करना भाई
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await api.get(`/api/products/${productId}`);
    const productData = response.data.product ? response.data.product : response.data;

    if (productData && productData.id) {
      // पहले वैरिएंट को बेस वैरिएंट मानकर डेटा निकालो भाई
      const baseVariant = productData.variants?.[0] || { price: 0, stock: 0, id: null };

      setFormData({
        ...productData,
        // यूआई के लिए फ्लैट कीज बना दी भाई
        price: baseVariant.price || '0',
        stock: baseVariant.stock || 0,
        variantId: baseVariant.id // इसे अपडेट के समय भेजना होगा भाई
      });
      setInitialPrice(String(baseVariant.price || '0'));
    } else {
      Alert.alert("Data Error", "Product ki jankari sahi format mein nahi mili.");
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      Alert.alert(
        "Product Not Found (404)", 
        "Ya toh ID galat hai, ya product abhi Approved nahi hai भाई।"
      );
    }
  } finally {
    setLoading(false);
  }
}, [productId]);
// 2. Updated Handle Update Logic

 // 🎯 फिक्स 2: नए वैरिएंट-अवेयर पैच एंडपॉइंट के हिसाब से पेलोड पैक करना भाई
const handleUpdate = async () => {
  if (!formData?.name || !formData?.price) {
    Alert.alert("Rukiye!", "Naam aur Price zaroori hain.");
    return;
  }

  setSaving(true);
  try {
    const { 
      category, 
      variants, // पुराने वैरिएंट्स लिस्ट को हटा दो भाई
      createdAt, 
      updatedAt, 
      id, 
      _id,
      ...rawPayload 
    } = formData;

    // 🗺️ यह है बैकएंड का असली वॉटरप्रूफ पेलोड रास्ता भाई:
    let updatePayload = {
      ...rawPayload,
      variantId: formData.variantId, // 👈 यह है तिजोरी की असली चाबी भाई!
      price: Number(formData.price), // बैकएंड नंबर एक्सेप्ट करता है
      stock: Number(formData.stock), 
    };

    if (String(formData.price) !== initialPrice) {
      updatePayload.changeReason = "Price updated via Seller App";
    }

    console.log("🚀 Sending Variant-Aware Clean Payload:", updatePayload);

    // आपके सुधरे हुए कंट्रोलर एंडपॉइंट पर हिट मारो भाई
    await api.patch(`/api/products/${productId}`, updatePayload);
    
    Alert.alert("Success ✅", "Product update ho gaya hai भाई!", [
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
     
       
{/* 🎯 फिक्स 3: डुप्लीकेट हटाकर एकदम साफ़ सुथरा इनपुट फॉर्म भाई */}
        <View style={styles.form}>
          <Text style={styles.label}>Product Ka Naam</Text>
          <TextInput 
            style={styles.input}
            value={formData?.name}
            onChangeText={(v) => setFormData({...formData, name: v})}
          />

          <View style={styles.row}>
            {/* प्राइस इनपुट ब्लॉक (वर्जनिंग बॉर्डर इंडिकेटर के साथ भाई) */}
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput 
                style={[
                  styles.input, 
                  String(formData?.price) !== initialPrice && { borderColor: '#1e40af', borderWidth: 2 }
                ]}
                keyboardType="numeric"
                value={String(formData?.price || '')}
                onChangeText={(v) => setFormData({...formData, price: v})}
              />
            </View>
            
            {/* स्टॉक इनपुट ब्लॉक */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Stock</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={String(formData?.stock ?? '0')}
                onChangeText={(v) => setFormData({...formData, stock: v})}
              />
            </View>
          </View>

          {/* Price Change Warning Message */}
          {String(formData?.price) !== initialPrice && (
            <Text style={{ fontSize: 11, color: '#1e40af', marginTop: -10, marginBottom: 15, fontWeight: '700' }}>
              ⚠️ Price change detect hua hai (Versioning ON भाई)
            </Text>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            value={formData?.description}
            onChangeText={(v) => setFormData({...formData, description: v})}
          />

          {/* Status Toggle */}
          <View style={styles.statusBox}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.statusTitle}>Dukaan mein dikhayein?</Text>
              <Text style={styles.statusSub}>{formData?.isActive ? 'Abhi Customer ko dikh raha hai' : 'Abhi chupa hua hai'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, isActive: !formData?.isActive})}
              style={[styles.toggle, { backgroundColor: formData?.isActive ? '#10b981' : '#cbd5e1' }]}
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