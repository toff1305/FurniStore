const mongoose = require("mongoose");

// Import all 9 models
const Order = require("./models/Order");
const OrderDetail = require("./models/OrderDetail");
const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Category = require("./models/Category");
const ProductType = require("./models/ProductType");
const Images = require("./models/Images");
const Payment = require("./models/Payment");
const Review = require("./models/Review");

// --- 1. SET YOUR MONGO_URI ---
const MONGO_URI = "mongodb+srv://dbmsfs:dbmsfs@cluster0.fctxzda.mongodb.net/FurnitureStore";

const seedDatabase = async () => {
  try {
    // 2. Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Successfully connected to MongoDB for seeding.");

    // 3. Clear all existing data (WARNING: DESTRUCTIVE)
    console.log("🧹 Clearing old data...");
    // Clear in an order that respects dependencies
    await OrderDetail.deleteMany({});
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Images.deleteMany({});
    await Product.deleteMany({});
    await ProductType.deleteMany({});
    await Category.deleteMany({});
    await Customer.deleteMany({});
    console.log("🗑️ Old data cleared.");

    // 4. Create Customers
    console.log("👤 Creating customers...");
    const customers = await Customer.create([
      {
        customer_name: "Admin User",
        email: "admin@gmail.com",
        password: "12345", // Will be hashed by the Customer model's pre-save hook
        role: "admin",
        phone_number: "09123456789",
        shipping_address: "123 Admin St, Metro Manila"
      },
      {
        customer_name: "Kristine Cruz",
        email: "kristine@gmail.com",
        password: "12345",
        phone_number: "09111111111",
        shipping_address: "456 User Ave, Quezon City"
      },
      {
        customer_name: "CJ Aroy",
        email: "cj@gmail.com",
        password: "12345",
        phone_number: "09222222222",
        shipping_address: "789 Guest Rd, Pasig City"
      },
      {
        customer_name: "Hannah Lee",
        email: "hannah@gmail.com",
        password: "12345",
        phone_number: "09333333333",
        shipping_address: "101 Shopper Blvd, Makati City"
      },
    ]);
    const [admin, user1, user2, user3] = customers;
    console.log(`👤 Created ${customers.length} customers.`);

    // 5. Create Categories
    console.log("🏷️ Creating categories...");
    const categories = await Category.create([
      { category_name: "Living Room" },
      { category_name: "Bedroom" },
      { category_name: "Dining Room" },
      { category_name: "Office" },
      { category_name: "Outdoor" },
    ]);
    const [livingRoom, bedroom, diningRoom, office, outdoor] = categories;
    console.log(`🏷️ Created ${categories.length} categories.`);

    // 6. Create Product Types
    console.log("U Creating product types...");
    const productTypes = await ProductType.create([
      // Living Room
      { category_id: livingRoom._id, product_type_name: "Sofa" },
      { category_id: livingRoom._id, product_type_name: "Center Table" },
      { category_id: livingRoom._id, product_type_name: "TV Stand" },
      // Bedroom
      { category_id: bedroom._id, product_type_name: "Bed Frame" },
      { category_id: bedroom._id, product_type_name: "Wardrobe" },
      { category_id: bedroom._id, product_type_name: "Side Table" },
      // Dining Room
      { category_id: diningRoom._id, product_type_name: "Dining Table" },
      { category_id: diningRoom._id, product_type_name: "Dining Chair" },
      // Office
      { category_id: office._id, product_type_name: "Office Desk" },
      { category_id: office._id, product_type_name: "Office Chair" },
      // Outdoor
      { category_id: outdoor._id, product_type_name: "Patio Set" },
    ]);
    // Destructure for easy access
    const [
        sofa, centerTable, tvStand,
        bedFrame, wardrobe, sideTable,
        diningTable, diningChair,
        officeDesk, officeChair,
        patioSet
    ] = productTypes;
    console.log(`U Created ${productTypes.length} product types.`);

    // 7. Create Products
    console.log("🪑 Creating products...");
    const products = await Product.create([
      {
        product_name: "Plush Velvet Sofa",
        price: 24999, stock_quantity: 15,
        product_description: "A very comfortable plush velvet sofa, perfect for any modern living room.",
        category_id: livingRoom._id, product_type_id: sofa._id,
        dimensions: { length: 200, width: 90, height: 85 }
      },
      {
        product_name: "Minimalist Bed Frame (Queen)",
        price: 12999, stock_quantity: 25,
        product_description: "A queen-size minimalist bed frame made from solid oak.",
        category_id: bedroom._id, product_type_id: bedFrame._id,
        dimensions: { length: 205, width: 155, height: 100 }
      },
      {
        product_name: "Glass Top Dining Table",
        price: 18999, stock_quantity: 10,
        product_description: "A sleek dining table with a tempered glass top and metal legs. Seats 6.",
        category_id: diningRoom._id, product_type_id: diningTable._id,
        dimensions: { length: 180, width: 90, height: 75 }
      },
      {
        product_name: "Modern 3-Door Wardrobe",
        price: 21500, stock_quantity: 12,
        product_description: "A spacious 3-door wardrobe with a mirror and multiple compartments.",
        category_id: bedroom._id, product_type_id: wardrobe._id,
        dimensions: { length: 150, width: 60, height: 200 }
      },
      {
        product_name: "Industrial Coffee Table",
        price: 7999, stock_quantity: 30,
        product_description: "A rustic coffee table with a solid wood top and black metal frame.",
        category_id: livingRoom._id, product_type_id: centerTable._id,
        dimensions: { length: 110, width: 60, height: 45 }
      },
      {
        product_name: "Ergonomic Office Chair",
        price: 8999, stock_quantity: 40,
        product_description: "High-back ergonomic mesh chair with lumbar support and adjustable armrests.",
        category_id: office._id, product_type_id: officeChair._id,
        dimensions: { length: 65, width: 60, height: 120 }
      },
      {
        product_name: "Executive L-Shaped Desk",
        price: 15999, stock_quantity: 18,
        product_description: "A large L-shaped desk with built-in drawers and a modern finish.",
        category_id: office._id, product_type_id: officeDesk._id,
        dimensions: { length: 160, width: 140, height: 76 }
      },
      {
        product_name: "4-Seater Patio Set",
        price: 22999, stock_quantity: 14,
        product_description: "Weather-resistant wicker patio set with two chairs, one loveseat, and a glass-top table.",
        category_id: outdoor._id, product_type_id: patioSet._id,
        dimensions: { length: 120, width: 70, height: 40 } // Table dimensions
      },
      {
        product_name: "Upholstered Dining Chair (Set of 2)",
        price: 5999, stock_quantity: 50,
        product_description: "A set of two comfortable dining chairs with grey fabric upholstery.",
        category_id: diningRoom._id, product_type_id: diningChair._id,
        dimensions: { length: 45, width: 50, height: 95 }
      },
      {
        product_name: "Modern TV Stand",
        price: 6499, stock_quantity: 22,
        product_description: "A low-profile TV stand with open shelves and two cabinets. Fits TVs up to 65 inches.",
        category_id: livingRoom._id, product_type_id: tvStand._id,
        dimensions: { length: 160, width: 40, height: 50 }
      },
    ]);
    const [prod1, prod2, prod3, prod4, prod5, prod6, prod7, prod8, prod9, prod10] = products;
    console.log(`🪑 Created ${products.length} products.`);

    // 8. Create and Link Images
    console.log("🖼️ Creating and linking images...");
    const imagesData = [
      { product_id: prod1._id, main_photo_url: "https://placehold.co/600x400/5A67D8/FFF?text=Sofa+1", secondary_photo_url: "https://placehold.co/600x400/5A67D8/FFF?text=Sofa+2" },
      { product_id: prod2._id, main_photo_url: "https://placehold.co/600x400/38A169/FFF?text=Bed+1", secondary_photo_url: "https://placehold.co/600x400/38A169/FFF?text=Bed+2", third_photo_url: "https://placehold.co/600x400/38A169/FFF?text=Bed+3" },
      { product_id: prod3._id, main_photo_url: "https://placehold.co/600x400/DD6B20/FFF?text=Dining+Table" },
      { product_id: prod4._id, main_photo_url: "https://placehold.co/600x400/38A169/FFF?text=Wardrobe" },
      { product_id: prod5._id, main_photo_url: "https://placehold.co/600x400/5A67D8/FFF?text=Coffee+Table" },
      { product_id: prod6._id, main_photo_url: "https://placehold.co/600x400/D53F8C/FFF?text=Office+Chair" },
      { product_id: prod7._id, main_photo_url: "https://placehold.co/600x400/D53F8C/FFF?text=Office+Desk" },
      { product_id: prod8._id, main_photo_url: "https://placehold.co/600x400/319795/FFF?text=Patio+Set" },
      { product_id: prod9._id, main_photo_url: "https://placehold.co/600x400/DD6B20/FFF?text=Dining+Chair" },
      { product_id: prod10._id, main_photo_url: "https://placehold.co/600x400/5A67D8/FFF?text=TV+Stand" },
    ];
    const createdImages = await Images.insertMany(imagesData);

    // Link images back to products
    for (const img of createdImages) {
      await Product.findByIdAndUpdate(img.product_id, { images_id: img._id });
    }
    console.log(`🖼️ Created ${createdImages.length} image records and linked to products.`);

    // 9. Create Orders
    console.log("📦 Creating orders...");
    const orders = await Order.create([
      { customer_id: user1._id, date_of_order: new Date("2023-11-01T10:00:00Z"), order_status: "Completed" },
      { customer_id: user2._id, date_of_order: new Date("2023-11-02T11:00:00Z"), order_status: "To Ship" },
      { customer_id: user3._id, date_of_order: new Date("2023-11-03T14:00:00Z"), order_status: "To Ship" },
      { customer_id: user1._id, date_of_order: new Date("2023-11-04T09:00:00Z"), order_status: "Pending" },
      { customer_id: user2._id, date_of_order: new Date("2023-10-10T12:00:00Z"), order_status: "Cancelled" },
      { customer_id: user3._id, date_of_order: new Date("2023-10-28T16:00:00Z"), order_status: "To Receive" },
      { customer_id: user1._id, date_of_order: new Date("2023-10-25T16:00:00Z"), order_status: "Completed" },
    ]);
    const [order1, order2, order3, order4, order5, order6, order7] = orders;
    console.log(`📦 Created ${orders.length} orders.`);

    // 10. Create OrderDetails
    console.log("🧾 Creating order details...");
    await OrderDetail.insertMany([
      // Order 1 (Completed)
      { order_id: order1._id, product_id: prod6._id, quantity: 1, order_price: prod6.price }, // Office Chair
      // Order 2 (To Ship) - Multiple items
      { order_id: order2._id, product_id: prod2._id, quantity: 1, order_price: prod2.price }, // Bed Frame
      { order_id: order2._id, product_id: prod4._id, quantity: 1, order_price: prod4.price }, // Wardrobe
      // Order 3 (To Ship)
      { order_id: order3._id, product_id: prod3._id, quantity: 1, order_price: prod3.price }, // Dining Table
      { order_id: order3._id, product_id: prod9._id, quantity: 2, order_price: prod9.price }, // 2x Dining Chair sets
      // Order 4 (Pending)
      { order_id: order4._id, product_id: prod8._id, quantity: 1, order_price: prod8.price }, // Patio Set
      // Order 5 (Cancelled)
      { order_id: order5._id, product_id: prod1._id, quantity: 1, order_price: prod1.price }, // Sofa
      // Order 6 (To Receive)
      { order_id: order6._id, product_id: prod7._id, quantity: 1, order_price: prod7.price }, // Office Desk
      // Order 7 (Completed)
      { order_id: order7._id, product_id: prod10._id, quantity: 1, order_price: prod10.price }, // TV Stand
    ]);
    console.log("🧾 Created order details.");

    // 11. Create Payments
    console.log("💳 Creating payments...");
    await Payment.insertMany([
      { order_id: order1._id, payment_date: new Date("2023-11-01T10:05:00Z"), payment_method: "Credit Card", total_amount: prod6.price, payment_status: "Paid" },
      { order_id: order2._id, payment_date: new Date("2023-11-02T11:05:00Z"), payment_method: "Cash on Delivery", total_amount: prod2.price + prod4.price, payment_status: "Unpaid" },
      { order_id: order3._id, payment_date: new Date("2023-11-03T14:05:00Z"), payment_method: "GCash", total_amount: prod3.price + (prod9.price * 2), payment_status: "Paid" },
      { order_id: order4._id, payment_date: new Date("2023-11-04T09:05:00Z"), payment_method: "Pending", total_amount: prod8.price, payment_status: "Unpaid" },
      { order_id: order5._id, payment_date: new Date("2023-10-10T12:05:00Z"), payment_method: "GCash", total_amount: prod1.price, payment_status: "Refunded" },
      { order_id: order6._id, payment_date: new Date("2023-10-28T16:05:00Z"), payment_method: "Credit Card", total_amount: prod7.price, payment_status: "Paid" },
      { order_id: order7._id, payment_date: new Date("2023-10-25T16:05:00Z"), payment_method: "GCash", total_amount: prod10.price, payment_status: "Paid" },
    ]);
    console.log("💳 Created payment records.");

    // 12. Create Reviews
    console.log("⭐ Creating reviews...");
    await Review.insertMany([
      { product_id: prod6._id, customer_id: user1._id, rating: 5, comment: "Best office chair I've ever used! My back pain is gone.", review_date: new Date("2023-11-05T10:00:00Z")},
      { product_id: prod10._id, customer_id: user1._id, rating: 4, comment: "Looks great, but was a bit difficult to assemble.", review_date: new Date("2023-10-30T10:00:00Z")},
      { product_id: prod1._id, customer_id: user2._id, rating: 5, comment: "So comfortable! The velvet is very high quality.", review_date: new Date("2023-10-15T10:00:00Z")}, // From cancelled order, maybe a mistake, but possible
      { product_id: prod6._id, customer_id: user3._id, rating: 4, comment: "Good chair. Solid build.", review_date: new Date("2023-11-06T10:00:00Z")},
    ]);
    console.log("⭐ Created reviews.");


    console.log("\n✅ --- SEEDING COMPLETE --- ✅\n");

  } catch (error) {
    console.error("❌ --- SEEDING FAILED --- ❌");
    console.error(error);
  } finally {
    // 13. Disconnect from the database
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
};

// Run the seed function
seedDatabase();