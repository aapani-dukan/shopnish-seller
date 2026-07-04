import React, { useEffect, useRef, useState } from "react";
import {
View,
StyleSheet,
TouchableOpacity,
Text,
ActivityIndicator,
Dimensions,
Alert,
} from "react-native";

import MapView,{
Marker,
PROVIDER_GOOGLE,
Region
} from "react-native-maps";

import * as Location from "expo-location";

import { SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

import { useNavigation,useRoute } from "@react-navigation/native";
import { useLocationStore } from "../../hooks/useLocationStore";
const { width,height }=Dimensions.get("window");

export default function SellerMapPicker(){

const navigation=useNavigation<any>();

const route=useRoute<any>();

const mapRef=useRef<MapView>(null);

const [loading,setLoading]=useState(true);
const [selectedAddress, setSelectedAddress] = useState("Loading address...");
const [region,setRegion]=useState<Region>({
latitude:26.4499,
longitude:75.6399,
latitudeDelta:0.01,
longitudeDelta:0.01
});



useEffect(()=>{

loadCurrentLocation();

},[]);
const loadCurrentLocation=async()=>{

try{

const {status}=await Location.requestForegroundPermissionsAsync();

if(status!=="granted"){

Alert.alert(
"Permission",
"Location permission denied."
);

return;
}

const loc=await Location.getCurrentPositionAsync({

accuracy:Location.Accuracy.Highest

});

const r={

latitude:loc.coords.latitude,

longitude:loc.coords.longitude,

latitudeDelta:0.01,

longitudeDelta:0.01

};

setRegion(r);
await updateAddress(r);
mapRef.current?.animateToRegion(r,1000);

}

finally{

setLoading(false);

}

};
const updateAddress = async (r: Region) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: r.latitude,
      longitude: r.longitude,
    });
    if (result.length > 0) {
      const place = result[0];
      const address = [place.name, place.street, place.district, place.subregion]
        .filter(Boolean)
        .join(", ");
      setSelectedAddress(address);
    }
  } catch (e) {
    console.log(e);
  }
};

const confirmLocation = async () => {
  try {
    const address = await Location.reverseGeocodeAsync({
      latitude: region.latitude,
      longitude: region.longitude
    });

    if (!address || address.length === 0) {
      Alert.alert("Error", "Address detect nahi hua.");
      return;
    }

    const place = address[0];

    // Zustand store update करें
    useLocationStore.getState().setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
      address: [place.name, place.street, place.district].filter(Boolean).join(", "),
      city: place.city || place.subregion || "",
      pincode: place.postalCode || ""
    });

    navigation.goBack();
  } catch (e) {
    console.error(e);
    Alert.alert("Error", "Location process karne mein samasya aayi.");
  }
};
if(loading){
return(
<View style={styles.loader}>
<ActivityIndicator size="large"/>
</View>
);
}
return(
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity
onPress={()=>navigation.goBack()}
>
<Feather
name="arrow-left"
size={26}
/>
</TouchableOpacity>

<Text style={styles.title}>
Choose Shop Location
</Text>
<View style={{width:25}}/>
</View>
<View
style={{
backgroundColor:"#fff",
padding:12,
margin:10,
borderRadius:12,
elevation:3
}}
>
<Text
style={{
fontWeight:"700",
marginBottom:5
}}
>
Selected Address
</Text>

<Text>
{selectedAddress}
</Text>

</View>
<MapView

ref={mapRef}

provider={PROVIDER_GOOGLE}

style={styles.map}

initialRegion={region}

showsUserLocation

showsMyLocationButton
onRegionChangeComplete={(r)=>{
    setRegion(r);
    updateAddress(r);
}}
>
</MapView>
<View
style={{
position:"absolute",
top:"50%",
left:"50%",
marginLeft:-18,
marginTop:-36,
zIndex:100
}}
>
<Feather
name="map-pin"
size={40}
color="red"/>
</View>
<TouchableOpacity
style={styles.confirmButton}
onPress={confirmLocation}>
<Text style={styles.confirmText}>
Confirm Shop Location
</Text>
</TouchableOpacity>
</SafeAreaView>
);
}
const styles=StyleSheet.create({
container:{
flex:1
},
loader:{
flex:1,
justifyContent:"center",
alignItems:"center"
},
header:{

height:60,

flexDirection:"row",

alignItems:"center",

justifyContent:"space-between",

paddingHorizontal:16,

backgroundColor:"#fff",

elevation:4

},
title:{

fontSize:18,

fontWeight:"700"

},

map:{

flex:1

},
confirmButton:{

position:"absolute",

bottom:40,

left:20,

right:20,
height:55,
backgroundColor:"#0F766E",

paddingVertical:15,

borderRadius:14,
justifyContent:'center',
alignItems:"center",
zIndex:100,
elevation:10

},

confirmText:{

color:"#fff",

fontWeight:"bold",

fontSize:16

}

});