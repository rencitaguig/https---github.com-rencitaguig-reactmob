import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts } from "../store/productSlice";
import { fetchReviews, updateReview, deleteReview } from "../store/reviewSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext } from "../context/CartContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = async (item) => {
    await addToCart(item);
  };

  const handleProductSelect = (product) => {
    if (!product._id) {
      console.warn('Product missing ID:', product);
      return;
    }
    setSelectedProduct(product);
    dispatch(fetchReviews(product._id));
    setModalVisible(true);
  };

  const handleEditReview = (review) => {
    if (!review._id) {
      console.warn('Review missing ID:', review);
      return;
    }
    console.log('Opening edit modal for review:', review); // Add logging
    setSelectedReview(review);
    setEditRating(review.rating.toString());
    setEditComment(review.comment);
    setEditModalVisible(true); // Make sure this is being called
    setModalVisible(false); // Close the product modal first
  };

  const handleUpdateReview = async () => {
    const token = await AsyncStorage.getItem("token");
    dispatch(updateReview({ reviewId: selectedReview._id, updatedData: { rating: editRating, comment: editComment }, token }));
    setEditModalVisible(false);
  };

  const handleDeleteReview = async (reviewId) => {
    const token = await AsyncStorage.getItem("token");
    dispatch(deleteReview({ reviewId, token }));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.price.toString().includes(searchQuery)
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        placeholderTextColor="#8D6E63"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => `product-${item._id}`} // Added prefix for uniqueness
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleProductSelect(item)}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>₱{item.price}</Text>
            <TouchableOpacity 
              onPress={() => handleAddToCart(item)} 
              style={styles.addToCartButton}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      {selectedProduct && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
              <Text style={styles.modalPrice}>${selectedProduct.price}</Text>
              <Text style={styles.modalTitle}>Reviews:</Text>
              <FlatList
                data={reviews}
                keyExtractor={(item) => `review-${item._id}`} // Added prefix for uniqueness
                renderItem={({ item }) => (
                  <View key={`item-${item._id}-${reviews.indexOf(item)}`} style={styles.reviewCard}>
                    <Text style={styles.reviewText}>Rating: {item.rating}</Text>
                    <Text style={styles.reviewText}>Comment: {item.comment}</Text>
                    <Text style={styles.reviewText}>By: {item.userId.name}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity onPress={() => handleEditReview(item)} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteReview(item._id)} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Your Review</Text>
              <TextInput
                placeholder="Rating (1-5)"
                value={editRating}
                onChangeText={setEditRating}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#3E2723"
              />
              <TextInput
                placeholder="Comment"
                value={editComment}
                onChangeText={setEditComment}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLine
                placeholderTextColor="#3E2s={4}723"
              />
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateReview}>
                <Text style={styles.updateButtonText}>Submit Update</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { marginBottom: 20 }]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: "#EFEBE9" // Light brown background
  },
  searchInput: { 
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  card: { 
    flex: 1, 
    margin: 8,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: { 
    width: "100%", 
    height: 150, 
    resizeMode: "cover",
    borderRadius: 10,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "700",
    marginVertical: 8,
    color: '#3E2723' // Dark brown text
  },
  price: { 
    fontSize: 18, 
    color: "#8B4513",
    fontWeight: "600"
  },
  addToCartButton: { 
    marginTop: 10, 
    backgroundColor: "#6B4423", 
    padding: 12,
    borderRadius: 25,
    elevation: 2
  },
  addToCartText: { 
    color: "#FFF", 
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "flex-end", // Makes modal slide from bottom
    backgroundColor: "rgba(0,0,0,0.5)", 
    margin: 0, // Add this
    padding: 0, // Add this
  },
  modalScrollView: {
    maxHeight: '80%',
    width: '100%', // Add this
  },
  modalContent: { 
    backgroundColor: "#FFF",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    width: '100%', // Add this
    minHeight: 300, // Add this to ensure minimum height
  },
  modalImage: { 
    width: "100%", 
    height: 250,
    resizeMode: "cover",
    borderRadius: 15,
    marginBottom: 15
  },
  modalTitle: { 
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 10,
    color: '#3E2723'
  },
  modalDescription: { 
    fontSize: 16,
    marginVertical: 10,
    color: '#5D4037',
    lineHeight: 24
  },
  modalPrice: { 
    fontSize: 22,
    color: "#8B4513",
    marginVertical: 10,
    fontWeight: "700"
  },
  reviewCard: { 
    backgroundColor: "#FBF7F4",
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513'
  },
  reviewText: { 
    fontSize: 15,
    color: '#5D4037',
    marginBottom: 5
  },
  actionButtons: { 
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10
  },
  editButton: { 
    backgroundColor: "#8B4513",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  editButtonText: { 
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  deleteButton: { 
    backgroundColor: "#D7CCC8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  deleteButtonText: { 
    color: "#3E2723",
    fontSize: 14,
    fontWeight: "600"
  },
  closeButton: { 
    backgroundColor: "#6B4423",
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    width: '100%'
  },
  closeButtonText: { 
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: 'center'
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
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  updateButton: { 
    backgroundColor: "#8B4513",
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    width: '100%',
    elevation: 3,
  },
  updateButtonText: { 
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16
  },
  cancelButton: { 
    backgroundColor: "#D7CCC8",
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    width: '100%'
  },
  cancelButtonText: { 
    color: "#3E2723",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16
  }
});
