import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient"; // path अपने project के अनुसार ठीक कर लेना

export default function ReturnRequestsScreen({ navigation }: any) {

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/returns/seller"],
  });

  const acceptMutation = useMutation({

    mutationFn: async (id: number) => {

      return apiRequest(
        "POST",
        `/api/returns/${id}/accept`,
        {}
      );

    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["/api/returns/seller"],
      });

      Alert.alert(
        "Success",
        "Return Accepted"
      );

    },

  });

  if (isLoading) {

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  }

  const requests = data?.data || [];

  return (

    <FlatList

      data={requests}

      keyExtractor={(item) => String(item.id)}

      contentContainerStyle={{
        padding: 12,
      }}

      ListEmptyComponent={() => (
        <View style={styles.center}>
          <Text>No Return Requests</Text>
        </View>
      )}

      renderItem={({ item }) => (

       <View style={styles.card}>

  <View style={{ flexDirection: "row" }}>

    <Image
      source={{
        uri: item.product?.image,
      }}
      style={{
        width: 70,
        height: 70,
        borderRadius: 8,
      }}
    />

    <View
      style={{
        marginLeft: 12,
        flex: 1,
      }}
    >

      <Text style={styles.title}>
        {item.product?.name || item.orderItem?.productName}
      </Text>

      <Text>
        Customer : {item.customer?.name}
      </Text>

          <Text>
            Reason :
            {" "}
            {item.reason}
          </Text>

        <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  }}
>
  <Text>Type : </Text>

  <View
    style={{
      backgroundColor:
        item.returnType === "pickup"
          ? "#16a34a"
          : "#2563eb",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "700",
      }}
    >
      {item.returnType === "pickup"
        ? "Pickup"
        : "Shop"}
    </Text>
  </View>
</View>

          <Text>
            Status :
            {" "}
            {item.status}
          </Text>
          <Text>

Requested On

{new Date(item.createdAt).toLocaleDateString()}

</Text>
         </View>

  </View>
          {item.status === "requested" && (

            <TouchableOpacity
    disabled={acceptMutation.isPending}
    style={[
        styles.button,
        acceptMutation.isPending && {
            opacity: 0.6,
        },
    ]}
    onPress={() => {

Alert.alert(
"Accept Return",
"Are you sure?",
[
{
text:"Cancel",
style:"cancel"
},
{
text:"Accept",
onPress:()=>acceptMutation.mutate(item.id)
}
]
);

}}
   
>

              <Text style={styles.buttonText}>
                Accept Return
              </Text>

            </TouchableOpacity>

          )}

          {item.status === "accepted" &&
            item.returnType === "shop" && (

            <View style={styles.waitBox}>

              <Text>
                Waiting for customer to submit product
              </Text>

            </View>

          )}

          {item.status === "picked_up" && (

            <TouchableOpacity

              style={[
                styles.button,
                {
                  backgroundColor: "#16a34a",
                },
              ]}

              onPress={() =>
                navigation.navigate(
                  "ReturnDetails",
                  {
                    returnId: item.id,
                  }
                )
              }

            >

              <Text style={styles.buttonText}>
                Complete Refund
              </Text>

            </TouchableOpacity>

          )}

          {item.status === "completed" && (

            <Text
              style={{
                color: "green",
                marginTop: 10,
                fontWeight: "700",
              }}
            >
              Return Completed
            </Text>

          )}

        </View>

      )}

    />

  );

}

const styles = StyleSheet.create({

  center: {

    flex: 1,

    justifyContent: "center",

    alignItems: "center",

  },

  card: {

    backgroundColor: "#fff",

    borderRadius: 10,

    padding: 14,

    marginBottom: 12,

    elevation: 2,

  },

  title: {

    fontSize: 16,

    fontWeight: "700",

    marginBottom: 8,

  },

  button: {

    marginTop: 12,

    backgroundColor: "#2563eb",

    padding: 12,

    borderRadius: 8,

    alignItems: "center",

  },

  buttonText: {

    color: "#fff",

    fontWeight: "700",

  },

  waitBox: {

    marginTop: 12,

    padding: 10,

    backgroundColor: "#fef3c7",

    borderRadius: 8,

  },

});