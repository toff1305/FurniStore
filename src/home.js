import React, { useState, useEffect } from "react";
// import { Link } from 'react-router-dom'; // Replaced with <a>
 import "./home.css"; // Styles are embedded
 import Navbar from "./header"; // Using placeholder
 import Footer from "./footer"; // Using placeholder

// // --- Placeholder Components ---
// const Navbar = () => (
//   <nav style={{ padding: '20px', backgroundColor: '#fff', textAlign: 'center', borderBottom: '1px solid #eee' }}>
//     <strong>Navbar Placeholder</strong>
//   </nav>
// );
// const Footer = () => (
//   <footer style={{ padding: '40px', backgroundColor: '#333', color: 'white', textAlign: 'center' }}>
//     <strong>Footer Placeholder</strong>
//   </footer>
// );
// const Topbar = () => {
//   return <div className="topbar"></div>;
// };
// --- End Placeholders ---


// --- Home Component (Main) ---
// This component now correctly renders EITHER the public Home page
// OR the admin "View Products" page, based on the URL.
function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [modalMainImage, setModalMainImage] = useState("");
  const [modalReviews, setModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // --- Data State ---
  const [allProducts, setAllProducts] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);

  // --- Admin View State ---
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchTerms, setSearchTerms] = useState({});
  const [activeSort, setActiveSort] = useState({});
  const [sortOptions, setSortOptions] = useState({});

  // --- Helper Functions ---
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `PHP ${new Intl.NumberFormat('en-US').format(numericPrice)}.00`;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ color: index < (rating || 0) ? '#f59e0b' : '#ccc', fontSize: '1.1rem' }}>★</span>
    ));
  };

  // --- Modal Handlers ---
  const openModal = async (furniture) => {
    // Find the full furniture object from allProducts, as the one passed might be a summary
    const fullFurnitureDetails = allProducts.find(p => p.id === furniture.id) || furniture;
    
    setSelectedFurniture(fullFurnitureDetails);
    setModalMainImage(fullFurnitureDetails.image_link_1 || fullFurnitureDetails.image_link_2 || fullFurnitureDetails.image_link_3 || fullFurnitureDetails.image_link_4 || fullFurnitureDetails.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsModalOpen(true);
    setLoadingModal(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${fullFurnitureDetails.id}/reviews`);
      if (!response.ok) {
        throw new Error('Could not fetch reviews.');
      }
      const reviewData = await response.json();
      setModalReviews(reviewData);
    } catch (err) {
      console.error(err.message);
      setModalReviews([]); // Set empty on error
    } finally {
      setLoadingModal(false);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFurniture(null);
    setModalMainImage("");
    setModalReviews([]);
  };
  
  const getFurnitureImages = () => {
    if (!selectedFurniture) return [];
    const images = [
      selectedFurniture.image_link_1,
      selectedFurniture.image_link_2,
      selectedFurniture.image_link_3,
      selectedFurniture.image_link_4,
      selectedFurniture.image_link_5,
    ];
    return images.filter(Boolean); // Filter out any null/empty links
  };

  // --- Admin View Handlers ---
  const toggleDropdown = (cat) => {
    setDropdownOpen(dropdownOpen === cat ? null : cat);
  };

  const handleSearchChange = (cat, value) => {
    setSearchTerms({ ...searchTerms, [cat]: value });
  };

  const handleSortChange = (cat, option) => {
    setActiveSort(prev => ({ ...prev, [cat]: option }));
    setDropdownOpen(null); 
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, reviewsRes] = await Promise.all([
          fetch("http://localhost:5000/api/products"),
          fetch("http://localhost:5000/api/reviews")
        ]);

        if (!productsRes.ok || !reviewsRes.ok) {
          throw new Error("Failed to fetch all data. Is the backend server running?");
        }

        const productsData = await productsRes.json();
        const reviewsData = await reviewsRes.json();

        setAllProducts(productsData); // Save all products

        // --- Process Data for Sections ---

        // 1. Set Categories and Sort Options (for Admin View)
        const uniqueCategories = [...new Set(productsData.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);

        const initialSearch = {};
        const initialSort = {};
        const dynamicSortOptions = {};

        for (const cat of uniqueCategories) {
          initialSearch[cat] = "";
          initialSort[cat] = "";
          const typesForCat = [...new Set(
            productsData
              .filter(item => item.category === cat)
              .map(item => item.type)
              .filter(Boolean)
          )];
          dynamicSortOptions[cat] = [...typesForCat, "Ascending (Price)", "Descending (Price)"];
        }

        setSearchTerms(initialSearch);
        setActiveSort(initialSort);
        setSortOptions(dynamicSortOptions);

        // 2. Calculate Top Rated Products (for Home View)
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

        // 3. Get Featured Categories (for Home View)
        const categoryData = uniqueCategories.slice(0, 5).map(catName => {
          const productInCategory = productsData.find(p => p.category === catName);
          return {
            name: catName,
            image: productInCategory ? productInCategory.image : 'https://placehold.co/400x300'
          };
        });
        setFeaturedCategories(categoryData);

      } catch (err) {
        console.error("Error fetching home page data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);
  
  const newestProducts = allProducts.slice(0, 5);

  // --- All Sub-Components are defined here ---

  // --- Hero Section ---
  const Hero = () => {
    const heroStyle = {
      background: `url(https://placehold.co/1920x1080/e2e8f0/64748b?text=Elegant+Bedroom) center/cover no-repeat`,
      height: '90vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    return (
      <section className="hero" style={heroStyle}>
        <div className="overlay">
          <div className="hero-content">
            <h1><span>Elevate Your</span><br /><strong>HOME</strong></h1>
            <a href="/login" className="cta-btn">LET’S GO</a>
          </div>
        </div>
      </section>
    );
  };

  // --- Product Carousel ---
  const FurnitureCarousel = ({ products = [] }) => {
    const [current, setCurrent] = useState(0);

    const slides = products.length > 0
      ? products.map(p => ({ img: p.image, name: p.name }))
      : [
          { img: "https://placehold.co/1200x600/f2ecd5/44433d?text=New+Arrival+1", name: "New Arrival 1" },
          { img: "https://placehold.co/1200x600/e2e8f0/64748b?text=New+Arrival+2", name: "New Arrival 2" },
          { img: "https_//placehold.co/1200x600/fef3c7/b45309?text=New+Arrival+3", name: "New Arrival 3" },
        ];
    
    if (slides.length === 0) return null;

    const nextSlide = () => setCurrent((current + 1) % slides.length);
    const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length);
    const goToSlide = (index) => setCurrent(index);

    return (
      <section className="furniture-section">
        <div className="carousel-container">
          <div className="carousel" style={{ transform: `translateX(-${current * 100}%)` }}>
            {slides.map((slide, idx) => (
              <img 
                key={idx} 
                src={slide.img || 'https://placehold.co/1200x600'} 
                className="slide-image"
                alt={slide.name}
                onError={(e) => e.target.src = 'https://placehold.co/1200x600/f0f0f0/ccc?text=Image+Error'}
              />
            ))}
          </div>
          <button className="arrow left" onClick={prevSlide}>&#9664;</button>
          <button className="arrow right" onClick={nextSlide}>&#9654;</button>
          <div className="dots">
            {slides.map((_, idx) => (
              <span key={idx} className={idx === current ? "active" : ""} onClick={() => goToSlide(idx)}></span>
            ))}
          </div>
        </div>
        <div className="text-container">
          <h2>Discover Our Newest Collections</h2>
          <p>
            Elevate your home with furniture that blends style, comfort, and functionality. 
            From timeless classics to modern designs, each piece is crafted to enhance your 
            space and inspire everyday living.
          </p>
        </div>
      </section>
    );
  };

  // --- Shop by Category ---
  const FeaturedCategories = ({ categories = [] }) => {
    const displayCategories = categories.length > 0
      ? categories
      : [
          { name: "Vanity", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Vanity" },
          { name: "Center Table", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Center+Table" },
          { name: "Sofa", image: "https://placehold.co/400x300/e6dcaa/4a2f0c?text=Sofa" },
        ];

    return (
      <section className="product-types">
        <h2>SHOP BY CATEGORY</h2>
        <p>Find the perfect furniture for every room, style, and mood<br />in just one click.</p>
        <div className="product-grid">
          {displayCategories.map((cat, idx) => (
            <div className="product-item" key={idx}>
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

  // --- Top Rated Products ---
  const TopRatedProducts = ({ products = [] }) => {
    return (
      <section className="top-rated-section">
        <h2>OUR MOST-RATED PRODUCTS</h2>
        <p>Discover the pieces our customers love the most.</p>
        <div className="top-rated-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div className="top-rated-card" key={product.id} onClick={() => openModal(product)}>
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

  // --- Our Story Section ---
  const OurStory = () => (
    <section className="our-story">
      <div className="story-text">
        <h2><span className="our">Our</span> STORY</h2>
        <p>
          "At <strong>Nest & Nook</strong>, we believe that every home deserves furniture
          that combines style, comfort, and quality. Our journey began with a simple idea:
          to create pieces that transform living spaces into warm, inviting, and functional
          environments. From timeless classics to modern designs, each item is thoughtfully
          crafted to reflect our passion for design and dedication to excellence.
          More than just furniture, we aim to inspire homes where memories are made,
          moments are shared, and every corner feels uniquely yours."
        </p>
      </div>
      <div className="story-image">
        <img 
          src={"https" + "://placehold.co/600x400/e2e8f0/64748b?text=Our+Workshop"} 
          alt="Our Story" 
          onError={(e) => e.target.src = 'https://placehold.co/600x400'}
        />
      </div>
    </section>
  );

  // --- CTA Section ---
  const CTASection = () => (
    <section className="cta-section">

      <a href="/login" className="cta-btn">SHOP NOW</a>
    </section>
  );


  // --- Main Return ---
  
  if (loading) {
    return <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading Homepage...</div>;
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
    <div className="home-page">
      <style>{`
        /* === GLOBAL RESET === */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        html, body {
          width: 100%;
          overflow-x: hidden; /* Prevent horizontal scroll */
        }
        
        /* === HERO === */
        .hero {
          background-size: cover;
          background-position: center;
          height: 90vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-content {
          text-align: center;
          color: white;
        }
        .hero-content h1 {
          font-size: 6rem;
          font-weight: 300;
          line-height: 1.1;
        }
        .hero-content h1 span {
          font-size: 3rem;
        }
        .hero-content h1 strong {
          font-weight: 700;
        }
        .cta-btn {
          display: inline-block;
          background-color: #4a552b;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 20px;
        }
        .cta-btn:hover {
          background-color: #3d4823;
        }

        /* === FURNITURE CAROUSEL === */
        .furniture-section {
          display: flex;
          padding: 60px 40px;
          background-color: #f8f8f8;
          align-items: center;
          gap: 40px;
        }
        .carousel-container {
          flex: 1.5;
          position: relative;
          max-width: 60%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .carousel {
          display: flex;
          transition: transform 0.5s ease-in-out;
        }
        .carousel .slide-image {
          width: 100%;
          flex-shrink: 0;
          display: block;
          height: 500px;
          object-fit: cover;
        }
        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.7);
          border: none;
          font-size: 2rem;
          cursor: pointer;
          padding: 10px;
          z-index: 2;
        }
        .arrow.left { left: 10px; }
        .arrow.right { right: 10px; }
        .dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        }
        .dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          opacity: 0.5;
          cursor: pointer;
        }
        .dots span.active {
          opacity: 1;
        }
        .text-container {
          flex: 1;
          max-width: 40%;
          color: #4a2f0c;
          font-size: 1.1rem;
          line-height: 1.7;
        }
        .text-container h2 {
          font-size: 2.5rem;
          color: #4a2f0c;
          margin-bottom: 20px;
        }

        /* === PRODUCT TYPES / CATEGORIES === */
        .product-types {
          text-align: center;
          padding: 60px 40px;
        }
        .product-types h2 {
          font-size: 2.5rem;
          color: #4a2f0c;
          margin-bottom: 10px;
        }
        .product-types p {
          font-size: 1.1rem;
          color: #6a4b22;
          margin-bottom: 40px;
        }
        .product-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .product-item {
          width: 200px;
          text-align: center;
        }
        .product-item img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 50%;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }
        .product-item img:hover {
          transform: scale(1.05);
        }
        .product-item h3 {
          margin-top: 15px;
          color: #4a552b;
          font-size: 1.2rem;
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
        .cta-section .cta-btn {
          background-color: #f2ecd5;
          color: #4a552b;
        }
        .cta-section .cta-btn:hover {
          background-color: #e6dcaa;
        }
        
        /* --- NEW: Modal Styles --- */
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
          z-index: 1010;
        }
        .modal-content {
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
        .modal-body {
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
        }
        .modal-details h2 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
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
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 0;
          grid-column: 1 / -1; 
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
        
        /* Responsive */
        @media (max-width: 900px) {
          .furniture-section {
            flex-direction: column;
            max-width: 100%;
          }
          .carousel-container {
            max-width: 100%;
          }
          .text-container {
            max-width: 100%;
            text-align: center;
          }
          .our-story {
            flex-direction: column;
          }
          .cta-section {
            flex-direction: column;
          }
          .modal-content {
            grid-template-columns: 1fr;
            max-height: 80vh;
          }
          .modal-body {
            grid-template-columns: 1fr;
          }
          .modal-main-image img {
            height: 250px;
          }
          .modal-thumbnail-grid img {
            height: 45px;
          }
        }
        
        /* Admin-specific styles (for /view-products) */
        .admin-container {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 270px;
          background-color: #08112b;
          color: white;
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
        .main-content {
          flex: 1;
          background-color: #f5f7fa;
          overflow-y: auto;
          margin-left: 270px; 
          padding: 25px 40px;
        }
        .topbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          background-color: #eaf0f5;
          padding: 15px 40px;
          border-bottom: 2px solid #dcdcdc;
          margin: -25px -40px 25px -40px;
        }
        .main-content {
           padding-top: 0;
        }
        .header-mf {
          margin-bottom: 20px;
        }
        .header-mf h1 {
          margin: 0;
          font-size: 1.8rem;
        }
        .furniture-container {
          background-color: #fff; /* Changed background */
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* Added shadow */
          border: 1px solid #e5e7eb; /* Added border */
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 10px;
          background-color: #485168;
          color: white;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
        }
        .view-furniture-page .search-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #ffffff;
          border: 1px solid #ddd; /* Lighter border */
          border-radius: 8px; /* Less round */
          overflow: hidden;
          width: 330px;
          margin-bottom: 20px;
          margin-left: 10px; /* Align with grid */
        }
        .view-furniture-page .search-container input {
          border: none;
          outline: none;
          padding: 10px 15px; /* More padding */
          flex: 1;
          font-size: 15px;
          color: #485168;
          background: transparent;
        }
        .view-furniture-page .search-container button {
          background: none;
          border: none;
          color: #485168; /* Match border */
          cursor: pointer;
          padding: 0 15px; /* Adjust padding */
          font-size: 1.2rem;
        }
        .no-results {
          text-align: center;
          color: #555;
          font-style: italic;
          width: 100%;
          padding: 140px 0; /* Adjusted padding */
          font-size: 15px;
        }
      `}</style>
      
      <Navbar />

      {/* --- Page Content --- */}
      
      {/* This component is now flexible.
        It checks the URL. If it's "/view-products", it shows the admin view.
        If it's "/" or any other path, it shows the public homepage.
      */}
      
      {window.location.pathname.includes('/view-products') ? (
        
        // ADMIN "VIEW PRODUCTS" LAYOUT
        <div className="admin-container">
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
          <div className="main-content">
            <div className="topbar"></div>
            <div className="header-mf">
              <h1>FURNITURES VIEWING</h1>
            </div>

            {error && (
              <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
                <strong>Error:</strong> {error}
                <p style={{ margin: '5px 0 0 0' }}>Please ensure your backend server is running on http://localhost:5000 and the /api/products endpoint is correct.</p>
              </div>
            )}
            {loading && (
              <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem' }}>Loading furnitures...</div>
            )}
            {!loading && !error && (
              <>
                <div style={{ 
                  padding: '10px 20px', 
                  backgroundColor: allProducts.length === 0 ? '#ffeeee' : '#eef8ee', 
                  border: `1px solid ${allProducts.length === 0 ? 'red' : 'green'}`, 
                  margin: '0 0 20px 0', 
                  borderRadius: '5px' 
                }}>
                  Loaded <strong>{allProducts.length}</strong> total furnitures from the database.
                  {allProducts.length === 0 && " (This might be why nothing is showing.)"}
                </div>

                {categories.map((cat) => {
                  
                  let categoryFurnitures = allProducts.filter(item => item.category === cat);
                  
                  const searchTerm = searchTerms[cat]?.toLowerCase() || "";
                  if (searchTerm) {
                    categoryFurnitures = categoryFurnitures.filter(item => 
                      item.name.toLowerCase().includes(searchTerm)
                    );
                  }

                  const currentSort = activeSort[cat] || "";
                  if (currentSort) {
                    if (currentSort.includes("Ascending")) {
                      categoryFurnitures.sort((a, b) => a.price - b.price);
                    } else if (currentSort.includes("Descending")) {
                      categoryFurnitures.sort((a, b) => b.price - a.price);
                    } else {
                      categoryFurnitures = categoryFurnitures.filter(item => item.type === currentSort);
                    }
                  }

                  return (
                    <div className="furniture-container" key={cat}>
                      <div className="section-header">
                        <span className="section-title">{cat} ({categoryFurnitures.length})</span>
                        <div className="dropdown-wrapper">
                          <span className="dropdown-toggle" onClick={() => toggleDropdown(cat)} style={{cursor: 'pointer'}}>
                            {activeSort[cat] || 'Sort'} ⇅
                          </span>
                          {dropdownOpen === cat && (
                            <div className="sort-dropdown">
                              <div onClick={() => handleSortChange(cat, "")}>Clear Sort</div>
                              {(sortOptions[cat] || []).map((option, index) => (
                                <div key={index} onClick={() => handleSortChange(cat, option)}>
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="search-container">
                        <input
                          type="text"
                          placeholder={`Search in ${cat}`}
                          value={searchTerms[cat] || ""}
                          onChange={(e) => handleSearchChange(cat, e.target.value)}
                        />
                        <button>🔍</button>
                      </div>

                      <div className="furniture-grid">
                        {categoryFurnitures.length > 0 ? (
                          categoryFurnitures.map((item) => (
                            <div className="furniture-card" key={item.id} onClick={() => openModal(item)}>
                              <img 
                                src={item.image || 'https://placehold.co/400x300/f0f0f0/ccc?text=Nest+Nook'} 
                                alt={item.name} 
                                onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Not+Found'}
                              />
                              <h4>{item.name}</h4>
                              <p className="price">{formatPrice(item.price)}</p>
                              <p className="details">Tap for more details!</p>
                            </div>
                          ))
                        ) : (
                          <p className="no-results">No results found in {cat}. (Check search term or filters)</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

      ) : (

        // PUBLIC "HOME" LAYOUT
        <>
          <Hero />
          <FurnitureCarousel products={newestProducts} />
          <TopRatedProducts 
            products={topRatedProducts} 
            onCardClick={openModal} 
            formatPrice={formatPrice} 
            renderStars={renderStars} 
          />
          <FeaturedCategories categories={featuredCategories} />
          <OurStory />
          <CTASection />
        </>
      )}
      
      {/* --- Details Modal (used by both views) --- */}
      {isModalOpen && selectedFurniture && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="modal-gallery">
                <div className="modal-main-image">
                  <img 
                    src={modalMainImage} 
                    alt={selectedFurniture.name} 
                    onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'}
                  />
                </div>
                <div className="modal-thumbnail-grid">
                  {getFurnitureImages().map((imgSrc, index) => (
                    <img 
                      key={index}
                      src={imgSrc} 
                      alt={`${selectedFurniture.name} thumbnail ${index + 1}`}
                      className={modalMainImage === imgSrc ? 'active' : ''}
                      onClick={() => setModalMainImage(imgSrc)}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-details">
                <h2>{selectedFurniture.name}</h2>
                <span className="price">{formatPrice(selectedFurniture.price)}</span>
                <div className="modal-info-grid">
                  <div className="info-item">
                    <label>Category</label>
                    <span>{selectedFurniture.category}</span>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <span>{selectedFurniture.type}</span>
                  </div>
                  <div className="info-item">
                    <label>Stock</label>
                    <span>{selectedFurniture.stock} units</span>
                  </div>
                  <div className="info-item">
                    <label>Dimensions (L x W x H)</label>
                    <span>
                      {selectedFurniture.dimensions?.length || 'N/A'}cm x 
                      {selectedFurniture.dimensions?.width || 'N/A'}cm x 
                      {selectedFurniture.dimensions?.height || 'N/A'}cm
                    </span>
                  </div>
                </div>
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>
                    {selectedFurniture.description || "No description provided."}
                  </p>
                </div>
                <div className="modal-reviews">
                   <h3>Reviews</h3>
                   <div className="reviews-list">
                      {loadingModal ? (
                        <p>Loading reviews...</p>
                      ) : modalReviews.length > 0 ? (
                        modalReviews.map(review => (
                          <div key={review.id} className="review-item">
                            <div className="review-header">
                              <span className="review-name">{review.customerName}</span>
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
            <div className="modal-actions">
              <button className="close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* --- End of Modal --- */}
      <Footer />
    </div>
  );
}

export default Home;

