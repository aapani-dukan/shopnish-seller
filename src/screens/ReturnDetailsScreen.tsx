import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient"; // path अपने project के अनुसार ठीक कर लेना

export default function ReturnDetailsScreen({ route, navigation }: any) {

  const { returnId } = route.params;

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/returns/${returnId}`],
  });

  const completeMutation = useMutation({

    mutationFn: async () => {

      return apiRequest(
        "POST",
        `/api/returns/${returnId}/complete`,
        {}
      );

    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["/api/returns/seller"],
      });

      Alert.alert(
        "Success",
        "Return Completed"
      );

      navigation.goBack();

    },

  });

  if (isLoading) {

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  }

  const request = data?.data;

  return (

    <ScrollView
      contentContainerStyle={styles.container}
    >

      <Text style={styles.title}>
        {request.product?.name}
      </Text>

      <Text>
        Customer :
        {" "}
        {request.customer?.name}
      </Text>

      <Text>
        Reason :
        {" "}
        {request.reason}
      </Text>

      <Text>
        Return Type :
        {" "}
        {request.returnType}
      </Text>

      <Text>
        Status :
        {" "}
        {request.status}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.heading}>
        Refund Details
      </Text>

      <Text>
        PhonePe :
        {" "}
        {request.refundPhonePe || "-"}
      </Text>

      <Text>
        UPI :
        {" "}
        {request.refundUpi || "-"}
      </Text>

      <Text>
        Pickup Fee :
        ₹{request.pickupFee}
      </Text>

      <TouchableOpacity
        style={styles.button}
        disabled={completeMutation.isPending}
        onPress={() => {

          Alert.alert(
            "Complete Return",
            "Refund completed?",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Complete",
                onPress: () =>
                  completeMutation.mutate(),
              },
            ]
          );

        }}
      >

        <Text style={styles.buttonText}>
          Complete Refund
        </Text>

      </TouchableOpacity>

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },

  button: {
    marginTop: 30,
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

});