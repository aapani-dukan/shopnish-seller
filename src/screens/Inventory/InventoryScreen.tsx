import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';

export default function InventoryScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products/seller');
      setProducts(response.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const deleteProduct = (id: string) => {
    Alert.alert(
      "Confirm Delete", 
      "Kya aap is product ko hatana chahte hain?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await api.delete(`/api/products/${id}`);
            fetchProducts();
          } 
        }
      ]
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProduct = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.img} />
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
        
        <View style={styles.stockRow}>
          <View style={[styles.stockBadge, { backgroundColor: item.stock > 5 ? '#ecfdf5' : '#fef2f2' }]}>
            <Text style={[styles.stockText, { color: item.stock > 5 ? '#059669' : '#dc2626' }]}>
              Stock: {item.stock}
            </Text>
          </View>
          <Text style={styles.statusBadge}>{item.approvalstatus === 'approved' ? '✅ Live' : '⏳ Pending'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
        >
          <Feather name="edit-2" size={18} color="#1e40af" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { marginTop: 10 }]} 
          onPress={() => deleteProduct(item.id)}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Dukaan Ka Stock</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Product ka naam khojein..." 
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList 
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>Koi product nahi mila</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#fff' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  addBtn: { 
    backgroundColor: '#1e40af', 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  addBtnText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    margin: 15, 
    paddingHorizontal: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  searchInput: { flex: 1, height: 45, marginLeft: 10 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 12, 
    marginBottom: 15, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05 
  },
  img: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9' },
  info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  price: { fontSize: 15, color: '#1e40af', fontWeight: '700', marginTop: 4 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  stockText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  actions: { justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#f1f5f9', paddingLeft: 12 },
  actionBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 16 }
});