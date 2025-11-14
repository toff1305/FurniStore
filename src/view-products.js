import React, { useState, useEffect, useCallback, useRef } from "react";
// import { Link, useNavigate } from "react-router-dom"; // Using <a> tags and placeholders
import "./view-furnitures.css"; // Styles are embedded
import Topbar from "./topbar-admin"; // Using placeholder

// --- Main ViewFurnitures Component (now with Admin features) ---
function ViewFurnitures() {
  const navigate = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data State ---
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allProductTypes, setAllProductTypes] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState([]); // For rendering sections

  // --- NEW: Tab Navigation & Filtering State ---
  const [activeTab, setActiveTab] = useState("All"); // "All", "Top Rated", or Category Name
  const [filteredProducts, setFilteredProducts] = useState([]);

  // --- State for View Product Modal ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  // --- State for Add/Edit Modal (from ManageFurnitures) ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFurniture, setCurrentFurniture] = useState(null);

  // --- State for Category Modal (from ManageFurnitures) ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  
  // --- State for other modals ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewProductId, setReviewProductId] = useState("");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  
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
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // --- These are all PUBLIC routes, so no token is needed ---
      const [productsRes, reviewsRes, typesRes] = await Promise.all([
        fetch("http://localhost:5000/api/products"),
        fetch("http://localhost:5000/api/reviews"),
        fetch("http://localhost:5000/api/categories-and-types")
      ]);

      if (!productsRes.ok || !reviewsRes.ok || !typesRes.ok) {
        throw new Error("Failed to fetch all data. Is the backend server running?");
      }

      const productsData = await productsRes.json();
      const reviewsData = await reviewsRes.json();
      const typesData = await typesRes.json();
      
      setAllProducts(productsData);
      setAllReviews(reviewsData);
      setAllCategories(typesData.categories); // Flat list for modals
      setAllProductTypes(typesData.productTypes); // Flat list for modals
      
      if (typesData.categories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(typesData.categories[0]._id);
      }

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

      // 2. Group Products by Category and Type (for rendering)
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
      setGroupedCategories(categoryList); // This is used for the tabs now

    } catch (err) {
      console.error("Error fetching shop data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userName, activeCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- NEW: Tab Filtering Logic ---
  useEffect(() => {
    if (activeTab === "All") {
      setFilteredProducts(allProducts);
    } else if (activeTab === "Top Rated") {
      setFilteredProducts(topRatedProducts);
    } else {
      // Filter by category name
      setFilteredProducts(allProducts.filter(p => p.category === activeTab));
    }
  }, [activeTab, allProducts, topRatedProducts]);


  // --- All Modal Handlers ---

  // --- View Product Modal ---
  const openProductModal = (product) => {
    const reviews = allReviews.filter(r => r.productId === product.id);
    reviews.sort((a, b) => {
      if (a.customerName === userName) return -1;
      if (b.customerName === userName) return 1;
      return 0; 
    });
    
    setSelectedProduct(product);
    setProductModalReviews(reviews);
    setProductModalImage(product.image_link_1 || product.image_link_2 || product.image_link_3 || product.image_link_4 || product.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsViewModalOpen(true);
  };
  const closeProductModal = () => setIsViewModalOpen(false);

  // --- Add/Edit Product Modal ---
  const openAddModal = () => {
    setIsEditing(false);
    setCurrentFurniture({
      name: "",
      price: 0,
      stock: 0,
      description: "",
      categoryId: allCategories[0]?._id || "",
      typeId: "",
      dimensions: { length: 0, width: 0, height: 0 },
      image_link_1: "",
      image_link_2: "",
      image_link_3: "",
      image_link_4: "",
      image_link_5: "",
    });
    setIsEditModalOpen(true);
    setIsViewModalOpen(false); // Close view modal if open
  };

  const openEditModal = (furniture) => {
    setIsEditing(true);
    // Ensure dimensions is an object
    const dimensions = furniture.dimensions || { length: 0, width: 0, height: 0 };
    setCurrentFurniture({...furniture, dimensions }); 
    setIsEditModalOpen(true);
    setIsViewModalOpen(false); // Close view modal
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentFurniture(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      
      // --- FIX: Add token ---
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Error: Not authorized. Please log in again.");
        return;
      }
      // --- End Fix ---

      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          method: "DELETE",
          // --- FIX: Add headers ---
          headers: {
            "Authorization": `Bearer ${token}`
          }
          // --- End Fix ---
        });
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Failed to delete product");
        }
        
        closeProductModal(); // Close the view modal
        fetchData(); // Refetch all data
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // --- FIX: Add token ---
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Error: Not authorized. Please log in again.");
      return;
    }
    // --- End Fix ---

    const url = isEditing 
      ? `http://localhost:5000/api/products/${currentFurniture.id}`
      : "http://localhost:5000/api/products";
    const method = isEditing ? "PUT" : "POST";

    // Ensure dimensions are numbers
    const payload = {
      ...currentFurniture,
      dimensions: {
        length: Number(currentFurniture.dimensions?.length) || 0,
        width: Number(currentFurniture.dimensions?.width) || 0,
        height: Number(currentFurniture.dimensions?.height) || 0,
      }
    };

    try {
      const response = await fetch(url, {
        method: method,
        // --- FIX: Add Authorization header ---
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // --- End Fix ---
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
      }
      
      closeEditModal();
      fetchData(); // Refetch all data
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      setCurrentFurniture(prev => ({
        ...prev,
        categoryId: value,
        typeId: "" // Reset type when category changes
      }));
    } else {
      setCurrentFurniture(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleDimensionChange = (e) => {
     const { name, value } = e.target;
     setCurrentFurniture(prev => ({
       ...prev,
       dimensions: { ...prev.dimensions, [name]: value }
     }));
  };
  
  // --- Category Modal Handlers ---
  const openCategoryModal = () => setIsCategoryModalOpen(true);
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setEditingType(null);
    setNewCategoryName("");
    setNewTypeName("");
    fetchData(); // Refresh all data
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return alert("Please enter a category name.");

    // --- FIX: Add token ---
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Error: Not authorized. Please log in again.");
      return;
    }
    // --- End Fix ---

    const isUpdating = !!editingCategory;
    const url = isUpdating 
      ? `http://localhost:5000/api/categories/${editingCategory._id}`
      : "http://localhost:5000/api/categories";
    const method = isUpdating ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method: method,
        // --- FIX: Add Authorization header ---
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // --- End Fix ---
        body: JSON.stringify({ category_name: newCategoryName }),
      });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || `Failed to ${isUpdating ? 'update' : 'add'} category`);
      }
      const savedCategory = await response.json();
      if (isUpdating) {
        setAllCategories(allCategories.map(c => c._id === savedCategory._id ? savedCategory : c));
      } else {
        setAllCategories([...allCategories, savedCategory]);
        setActiveCategoryId(savedCategory._id);
      }
      setNewCategoryName("");
      setEditingCategory(null);
      alert(`Category ${isUpdating ? 'updated' : 'added'}!`);
    } catch (err) {
      alert("Error:" + err.message);
    }
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.category_name);
  };
  
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure? Deleting a category will fail if products or types still use it.")) {

      // --- FIX: Add token ---
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Error: Not authorized. Please log in again.");
        return;
      }
      // --- End Fix ---

      try {
        const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
          method: "DELETE",
          // --- FIX: Add headers ---
          headers: {
            "Authorization": `Bearer ${token}`
          }
          // --- End Fix ---
        });
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Failed to delete category");
        }
        setAllCategories(allCategories.filter(c => c._id !== categoryId));
        if (activeCategoryId === categoryId) {
          setActiveCategoryId(allCategories[0]?._id || null);
        }
        alert("Category deleted.");
      } catch (err) {
         alert("Error: " + err.message);
      }
    }
  };

  const handleSaveType = async (e) => {
     e.preventDefault();
     if (!newTypeName || !activeCategoryId) {
       return alert("Please select a category and enter a type name.");
     }

     // --- FIX: Add token ---
     const token = localStorage.getItem("token");
     if (!token) {
       alert("Error: Not authorized. Please log in again.");
       return;
     }
     // --- End Fix ---

     const isUpdating = !!editingType;
     const url = isUpdating
       ? `http://localhost:5000/api/product-types/${editingType._id}`
       : "http://localhost:5000/api/product-types";
     const method = isUpdating ? "PUT" : "POST";
     try {
       const response = await fetch(url, {
         method: method,
         // --- FIX: Add Authorization header ---
         headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
         },
         // --- End Fix ---
         body: JSON.stringify({ 
           category_id: activeCategoryId, 
           product_type_name: newTypeName 
         }),
       });
       if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || `Failed to ${isUpdating ? 'update' : 'add'} product type`);
       }
       const savedType = await response.json();
       if (isUpdating) {
         setAllProductTypes(allProductTypes.map(t => t._id === savedType._id ? savedType : t));
       } else {
         setAllProductTypes([...allProductTypes, savedType]);
       }
       setNewTypeName("");
       setEditingType(null);
       alert(`Product type ${isUpdating ? 'updated' : 'added'}!`);
     } catch (err) {
       alert("Error: " + err.message);
     }
  };

  const handleEditTypeClick = (type) => {
    setEditingType(type);
    setNewTypeName(type.product_type_name);
    setActiveCategoryId(type.category_id._id); // type is populated
  };

  const handleDeleteType = async (typeId) => {
     if (window.confirm("Are you sure? Deleting a type will fail if products still use it.")) {

       // --- FIX: Add token ---
       const token = localStorage.getItem("token");
       if (!token) {
         alert("Error: Not authorized. Please log in again.");
         return;
       }
       // --- End Fix ---

       try {
         const response = await fetch(`http://localhost:5000/api/product-types/${typeId}`, {
           method: "DELETE",
           // --- FIX: Add headers ---
           headers: {
             "Authorization": `Bearer ${token}`
           }
           // --- End Fix ---
         });
         if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Failed to delete product type");
         }
         setAllProductTypes(allProductTypes.filter(t => t._id !== typeId));
         alert("Product type deleted.");
       } catch (err) {
         alert("Error: " + err.message);
       }
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

  // --- Create available types for the EDIT modal ---
  const availableTypesForEdit = currentFurniture
    ? allProductTypes.filter(pt => pt.category_id?._id === currentFurniture.categoryId)
    : [];
    
  const typesForActiveCategory = allProductTypes.filter(
    (type) => type.category_id?._id === activeCategoryId
  );
  
  const activeCategoryName = allCategories.find(c => c._id === activeCategoryId)?.category_name || "...";


  // --- Main Return ---
  return (
    <div className="view-furniture-page">
      <style>
        {`
          
          /* === ADMIN BAR === */
          .admin-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0; /* No horizontal padding */
            background: transparent;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
          }
          .admin-bar h1 {
            font-size: 1.5rem;
            color: #333;
          }
          .admin-buttons {
            display: flex;
            gap: 15px;
          }
          .admin-btn {
            padding: 10px 20px;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .add-btn {
            background-color: #4a552b;
            color: white;
          }
          .add-btn:hover {
            background-color: #3d4823;
          }
          .manage-btn {
          height:auto;
            background-color: #6b7280;
            color: white;
          }
          .manage-btn:hover {
            background-color: #4b5563;
          }

          /* === TAB NAVIGATION === */
          .shop-category-tabs {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            padding: 20px 40px;
            background-color: #f2ecd5;
            top: 70px; /* Stick below the topbar */
            z-index: 99;
          }
          .tab-btn {
            padding: 10px 20px;
            font-size: 1rem;
            font-weight: 600;
            color: #4a2f0c;
            background-color: #fff;
            border: 2px solid #e6dcaa;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .tab-btn:hover {
            background-color: #fff;
            border-color: #4a2f0c;
          }
          .tab-btn.active {
            background-color: #4a2f0c;
            color: white;
            border-color: #4a2f0c;
          }

          /* === PRODUCT DISPLAY === */
          .shop-product-display {
            padding: 20px 0 60px 0; /* Use padding of main-content */
            background: transparent;
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
            text-align: center;
          }
          .item-name {
            font-weight: 600;
            font-size: 1.1rem;
          }
          .item-price {
            font-weight: 700;
            color: #3b82f6;
            margin: 5px 0;
          }
          .item-details-link {
            font-size: 0.9rem;
            font-style: italic;
            color: #555;
            cursor: pointer;
            text-decoration: underline;
          }
          
          /* --- TOP RATED PRODUCTS (Used for the tab) --- */
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
            padding: 20px;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-height: 90vh;
            overflow-y: auto;
          }
          .modal-content h2 {
            font-size: 1.8rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 25px;
            text-align: center;
          }
          .modal-form {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 20px;
          }
          .form-group {
             display: flex;
             flex-direction: column;
          }
          .form-group.full-width {
             grid-column: 1 / -1;
          }
          .form-group label {
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
          .dimensions-group {
             display: grid;
             grid-template-columns: 1fr 1fr 1fr;
             gap: 10px;
          }
          .image-links-group {
             grid-column: 1 / -1;
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 15px;
          }
          .image-links-group .form-group {
             margin-bottom: 0; 
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
            grid-column: 1 / -1;
            justify-content: flex-end;
          }
          .cancel-btn, .save-btn, .submit-review-btn, .confirm-order-btn {
            /* flex: 1; */
            height: 45px;
            padding: 12px 25px;
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
          
          /* --- Responsive --- */
          @media (max-width: 900px) {
            .admin-bar {
              flex-direction: column;
              gap: 15px;
            }
            .shop-area-section {
              background-attachment: scroll; /* Disable parallax on mobile */
            }
            .furniture-section, .our-story {
              flex-direction: column;
            }
            .carousel-container, .text-container, .story-image, .story-text {
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
          
          /* --- Category Modal (REDESIGNED) --- */
          .category-modal-columns {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 30px;
          }
          .category-modal-form {
            margin-bottom: 15px;
          }
          .category-modal-form .form-group {
             display: flex;
             flex-direction: row;
             align-items: center;
             gap: 10px;
          }
          .category-modal-form .form-group input {
             flex: 1;
          }
          .category-modal-form button {
             flex-shrink: 0; 
             padding: 8px 12px;
             font-size: 1.2rem;
             font-weight: bold;
             line-height: 1;
          }
          .category-list-container {
             max-height: 250px;
             overflow-y: auto;
             border: 1px solid #eee;
             border-radius: 5px;
             padding: 5px;
          }
          .category-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            border-radius: 4px;
          }
           .category-list-item:last-child {
             border-bottom: none;
           }
          .category-list-item.active-category {
            background-color: #e0e7ff;
            font-weight: bold;
          }
          .list-item-name {
            font-weight: 500;
          }
          .list-item-name .type-category {
            font-size: 0.8rem;
            color: #666;
            font-weight: 400;
            margin-left: 5px;
          }
          .list-item-actions button {
            font-size: 0.8rem;
            padding: 2px 6px;
            margin-left: 5px;
          }
          
          /* --- Print-Only Styles --- */
          @media print {
             /* ... (print styles from ManageFurnitures) ... */
          }
          #print-header {
            display: none;
          }
        
          .add-btn-out, .manage-cat-btn {
            color: rgb(33, 29, 75);
            border: 3px solid rgb(33, 29, 75);
            padding: 7px 14px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            font-size: 20px;
            background-color: transparent;
            font-variant: small-caps;
            text-decoration: none;
            display: inline-block;
            transition: 0.3s;
          }
          .manage-cat-btn {
            
            font-size: 16px; 
            padding: 9px 14px;
            background-color: #6b7280;
            border-color: #6b7280;
            color: white;
            font-variant: normal;
          }
          .add-btn-out:hover, .manage-cat-btn:hover {
            background-color: rgb(33, 29, 75);
            color: var(--white);
            border-color: rgb(33, 29, 75);
          }
        `}
      </style>
      
      <div className="admin-container">
        {/* --- SIDEBAR --- */}
        <aside className="sidebar">
          <div className="logo-section">
            <div className="logo-circle"></div>
            <h2>Logo & Company Name</h2>
          </div>
          <nav className="sidebar-nav">
            <a href="/admin">Dashboard</a>
            <a href="/view-products" className="active">View Products</a>
            <a href="/manage-furnitures">Manage Furnitures</a>
            <a href="/manage-orders">Manage Orders</a>
            <a href="/manage-users">Manage Users</a>
          </nav>
        </aside>
        
        {/* --- MAIN CONTENT --- */}
        <div className="main-content">
          <Topbar />
          
          {/* --- NEW: Admin Control Bar (Replaces Header) --- */}
          <div className="admin-bar">
            <h1>Admin Product View</h1>
            <div className="admin-buttons">
              <button className="manage-cat-btn" onClick={openCategoryModal}>+ Manage Categories</button>
              <button className="add-btn-out" onClick={openAddModal}>+ Add New Furniture</button>
            </div>
          </div>
          
          {/* --- NEW: Tab Navigation --- */}
          <div className="shop-category-tabs">
            <button 
              className={`tab-btn ${activeTab === "All" ? 'active' : ''}`}
              onClick={() => setActiveTab("All")}
            >
              All Products
            </button>
            <button 
              className={`tab-btn ${activeTab === "Top Rated" ? 'active' : ''}`}
              onClick={() => setActiveTab("Top Rated")}
            >
              Top Rated
            </button>
            {groupedCategories.map(cat => (
              <button 
                key={cat.name} 
                className={`tab-btn ${activeTab === cat.name ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {/* --- Main Product Sections --- */}
          {loading ? (
            <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading products...</div>
          ) : error ? (
            <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <section className="shop-product-display">
              <div className="shop-products">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
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
                      {/* --- Admin View doesn't need these buttons --- */}
                    </div>
                  ))
                ) : (
                  <p style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666'}}>
                    No products found for "{activeTab}".
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      
      {/* --- ALL MODALS --- */}
      
      {/* --- Add/Edit Furniture Modal --- */}
      {isEditModalOpen && currentFurniture && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? "Edit Furniture" : "Add New Furniture"}</h2>
            
            <form className="modal-form" onSubmit={handleFormSubmit}>
              <div className="form-group full-width">
                <label htmlFor="name">Product Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  {...isEditing ? { value: currentFurniture.name } : { value: currentFurniture.name || '' }}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoryId">Category</label>
                <select 
                  id="categoryId"
                  name="categoryId" 
                  value={currentFurniture.categoryId} 
                  onChange={handleFormChange}
                >
                  <option value="">Select Category</option>
                  {allCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="typeId">Product Type</label>
                <select 
                  id="typeId"
                  name="typeId"
                  value={currentFurniture.typeId} 
                  onChange={handleFormChange}
                  disabled={!currentFurniture.categoryId || availableTypesForEdit.length === 0}
                >
                  <option value="">
                  {!currentFurniture.categoryId
                    ? "Select category first"
                    : availableTypesForEdit.length === 0
                    ? "No types for this category"
                    : "-- Select Type --"}
                  </option>
                  {availableTypesForEdit.map(type => (
                    <option key={type._id} value={type._id}>{type.product_type_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (PHP)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  value={currentFurniture.price}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="stock">Stock Quantity</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  value={currentFurniture.stock}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Dimensions (cm)</label>
                <div className="dimensions-group">
                  <input
                    name="length"
                    type="number"
                    placeholder="Length"
                    value={currentFurniture.dimensions?.length}
                    onChange={handleDimensionChange}
                  />
                  <input
                    name="width"
                    type="number"
                    placeholder="Width"
                    value={currentFurniture.dimensions?.width}
                    onChange={handleDimensionChange}
                  />
                  <input
                    name="height"
                    type="number"
                    placeholder="Height"
                    value={currentFurniture.dimensions?.height}
                    onChange={handleDimensionChange}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={currentFurniture.description}
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div className="image-links-group">
                <div className="form-group">
                  <label htmlFor="image_link_1">Main Image Link</label>
                  <input type="url" id="image_link_1" name="image_link_1" value={currentFurniture.image_link_1} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_2">Image Link 2</label>
                  <input type="url" id="image_link_2" name="image_link_2" value={currentFurniture.image_link_2} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_3">Image Link 3</label>
                  <input type="url" id="image_link_3" name="image_link_3" value={currentFurniture.image_link_3} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_4">Image Link 4</label>
                  <input type="url" id="image_link_4" name="image_link_4" value={currentFurniture.image_link_4} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_5">Image Link 5</label>
                  <input type="url" id="image_link_5" name="image_link_5" value={currentFurniture.image_link_5} onChange={handleFormChange} />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- Manage Category Modal --- */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-content" style={{maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
            <h2>Manage Categories & Types</h2>
            <div className="category-modal-columns">
              <div>
                <h3>Categories</h3>
                <form className="category-modal-form" onSubmit={handleSaveCategory}>
                  <div className="form-group">
                    <input
                      id="newCategoryName"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={editingCategory ? "Update name..." : "New category name..."}
                    />
                    <button type="submit" className="save-btn" style={{padding: '8px 12px', fontSize: '1rem', flex: '0 0 auto'}}>
                      {editingCategory ? "✓" : "+"}
                    </button>
                    {editingCategory && (
                      <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <div className="category-list-container">
                  {allCategories.map(cat => (
                    <div 
                      key={cat._id} 
                      className={`category-list-item ${activeCategoryId === cat._id ? 'active-category' : ''}`}
                      onClick={() => setActiveCategoryId(cat._id)}
                    >
                      <span className="list-item-name">{cat.category_name}</span>
                      <div className="list-item-actions">
                        <button className="edit-btns" style={{fontSize: '0.8rem', padding: '2px 6px'}} onClick={(e) => { e.stopPropagation(); handleEditCategoryClick(cat); }}>Edit</button>
                        <button className="delete-btns" style={{fontSize: '0.8rem', padding: '2px 6px'}} onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id); }}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3>Types for {activeCategoryName}</h3>
                <form className="category-modal-form" onSubmit={handleSaveType}>
                  <div className="form-group">
                    <input
                      id="newTypeName"
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder={editingType ? "Update name..." : "New product type name..."}
                      disabled={!activeCategoryId}
                    />
                    <button type="submit" className="save-btn" style={{padding: '8px 12px', fontSize: '1rem', flex: '0 0 auto'}} disabled={!activeCategoryId}>
                      {editingType ? "✓" : "+"}
                    </button>
                    {editingType && (
                      <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={() => { setEditingType(null); setNewTypeName(""); }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                 <div className="category-list-container">
                  {typesForActiveCategory.map(type => (
                    <div key={type._id} className="category-list-item">
                      <span className="list-item-name">
                        {type.product_type_name}
                      </span>
                      <div className="list-item-actions">
                        <button className="edit-btns" style={{fontSize: '0.8rem', padding: '2px 6px'}} onClick={() => handleEditTypeClick(type)}>Edit</button>
                        <button className="delete-btns" style={{fontSize: '0.8rem', padding: '2px 6px'}} onClick={() => handleDeleteType(type._id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{gridColumn: '1 / -1'}}>
              <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={closeCategoryModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Product Detail Modal (with Admin buttons) --- */}
      {isViewModalOpen && selectedProduct && (
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
                {/* --- NEW: Admin Edit/Delete Buttons --- */}
                <button 
                  className="ud-action-btn" 
                  style={{backgroundColor: '#f59e0b'}}
                  onClick={() => openEditModal(selectedProduct)}
                >
                  <span>✏️</span> Edit
                </button>
                <button 
                  className="ud-action-btn" 
                  style={{backgroundColor: '#ef4444'}}
                  onClick={() => handleDelete(selectedProduct.id)}
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Other Modals (Review, Order) are hidden for admin view --- */}
      
    </div>
  );
}

export default ViewFurnitures;