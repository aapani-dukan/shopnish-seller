import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, Image, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../../services/api';

export default function AddProductScreen({ navigation }: any) {
  const [mode, setMode] = useState<'catalog' | 'manual'>('catalog');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [masterProducts, setMasterProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState<any>({});
  const [image, setImage] = useState<string | null>(null);

  // Manual Form State
  const [manualData, setManualData] = useState({
    name: '', price: '', stock: '', description: '', categoryId: ''
  });

  // 1. Catalog Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 2) fetchMasterProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchMasterProducts = async () => {
    try {
      const res = await api.get(`/api/products/master-search?q=${searchTerm}`);
      setMasterProducts(res.data);
    } catch (err) { console.log(err); }
  };

  // 2. Catalog Selection Logic
  const toggleItem = (item: any) => {
    const newItems = { ...selectedItems };
    if (newItems[item.id]) {
      delete newItems[item.id];
    } else {
      newItems[item.id] = { ...item, price: '', stock: '10' };
    }
    setSelectedItems(newItems);
  };

  // 3. Image Picker for Manual Mode
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (response.assets && response.assets[0].uri) {
        setImage(response.assets[0].uri);
      }
    });
  };

  // 4. Submit Logic
  const handleAddProducts = async () => {
    setLoading(true);
    try {
      if (mode === 'catalog') {
        const payload = Object.values(selectedItems).map((item: any) => ({
          masterProductId: item.id,
          name: item.name,
          image: item.image,
          categoryId: item.categoryId,
          price: Number(item.price),
          stock: Number(item.stock),
        }));
        await api.post('/api/products/bulk', { products: payload });
      } else {
        // Manual upload logic (Cloudinary etc.)
        await api.post('/api/products', { ...manualData, image });
      }
      Alert.alert("Success", "Products aapki dukaan mein jud gaye hain!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Kuch galat hua, phir se try karein.");
    } finally {
      setLoading(false);
    }
  };

  const renderMasterItem = ({ item }: any) => {
    const isSelected = !!selectedItems[item.id];
    return (
      <View style={[styles.itemCard, isSelected && styles.selectedCard]}>
        <View style={styles.itemMain}>
          <Image source={{ uri: item.image }} style={styles.itemImg} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemBrand}>{item.brand || 'No Brand'}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleItem(item)}>
            <Feather name={isSelected ? "check-circle" : "plus-circle"} size={28} color={isSelected ? "#10b981" : "#1e40af"} />
          </TouchableOpacity>
        </View>
        
        {isSelected && (
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.smallInput} 
              placeholder="Price ₹" 
              keyboardType="numeric" 
              onChangeText={(txt) => setSelectedItems({...selectedItems, [item.id]: {...selectedItems[item.id], price: txt}})}
            />
            <TextInput 
              style={styles.smallInput} 
              placeholder="Stock" 
              keyboardType="numeric"
              onChangeText={(txt) => setSelectedItems({...selectedItems, [item.id]: {...selectedItems[item.id], stock: txt}})}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mode Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, mode === 'catalog' && styles.activeTab]} onPress={() => setMode('catalog')}>
          <Text style={[styles.tabText, mode === 'catalog' && styles.activeTabText]}>Catalog Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'manual' && styles.activeTab]} onPress={() => setMode('manual')}>
          <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual Add</Text>
        </TouchableOpacity>
      </View>

      {mode === 'catalog' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput 
              placeholder="Product ka naam likhein..." 
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <FlatList 
            data={masterProducts}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={renderMasterItem}
            contentContainerStyle={{ padding: 15 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Items khojne ke liye type karein...</Text>}
          />
        </View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.previewImg} /> : <Feather name="camera" size={40} color="#94a3b8" />}
            <Text style={{ color: '#94a3b8', marginTop: 10 }}>Product Photo Upload Karein</Text>
          </TouchableOpacity>
          <TextInput placeholder="Product Name" style={styles.input} onChangeText={(v) => setManualData({...manualData, name: v})} />
          <TextInput placeholder="Description" multiline style={[styles.input, { height: 100 }]} onChangeText={(v) => setManualData({...manualData, description: v})} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput placeholder="Price ₹" keyboardType="numeric" style={[styles.input, { width: '48%' }]} onChangeText={(v) => setManualData({...manualData, price: v})} />
            <TextInput placeholder="Stock" keyboardType="numeric" style={[styles.input, { width: '48%' }]} onChangeText={(v) => setManualData({...manualData, stock: v})} />
          </View>
        </ScrollView>
      )}

      <TouchableOpacity 
        style={[styles.submitBtn, (mode === 'catalog' && Object.keys(selectedItems).length === 0) && { backgroundColor: '#cbd5e1' }]} 
        onPress={handleAddProducts}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm & Add to Shop</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, margin: 15, borderRadius: 10, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#1e40af' },
  tabText: { fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, height: 50, marginLeft: 10 },
  itemCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  selectedCard: { borderColor: '#1e40af', backgroundColor: '#eff6ff' },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  itemImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f1f5f9' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  itemBrand: { fontSize: 12, color: '#1e40af', fontWeight: '600' },
  inputRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  smallInput: { flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  imagePicker: { height: 180, backgroundColor: '#fff', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  previewImg: { width: '100%', height: '100%', borderRadius: 15 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  submitBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#1e40af', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' }
});