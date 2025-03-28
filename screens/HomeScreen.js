import React, { useEffect, useState, useContext } from "react"; // Add useContext here
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Modal } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts } from "../store/productSlice";
import { fetchReviews, updateReview, deleteReview } from "../store/reviewSlice"; // Import actions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext } from "../context/CartContext"; // Import CartContext

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
    setSelectedProduct(product);
    dispatch(fetchReviews(product._id));
    setModalVisible(true);
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setEditRating(review.rating.toString());
    setEditComment(review.comment);
    setEditModalVisible(true);
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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleProductSelect(item)}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>${item.price}</Text>
            <TouchableOpacity onPress={() => handleAddToCart(item)} style={styles.addToCartButton}>
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
                keyExtractor={(item) => item._id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
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

      {/* Edit Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Your Review</Text>
            <TextInput
              placeholder="Rating (1-5)"
              value={editRating}
              onChangeText={setEditRating}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Comment"
              value={editComment}
              onChangeText={setEditComment}
              style={styles.input}
            />
            <TouchableOpacity onPress={handleUpdateReview} style={styles.updateButton}>
              <Text style={styles.updateButtonText}>Submit Update</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f8f8" },
  searchInput: { height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, marginTop: 20 },
  card: { flex: 1, margin: 10, backgroundColor: "white", padding: 10, borderRadius: 8 },
  image: { width: "100%", height: 120, resizeMode: "contain" },
  title: { fontSize: 14, fontWeight: "bold", marginVertical: 5 },
  price: { fontSize: 16, color: "green" },
  addToCartButton: { marginTop: 10, backgroundColor: "#007bff", padding: 5, borderRadius: 5 },
  addToCartText: { color: "white", textAlign: "center" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
  modalImage: { width: "100%", height: 200, resizeMode: "contain" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  modalDescription: { fontSize: 16, marginVertical: 10 },
  modalPrice: { fontSize: 18, color: "green", marginVertical: 10 },
  reviewCard: { backgroundColor: "#f0f0f0", padding: 10, marginVertical: 5, borderRadius: 5, width: "100%" },
  reviewText: { fontSize: 14 },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  editButton: { backgroundColor: "#007bff", padding: 5, borderRadius: 5 },
  editButtonText: { color: "white", textAlign: "center" },
  deleteButton: { backgroundColor: "#dc3545", padding: 5, borderRadius: 5 },
  deleteButtonText: { color: "white", textAlign: "center" },
  closeButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 5, marginTop: 20 },
  closeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  input: { height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, width: "100%" },
  updateButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5, marginTop: 10 },
  updateButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  cancelButton: { backgroundColor: "#dc3545", padding: 10, borderRadius: 5, marginTop: 10 },
  cancelButtonText: { color: "white", textAlign: "center", fontWeight: "bold" }
});
