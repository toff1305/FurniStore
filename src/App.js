import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

import Login from "./login";
import Signup from "./signup";
import Admin from "./admin";
import ManageFurnitures from "./manage-furnitures";
import ManageOrders from "./manage-orders";
import ManageUsers from "./manage-users";
import AddFurnitures from "./add-product";
import ViewFurnitures from "./view-products";
import Home from "./home";
import About from "./about";
import Help from "./help";
import "@fortawesome/fontawesome-free/css/all.min.css";
import UserDashboard from "./orderss";
import Profile from "./profile";
import UserCart from "./cart";
import ProductDetails from "./product-details";
import Checkout from "./checkout";
import GcashPayment from "./gcash";
import Shop from "./shop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* ✅ ensures smooth scrolling on route change */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/manage-furnitures" element={<ManageFurnitures />} />
        <Route path="/manage-orders" element={<ManageOrders />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/add-product" element={<AddFurnitures />} />
        <Route path="/view-products" element={<ViewFurnitures />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/orderss" element={<UserDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<UserCart />} />
        <Route path="/product-details" element={<ProductDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/gcash" element={<GcashPayment />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </BrowserRouter>
  );
}
