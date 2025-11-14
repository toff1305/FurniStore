import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
 import "./cart.css"; // Styles are embedded
 import UserNavbar from "./user-header"; // Using placeholder

// // --- Placeholder for UserNavbar ---
// const UserNavbar = ({ navigate }) => {
//   const [userName, setUserName] = useState("User");
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedName = localStorage.getItem("userName");
//       if (storedName) {
//         setUserName(storedName);
//       }
//     }
//   }, []);

//   return (
//     <nav style={{ 
//       display: 'flex', 
//       justifyContent: 'space-between', 
//       alignItems: 'center', 
//       padding: '15px 40px', 
//       backgroundColor: '#fff', 
//       borderBottom: '2px solid #f0f0f0',
//       fontFamily: 'Poppins, sans-serif'
//     }}>
//       <Link to="/shop" style={{textDecoration: 'none', color: '#08112b'}}>
//         <span style={{fontWeight: 'bold', fontSize: '1.5rem'}}>Nest & Nook</span>
//       </Link>
//       <span>Welcome back, {userName}!</span>
//       <div style={{display: 'flex', gap: '20px', fontSize: '1.5rem', cursor: 'pointer'}}>
//         <span onClick={() => navigate("/cart")} title="Cart" style={{textDecoration: 'none', cursor: 'pointer'}}>🛒</span>
//         <span onClick={() => navigate("/profile_user")} title="My Orders" style={{textDecoration: 'none', cursor: 'pointer'}}>📦</span>
//         <span onClick={() => navigate("/profile")} title="My Profile" style={{textDecoration: 'none', cursor: 'pointer'}}>👤</span>
//       </div>
//     </nav>
//   );
// };
// --- End Placeholder ---


export default function UserCart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery"); // Default payment
  const [isCartLoading, setIsCartLoading] = useState(true); // --- NEW: Loading state for cart

  // --- NEW: State for Modals ---
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // --- MODIFIED: Load cart and validate it ---
  useEffect(() => {
    const initializeCart = async () => {
      setIsCartLoading(true);
      const storedCart = localStorage.getItem("cart");
      let cart = storedCart ? JSON.parse(storedCart) : [];

      if (cart.length > 0) {
        try {
          // Fetch all products to validate IDs
          const response = await fetch("http://localhost:5000/api/products");
          if (!response.ok) throw new Error("Could not verify products.");
          
          const productsData = await response.json();
          const validProductIds = new Set(productsData.map(p => p.id));
          
          // Filter out any cart items that no longer exist in the DB
          const cleanedCart = cart.filter(item => validProductIds.has(item.id));
          
          if (cleanedCart.length < cart.length) {
            console.warn("Removed stale items from cart.");
            // Save the cleaned cart back to localStorage
            localStorage.setItem("cart", JSON.stringify(cleanedCart));
          }
          
          setCartItems(cleanedCart);
          setAllProducts(productsData); // Save products for modal
          
        } catch (err) {
          console.error("Error validating cart:", err.message);
          // If we can't fetch products, just load the cart as is
          setCartItems(cart);
        }
      } else {
         // No cart, but still fetch products for modals
        try {
            const productsRes = await fetch("http://localhost:5000/api/products");
            if (productsRes.ok) {
                setAllProducts(await productsRes.json());
            }
        } catch (err) {
            console.error("Error fetching products:", err.message);
        }
      }
      setIsCartLoading(false);
    };

    initializeCart();
  }, []);


  // --- Save cart to localStorage on any change ---
  useEffect(() => {
    // Only save to localStorage if cart is not loading
    if (!isCartLoading) {
      if (cartItems.length > 0) {
        localStorage.setItem("cart", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("cart");
      }
    }
  }, [cartItems, isCartLoading]);

  // --- NEW: Fetch modal data on load ---
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const reviewsRes = await fetch("http://localhost:5000/api/reviews", {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setAllReviews(reviewsData);
          const myReviews = reviewsData.filter(r => r.customerName === userName);
          setReviewedProductIds(new Set(myReviews.map(r => r.productId)));
        } else {
          console.warn("Could not fetch all reviews (user may not be admin)");
        }
        
      } catch (err) {
        console.error("Error fetching review data:", err.message);
      }
    };
    
    // Only fetch if token/user exists
    if (token && userName) {
      fetchReviewData();
    }
  }, [token, userName]);


  const goBack = () => navigate(-1);

  const handleIncrease = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const handleDecrease = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 }
          : item
      )
    );
  };

  const handleRemove = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheck = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  const handleCheckAll = (e) => {
    const isChecked = e.target.checked;
    setCartItems(prev => prev.map(item => ({ ...item, checked: isChecked })));
  };

  // Compute total only for checked items
  const checkedItems = cartItems.filter((item) => item.checked);
  const total = checkedItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const formatPrice = (price) => {
    return `Php ${new Intl.NumberFormat('en-US').format(price)}.00`;
  };
  
  // --- NEW: Handle Checkout ---
  const handleCheckout = async () => {
    if (!userId || !token) { 
      alert("Please log in to check out.");
      navigate("/login");
      return;
    }
    
    if (checkedItems.length === 0) {
      alert("Please select items to check out.");
      return;
    }

    const orderPayload = {
      customer_id: userId,
      items: checkedItems.map(item => ({
        id: item.id,
        qty: item.qty,
        price: item.price
      })),
      total_amount: total,
      payment_method: paymentMethod
    };
    
    try {
      const response = await fetch("http://localhost:5000/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Send the token
        },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Checkout failed.");
      }
      
      alert("Order placed successfully! You will be redirected to your profile.");
      
      // Remove checked items from cart
      setCartItems(prev => prev.filter(item => !item.checked));
      
      // Navigate to profile page to see the new "Pending" order
      navigate("/orderss");
      
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Error: " + err.message);
    }
  };

  // --- NEW: Helper functions for Modal ---
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span key={ratingValue} className={ratingValue <= rating ? 'on' : 'off'}>
          ★
        </span>
      );
    });
  };
  
  const getFurnitureImages = (product) => {
    if (!product) return [];
    const images = [
      product.image_link_1,
      product.image_link_2,
      product.image_link_3,
      product.image_link_4,
      product.image_link_5,
    ];
    return images.filter(Boolean); 
  };

  // --- NEW: Modal Handlers ---
  const openProductModal = (productId) => {
    if (!productId) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
      alert("Product details not found. This item may be from an old session and will be removed.");
      // Self-heal: remove the bad item
      setCartItems(prev => prev.filter(item => item.id !== productId));
      return;
    }
    
    const fetchReviewsForProduct = async (prodId) => {
      setLoadingModal(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${prodId}/reviews`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const data = await res.json();
        
        data.sort((a, b) => {
          if (a.customerName === userName) return -1;
          if (b.customerName === userName) return 1;
          return 0; 
        });
        
        setProductModalReviews(data);
        
        const existingReview = data.find(r => r.customerName === userName);
        if (existingReview) {
          setReviewedProductIds(prev => new Set(prev).add(prodId));
        }

      } catch (err) {
        console.error(err.message);
        setProductModalReviews([]);
      } finally {
        setLoadingModal(false);
      }
    };
    
    fetchReviewsForProduct(productId);
    
    setSelectedProduct(product);
    setProductModalImage(product.image_link_1 || product.image_link_2 || product.image_link_3 || product.image_link_4 || product.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => setIsProductModalOpen(false);
  
  const handleOrderNow = (product) => {
    setConfirmationOrderDetails({
      product: product,
      total: product.price,
      quantity: 1
    });
    setPaymentMethod("Cash on Delivery"); 
    setIsProductModalOpen(false); 
    setIsConfirmationModalOpen(true); 
  };
  
  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setConfirmationOrderDetails(null);
  };
  
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!confirmationOrderDetails || !userId) return;

    const { product, total } = confirmationOrderDetails;
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${product.id}/order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          customer_id: userId,
          payment_method: paymentMethod,
          total_amount: total,
          product_id: product.id, 
          quantity: 1, 
          order_price: product.price
        })
      });
       if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to place order.");
      }
      alert("Order placed! It is now in your 'Pending' list.");
      closeConfirmationModal();
      navigate("/profile_user");
    } catch (err) {
       alert("Error: " + err.message);
    }
  };
  
  // This is for the modal "Add to Cart" button
  const handleAddToCartInModal = (product) => {
     if (!userId) {
      alert("Please log in to add items to your cart.");
      navigate("/login");
      return;
    }
    
    setCartItems((prev) => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: 1,
          checked: true 
        };
        return [...prev, cartItem];
      }
    });
    
    alert(`${product.name} added to cart!`);
  };

  return (
    <>
      <style>{`
        /* --- Global --- */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        .uc-page {
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        /* --- Header --- */
        .uc-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 40px;
          background-color: #fff;
          border-bottom: 1px solid #ddd;
        }
        .uc-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .uc-back-btn:hover {
          background-color: #f0f0f0;
        }
        .uc-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #485168;
        }
        .uc-header-title i {
          font-size: 1.8rem;
        }
        .uc-header-title h1 {
          font-size: 1.8rem;
          font-weight: 600;
        }
        
        /* --- Main Layout --- */
        .uc-cart-container {
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 30px;
          padding: 30px 40px;
          align-items: flex-start;
        }
        
        /* --- Cart Items Table --- */
        .uc-cart-items {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .uc-cart-table {
          width: 100%;
          border-collapse: collapse;
        }
        .uc-cart-table thead tr {
          border-bottom: 2px solid #f0f0f0;
        }
        .uc-cart-table th {
          padding: 15px 20px;
          text-align: left;
          font-size: 0.9rem;
          color: #555;
          text-transform: uppercase;
        }
        .uc-cart-table tbody tr {
          border-bottom: 1px solid #f0f0f0;
        }
        .uc-cart-table tbody tr:last-child {
          border-bottom: none;
        }
        .uc-cart-table td {
          padding: 20px;
          vertical-align: middle;
        }
        .uc-product-img {
          width: 80px;
          height: 80px;
          background-color: #f0f0f0;
          border-radius: 8px;
          background-image: url('https://placehold.co/100x100/e2e8f0/64748b?text=Img');
          background-size: cover;
        }
        .uc-product-name {
          font-weight: 600;
          font-size: 1.1rem;
        }
        /* --- NEW: Clickable Product Name --- */
        .uc-product-name.clickable {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }
        .uc-product-name.clickable:hover {
          color: #2563eb;
        }
        
        .uc-quantity-control {
          display: flex;
          align-items: center;
        }
        .uc-qty-btn {
          width: 30px;
          height: 30px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
        }
        .uc-qty-number {
          width: 40px;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 500;
        }
        .uc-price {
          font-weight: 600;
          font-size: 1.1rem;
          color: #333;
        }
        .uc-remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        /* --- Order Summary --- */
        .uc-order-summary {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          padding: 20px;
          position: sticky;
          top: 30px;
        }
        .uc-order-summary h2 {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .uc-summary-details p {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          color: #555;
          margin-bottom: 10px;
        }
        .uc-summary-total {
          border-top: 2px solid #333;
          padding-top: 15px;
          margin-top: 15px;
        }
        .uc-summary-total p {
          font-size: 1.2rem;
          font-weight: 700;
          color: #000;
        }
        .uc-checkout-btn {
          width: 100%;
          padding: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          background-color: #4a552b;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 20px;
        }
        .uc-checkout-btn:hover {
          background-color: #3d4823;
        }
        .uc-checkout-btn.disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        /* --- Payment Method --- */
        .uc-payment-method {
          margin-top: 20px;
        }
        .uc-payment-method label {
          font-size: 1rem;
          font-weight: 500;
          color: #333;
          display: block;
          margin-bottom: 10px;
        }
        .uc-payment-method select {
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        /* --- Responsive --- */
        @media (max-width: 900px) {
          .uc-cart-container {
            grid-template-columns: 1fr;
          }
          .uc-cart-table {
            /* Better for mobile */
            display: block;
            width: 100%;
          }
          .uc-cart-table thead { display: none; }
          .uc-cart-table tbody, .uc-cart-table tr, .uc-cart-table td {
            display: block;
            width: 100% !important;
          }
          .uc-cart-table tr {
            border-bottom: 1px solid #ddd;
            padding: 10px 0;
          }
          .uc-cart-table td {
            padding: 5px 10px;
            border: none;
          }
          .uc-product-img {
            display: none; /* Hide image on mobile to save space */
          }
        }
        
        /* --- ALL MODAL STYLES --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background-color: #fff;
          padding: 30px 40px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .modal-content h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
          text-align: center;
        }
        .modal-form .form-group {
          margin-bottom: 15px;
        }
        .modal-form label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 5px;
          color: #555;
        }
        .modal-form input,
        .modal-form textarea,
        .modal-form select {
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
        }
        .modal-form textarea {
          resize: vertical;
          min-height: 80px;
        }
        .modal-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 10px;
          height: 1.2em;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .cancel-btn, .save-btn, .submit-review-btn, .confirm-order-btn {
          flex: 1;
          height: 45px;
          padding: 12px 0;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          font-size: 15px;
        }
        .cancel-btn {
          background-color: #eee;
          color: #555;
          border: 1px solid #ccc;
        }
        .cancel-btn:hover {
          background-color: #ddd;
        }
        .save-btn, .submit-review-btn, .confirm-order-btn {
          background-color: #485168;
          color: white;
        }
        .save-btn:hover, .submit-review-btn:hover, .confirm-order-btn:hover {
          background-color: #3a4255;
        }
        
        /* --- Star Rating --- */
        .star-rating {
          display: flex;
          justify-content: center;
          gap: 5px;
          font-size: 2rem;
          margin-bottom: 15px;
        }
        .star-rating span {
          cursor: pointer;
          color: #ccc;
        }
        .star-rating span.on {
          color: #f59e0b;
        }
        
        /* --- Product Detail/Review Modal Styles --- */
        .product-modal-content {
           background-color: white;
           border-radius: 12px;
           width: 90%;
           max-width: 900px;
           max-height: 90vh;
           overflow: hidden;
           box-shadow: 0 5px 15px rgba(0,0,0,0.3);
           display: flex;
           flex-direction: column;
           padding: 0;
        }
        .product-modal-body {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 25px;
          padding: 25px;
          overflow-y: auto;
        }
        .modal-gallery {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modal-main-image img {
          width: 100%;
          height: 350px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .modal-thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .modal-thumbnail-grid img {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .modal-thumbnail-grid img:hover {
          border-color: #999;
        }
        .modal-thumbnail-grid img.active {
          border-color: #3b82f6;
        }
        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 15px; 
          min-height: 420px; /* Match gallery height */
        }
        .modal-details h2 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
          text-align: left;
        }
        .modal-details h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
          text-align: left;
        }
        .modal-details .price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 0; 
        }
        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 0; 
        }
        .info-item {
          background-color: #f8f8f8;
          padding: 10px;
          border-radius: 6px;
        }
        .info-item label {
          display: block;
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .info-item span {
          font-size: 1rem;
          font-weight: 600;
        }
        .modal-description {
          font-size: 0.95rem;
          color: #333;
          line-height: 1.6;
          flex-grow: 1;
          background-color: #f8f8f8; 
          padding: 10px; 
          border-radius: 6px; 
        }
        .modal-description h3 {
           font-size: 1rem;
           font-weight: 600;
           margin-bottom: 5px;
           padding-bottom: 0;
           border-bottom: none;
           text-align: left;
        }
        .modal-reviews {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-height: 150px;
        }
        .modal-reviews h3 {
           margin-bottom: 10px;
           padding-bottom: 0;
           border-bottom: none;
           text-align: left;
        }
        .reviews-list {
          flex: 1;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 10px;
        }
        .review-item {
          border-bottom: 1px solid #f0f0f0;
          padding: 10px 0;
        }
        .review-item-user {
          background-color: #eef2ff;
          border-left: 4px solid #3b82f6;
          padding: 10px;
          margin: 0 -10px;
          border-radius: 4px;
        }
        .review-item:last-child {
          border-bottom: none;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .review-name {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .review-rating {
          font-size: 1.1rem;
          color: #f59e0b;
        }
        .review-comment {
          font-size: 0.9rem;
          color: #444;
        }
        .product-modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0;
          border-top: 1px solid #eee;
          padding: 15px 25px;
          background-color: #f9fafb;
        }
        .product-modal-actions .action-buttons-group {
          display: flex;
          gap: 10px;
        }
        .close-btn {
          background-color: #485168;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .ud-action-btn {
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
          background-color: #6b7280;
          color: white;
          display: flex;
          align-items: center;
          gap: 5px; 
          transition: background-color 0.2s;
        }
        .ud-action-btn:hover {
          background-color: #4b5563;
        }
        .ud-action-btn:disabled {
          background-color: #b0b0b0;
          cursor: not-allowed;
        }
        .ud-action-btn span { 
          font-size: 1.1em;
          line-height: 1;
        }
        
        .confirmation-receipt {
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eee;
          padding: 15px;
          margin-bottom: 15px;
        }
        .receipt-item {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .receipt-item strong {
          color: #333;
        }
        .receipt-total {
          border-top: 2px solid #ddd;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 1.2rem;
          font-weight: bold;
        }
      `}</style>
      <UserNavbar navigate={navigate} />

      <div className="uc-page">
        {/* HEADER */}
        <header className="uc-header">
          <div className="uc-back-btn" onClick={goBack}>
            &larr;
          </div>
          <div className="uc-header-title">
            <h1>Your Shopping Cart</h1>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="uc-cart-container">
          {/* LEFT SECTION */}
          <section className="uc-cart-items">
            <table className="uc-cart-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={handleCheckAll}
                      checked={cartItems.length > 0 && checkedItems.length === cartItems.length}
                    />
                  </th>
                  <th>Product</th>
                  <th>Details</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isCartLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>
                      Loading cart items...
                    </td>
                  </tr>
                ) : cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleCheck(item.id)}
                        />
                      </td>
                      <td>
                        <div 
                          className="uc-product-img" 
                          style={{
                            backgroundImage: `url(${item.image || 'https://placehold.co/100x100/e2e8f0/64748b?text=Img'})`
                          }}
                        ></div>
                      </td>
                      {/* --- MODIFIED: Added onClick and className --- */}
                      <td 
                        className="uc-product-name clickable"
                        onClick={() => openProductModal(item.id)}
                      >
                        {item.name}
                      </td>
                      <td className="uc-quantity-control">
                        <button
                          className="uc-qty-btn"
                          onClick={() => handleDecrease(item.id)}
                        >
                          -
                        </button>
                        <span className="uc-qty-number">{item.qty}</span>
                        <button
                          className="uc-qty-btn"
                          onClick={() => handleIncrease(item.id)}
                        >
                          +
                        </button>
                      </td>
                      <td className="uc-price">
                        {formatPrice(item.price * item.qty)}
                      </td>
                      <td>
                        <button
                          className="uc-remove-btn"
                          onClick={() => handleRemove(item.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>
                      Your cart is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* RIGHT SECTION */}
          <aside className="uc-order-summary">
            <h2>Order Summary</h2>
            <div className="uc-summary-details">
              <p>
                Subtotal: <span>{formatPrice(total)}</span>
              </p>
            </div>
            
            <div className="uc-payment-method">
              <label htmlFor="payment">Payment Method</label>
              <select 
                id="payment" 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="GCash">GCash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            
            <div className="uc-summary-total">
              <p>
                Total: <span>{formatPrice(total)}</span>
              </p>
            </div>
            
            <button
              className={`uc-checkout-btn ${total === 0 ? "disabled" : ""}`}
              onClick={handleCheckout}
              disabled={total === 0}
            >
              CHECK OUT!
            </button>


          </aside>
        </main>
      </div>

      {/* --- NEW: Product Detail Modal --- */}
      {isProductModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-body">
              <div className="modal-gallery">
                <div className="modal-main-image">
                  <img 
                    src={productModalImage} 
                    alt={selectedProduct.name} 
                    onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'}
                  />
                </div>
                <div className="modal-thumbnail-grid">
                  {getFurnitureImages(selectedProduct).map((imgSrc, index) => (
                    <img 
                      key={index}
                      src={imgSrc} 
                      alt={`${selectedProduct.name} thumbnail ${index + 1}`}
                      className={productModalImage === imgSrc ? 'active' : ''}
                      onClick={() => setProductModalImage(imgSrc)}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-details">
                <h2>{selectedProduct.name}</h2>
                <span className="price">{formatPrice(selectedProduct.price)}</span>
                <div className="modal-info-grid">
                  <div className="info-item">
                    <label>Category</label>
                    <span>{selectedProduct.category}</span>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <span>{selectedProduct.type}</span>
                  </div>
                  <div className="info-item">
                    <label>Stock</label>
                    <span>{selectedProduct.stock} units</span>
                  </div>
                  <div className="info-item">
                    <label>Dimensions (L x W x H)</label>
                    <span>
                      {selectedProduct.dimensions?.length || 'N/A'}cm x 
                      {selectedProduct.dimensions?.width || 'N/A'}cm x 
                      {selectedProduct.dimensions?.height || 'N/A'}cm
                    </span>
                  </div>
                </div>
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>
                    {selectedProduct.description || "No description provided."}
                  </p>
                </div>
                <div className="modal-reviews">
                    <h3>Reviews</h3>
                    <div className="reviews-list">
                      {loadingModal ? (
                        <p>Loading reviews...</p>
                      ) : productModalReviews.length > 0 ? (
                        productModalReviews.map(review => (
                          <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                            <div className="review-header">
                              <span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span>
                              <span className="review-rating">{renderStars(review.rating)}</span>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews for this product yet.</p>
                      )}
                    </div>
                </div>
              </div>
            </div>
            <div className="product-modal-actions">
              <div className="action-buttons-group">
                <button 
                  className="ud-action-btn"
                  onClick={() => handleAddToCartInModal(selectedProduct)}
                >
                  <span>🛒</span> Add to Cart
                </button>
                {/* Review button removed from cart modal */}
                <button className="ud-action-btn" onClick={() => handleOrderNow(selectedProduct)}>
                  <span>&#8634;</span> Buy Now
                </button>
              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- NEW: Order Confirmation Modal --- */}
      {isConfirmationModalOpen && confirmationOrderDetails && (
        <div className="modal-overlay" onClick={closeConfirmationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Your Order</h2>
            <form onSubmit={handleConfirmOrder} className="modal-form">
              
              <div className="confirmation-receipt">
                <div className="receipt-item">
                  <span>{confirmationOrderDetails.product.name} (x1)</span>
                  <strong>{formatPrice(confirmationOrderDetails.product.price)}</strong>
                </div>
                <div className="receipt-item receipt-total">
                  <span>Total</span>
                  <strong>{formatPrice(confirmationOrderDetails.total)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select 
                  id="paymentMethod" 
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="GCash">GCash</option>
                  <option value_ ="Credit Card">Credit Card (Mock)</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeConfirmationModal}>Cancel</button>
                <button type="submit" className="confirm-order-btn">Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}