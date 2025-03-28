import React, { useState, useEffect, useContext } from "react";
import { View, TextInput, Button, Text, Image, StyleSheet, FlatList, Modal } from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config"; // Import BASE_URL
import { OrderContext } from "../context/OrderContext"; // Import OrderContext

export default function ProfileScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showOrders, setShowOrders] = useState(true); // State to toggle orders visibility
  const { orders, fetchOrders } = useContext(OrderContext); // Use OrderContext
  const [selectedOrder, setSelectedOrder] = useState(null); // State for selected order
  const [reviewModalVisible, setReviewModalVisible] = useState(false); // State for review modal visibility
  const [rating, setRating] = useState(0); // State for rating
  const [comment, setComment] = useState(""); // State for comment

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (token && userId) {
        setLoggedIn(true);
        const user = await axios.get(`${BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(user.data.name);
        setProfileImage(user.data.profileImage);
        fetchOrders(); // Fetch orders
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user._id);
      console.log("Token:", token);
      setProfileImage(user.profileImage);
      setUserName(user.name);
      setLoggedIn(true);
      setMessage("Login successful!");
      fetchOrders();
    } catch (error) {
      console.error("Error during login:", error.response ? error.response.data : error.message);
      setMessage("Error logging in.");
    }
  };

  const handleRegister = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (image) {
      const imageData = new FormData();
      imageData.append("file", {
        uri: image.uri ? image.uri.replace("file://", "") : "",
        type: 'image/jpeg',
        name: image.uri ? image.uri.split('/').pop() : 'image.jpg',
      });
      imageData.append("upload_preset", "ml_default");

      try {
        const res = await axios.post("https://api.cloudinary.com/v1_1/dv4vzq7pv/image/upload", imageData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        formData.append("profileImage", res.data.secure_url);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.response ? error.response.data : error.message);
        setMessage("Error uploading image.");
        return;
      }
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Registration successful!");
      setIsLogin(true);
    } catch (error) {
      console.error("Error during registration:", error.response ? error.response.data : error.message);
      setMessage("Error registering.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    setLoggedIn(false);
    setUserName("");
    setProfileImage(null);
    setMessage("Logged out successfully.");
  };

  const pickImage = async () => {
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

  const handleReviewSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const reviewData = {
        userId,
        productId: selectedOrder.items[0].productId,
        rating,
        comment,
      };
      await axios.post(`${BASE_URL}/api/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Review submitted successfully!");
      setReviewModalVisible(false);
    } catch (error) {
      console.error("Error submitting review:", error.response ? error.response.data : error.message);
      setMessage("Error submitting review.");
    }
  };

  return (
    <View style={styles.container}>
      {loggedIn ? (
        <>
          <Text style={styles.text}>Welcome, {userName}</Text>
          {profileImage ? <Image source={{ uri: profileImage }} style={styles.profileImage} /> : null}
          <Button title="Logout" onPress={handleLogout} />
          <Button title={showOrders ? "Hide Orders" : "Show Orders"} onPress={() => setShowOrders(!showOrders)} />
          {showOrders && (
            <>
              <Text style={styles.text}>Your Orders:</Text>
              <FlatList
                data={orders}
                keyExtractor={(item) => item._id ? item._id.toString() : "undefined"}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <Text style={styles.orderText}>Order ID: {item._id}</Text>
                    <Text style={styles.orderText}>Total Price: ${item.totalPrice}</Text>
                    <Text style={styles.orderText}>Status: {item.status}</Text>
                    <FlatList
                      data={item.items}
                      keyExtractor={(item) => item.productId ? item.productId.toString() : "undefined"}
                      renderItem={({ item }) => (
                        <View style={styles.itemCard}>
                          <Text style={styles.itemText}>{item.name}</Text>
                          <Text style={styles.itemText}>Quantity: {item.quantity}</Text>
                          <Text style={styles.itemText}>Price: ${item.price}</Text>
                        </View>
                      )}
                    />
                    {item.status === "Delivered" && (
                      <Button
                        title="Write a Review"
                        onPress={() => {
                          setSelectedOrder(item);
                          setReviewModalVisible(true);
                        }}
                      />
                    )}
                  </View>
                )}
              />
            </>
          )}
        </>
      ) : (
        <>
          {isLogin ? (
            <>
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
              <Button title="Login" onPress={handleLogin} />
              <Button title="Switch to Register" onPress={() => setIsLogin(false)} />
            </>
          ) : (
            <>
              <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
              <Button title="Choose Image" onPress={pickImage} />
              <Button title="Register" onPress={handleRegister} />
              <Button title="Switch to Login" onPress={() => setIsLogin(true)} />
            </>
          )}
        </>
      )}
      {message ? <Text>{message}</Text> : null}

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <TextInput
              placeholder="Rating (1-5)"
              value={rating.toString()}
              onChangeText={setRating}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Comment"
              value={comment}
              onChangeText={setComment}
              style={styles.input}
            />
            <Button title="Submit Review" onPress={handleReviewSubmit} />
            <Button title="Cancel" onPress={() => setReviewModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
  input: { width: 200, height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 10, padding: 10 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginTop: 20 },
  orderCard: { backgroundColor: "white", padding: 10, marginVertical: 5, borderRadius: 8, width: "90%" },
  orderText: { fontSize: 16, fontWeight: "bold" },
  itemCard: { backgroundColor: "#f0f0f0", padding: 5, marginVertical: 5, borderRadius: 5 },
  itemText: { fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
