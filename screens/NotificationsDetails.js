import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { OrderContext } from '../context/OrderContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsDetails({ route }) {
  const { orderId } = route.params;
  const { orders } = useContext(OrderContext);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId && orders?.length) {
      const foundOrder = orders.find(o => o._id === orderId);
      setOrder(foundOrder);
    }
  }, [orderId, orders]);

  if (!order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.header}>Notification Details</Text>
          <Text style={styles.orderNumber}>Order #{order._id?.slice(-6)}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item?.name || 'N/A'}</Text>
                <Text style={styles.itemQuantity}>Qty: {item?.quantity || 0}</Text>
              </View>
              
              <View style={styles.priceDetails}>
                <Text style={styles.itemPrice}>
                  Price: ₱{(item?.price || 0).toFixed(2)}
                </Text>
                <Text style={styles.itemTotal}>
                  Total: ₱{((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>
              ₱{(order.totalPrice || 0).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.dateText}>
            Order Date: {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
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
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 15,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3E2723',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8B4513',
  },
  priceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#5D4037',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
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
