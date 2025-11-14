import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // Import Link and useLocation
 import "./shop.css"; // Styles are embedded
 import UserNavbar from "./user-header"; // Using placeholder

// // --- Placeholder Components ---
// const UserNavbar = ({ navigate }) => { // Accept navigate as a prop
//   const [userName, setUserName] = useState("User");
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedName = localStorage.getItem("userName");
//       if (storedName) {
//         setUserName(storedName);
//       }
//     }
//   }, []);
  
//   // This is a simplified header for placeholder purposes
//   // The full header logic is in user-header.js
//   return (
//     <nav style={{ 
//       display: 'flex', 
//       justifyContent: 'space-between', 
//       alignItems: 'center', 
//       padding: '15px 40px', 
//       backgroundColor: '#fff', 
//       borderBottom: '2px solid #f0f0f0',
//       fontFamily: 'Poppins, sans-serif',
//       height: '82px', // Set fixed height
//       position: 'sticky',
//       top: 0,
//       zIndex: 900
//     }}>
//       <Link to="/shop" style={{textDecoration: 'none', color: '#08112b'}}>
//         <span style={{fontWeight: 'bold', fontSize: '1.5rem'}}>Nest & Nook</span>
//       </Link>
//       <span>Welcome back, {userName}!</span>
//       <div style={{display: 'flex', gap: '20px', fontSize: '1.5rem', cursor: 'pointer'}}>
//         {/* Use navigate prop */}
//         <span onClick={() => navigate("/cart")} title="Cart" style={{textDecoration: 'none', cursor: 'pointer'}}>🛒</span>
//         <span onClick={() => navigate("/profile_user")} title="My Orders" style={{textDecoration: 'none', cursor: 'pointer'}}>📦</span>
//         <span onClick={() => navigate("/profile")} title="My Profile" style={{textDecoration: 'none', cursor: 'pointer'}}>👤</span>
//       </div>
//     </nav>
//   );
// };

// const Footer = () => (
//   <footer style={{ padding: '40px', backgroundColor: '#333', color: 'white', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
//     <strong>© 2023 Nest Nook. All rights reserved.</strong>
//   </footer>
// );
// --- End Placeholders ---


// --- Main Shop Component ---
export default function Shop() {
  const navigate = useNavigate(); // Defined at the top level
  const categoryRefs = useRef({}); // For auto-scrolling
  const location = useLocation(); // --- NEW: For auto-scrolling ---

  // --- State for Data ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [categories, setCategories] = useState([]); // [{ name, types: [name, ...], products: [] }]

  // --- State for Modals ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null); // Added for context
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewProductId, setReviewProductId] = useState("");

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  
  // --- NEW: Get token and user data ---
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());


  // --- Helper Functions ---
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `PHP ${new Intl.NumberFormat('en-US').format(numericPrice)}.00`;
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

  // --- Data Fetching ---
  const fetchShopData = useCallback(async () => { // Wrapped in useCallback
    setLoading(true);
    setError(null);
    try {
      // --- MODIFIED: Added Authorization header to reviews ---
      const [productsRes, reviewsRes] = await Promise.all([
        fetch("http://localhost:5000/api/products"), // This is public
        fetch("http://localhost:5000/api/reviews", { // This is admin-only, but we'll fetch anyway
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
        })
      ]);

      if (!productsRes.ok) {
        throw new Error("Failed to fetch products.");
      }
      
      const productsData = await productsRes.json();
      let reviewsData = [];

      if (reviewsRes.ok) {
        // Only process reviews if the fetch was successful (i.e., user is admin)
        reviewsData = await reviewsRes.json();
      } else {
        console.warn("Could not fetch all reviews (user may not be admin). This is OK.");
        // We can continue without all reviews
      }
      
      setAllProducts(productsData);
      setAllReviews(reviewsData);

      const myReviews = reviewsData.filter(r => r.customerName === userName);
      setReviewedProductIds(new Set(myReviews.map(r => r.productId)));

      // 1. Calculate Top Rated Products
      const productRatings = {};
      for (const review of reviewsData) {
        if (!review.productId) continue;
        if (!productRatings[review.productId]) {
          productRatings[review.productId] = { total: 0, count: 0 };
        }
        productRatings[review.productId].total += review.rating;
        productRatings[review.productId].count++;
      }
      
      const ratedProducts = productsData.map(product => {
        const ratingData = productRatings[product.id];
        return {
          ...product,
          avgRating: ratingData ? ratingData.total / ratingData.count : 0,
          reviewCount: ratingData ? ratingData.count : 0
        };
      }).sort((a, b) => b.avgRating - a.avgRating);

      setTopRatedProducts(ratedProducts.slice(0, 5));

      // 2. Group Products by Category and Type
      const categoryMap = new Map();
      for (const product of productsData) {
        if (!product.category || product.category === "N/A") continue;

        if (!categoryMap.has(product.category)) {
          categoryMap.set(product.category, {
            name: product.category,
            types: new Map(),
            image: product.image || `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(product.category)}`
          });
        }
        
        const category = categoryMap.get(product.category);
        const typeName = product.type || "Other";
        
        if (!category.types.has(typeName)) {
          category.types.set(typeName, []);
        }
        
        category.types.get(typeName).push(product);
      }
      
      const categoryList = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        types: Array.from(cat.types.entries()).map(([typeName, products]) => ({
          name: typeName,
          products: products
        }))
      }));

      setCategories(categoryList);

    } catch (err) {
      console.error("Error fetching shop data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userName, token]); // Added token dependency

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // --- NEW: Effect for auto-scrolling ---
  useEffect(() => {
    if (loading) return; // Don't scroll until content is loaded
    
    if (location.hash) {
      // Decode the hash and find the matching element
      const categoryName = decodeURIComponent(location.hash.substring(1));
      const element = categoryRefs.current[categoryName];
      
      if (element) {
        // Scroll to the element
        const yOffset = -82; // --- MODIFIED: Was -80, now -82 to account for border ---
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [location, loading]); // This runs every time the URL hash or loading state changes

  // --- Modal Handlers ---
  const openProductModal = (product) => {
    // --- NEW: Fetch product-specific reviews ---
    const fetchReviewsForProduct = async (productId) => {
      setLoadingModal(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const data = await res.json();
        
        // Sort to show user's review first
        data.sort((a, b) => {
          if (a.customerName === userName) return -1;
          if (b.customerName === userName) return 1;
          return 0; 
        });
        
        setProductModalReviews(data);
        
        // Update review status
        const existingReview = data.find(r => r.customerName === userName);
        if (existingReview) {
          setReviewedProductIds(prev => new Set(prev).add(productId));
        }

      } catch (err) {
        console.error(err.message);
        setProductModalReviews([]); // Clear reviews on error
      } finally {
        setLoadingModal(false);
      }
    };
    
    fetchReviewsForProduct(product.id);
    setSelectedProduct(product);
    setProductModalImage(product.image_link_1 || product.image_link_2 || product.image_link_3 || product.image_link_4 || product.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsProductModalOpen(true);
  };
  const closeProductModal = () => setIsProductModalOpen(false);

  const openReviewModal = (product, orderContext = null) => {
    const reviews = allReviews.filter(r => r.productId === product.id);
    reviews.sort((a, b) => {
      if (a.customerName === userName) return -1;
      if (b.customerName === userName) return 1;
      return 0;
    });
    
    setReviewProduct(product); 
    setReviewProductId(product.id);
    setReviewOrder(orderContext); // Store order if it came from one
    setProductModalReviews(reviews); // Set reviews for display
    setProductModalImage(product.image_link_1 || product.image_link_2 || 'https://placehold.co/600x400');
    
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
    setIsProductModalOpen(false); 
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
          'Authorization': `Bearer ${token}` // Send the token
        },
        body: JSON.stringify({
          product_id: reviewProduct.id,
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
      fetchShopData();
    } catch(err) {
      setReviewError(err.message);
    }
  };

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
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/products/${product.id}/order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}` // Send the token
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
      alert("Order placed! It is now in your 'To Pay' list.");
      closeConfirmationModal();
      navigate("/orderss"); 
    } catch (err) {
       alert("Error: " + err.message);
    }
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
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1,
        checked: true 
      };
      cart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };
  
  // --- NEW: Scroll to Category ---
  const handleCategoryClick = (categoryName) => {
    const element = categoryRefs.current[categoryName];
    if (element) {
      // --- MODIFIED: Added offset for sticky header ---
      const yOffset = -82; // Height of your header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };


  // --- Sub-Components (Now defined inside Shop) ---

  const Hero = () => {
    const heroStyle = {
      background: `url(https://placehold.co/1920x1080/e2e8f0/64748b?text=Elegant+Bedroom) center/cover no-repeat`,
      height: '50vh', // Adjusted height
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
  
    return (
      <section className="shop-hero" style={heroStyle}>
        {/* Removed overlay for a cleaner look, kept image */}
      </section>
    );
  };
  
  const FeaturedCategories = ({ categories = [] }) => {
    const displayCategories = categories.length > 0
      ? categories
      : [
          { name: "Living Room", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Living+Room" },
          { name: "Bedroom", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Bedroom" },
          { name: "Dining Room", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Dining+Room" },
        ];
  
    return (
      <section className="shop-category">
        <h2>SHOP BY CATEGORY</h2>
        <p>Find the perfect furniture for every room, style, and mood in just one click.</p>
        <div className="shop-category-cards">
          {displayCategories.slice(0, 3).map((cat, idx) => ( 
            <div className="shop-card" key={idx} onClick={() => handleCategoryClick(cat.name)}>
              <img 
                src={cat.image || 'https://placehold.co/400x300'} 
                alt={cat.name} 
                onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error'}
              />
              <h3>{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  const TopRatedProducts = ({ products = [] }) => {
    return (
      <section className="top-rated-section">
        <h2>OUR MOST-RATED PRODUCTS</h2>
        <p>Discover the pieces our customers love the most.</p>
        <div className="top-rated-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div className="top-rated-card" key={product.id} onClick={() => openProductModal(product)}>
                <img 
                  src={product.image || 'https://placehold.co/400x300'} 
                  alt={product.name} 
                  onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error'}
                />
                <h4>{product.name}</h4>
                <div className="rating">
                  {renderStars(product.avgRating)}
                  <span>({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
                <p className="price">{formatPrice(product.price)}</p>
              </div>
            ))
          ) : (
            <p>No rated products found.</p>
          )}
        </div>
      </section>
    );
  };
  
  const CTASection = () => (
    <section className="cta-section">
      {/* --- MODIFIED: Use Link/navigate for internal links --- */}
      <button onClick={() => navigate("/login")} className="cta-btn">LOG IN</button>
      <button onClick={() => navigate("/shop")} className="cta-btn">SHOP NOW</button>
      <button onClick={() => navigate("/orderss")} className="cta-btn">MY ACCOUNT</button>
    </section>
  );

  // --- Main Return ---
  
  if (loading) {
    return <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading Shop...</div>;
  }
  
  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
        <strong>Error:</strong> {error}
        <p style={{ margin: '5px 0 0 0' }}>Please ensure your backend server is running on http://localhost:5000.</p>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <style>{`
        /* === GLOBAL RESET === */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        html {
          scroll-behavior: smooth; /* --- NEW: Enables smooth scroll --- */
        }
        body {
          width: 100%;
          overflow-x: hidden;
        }
        .shop-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        /* --- NEW: Spacer for sticky header --- */
        .header-spacer {
          height: 82px; /* --- MODIFIED: Was 80px, must match the header's height + border --- */
        }

        /* === HERO === */
        .shop-hero {
          height: 50vh;
          width: 100%;
          overflow: hidden;
        }
        .shop-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* === CATEGORY === */
        .shop-category {
          text-align: center;
          padding: 60px 40px;
        }
        .shop-category h2 {
          font-size: 2.5rem;
          color: #4a2f0c;
          margin-bottom: 10px;
        }
        .shop-category p {
          font-size: 1.1rem;
          color: #6a4b22;
          margin-bottom: 40px;
        }
        .shop-category-cards {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }
        .shop-card {
          width: 300px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s;
          cursor: pointer; /* --- NEW: Make clickable --- */
        }
        .shop-card:hover {
          transform: translateY(-5px);
        }
        .shop-card img {
          width: 100%;
          height: 350px;
          object-fit: cover;
        }
        .shop-card h3 {
          padding: 20px;
          background-color: #fff;
          color: #4a552b;
          font-size: 1.3rem;
        }

        /* === AREA SECTIONS (Living, Bed, Dining) === */
        .shop-area-section {
          height: auto; /* --- UPDATED --- */
          background: #f8f8f8; /* --- UPDATED: Removed image --- */
          padding: 20px 0; /* --- UPDATED --- */
        }
        .shop-overlay {
          background-color: transparent; /* --- UPDATED --- */
          padding: 20px 40px;
          text-align: left; /* --- UPDATED --- */
        }
        .shop-overlay p {
          color: #4a2f0c; /* --- UPDATED --- */
          font-size: 1.5rem;
          font-weight: 500;
          max-width: 100%; /* --- UPDATED --- */
        }

        /* === PRODUCT DISPLAY === */
        .shop-product-display {
          padding: 20px 40px 60px 40px; /* Adjusted padding */
          background: #f8f8f8;
        }
        .shop-product-row {
          margin-bottom: 40px;
        }
        .shop-product-row h2 {
          font-size: 2rem;
          color: #4a2f0c;
          margin-bottom: 20px;
          border-bottom: 2px solid #e6dcaa;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .shop-product-row h2 span {
          font-size: 1.5rem;
        }
        .shop-divider {
          color: #e6dcaa;
          font-weight: 300;
        }
        .shop-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .shop-item {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: box-shadow 0.3s;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .shop-item:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .shop-item img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          cursor: pointer;
        }
        .shop-item .item-info {
          padding: 15px;
          flex-grow: 1;
        }
        .shop-item p {
          font-size: 1rem;
          color: #333;
          line-height: 1.4;
        }
        .item-name {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .item-price {
          font-weight: 700;
          color: #4a552b;
          margin: 5px 0;
        }
        .item-details-link {
          font-size: 0.9rem;
          font-style: italic;
          color: #555;
          cursor: pointer;
          text-decoration: underline;
        }
        .shop-item-btn {
          display: block;
          width: calc(100% - 30px);
          margin: 0 15px 15px;
          padding: 10px;
          background-color: #4a552b;
          color: white;
          border: none;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .shop-item-btn:hover {
          background-color: #3d4823;
        }
        /* --- NEW: Add to Cart Button --- */
        .shop-item-btn-add {
          display: block;
          width: calc(100% - 30px);
          margin: 10px 15px 0px; /* Adjusted margin */
          padding: 10px;
          background-color: #8c7a6b;
          color: white;
          border: none;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .shop-item-btn-add:hover {
          background-color: #7a6c5f;
        }
        
        /* --- NEW: TOP RATED PRODUCTS --- */
        .top-rated-section {
          text-align: center;
          padding: 60px 40px;
          background-color: #f2ecd5;
        }
        .top-rated-section h2 {
          font-size: 2.5rem;
          color: #4a2f0c;
          margin-bottom: 10px;
        }
        .top-rated-section p {
          font-size: 1.1rem;
          color: #6a4b22;
          margin-bottom: 40px;
        }
        .top-rated-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .top-rated-card {
          background-color: #fff;
          width: 250px;
          border-radius: 14px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid #eee;
          cursor: pointer;
        }
        .top-rated-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        .top-rated-card img {
          width: 100%;
          height: 180px;
          border-radius: 10px;
          object-fit: cover;
          margin-bottom: 10px;
        }
        .top-rated-card h4 {
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .top-rated-card .rating {
          font-size: 1rem;
          color: #f59e0b;
          margin-bottom: 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }
        .top-rated-card .rating span {
          font-size: 0.8rem;
          color: #666;
        }
        .top-rated-card .price {
          font-weight: 700;
          font-size: 1rem;
          color: #3b82f6;
        }
        
        /* === OUR STORY === */
        .our-story {
          display: flex;
          align-items: center;
          padding: 60px 40px;
          background-color: #fff;
          gap: 40px;
        }
        .story-text {
          flex: 1;
        }
        .story-text h2 {
          font-size: 3rem;
          color: #4a2f0c;
          font-weight: 300;
          margin-bottom: 20px;
        }
        .story-text h2 .our {
          font-weight: 700;
        }
        .story-text p {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #333;
        }
        .story-image {
          flex: 1;
        }
        .story-image img {
          width: 100%;
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        /* === CTA SECTION === */
        .cta-section {
          padding: 60px 40px;
          background-color: #44433d;
          text-align: center;
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .cta-btn { /* --- NEW: Added CTA Button --- */
          background-color: #f2ecd5;
          color: #4a552b;
          padding: 12px 25px;
          text-decoration: none;
          font-weight: 600;
          border-radius: 25px;
          transition: background-color 0.3s;
          border: none;
          font-size: 1rem;
          cursor: pointer;
        }
        .cta-section .cta-btn:hover {
          background-color: #e6dcaa;
        }
        
        /* --- All Modal Styles --- */
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
        .star-rating span.interactive.on:hover ~ span {
          color: #f59e0b;
        }
        .star-rating span.on {
          color: #f59e0b;
        }
        
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
          min-height: 420px;
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
        
        @media (max-width: 900px) {
          .shop-area-section {
            background-attachment: scroll; /* Disable parallax on mobile */
          }
          .our-story {
            flex-direction: column;
          }
          .story-text, .story-image {
            max-width: 100%;
          }
          .cta-section {
            flex-direction: column;
            gap: 15px;
          }
          .product-modal-body {
            grid-template-columns: 1fr;
          }
          .modal-details {
            min-height: auto;
          }
          .modal-main-image img {
            height: 250px;
          }
        }
      `}</style>
      <UserNavbar navigate={navigate} />
      {/* --- NEW: Add this spacer div --- */}
      <div className="header-spacer"></div>
      
      <Hero />
      <FeaturedCategories categories={categories} />

      <TopRatedProducts products={topRatedProducts} />
      
      {/* --- Main Product Sections --- */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading products...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : (
        categories.map((category) => (
          <React.Fragment key={category.name}>
            <section
              className="shop-area-section"
              style={{ backgroundColor: '#f8f8f8' }}
              ref={el => categoryRefs.current[category.name] = el}
            >
              <div className="shop-overlay" style={{backgroundColor: 'transparent'}}>
                <p style={{color: '#4a2f0c'}}>Discover our {category.name} collection.</p>
              </div>
            </section>
            
            <section className="shop-product-display">
              {category.types.map((type) => (
                <div key={type.name} className="shop-product-row">
                  <h2>
                    <span>🛋️</span> {category.name} <span className="shop-divider">|</span> {type.name}
                  </h2>
                  <div className="shop-products">
                    {type.products.map((product) => (
                      <div key={product.id} className="shop-item">
                        <img 
                          src={product.image || 'https://placehold.co/400x300'} 
                          alt={product.name} 
                          onClick={() => openProductModal(product)}
                          onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error'}
                        />
                        <div className="item-info">
                          <p className="item-name">{product.name}</p>
                          <p className="item-price">{formatPrice(product.price)}</p>
                          <p 
                            className="item-details-link"
                            onClick={() => openProductModal(product)}
                          >
                            Tap for more details!
                          </p>
                        </div>
                        <button className="shop-item-btn-add" onClick={() => handleAddToCart(product)}>
                          ADD TO CART
                        </button>
                        <button className="shop-item-btn" onClick={() => handleOrderNow(product)}>
                          BUY NOW!
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </React.Fragment>
        ))
      )}
      
      <CTASection />
      {/* <Footer /> */}
      
      {/* --- ALL MODALS --- */}
      
      {/* --- Review Modal --- */}
      {isReviewModalOpen && reviewProduct && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
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
                  
                  {/* This select is only shown if opening from an order with multiple items */}
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
                          setReviewProductId(e.target.value);
                          setProductModalImage(newProd.image_link_1 || 'https://placehold.co/600x400');
                        }}
                      >
                        {reviewOrder.products.map(p => {
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
                {/* --- NEW: Add to Cart Button --- */}
                <button 
                  className="ud-action-btn"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  <span>🛒</span> Add to Cart
                </button>
                <button 
                  className="ud-action-btn" 
                  onClick={() => openReviewModal(selectedProduct)}
                  disabled={reviewedProductIds.has(selectedProduct.id)}
                >
                  <span>&#9998;</span> {reviewedProductIds.has(selectedProduct.id) ? "Reviewed" : "Write Review"}
                </button>
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
}