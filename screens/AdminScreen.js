import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, ScrollView } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { OrderContext } from "../context/OrderContext";

export default function AdminScreen() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("Pending");
  const { orders, fetchOrders, updateOrderStatus } = useContext(OrderContext);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchOrders(); // Fetch all orders
  }, []);

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) {
      setMessage("Please select an order.");
      return;
    }

    await updateOrderStatus(selectedOrder, status);
    setMessage("Order status updated successfully!");
  };

  const renderContent = () => {
    if (!orders || orders.length === 0) {
      return <Text>No orders available.</Text>;
    }

    return (
      <View style={styles.orderStatusContainer}>
        <Text style={styles.sectionTitle}>Update Order Status</Text>
        <View style={styles.flatListContainer}>
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedOrder(item._id)}
                style={[
                  styles.orderItem,
                  selectedOrder === item._id && styles.selectedOrderItem,
                ]}
              >
                <Text>
                  Order ID: {item._id} - Status: {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <Picker
          selectedValue={status}
          onValueChange={(itemValue) => setStatus(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="Shipped" value="Shipped" />
          <Picker.Item label="Delivered" value="Delivered" />
          <Picker.Item label="Cancelled" value="Cancelled" />
        </Picker>
        <Button title="Update Status" onPress={handleUpdateOrderStatus} />
        {message ? <Text>{message}</Text> : null}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>{renderContent()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 10, backgroundColor: "#f8f8f8" },
  container: { flex: 1 },
  orderStatusContainer: { marginTop: 40 },
  sectionTitle: { marginTop: 20, fontWeight: "bold" },
  flatListContainer: { maxHeight: 300, marginBottom: 20 }, // Limit height for FlatList
  orderItem: { padding: 10, backgroundColor: "#fff", marginVertical: 5 },
  selectedOrderItem: { backgroundColor: "#d3d3d3" },
  picker: { height: 50, width: "100%", marginVertical: 10 },
});
