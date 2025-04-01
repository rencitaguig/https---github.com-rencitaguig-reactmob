import React from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppNavigator from "./navigation/AppNavigator";
import { CartProvider } from "./context/CartContext"; // Import CartProvider
import { OrderProvider } from "./context/OrderContext"; // Import OrderProvider
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { ProductProvider } from './context/ProductContext'; // Import ProductProvider

export default function App() {
  return (
    <AuthProvider>
      <Provider store={store}>
        <OrderProvider>
          <ProductProvider>
            <CartProvider>
              <AppNavigator />
            </CartProvider>
          </ProductProvider>
        </OrderProvider>
      </Provider>
    </AuthProvider>
  );
}
