import React from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppNavigator from "./navigation/AppNavigator";
import { CartProvider } from "./context/CartContext"; // Import CartProvider
import { OrderProvider } from "./context/OrderContext"; // Import OrderProvider

export default function App() {
  return (
    <Provider store={store}>
      <OrderProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </OrderProvider>
    </Provider>
  );
}
