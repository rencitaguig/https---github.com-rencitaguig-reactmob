import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";
import productReducer from "./productSlice";
import reviewReducer from "./reviewSlice";
import discountReducer from './discountSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
    reviews: reviewReducer,
    discounts: discountReducer,
  },
});
