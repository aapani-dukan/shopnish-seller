import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import auth  from '../lib/firebase'; // आपका Firebase Config
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react-native';
//import { styled } from 'nativewind';

// styled हटा दें, इसकी ज़रूरत नहीं है अगर v4 सही से सेटअप है
const SellerWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
//const StyledScrollView = styled(ScrollView);
//const StyledView = styled(View);
//const StyledText = styled(Text);
  const fetchWalletData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      
      // बैकएंड से डेटा लाना
      const response = await fetch('https://shopnish.com/api/wallet/my-wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Wallet Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  if (loading) return <ActivityIndicator size="large" color="#000" style={{flex: 1}} />;

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 💳 MAIN WALLET CARD */}
      <View className="bg-black m-4 p-6 rounded-[30px] shadow-xl">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-400 font-medium">Available Balance</Text>
          <Wallet color="white" size={20} />
        </View>
        <Text className="text-white text-4xl font-black">₹{Number(balance).toFixed(2)}</Text>
        
        <TouchableOpacity className="mt-6 bg-white/20 p-4 rounded-2xl items-center border border-white/10">
          <Text className="text-white font-bold text-sm uppercase tracking-widest">Next Payout: Tuesday</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 TRANSACTION HISTORY */}
      <View className="px-6 mt-4">
        <Text className="text-xl font-black text-gray-800 mb-4">Payment History</Text>
        
        {transactions.length === 0 ? (
          <View className="items-center mt-10">
            <Text className="text-gray-400 italic">No transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx.id} className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className={`p-3 rounded-xl ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tx.amount > 0 ? <ArrowUpRight color="green" size={20} /> : <ArrowDownLeft color="red" size={20} />}
                </View>
                <View className="ml-4">
                  <Text className="font-bold text-gray-800">{tx.description}</Text>
                  <Text className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text className={`font-black text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default SellerWallet;