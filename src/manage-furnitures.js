import React, { useState, useEffect, useRef } from "react";
import "./manage-furnitures.css"; // Styles are now embedded
import Topbar from "./topbar-admin"; // Using placeholder

function ManageFurnitures() {
  const [allFurnitures, setAllFurnitures] = useState([]); // Master list
  const [filteredFurnitures, setFilteredFurnitures] = useState([]); // List to display
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableRef = useRef();

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for column sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'Ascending' });
  const [sortDropdownOpen, setSortDropdownOpen] = useState(null); // Which header dropdown is open

  // State for Modal Form Dropdowns
  const [allCategories, setAllCategories] = useState([]);
  const [allProductTypes, setAllProductTypes] = useState([]);
  
  // State for the Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFurniture, setCurrentFurniture] = useState(null);

  // State for Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // State for Category Modal Forms
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  
  // State for Category Modal Logic
  const [activeCategoryId, setActiveCategoryId] = useState(null); // Which category is selected
  const [editingCategory, setEditingCategory] = useState(null); // { _id, category_name }
  const [editingType, setEditingType] = useState(null); // { _id, product_type_name, category_id }
  
  // --- NEW: State for View Product Modal ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  // --- FIXED: Added userName for review highlighting ---
  const userName = localStorage.getItem("userName");

  // --- 1. FETCH ALL DATA ON MOUNT ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reviews as well now
      const [productsRes, typesRes, reviewsRes] = await Promise.all([
        fetch("http://localhost:5000/api/products"),
        fetch("http://localhost:5000/api/categories-and-types"),
        fetch("http://localhost:5000/api/reviews"), 
      ]);

      if (!productsRes.ok || !typesRes.ok || !reviewsRes.ok) {
        throw new Error("Failed to fetch data from server. Is the backend server running?");
      }

      const productsData = await productsRes.json();
      const typesData = await typesRes.json();
      // const reviewsData = await reviewsRes.json(); // We'll fetch reviews on-demand

      setAllFurnitures(productsData);
      setFilteredFurnitures(productsData); 
      
      setAllCategories(typesData.categories);
      setAllProductTypes(typesData.productTypes);

      if (typesData.categories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(typesData.categories[0]._id);
      } else if (typesData.categories.length > 0 && !typesData.categories.find(c => c._id === activeCategoryId)) {
          setActiveCategoryId(typesData.categories[0]._id);
      } else if (typesData.categories.length === 0) {
        setActiveCategoryId(null); 
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData(); // Initial fetch
  }, []); // activeCategoryId removed to prevent refetch loop

  // --- 2. FILTER/SORT LOGIC ---
  useEffect(() => {
    let tempFurnitures = [...allFurnitures];
    if (searchQuery) {
      tempFurnitures = tempFurnitures.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortConfig.key) {
      tempFurnitures.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'price' || sortConfig.key === 'stock') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = valA?.toString().toLowerCase() || '';
          valB = valB?.toString().toLowerCase() || '';
        }

        if (valA < valB) {
          return sortConfig.direction === 'Ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'Ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    setFilteredFurnitures(tempFurnitures);
  }, [searchQuery, sortConfig, allFurnitures]);

  // --- 3. EVENT HANDLERS (Dropdowns, Search, Print) ---
  const handlePrint = () => {
    window.print();
  };
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const toggleSortDropdown = (key) => {
    setSortDropdownOpen(sortDropdownOpen === key ? null : key);
  };
  
  const handleTableSort = (key, direction) => {
    setSortConfig({ key, direction });
    setSortDropdownOpen(null);
  };
  
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Product Type' },
    { key: 'name', label: 'Product Name' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
  ];

  // --- 4. MODAL & CRUD HANDLERS ---
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
    setIsModalOpen(true);
  };

  const openEditModal = (furniture) => {
    setIsEditing(true);
    setCurrentFurniture(furniture); 
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
        if (!response.ok) throw new Error("Failed to delete product");
        setAllFurnitures(allFurnitures.filter(f => f.id !== id));
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

    const payload = {
      ...currentFurniture,
      dimensions: {
        length: Number(currentFurniture.dimensions.length) || 0,
        width: Number(currentFurniture.dimensions.width) || 0,
        height: Number(currentFurniture.dimensions.height) || 0,
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
      const savedFurniture = await response.json();
      if (isEditing) {
        setAllFurnitures(allFurnitures.map(f => f.id === savedFurniture.id ? savedFurniture : f));
      } else {
        setAllFurnitures([...allFurnitures, savedFurniture]);
      }
      closeModal();
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
        typeId: ""
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
        setActiveCategoryId(savedCategory._id); // Auto-select new category
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
           category_id: activeCategoryId, // Use the active category
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
  
  // --- NEW: View Product Modal Handlers ---
  const openViewModal = async (product) => {
    setSelectedProduct(product);
    setProductModalImage(product.image_link_1 || product.image_link_2 || 'https://placehold.co/600x400');
    setIsViewModalOpen(true);
    setLoadingModal(true);
    
    try {
      // Fetch reviews for this specific product (This is a PUBLIC route, no token needed)
      const response = await fetch(`http://localhost:5000/api/products/${product.id}/reviews`);
      if (!response.ok) throw new Error("Could not load reviews.");
      const reviewsData = await response.json();
      
      reviewsData.sort((a, b) => {
         if (a.customerName === userName) return -1;
         if (b.customerName === userName) return 1;
         return 0;
      });
      setProductModalReviews(reviewsData);
      
    } catch (err) {
      console.error(err.message);
      setProductModalReviews([]); // Set empty on error
    } finally {
      setLoadingModal(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProduct(null);
    setProductModalImage("");
    setProductModalReviews([]);
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
  
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ color: index < (rating || 0) ? '#f59e0b' : '#ccc', fontSize: '1.1rem' }}>★</span>
    ));
  };
  // --- End View Product Modal Handlers ---


  // --- 5. RENDER LOGIC ---
  
  const availableTypes = currentFurniture
    ? allProductTypes.filter(pt => pt.category_id?._id === currentFurniture.categoryId)
    : [];
    
  const typesForActiveCategory = allProductTypes.filter(
    (type) => type.category_id?._id === activeCategoryId
  );

  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };
  
  const activeCategoryName = allCategories.find(c => c._id === activeCategoryId)?.category_name || "...";

  return (
    <div className="mf-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Poppins", sans-serif;
        }
        :root {
          --sidebar-width: 270px;
          --main-bg: #f5f7fa;
          --sidebar-bg: #08112b;
          --header-color: #485168;
          --accent-color: #3b82f6;
          --edit-btn: #4caf50;
          --del-btn: #d9534f;
          --white: #ffffff;
        }

        /* LAYOUT */
        .mf-container { 
          display: flex;
          min-height: 100vh;
          background-color: var(--main-bg);
        }

        /* SIDEBAR */
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--sidebar-bg);
          color: var(--white);
          padding: 25px 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100; 
        }
        .logo-section {
          text-align: center;
          margin-bottom: 25px;
        }
        .logo-circle {
          width: 60px;
          height: 60px;
          background-color: #e8dcaa;
          border-radius: 50%;
          margin: 0 auto 10px;
        }
        .logo-section h2 {
          font-size: 16px;
          margin-bottom: 4px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-nav a {
          color: var(--white);
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          padding: 10px 15px;
          border-radius: 8px;
          transition: 0.3s;
        }
        .sidebar-nav a:hover,
        .sidebar-nav a.active {
          background-color: var(--white);
          color: var(--sidebar-bg);
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1;
          background-color: var(--main-bg);
          overflow-y: auto;
          margin-left: var(--sidebar-width); 
          padding: 25px 40px;
        }
        .main-content {
           padding-top: 0; 
        }
        
        .header-mf {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-mf h1 {
          margin: 0;
          font-size: 1.8rem;
        }
        
        .dashboard-section {
          background-color: var(--white);
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
        }

        /* --- Controls Layout --- */
        .top-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap; 
          gap: 10px; 
        }
        .header-buttons {
          display: flex;
          gap: 10px;
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
           color: var(--white);
           font-variant: normal;
        }
        .add-btn-out:hover, .manage-cat-btn:hover {
          background-color: rgb(33, 29, 75);
          color: var(--white);
          border-color: rgb(33, 29, 75);
        }

        /* TABLE */
        .furnitures-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          margin-bottom: 20px;
        }
        .furnitures-table th,
        .furnitures-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        .furnitures-table th {
          background-color: var(--header-color); 
          color: var(--white); 
          font-weight: bold;
          position: relative; 
        }
        
        /* --- NEW: Clickable product name --- */
        .product-name-link {
          color: var(--accent-color);
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
        }
        .product-name-link:hover {
          color: #1d4ed8;
        }
        
        /* Column Sort Styles */
        .dropdown-container {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .dropdown-toggle {
          cursor: pointer;
          user-select: none;
        }
        .sort-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--white);
          border: 1px solid #ccc;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          z-index: 10;
          border-radius: 5px;
          width: 120px;
          padding: 5px 0;
        }
        .sort-dropdown div {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .sort-dropdown div:hover {
          background-color: #f0f0f0;
        }

        .furnitures-table tr:nth-of-type(even) {
          background-color: #f9f9f9; 
        }

        /* ACTION BUTTONS */
        .edit-btns {
          background-color: var(--edit-btn);
          color: var(--white);
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          cursor: pointer;
          margin-right: 6px;
        }
        .edit-btns:hover {
          background-color: #45a049;
        }
        .delete-btns {
          background-color: var(--del-btn);
          color: var(--white);
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          cursor: pointer;
        }
        .delete-btns:hover {
          background-color: #c9302c;
        }

        /* Search Bar */
        .search-container {
          display: flex;
          align-items: center;
          background-color: var(--white); 
          border: 2px solid var(--header-color);
          border-radius: 20px;
          overflow: hidden;
          width: 320px;
        }
        .search-container input {
          border: none;
          outline: none;
          padding: 8px 10px;
          flex: 1;
          font-size: 15px;
          color: var(--header-color); 
          background: transparent;
        }
        .search-container button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
        }

        /* Print Section */
        .print-section-mf {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .print-controls-mf {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .print-controls-mf select { 
          display: none;
        }
        .print-btn-mf {
          background-color: var(--header-color);
          color: var(--white);
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .print-btn-mf:hover {
          background-color: #2f3952;
        }
        
        /* --- Modal Styling --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          overflow-y: auto; 
        }
        .modal-content {
          background-color: var(--white);
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px; 
          max-height: 90vh;
          overflow-y: auto; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          margin: 20px auto; 
        }
        .modal-content.category-modal {
          max-width: 800px; /* Wider modal for two columns */
        }
        .modal-content h2, .modal-content h3 {
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
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
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
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
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          grid-column: 1 / -1; 
        }
        .save-btn, .cancel-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
        }
        .cancel-btn {
          background-color: #ccc;
        }
        .save-btn {
          background-color: var(--accent-color);
          color: var(--white);
        }
        .save-btn.update-btn {
          background-color: #f59e0b;
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
        
        /* --- NEW: View Product Modal Styles --- */
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
          justify-content: flex-end; /* Only close button */
          align-items: center;
          margin-top: 0;
          border-top: 1px solid #eee;
          padding: 15px 25px;
          background-color: #f9fafb;
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
        @media (max-width: 900px) {
          .product-modal-body {
            grid-template-columns: 1fr;
          }
          .modal-details {
            min-height: auto;
          }
        }
        
        /* --- Print-Only Styles --- */
        @media print {
          body * {
            visibility: hidden;
          }
          #printableArea, #printableArea * {
            visibility: visible;
          }
          #printableArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          #print-header {
            display: block; 
            text-align: center;
            margin-bottom: 20px;
          }
          .sidebar, .top-controls, .print-section-mf, .edit-btns, .delete-btns, .sidebar-nav, .logo-section, .header-mf, .topbar {
            display: none;
          }
          .furnitures-table th, .furnitures-table td {
            border: 1px solid #000;
          }
          .furnitures-table a {
            text-decoration: none;
            color: #000;
          }
          .dashboard-section {
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .main-content {
             margin: 0;
             padding: 0;
          }
        }
        #print-header {
          display: none;
        }
      `}</style>

      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle"></div>
          <h2>Logo & Company Name</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="/admin">Dashboard</a>
          <a href="/view-products">View Products</a>
          <a href="/manage-furnitures" className="active">
            Manage Furnitures
          </a>
          <a href="/manage-orders">Manage Orders</a>
          <a href="/manage-users">Manage Users</a>
        </nav>
      </aside>

      <div className="main-content">
        <Topbar />
        <div className="header-mf">
          <h1>FURNITURES OVERVIEW</h1>
        </div>

        <section className="dashboard-section">
          <div className="order-container-mf">
            <div className="top-controls">
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="What product are you looking for?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button>🔍</button>
              </div>
              <div className="header-buttons">
                <button className="manage-cat-btn" onClick={openCategoryModal}>
                  + Manage Categories
                </button>
                <button className="add-btn-out" onClick={openAddModal}>
                  ＋ ADD NEW FURNITURE
                </button>
              </div>
            </div>

            {/* TABLE (Printable Area) */}
            <div id="printableArea" ref={tableRef}>
              <div id="print-header">
                <h1>Nest & Nook</h1>
                <h2>Furniture Store - Inventory Report</h2>
                <p>Date: {today}</p>
              </div>

              <table className="furnitures-table">
                <thead>
                  <tr>
                    {tableHeaders.map((header) => (
                      <th key={header.key}>
                        <div className="dropdown-container">
                          <span>{header.label}</span>
                          <span 
                            className="dropdown-toggle"
                            onClick={() => toggleSortDropdown(header.key)}
                          >
                            ⇅
                          </span>
                        </div>
                        {sortDropdownOpen === header.key && (
                          <div className="sort-dropdown">
                            <div onClick={() => handleTableSort(header.key, 'Ascending')}>Ascending</div>
                            <div onClick={() => handleTableSort(header.key, 'Descending')}>Descending</div>
                          </div>
                        )}
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{textAlign: "center"}}>Loading...</td></tr>
                  ) : error ? (
                      <tr><td colSpan="7" style={{textAlign: "center", color: "red"}}>Error: {error}</td></tr>
                  ) : filteredFurnitures.length > 0 ? (
                    filteredFurnitures.map((f) => (
                      <tr key={f.id}>
                        <td>{f.id.slice(-6).toUpperCase()}</td>
                        <td>{f.category}</td>
                        <td>{f.type}</td>
                        {/* --- UPDATED: Clickable name --- */}
                        <td>
                          <span 
                            className="product-name-link"
                            onClick={() => openViewModal(f)}
                          >
                            {f.name}
                          </span>
                        </td>
                        <td>{formatPrice(f.price)}</td>
                        <td>{f.stock}</td>
                        <td>
                          <button className="edit-btns" onClick={() => openEditModal(f)}>EDIT</button>
                          <button className="delete-btns" onClick={() => handleDelete(f.id)}>DELETE</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                      <tr><td colSpan="7" style={{textAlign: "center"}}>No furnitures found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PRINT SECTION (Dropdowns removed) */}
            <div className="print-section-mf">
              <div className="print-controls-mf">
                <button className="print-btn-mf" onClick={handlePrint}>
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>
            
            {filteredFurnitures.length === 0 && !loading && !searchQuery && (
              <p style={{ textAlign: "center", color: "#777", marginTop: "10px" }}>
                No furnitures found in the database.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* --- Add/Edit Furniture Modal --- */}
      {isModalOpen && currentFurniture && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? "Edit Furniture" : "Add New Furniture"}</h2>
            
            <form className="modal-form" onSubmit={handleFormSubmit}>
              <div className="form-group full-width">
                <label htmlFor="name">Product Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={currentFurniture.name}
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
                  disabled={!currentFurniture.categoryId || availableTypes.length === 0}
                >
                  <option value="">
                  {!currentFurniture.categoryId
                    ? "Select category first"
                    : availableTypes.length === 0
                    ? "No types for this category"
                    : "-- Select Type --"}
                  </option>
                  {availableTypes.map(type => (
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
                    value={currentFurniture.dimensions.length}
                    onChange={handleDimensionChange}
                  />
                  <input
                    name="width"
                    type="number"
                    placeholder="Width"
                    value={currentFurniture.dimensions.width}
                    onChange={handleDimensionChange}
                  />
                  <input
                    name="height"
                    type="number"
                    placeholder="Height"
                    value={currentFurniture.dimensions.height}
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
                  <input
                    type="url"
                    id="image_link_1"
                    name="image_link_1"
                    value={currentFurniture.image_link_1}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_2">Image Link 2</label>
                  <input
                    type="url"
                    id="image_link_2"
                    name="image_link_2"
                    value={currentFurniture.image_link_2}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_3">Image Link 3</label>
                  <input
                    type="url"
                    id="image_link_3"
                    name="image_link_3"
                    value={currentFurniture.image_link_3}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_4">Image Link 4</label>
                  <input
                    type="url"
                    id="image_link_4"
                    name="image_link_4"
                    value={currentFurniture.image_link_4}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="image_link_5">Image Link 5</label>
                  <input
                    type="url"
                    id="image_link_5"
                    name="image_link_5"
                    value={currentFurniture.image_link_5}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="save-btn">Save Furniture</button>
              </div>
            </form>
          </div>
        </div>
      )}

   {/* --- Manage Category Modal (Redesigned) --- */}
{isCategoryModalOpen && (
  <div className="modal-overlay" onClick={closeCategoryModal}>
    <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
      <h2>Manage Categories & Types</h2>
      
      <div className="category-modal-columns">
        {/* --- Column 1: Categories --- */}
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
              <button
                type="submit"
                className={editingCategory ? "save-btn update-btn" : "save-btn"}
              >
                {editingCategory ? "✓" : "+"}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                  }}
                >
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
                  <button
                    className="edit-btns"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategoryClick(cat);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btns"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat._id);
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* --- Column 2: Product Types --- */}
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
              <button
                type="submit"
                className={editingType ? "save-btn update-btn" : "save-btn"}
                disabled={!activeCategoryId}
              >
                {editingType ? "✓" : "+"}
              </button>
              {editingType && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditingType(null);
                    setNewTypeName("");
                  }}
                >
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
                  <button
                    className="edit-btns"
                    onClick={() => handleEditTypeClick(type)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btns"
                    onClick={() => handleDeleteType(type._id)}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
        <button type="button" className="cancel-btn" onClick={closeCategoryModal}>
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* --- NEW: View Product Modal --- */}
      {isViewModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeViewModal}>
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
              <button className="close-btn" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManageFurnitures;