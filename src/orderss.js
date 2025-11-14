import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link
import "./profile_user.css"; // Styles are embedded
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
//         {/* MODIFIED: Link to /profile */}
//         <span onClick={() => navigate("/profile")} title="My Profile" style={{textDecoration: 'none', cursor: 'pointer'}}>👤</span>
//       </div>
//     </nav>
//   );
// };
// --- End Placeholder ---

// --- NEW: Placeholder for Footer ---
const Footer = () => (
  <footer style={{ padding: '40px', backgroundColor: '#333', color: 'white', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
    <strong>© 2023 Nest Nook. All rights reserved.</strong>
  </footer>
);
// --- End Placeholder ---


function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Data ---
  // const [user, setUser] = useState(null); // Removed Profile State
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("All"); 

  // --- NEW: State for all products/reviews (for modal) ---
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set()); // <-- NEW
  // --- NEW: Add state for completed product IDs ---
  const [completedProductIds, setCompletedProductIds] = useState(new Set());

  // --- State for Profile Edit Modal (REMOVED) ---
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [editForm, setEditForm] = useState(...);
  // const [modalError, setModalError] = useState("");

  // --- State for Review Modal ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null); 
  const [reviewProduct, setReviewProduct] = useState(null); // <-- NEW: Store product for review
  const [reviewProductId, setReviewProductId] = useState(""); // <-- FIXED: Added missing state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  // --- State for Product Detail Modal ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false); // <-- FIXED: Added missing state

  // --- State for Order Confirmation Modal ---
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  // --- MODIFIED: Get token from localStorage ---
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName"); 

  // --- Helper Functions (Moved inside component) ---
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };

  const renderStars = (rating, interactive = false, onStarClick = () => {}) => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span 
          key={ratingValue}
          className={interactive ? (ratingValue <= rating ? 'on interactive' : 'off interactive') : (ratingValue <= rating ? 'on' : 'off')}
          onClick={() => interactive && onStarClick(ratingValue)}
        >
          ★
        </span>
      );
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!userId || !token) { // Check for token too
      navigate("/login"); 
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // --- MODIFIED: Removed profileRes ---
      const [ordersRes, productsRes, reviewsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/profile/me/orders`, { // Changed to /me/orders
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/products`), // Public
        fetch(`http://localhost:5000/api/reviews`, { // Admin-only, might fail
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!ordersRes.ok) throw new Error("Failed to fetch your orders.");
      if (!productsRes.ok) throw new Error("Failed to fetch products.");
      
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      
      let reviewsData = [];
      if (reviewsRes.ok) { // Only process if admin
        reviewsData = await reviewsRes.json();
      } else {
        console.warn("Could not fetch all reviews (user may not be admin).");
      }

      // setUser(profileData); // Removed
      setAllOrders(ordersData);
      setFilteredOrders(ordersData); 
      setAllProducts(productsData); 
      setAllReviews(reviewsData); 

      const myReviews = reviewsData.filter(r => r.customerName === userName);
      const reviewedIds = new Set(myReviews.map(r => r.productId));
      setReviewedProductIds(reviewedIds);

      // --- NEW: Calculate completed product IDs ---
      const completedIds = new Set();
      ordersData.forEach(order => {
        if (order.status === 'Completed') {
          order.products.forEach(p => {
            completedIds.add(p.id);
          });
        }
      });
      setCompletedProductIds(completedIds);
      // --- END NEW ---
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate, token]); // Added token

  // --- Filtering Effect ---
  useEffect(() => {
    if (activeStatus === "All") {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(allOrders.filter(order => order.status === activeStatus));
    }
  }, [activeStatus, allOrders]);

  // --- Profile Modal & Form Handlers (REMOVED) ---
 
  // --- Review Modal Handlers ---
  const openReviewModal = (order, product = null) => {
    let productToReview;
    if (product) {
      productToReview = product;
      setReviewOrder(null);
    } else {
      // Find the first product in the order that isn't reviewed yet
      const firstUnreviewed = order.products.find(p => !reviewedProductIds.has(p.id));
      
      // If all are reviewed, tell the user and stop
      if (!firstUnreviewed) {
        alert("You have already reviewed all products in this order.");
        return;
      }
      
      // Find the full product data for the unreviewed item
      productToReview = allProducts.find(p => p.id === firstUnreviewed.id);
      setReviewOrder(order); 
    }
    
    if (!productToReview) {
      alert("Error: Product details not found.");
      return;
    }
    
    setReviewProduct(productToReview); 
    setReviewProductId(productToReview.id); 
    
    // Get all reviews for *this* product
    const reviews = allReviews.filter(r => r.productId === productToReview.id);
    
    // Sort to show the user's review first
    reviews.sort((a, b) => {
      if (a.customerName === userName) return -1;
      if (b.customerName === userName) return 1;
      return 0;
    });
    setProductModalReviews(reviews); 

    setProductModalImage(productToReview.image_link_1 || productToReview.image_link_2 || 'https://placehold.co/600x400');
    
    // Check if user already left a review for this product
    const existingReview = reviews.find(r => r.customerName === userName);
    if (existingReview) {
        setReviewRating(existingReview.rating);
        setReviewComment(existingReview.comment);
    } else {
        setReviewRating(0);
        setReviewComment("");
    }
    
    setReviewError("");
    setIsReviewModalOpen(true);
    setIsProductModalOpen(false); // Close product modal if it was open
  };
  
  const closeReviewModal = () => setIsReviewModalOpen(false);
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (reviewRating === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: reviewProductId,
          customer_id: userId,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit review.");
      }
      alert("Review submitted successfully!");
      closeReviewModal();
      fetchData(); // Refresh all data to update review status
    } catch(err) {
      setReviewError(err.message);
    }
  };

  // --- Product Modal Handlers ---
  const openProductModal = (productId) => {
    if (!productId) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // --- NEW: Fetch product-specific reviews ---
    const fetchReviewsForProduct = async (prodId) => {
      setLoadingModal(true);
      try {
        // This route is public, so no token needed
        const res = await fetch(`http://localhost:5000/api/products/${prodId}/reviews`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const data = await res.json();
        
        data.sort((a, b) => {
          if (a.customerName === userName) return -1;
          if (b.customerName === userName) return 1;
          return 0; 
        });
        
        setProductModalReviews(data);
        
        // Check if user has reviewed this product
        const existingReview = data.find(r => r.customerName === userName);
        if (existingReview) {
          // Add to set to disable button
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
  
  const getFurnitureImages = (product) => {
    if (!product) return [];
    const images = [
      product.image_link_1,
      product.image_link_2,
      product.image_link_3,
      product.image_link_4,
      product.image_link_5,
    ];
    return images.filter(Boolean); // Filters out null/undefined/empty strings
  };
  
  // --- Order Action Handlers ---
  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        // --- MODIFIED: Added Authorization Header ---
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to cancel order.");
        }
        alert("Order cancelled.");
        fetchData(); // Refresh data
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleReorder = async (orderId) => {
    if (window.confirm("Place this order again?")) {
      try {
        // --- MODIFIED: Added Authorization Header ---
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/reorder`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to reorder.");
        }
        alert("Order has been placed again! It is now in your 'Pending' list.");
        setActiveStatus("Pending"); // Switch tab to show new order
        fetchData(); // Refresh data
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  // --- Single Product "Buy Now" ---
  const handleOrderNow = (product) => {
    setConfirmationOrderDetails({
      product: product,
      total: product.price,
      quantity: 1
    });
    setPaymentMethod("Cash on Delivery"); 
    setIsProductModalOpen(false); // Close product modal
    setIsConfirmationModalOpen(true); // Open confirmation modal
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
      // --- MODIFIED: Added Authorization Header ---
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
      setActiveStatus("Pending");
      fetchData();
    } catch (err) {
       alert("Error: " + err.message);
    }
  };
  
  // --- NEW: Add to Cart Handler ---
  const handleAddToCart = (product) => {
    if (!userId) {
      alert("Please log in to add items to your cart.");
      navigate("/login");
      return;
    }
    
    const rawCart = localStorage.getItem("cart");
    let cart = rawCart ? JSON.parse(rawCart) : [];

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      cart = cart.map(item => 
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      );
    } else {
      // Find the full product from allProducts to get image
      const productData = allProducts.find(p => p.id === product.id);
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: productData?.image || 'https://placehold.co/100x100', // Use image from allProducts
        qty: 1,
        checked: true 
      };
      cart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };
  
  const goBack = () => navigate("/shop");


  return (
    <div className="ud-container">
      <style>{`
        /* --- Global --- */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        .ud-container {
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        /* --- Go Back Button --- */
        .uc-back-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 40px 0;
          cursor: pointer;
        }
        .uc-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #fff;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .uc-back-btn:hover {
          background-color: #f0f0f0;
        }
        .uc-back-text {
          font-weight: 500;
          font-size: 1rem;
          color: #333;
        }

        /* --- Main Content --- */
        .ud-main-content {
          padding: 20px 40px;
        }
        
        /* --- Main Grid Layout --- */
        .ud-main-grid {
          display: grid;
          /* --- MODIFIED: Changed from 3 columns to 2 --- */
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start; /* Changed from stretch */
        }
        @media (max-width: 1200px) {
          .ud-main-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .ud-section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          background-color: #8c7a6b; /* Brown color from screenshot */
          margin: 0;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
        }
        
        .ud-grid-item {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 400px;
          max-height: 500px; 
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden; 
        }
        
        .ud-grid-item-content {
          padding: 20px;
          overflow-y: auto; 
          flex-grow: 1;
        }
        
        .ud-orders .ud-grid-item-content {
           background-color: #f7f3e8; /* Cream color */
        }

        /* --- Order Status Section --- */
        .ud-order-status {
          display: grid;
          grid-template-columns: repeat(3, 1fr); 
          gap: 10px; 
        }
        
        @media (max-width: 500px) {
          .ud-order-status {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .ud-status-box {
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 10px 5px; 
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border-bottom: 3px solid #ccc;
          font-size: 0.9rem; 
          white-space: nowrap; 
        }
        .ud-status-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .ud-status-box.active {
          border: 2px solid #08112b;
          border-bottom-width: 3px;
          font-weight: 600;
          color: #08112b;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          background-color: #fff;
        }
        .ud-status-box p {
          font-weight: 500;
          color: #333;
        }

        /* --- Results Section --- */
        .ud-results-list {
          overflow-y: auto; 
          flex-grow: 1;
        }
        
        .ud-placeholder-text {
          color: #777;
          font-style: italic;
          text-align: center;
          padding-top: 50px;
        }
        .ud-order-card {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #fff; 
        }
        .ud-order-card:nth-child(even) {
          background-color: #f9f9f9; 
        }
        
        .ud-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .ud-order-id {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .ud-order-status-badge {
          font-weight: 500;
          font-size: 0.9rem;
          padding: 4px 10px;
          border-radius: 20px;
          color: #fff;
        }
        .ud-order-status-badge.Pending { background-color: #ef4444; }
        .ud-order-status-badge.To-Ship { background-color: #f59e0b; }
        .ud-order-status-badge.To-Receive { background-color: #3b82f6; }
        .ud-order-status-badge.Completed { background-color: #10b981; }
        .ud-order-status-badge.Cancelled { background-color: #6b7280; }
        
        .ud-order-body {
          font-size: 0.95rem;
          color: #555;
        }
        .ud-order-body p {
          margin-bottom: 5px;
        }
        
        .ud-order-products-list {
          font-size: 0.95rem;
          color: #555;
        }
        .ud-order-product-item {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          display: block;
          margin-bottom: 3px;
        }
        .ud-order-product-item:hover {
          color: #2563eb;
        }
        
        .ud-order-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-start; /* Float left */
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        .ud-action-btn {
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
          background-color: #6b7280; /* Consistent color */
          color: white;
          display: flex;
          align-items: center;
          gap: 5px; 
          transition: background-color 0.2s;
        }
        .ud-action-btn:hover {
          background-color: #4b5563; /* Consistent hover */
        }
        .ud-action-btn:disabled {
          background-color: #b0b0b0;
          cursor: not-allowed;
        }
        .ud-action-btn span { 
          font-size: 1.1em;
          line-height: 1;
        }


        /* --- Profile Section (REMOVED) --- */

        
        /* --- Modal Styles --- */
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
        .star-rating span.interactive:hover,
        .star-rating span.interactive.on:hover ~ span { /* Fix hover effect */
          color: #f59e0b;
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
        
        /* --- NEW: Confirmation Modal Styles --- */
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
        
        @media (max-width: 900px) {
          .modal-body {
            grid-template-columns: 1fr;
          }
        }
         /* ✅ FIX: Make "Write a Review" modal scrollable and compact */
.product-modal-content.review-mode {
  width: 95%;
  max-width: 450px !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  padding: 15px !important;
}

/* Force the layout to stack vertically */
.review-mode .product-modal-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 15px !important;
  padding: 0 !important;
}

/* Main image */
.review-mode .modal-main-image img {
  width: 100% !important;
  height: 180px !important;
  object-fit: cover;
  border-radius: 8px;
}

/* Thumbnail row becomes scrollable */
.review-mode .modal-thumbnail-grid {
  display: flex !important;
  gap: 10px;
  overflow-x: auto;
}
.review-mode .modal-thumbnail-grid img {
  width: 60px !important;
  height: 60px !important;
  flex-shrink: 0;
}

/* Product title */
.review-mode .modal-details h2,
.review-mode .modal-details h3 {
  text-align: center !important;
  margin: 5px 0 !important;
}

/* Rating stars */
.review-mode .star-rating {
  font-size: 1.6rem !important;
}

/* Textarea */
.review-mode textarea {
  min-height: 80px !important;
  font-size: 0.95rem;
}

/* Existing reviews list */
.review-mode .reviews-list {
  max-height: 150px !important;
  overflow-y: auto !important;
  background: #f8f8f8;
  border-radius: 6px;
  padding: 10px;
}

/* Review items */
.review-mode .review-item {
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}
.review-mode .review-item:last-child {
  border-bottom: none;
}

/* Buttons */
.review-mode .product-modal-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  justify-content: space-between;
}

      `}</style>
      <UserNavbar navigate={navigate} />
      <div className="uc-back-wrapper">
        <div className="uc-back-btn" onClick={goBack}>
          &larr;
        </div>
        <span className="uc-back-text">Go Back</span>
      </div>

      {loading ? (
        <p className="ud-placeholder-text">Loading your profile...</p>
      ) : error ? (
        <p className="ud-placeholder-text" style={{color: 'red'}}>{error}</p>
      ) : (
        <>
          {/* MAIN CONTENT */}
          <main className="ud-main-content">
            <div className="ud-main-grid">
              
              <section className="ud-grid-item ud-orders">
                <h2 className="ud-section-title">CHECK ORDERS BY STATUS</h2>
                <div className="ud-grid-item-content">
                  <div className="ud-order-status">
                    <div className={`ud-status-box ${activeStatus === 'All' ? 'active' : ''}`} onClick={() => setActiveStatus("All")}>
                      <p>All ({allOrders.length})</p>
                    </div>
                    {/* --- MODIFIED: "To Pay" is now "Pending" --- */}
                    <div className={`ud-status-box ${activeStatus === 'Pending' ? 'active' : ''}`} onClick={() => setActiveStatus("Pending")}>
                      <p>Pending</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'To Ship' ? 'active' : ''}`} onClick={() => setActiveStatus("To Ship")}>
                      <p>To Ship</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'To Receive' ? 'active' : ''}`} onClick={() => setActiveStatus("To Receive")}>
                      <p>To Receive</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'Completed' ? 'active' : ''}`} onClick={() => setActiveStatus("Completed")}>
                      <p>Completed</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'Cancelled' ? 'active' : ''}`} onClick={() => setActiveStatus("Cancelled")}>
                      <p>Cancelled</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="ud-grid-item ud-results">
                <h2 className="ud-section-title">RESULTS ({filteredOrders.length})</h2>
                <div className="ud-results-list ud-grid-item-content">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                      const unreviewedProducts = order.products.filter(p => !reviewedProductIds.has(p.id));
                      const allReviewed = unreviewedProducts.length === 0;

                      return (
                        <div className="ud-order-card" key={order.id}>
                          <div className="ud-order-header">
                            <span className="ud-order-id">Order ID: {order.orderId}</span>
                            <span className={`ud-order-status-badge ${order.status.replace(/\s+/g, '-')}`}>{order.status}</span>
                          </div>
                          <div className="ud-order-body">
                            <p><strong>Date:</strong> {formatDate(order.date)}</p>
                            {/* --- MODIFIED: Added Payment Method --- */}
                            <p><strong>Payment:</strong> {order.payment}</p>
                            <div className="ud-order-products-list">
                              <strong>Items:</strong>
                              {order.products.map(p => (
                                <span 
                                  key={p.id} 
                                  className="ud-order-product-item" 
                                  onClick={() => openProductModal(p.id)}
                                >
                                  {p.quantity}x {p.name} {reviewedProductIds.has(p.id) ? "(Reviewed)" : ""}
                                </span>
                              ))}
                            </div>
                            <p style={{marginTop: '5px'}}><strong>Total:</strong> {formatPrice(order.total)}</p>
                          </div>
                          <div className="ud-order-actions">
                            {(order.status === "Pending" || order.status === "To Ship") && (
                              <button className="ud-action-btn" onClick={() => handleCancelOrder(order.id)}>
                                <span>&#10005;</span> Cancel
                              </button>
                            )}
                            {order.status === "Completed" && (
                              <button 
                                className="ud-action-btn" 
                                onClick={() => openReviewModal(order, null)}
                                disabled={allReviewed}
                              >
                                <span>&#9998;</span> {allReviewed ? "Reviewed" : "Review"}
                              </button>
                            )}
                            {(order.status === "Completed" || order.status === "Cancelled") && (
                              <button className="ud-action-btn" onClick={() => handleReorder(order.id)}>
                                <span>&#8634;</span> Buy Again
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="ud-placeholder-text">No orders found for this status.</p>
                  )}
                </div>
              </section>

              {/* --- PROFILE SECTION (REMOVED) --- */}

            </div>
          </main>
        </>
      )}
      
      {/* --- Edit Profile Modal (REMOVED) --- */}
      
      {/* --- Review Modal --- */}
      {isReviewModalOpen && reviewProduct && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content product-modal-content review-mode" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleReviewSubmit} className="modal-form">
              <div className="product-modal-body">
                <div className="modal-gallery">
                  <div className="modal-main-image">
                    <img 
                      src={productModalImage} 
                      alt={reviewProduct.name} 
                      onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'}
                    />
                  </div>
                  <div className="modal-thumbnail-grid">
                    {getFurnitureImages(reviewProduct).map((imgSrc, index) => (
                      <img 
                        key={index}
                        src={imgSrc} 
                        alt={`${reviewProduct.name} thumbnail ${index + 1}`}
                        className={productModalImage === imgSrc ? 'active' : ''}
                        onClick={() => setProductModalImage(imgSrc)}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-details">
                  <h2>Write a Review</h2>
                  <h3>{reviewProduct.name}</h3>
                  
                  {reviewOrder && reviewOrder.products.length > 1 && (
                    <div className="form-group">
                      <label htmlFor="product">Select Product to Review</label>
                      <select 
                        id="product" 
                        name="product"
                        value={reviewProduct.id}
                        onChange={(e) => {
                          const newProd = allProducts.find(p => p.id === e.target.value);
                          setReviewProduct(newProd);
                          setReviewProductId(e.target.value); // Set ID for form submission
                          setProductModalImage(newProd.image_link_1 || 'https://placehold.co/600x400');
                        }}
                      >
                        {reviewOrder.products.map(p => {
                          // Find the full product data to show its name
                          const productData = allProducts.find(ap => ap.id === p.id);
                          return (
                            <option key={p.id} value={p.id}>{productData?.name || p.id}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Your Rating</label>
                    <div className="star-rating">
                      {renderStars(reviewRating, true, setReviewRating)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="comment">Your Comment</label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your thoughts about the product..."
                      style={{minHeight: '100px'}}
                    />
                  </div>
                  <div className="modal-error">{reviewError}</div>
                  
                  {/* --- NEW: Existing Reviews --- */}
                  <div className="modal-reviews" style={{minHeight: '100px'}}>
                      <h3>Existing Reviews</h3>
                     <div className="reviews-list" style={{maxHeight: '150px'}}>
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
                <button type="button" className="cancel-btn" onClick={closeReviewModal}>Cancel</button>
                <button type="submit" className="submit-review-btn">Submit Review</button>
              </div>

            </form>
          </div>
        </div>
      )}
      
      {/* --- Product Detail Modal --- */}
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
                {/* --- MODIFIED: Added Add to Cart Button --- */}
                <button 
                  className="ud-action-btn"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  <span>🛒</span> Add to Cart
                </button>
                
                {/* --- MODIFIED: Added new logic to disable review button --- */}
                {(() => {
                  const hasReviewed = reviewedProductIds.has(selectedProduct.id);
                  const canReview = completedProductIds.has(selectedProduct.id);
                  const isDisabled = !canReview || hasReviewed;
                  let title = "Write a review";
                  if (hasReviewed) title = "You have already reviewed this item.";
                  else if (!canReview) title = "You can only review products from a completed order.";

                  return (
                    <button 
                      className="ud-action-btn" 
                      onClick={() => openReviewModal(null, selectedProduct)}
                      disabled={isDisabled}
                      title={title}
                    >
                      <span>&#9998;</span> {hasReviewed ? "Reviewed" : "Write Review"}
                    </button>
                  );
                })()}

                <button className="ud-action-btn" onClick={() => handleOrderNow(selectedProduct)}>
                  <span>&#8634;</span> Order Now
                </button>
              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Order Confirmation Modal --- */}
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
                  <option value="Credit Card">Credit Card (Mock)</option>
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
    </div>
  );
};

export default UserDashboard;