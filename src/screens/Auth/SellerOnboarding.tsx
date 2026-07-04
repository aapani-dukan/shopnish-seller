import React, { useEffect,useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation,useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import * as Location from 'expo-location';
import { useLocationStore } from '../../hooks/useLocationStore';
// 📦 Schema: deliveryRadius को number रखा है
const sellerSchema = z.object({
  businessName: z.string().min(3, "Business name too short"),
  email: z.string().email("Sahi Gmail ID likhein"),
  description: z.string().min(10, "Describe your shop better"),
  businessAddress: z.string().min(10, "Full address required"),
  city: z.string().min(2, "City required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid Pincode"),
  businessPhone: z.string().regex(/^\d{10}$/, "10 digit phone required"),
  businessType: z.string().min(2, "Business type zaroori hai"),
  bankAccountNumber: z.string().min(9, "Invalid Account Number"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  deliveryRadius: z.number().min(1, "Radius required").max(100), 
  deliveryPincodes: z.array(
    z.string().regex(/^\d{6}$/)
  ).default([]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type SellerFormData = z.infer<typeof sellerSchema>;

export default function SellerOnboarding() {
  const navigation = useNavigation<any>();
  const { user,refreshUserStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pincodeInput, setPincodeInput] = React.useState('');
const [deliveryPincodes, setDeliveryPincodes] = React.useState<string[]>([]);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: { 
      businessName: '', 
      businessPhone: user?.phoneNumber?.replace('+91', '') || '', 
      email: user?.email || '',
      businessType: 'Retailer',
      city: '', 
      description: '',
      businessAddress: '',
      pincode: '',
      
      bankAccountNumber: '',
      ifscCode: '',
      deliveryRadius: 5, 
    }
  });

  useFocusEffect(
    useCallback(() => {
      const location = useLocationStore.getState().selectedLocation;
      
      if (location) {
        // मैप से डेटा मिलते ही यहाँ फॉर्म भर जाएगा
        setValue("latitude", location.latitude, { shouldValidate: true });
        setValue("longitude", location.longitude, { shouldValidate: true });
        setValue("businessAddress", location.address, { shouldValidate: true });
        setValue("city", location.city, { shouldValidate: true });
        setValue("pincode", location.pincode, { shouldValidate: true });
        
        // डेटा यूज़ करने के बाद स्टोर को खाली करना ज़रूरी है
        useLocationStore.getState().setSelectedLocation(null);
      }
    }, [setValue])
  );

  // 🚀 Final Submission Logic (Updated for Backend Compatibility)
  const onSubmit = async (data: SellerFormData) => {
  setIsSubmitting(true);
  try {
    const payload = {
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      email: data.email,
      description: data.description || "",
      city: data.city,
      pincode: data.pincode,
      bankAccountNumber: data.bankAccountNumber,
      ifscCode: data.ifscCode,
      deliveryRadius: data.deliveryRadius,
     deliveryPincodes:deliveryPincodes,
      businessType: data.businessType || "Retailer", 
      
      gstNumber: "", // Optional field
      latitude: data.latitude,
      longitude: data.longitude,
      // Firebase UID authentication/linking ke liye
      firebaseUid: user?.uid,
    };

    console.log("📤 Sending payload to backend:", payload);
console.log("📦 DELIVERY PINCODES =", deliveryPincodes);
    console.log("📦 DELIVERY RADIUS =", data.deliveryRadius);
    console.log(
      "📤 APPLY PAYLOAD =",
      JSON.stringify(payload, null, 2)
    );
   const response = await api.post('/api/sellers/apply', payload);

    // ✅ Success Block
    if (response.status === 201 || response.status === 200) {
      await refreshUserStatus();
      navigation.reset({
        index: 0,
        routes: [{ name: 'SellerStatus' }], // यहाँ अपनी पेंडिंग स्क्रीन का नाम लिखें
      });
    }
  } catch (err: any) {
    // ✅ Error Block (सिर्फ यहीं एरर दिखाएंगे)
    console.error("❌ Backend Error Details:", err.response?.data);
    const msg = err.response?.data?.message || "Submission failed";
    Alert.alert("Error", msg);
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Seller Registration</Text>
      <Text style={styles.headerSub}>Shopnish Premium Seller Portal</Text>

      <View style={styles.formCard}>
        <CustomInput control={control} name="businessName" label="Business Name" icon="shopping-bag" error={errors.businessName} />
        <CustomInput control={control} name="description" label="Shop Description" icon="info" error={errors.description} />
      <TouchableOpacity 
  onPress={() => navigation.navigate("SellerMapPicker")}
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
    justifyContent: 'center'
  }}
>
  <Feather
    name="map-pin"
    size={18}
    color="#0369A1"
    style={{ marginRight: 8 }}
  />

  <Text
    style={{
      color: "#0369A1",
      fontWeight: "700"
    }}
  >
    Select Shop Location
  </Text>
</TouchableOpacity>
       <CustomInput
  control={control}
  name="businessAddress"
  label="Shop Address"
  icon="map-pin"
  error={errors.businessAddress}
/>
<CustomInput
  control={control}
  name="latitude"
  label="Latitude"
  icon="crosshair"
  editable={false}
/>

<CustomInput
  control={control}
  name="longitude"
  label="Longitude"
  icon="crosshair"
  editable={false}
/>
        {/* Email Input - Sabse zaroori account linking ke liye */}
<CustomInput 
  control={control} 
  name="email" 
  label="Gmail ID (For Web Login)" 
  icon="mail" 
  keyboardType="email-address"
  autoCapitalize="none"
  error={errors.email} 
/>

{/* Business Type Input */}
<CustomInput 
  control={control} 
  name="businessType" 
  label="Business Type (e.g. Retailer, Wholesaler)" 
  icon="briefcase" 
  error={errors.businessType} 
/>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
                <CustomInput control={control} name="city" label="City" icon="map" editable={false} error={errors.city} />
            </View>
            <View style={{ flex: 1 }}>
                <CustomInput control={control} name="pincode" label="Pincode" icon="hash" editable={false} keyboardType="numeric" error={errors.pincode} />
            </View>
        </View>

        <CustomInput control={control} name="businessPhone" label="Contact Number" icon="phone" keyboardType="phone-pad" error={errors.businessPhone} />
        <CustomInput control={control} name="bankAccountNumber" label="Bank Account Number" icon="credit-card" keyboardType="numeric" error={errors.bankAccountNumber} />
        <CustomInput control={control} name="ifscCode" label="IFSC Code" icon="info" error={errors.ifscCode} />
        
        {/* Important: deliveryRadius input handled as number */}
        <CustomInput 
          control={control} 
          name="deliveryRadius" 
          label="Delivery Radius (KM)" 
          icon="target" 
          keyboardType="numeric" 
          error={errors.deliveryRadius} 
          isNumber={true} 
        />
        <View style={{ marginBottom: 20 }}>
  <Text
    style={{
      fontSize: 14,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8
    }}
  >
    Delivery Pincodes
  </Text>

  <View
    style={{
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10
    }}
  >
    <TextInput
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48
      }}
      value={pincodeInput}
      onChangeText={setPincodeInput}
      keyboardType="numeric"
      maxLength={6}
      placeholder="Enter Pincode"
    />

    <TouchableOpacity
      style={{
        backgroundColor: '#001B3A',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 10
      }}
      onPress={() => {
        if (
          pincodeInput.length === 6 &&
          !deliveryPincodes.includes(pincodeInput)
        ) {
          setDeliveryPincodes([
            ...deliveryPincodes,
            pincodeInput
          ]);

          setPincodeInput('');
        }
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: '700'
        }}
      >
        Add
      </Text>
    </TouchableOpacity>
  </View>

  <View
    style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    }}
  >
    {deliveryPincodes.map((code) => (
      <View
        key={code}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#dbeafe',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20
        }}
      >
        <Text>{code}</Text>

        <TouchableOpacity
          onPress={() =>
            setDeliveryPincodes(
              deliveryPincodes.filter(
                p => p !== code
              )
            )
          }
        >
          <Feather
            name="x"
            size={14}
            color="red"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    ))}
  </View>
</View>
        <View style={[styles.locationTag, { backgroundColor: watch('latitude') ? '#dcfce7' : '#fee2e2' }]}>
          <Feather name="crosshair" size={14} color={watch('latitude') ? '#166534' : '#991b1b'} />
          <Text style={{ fontSize: 12, marginLeft: 5, color: watch('latitude') ? '#166534' : '#991b1b' }}>
            {watch('latitude') ? "Location Locked" : "Location Pending (Check Address)"}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.btnText}>Register Now</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ✅ Updated CustomInput to handle number conversion safely
const CustomInput = ({ control, name, label, icon, error, isNumber, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, error && { borderColor: '#ef4444' }]}>
      <Feather name={icon} size={18} color="#64748b" style={{ marginRight: 10 }} />
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput 
            style={styles.input} 
            editable={props.editable ?? true}
            value={value?.toString()} 
            onChangeText={(text) => onChange(isNumber ? (parseFloat(text) || 0) : text)} 
            placeholder={`Enter ${label}`} 
            placeholderTextColor="#cbd5e1" 
            {...props} 
          />
        )}
      />
    </View>
    {error && <Text style={styles.errorText}>{error.message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001B3A' },
  content: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#D4AF37' },
  headerSub: { color: '#fff', fontSize: 14, marginBottom: 30, opacity: 0.8 },
  formCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 10 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15 },
  input: { flex: 1, height: 50, color: '#0f172a', fontSize: 15 },
  submitBtn: { backgroundColor: '#001B3A', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 18 },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 3, marginLeft: 5 },
  locationTag: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10, marginTop: 10 }
});