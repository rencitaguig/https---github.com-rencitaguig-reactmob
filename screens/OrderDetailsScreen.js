import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { OrderContext } from '../context/OrderContext';

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params;
  const { orders } = useContext(OrderContext);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const orderDetails = orders.find(o => o._id === orderId);
    setOrder(orderDetails);
  }, [orderId, orders]);

  const calculateItemTotal = (item) => {
    const price = item?.product?.price || 0;
    const quantity = item?.quantity || 0;
    return (price * quantity).toFixed(2);
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Order Details</Text>
        <Text style={styles.orderNumber}>Order #{order._id?.slice(-6) || 'N/A'}</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status || 'Unknown'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items || []).map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.itemName}>
              {item?.product?.name || 'Product Unavailable'}
            </Text>
            <Text style={styles.itemQuantity}>
              Quantity: {item?.quantity || 0}
            </Text>
            <Text style={styles.itemPrice}>
              ₱{calculateItemTotal(item)}
            </Text>
          </View>
        ))}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            ₱{(order.totalAmount || 0).toFixed(2)}
          </Text>
        </View>

        <Text style={styles.dateText}>
          Ordered on: {order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString() 
            : 'Date not available'}
        </Text>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#FFA000';
    case 'Shipped': return '#1E88E5';
    case 'Delivered': return '#43A047';
    case 'Cancelled': return '#E53935';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEBE9',
  },
  card: {
    margin: 15,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 18,
    color: '#5D4037',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E2723',
    marginTop: 15,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3E2723',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#5D4037',
    marginTop: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 5,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#D7CCC8',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E2723',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
  },
  dateText: {
    marginTop: 15,
    color: '#8D6E63',
    fontSize: 14,
  },
});