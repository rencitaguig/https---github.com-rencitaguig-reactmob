import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchOrders, updateOrderStatus } from "../store/orderSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config";

export default function AdminScreen() {
  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem("token");
      dispatch(fetchOrders(token));
    };
    fetchData();
  }, [dispatch]);

  const handleImagePick = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImage(result);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setMessage("Failed to pick image.");
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    if (image) {
      formData.append("image", {
        uri: image.uri,
        type: 'image/jpeg',
        name: image.uri.split('/').pop(),
      });
    }

    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        setMessage("No token found. Please log in again.");
        return;
      }
      const res = await axios.post(`${BASE_URL}/api/products`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${storedToken}`
        },
      });
      setMessage("Product created successfully!");
    } catch (error) {
      console.error("Error creating product:", error.response ? error.response.data : error.message);
      setMessage("Error creating product.");
    }
  };

  const handleUpdateOrderStatus = async () => {
    const token = await AsyncStorage.getItem("token");
    dispatch(updateOrderStatus({ orderId: selectedOrder, status, token }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
        <TextInput placeholder="Price" value={price} onChangeText={setPrice} style={styles.input} />
        <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={styles.input} />
        <Button title="Choose Image" onPress={handleImagePick} />
        <Button title="Create Product" onPress={handleSubmit} />
        {message ? <Text>{message}</Text> : null}
      </View>

      <View style={styles.orderStatusContainer}>
        <Text style={styles.sectionTitle}>Update Order Status</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setSelectedOrder(item._id)}
              style={[
                styles.orderItem,
                selectedOrder === item._id && styles.selectedOrderItem
              ]}
            >
              <Text>
                Order ID: {item._id} - Status: {item.status}
              </Text>
            </TouchableOpacity>
          )}
        />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f8f8" },
  formContainer: { marginTop: 20 },
  input: { height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 },
  orderStatusContainer: { marginTop: 40 },
  sectionTitle: { marginTop: 20, fontWeight: "bold" },
  orderItem: { padding: 10, backgroundColor: "#fff", marginVertical: 5 },
  selectedOrderItem: { backgroundColor: "#d3d3d3" },
  picker: { height: 50, width: 150, marginVertical: 10 }
});
