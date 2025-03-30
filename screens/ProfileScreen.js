import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config"; // Import BASE_URL
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { CartContext } from "../context/CartContext"; // Import CartContext
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

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
  const [showOrders, setShowOrders] = useState(true); // Toggle orders visibility
  const [userOrders, setUserOrders] = useState([]); // User-specific orders
  const [selectedOrder, setSelectedOrder] = useState(null); // Selected order for review
  const [reviewModalVisible, setReviewModalVisible] = useState(false); // Review modal visibility
  const [rating, setRating] = useState(0); // Rating state
  const [comment, setComment] = useState(""); // Comment state

  const { setOnOrderPlaced } = useContext(CartContext); // Access CartContext
  const { setUserRole } = useContext(AuthContext); // Access AuthContext

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (token && userId) {
        setLoggedIn(true);
        try {
          const userRes = await axios.get(`${BASE_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserName(userRes.data.name);
          setProfileImage(userRes.data.profileImage);
          fetchUserOrders(userId, token); // Fetch orders for the logged-in user
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    checkLoginStatus();

    // Set the callback to refresh orders when a new order is placed
    setOnOrderPlaced(() => async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (token && userId) {
        fetchUserOrders(userId, token);
      }
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshOrders = async () => {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) {
          fetchUserOrders(userId, token); // Fetch updated orders when screen is focused
        }
      };
      refreshOrders();
    }, [])
  );

  const fetchUserOrders = async (userId, token) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredOrders = response.data.filter(
        (order) => order.userId._id === userId
      );
      setUserOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user._id);
      await AsyncStorage.setItem('userRole', user.role);
      setUserRole(user.role);
      setProfileImage(user.profileImage);
      setUserName(user.name);
      setLoggedIn(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged in successfully! 👋',
        visibilityTime: 3000,
        position: 'top',
      });
      fetchUserOrders(user._id, token);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to login. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registration successful! Please login.',
        visibilityTime: 3000,
        position: 'top',
      });
      setIsLogin(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to register. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    setUserRole(null);
    setLoggedIn(false);
    setUserName("");
    setProfileImage(null);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Logged out successfully! 👋',
      visibilityTime: 3000,
      position: 'top',
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) { 
        setImage(result.assets[0]);
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Review submitted successfully! 🌟',
        visibilityTime: 3000,
        position: 'top',
      });
      setReviewModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit review. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
      console.error("Error submitting review:", error.response ? error.response.data : error.message);
    }
  };

  const renderOrders = () => {
    if (!userOrders || userOrders.length === 0) {
      return <Text>No orders found.</Text>;
    }

    return (
      <>
        <Text style={styles.text}>Your Orders:</Text>
        <FlatList
          data={userOrders}
          keyExtractor={(item) => (item._id ? item._id.toString() : "undefined")}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Order ID: {item._id}</Text>
              <Text style={styles.orderText}>Total Price: ${item.totalPrice}</Text>
              <Text style={styles.orderText}>Status: {item.status}</Text>
              <FlatList
                data={item.items}
                keyExtractor={(item) => (item.productId ? item.productId.toString() : "undefined")}
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
    );
  };

  return (
    <LinearGradient 
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.gradientBackground}
    >
      <View style={styles.container}>
        {loggedIn ? (
          <>
            <Text style={styles.text}>Welcome, {userName}</Text>
            {profileImage && <Image source={{ uri: profileImage }} style={styles.profileImage} />}
            <Button title="Logout" onPress={handleLogout} />
            <Button title={showOrders ? "Hide Orders" : "Show Orders"} onPress={() => setShowOrders(!showOrders)} />
            {showOrders && renderOrders()}
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
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <TextInput
                  placeholder="Rating (1-5)"
                  value={rating.toString()}
                  onChangeText={setRating}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#3E2723"
                />
                <TextInput
                  placeholder="Comment"
                  value={comment}
                  onChangeText={setComment}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#3E2723"
                />
                <TouchableOpacity style={styles.button} onPress={handleReviewSubmit}>
                  <Text style={styles.buttonText}>Submit Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { marginBottom: 20 }]} onPress={() => setReviewModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
        <Toast />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  gradientBackground: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    color: '#3E2723',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '100%',
    height: 55,
    borderRadius: 30,
    paddingHorizontal: 25,
    marginBottom: 15,
    fontSize: 16,
    color: '#3E2723',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginVertical: 20,
    alignSelf: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderText: {
    fontSize: 16,
    color: '#3E2723',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
  },
  itemText: {
    fontSize: 15,
    color: '#5D4037',
  },
  button: {
    backgroundColor: 'rgba(62, 39, 35, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 25,
    textAlign: 'center',
  },
});
