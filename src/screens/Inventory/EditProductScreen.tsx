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

  // 1. Fetch Data (Product + Categories)
  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/api/products/${productId}`),
        api.get('/api/categories/all')
      ]);
      setFormData(prodRes.data.product);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      Alert.alert("Error", "Data load karne mein dikkat aayi.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 2. Submit Logic
  const handleUpdate = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert("Rukiye!", "Naam aur Price bharna zaroori hai.");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/products/${productId}`, formData);
      Alert.alert("Success", "Product update ho gaya!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert("Update Failed", "Server par data save nahi ho paya.");
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

          {/* Status Toggle */}
          <View style={styles.statusBox}>
            <View>
              <Text style={styles.statusTitle}>Dukaan mein dikhayein?</Text>
              <Text style={styles.statusSub}>{formData.isactive ? 'Abhi Customer ko dikh raha hai' : 'Abhi chupa hua hai'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, isactive: !formData.isactive})}
              style={[styles.toggle, { backgroundColor: formData.isactive ? '#10b981' : '#cbd5e1' }]}
            >
              <View style={[styles.toggleCircle, { alignSelf: formData.isactive ? 'flex-end' : 'flex-start' }]} />
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