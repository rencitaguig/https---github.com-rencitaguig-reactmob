import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";
import productReducer from "./productSlice";
import reviewReducer from "./reviewSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
    reviews: reviewReducer,
  },
});
