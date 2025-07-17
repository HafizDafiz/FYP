require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('./models/inventoryModel');
const User = require('./models/userModel');

// Comprehensive inventory data with all fields
const inventoryItems = [
    // Electronics
    {
        name: 'Wireless Bluetooth Headphones',
        sku: 'ELEC-001',
        type: 'Electronics',
        description: 'High-quality wireless headphones with noise cancellation',
        rate: 89.99,
        quantity: 45
    },
    {
        name: 'Smartphone Case',
        sku: 'ELEC-002',
        type: 'Electronics',
        description: 'Protective case for smartphones with drop protection',
        rate: 24.99,
        quantity: 120
    },
    {
        name: 'USB-C Cable',
        sku: 'ELEC-003',
        type: 'Electronics',
        description: '6ft USB-C charging cable with fast charging support',
        rate: 12.99,
        quantity: 200
    },
    {
        name: 'Wireless Mouse',
        sku: 'ELEC-004',
        type: 'Electronics',
        description: 'Ergonomic wireless mouse with precision tracking',
        rate: 34.99,
        quantity: 75
    },
    {
        name: 'Bluetooth Speaker',
        sku: 'ELEC-005',
        type: 'Electronics',
        description: 'Portable Bluetooth speaker with 12-hour battery life',
        rate: 149.99,
        quantity: 30
    },
    {
        name: 'Phone Screen Protector',
        sku: 'ELEC-006',
        type: 'Electronics',
        description: 'Tempered glass screen protector for smartphones',
        rate: 9.99,
        quantity: 300
    },
    {
        name: 'Tablet Stand',
        sku: 'ELEC-007',
        type: 'Electronics',
        description: 'Adjustable stand for tablets and smartphones',
        rate: 19.99,
        quantity: 85
    },
    {
        name: 'Power Bank',
        sku: 'ELEC-008',
        type: 'Electronics',
        description: '10000mAh portable power bank with fast charging',
        rate: 29.99,
        quantity: 60
    },

    // Apparel
    {
        name: 'Classic Cotton T-Shirt',
        sku: 'APP-001',
        type: 'Apparel',
        description: '100% cotton t-shirt available in multiple colors',
        rate: 15.99,
        quantity: 150
    },
    {
        name: 'Denim Jeans',
        sku: 'APP-002',
        type: 'Apparel',
        description: 'Classic fit denim jeans with comfort stretch',
        rate: 49.99,
        quantity: 80
    },
    {
        name: 'Leather Jacket',
        sku: 'APP-003',
        type: 'Apparel',
        description: 'Genuine leather jacket with modern styling',
        rate: 199.99,
        quantity: 25
    },
    {
        name: 'Pullover Hoodie',
        sku: 'APP-004',
        type: 'Apparel',
        description: 'Comfortable pullover hoodie with front pocket',
        rate: 39.99,
        quantity: 90
    },
    {
        name: 'Wool Sweater',
        sku: 'APP-005',
        type: 'Apparel',
        description: 'Soft wool sweater perfect for cold weather',
        rate: 59.99,
        quantity: 40
    },
    {
        name: 'Casual Dress',
        sku: 'APP-006',
        type: 'Apparel',
        description: 'Comfortable casual dress suitable for daily wear',
        rate: 44.99,
        quantity: 65
    },
    {
        name: 'Athletic Shorts',
        sku: 'APP-007',
        type: 'Apparel',
        description: 'Moisture-wicking athletic shorts for active wear',
        rate: 22.99,
        quantity: 100
    },
    {
        name: 'Formal Blazer',
        sku: 'APP-008',
        type: 'Apparel',
        description: 'Professional blazer suitable for business occasions',
        rate: 89.99,
        quantity: 35
    },
    {
        name: 'Running Shoes',
        sku: 'APP-009',
        type: 'Apparel',
        description: 'Lightweight running shoes with cushioned sole',
        rate: 79.99,
        quantity: 55
    },
    {
        name: 'Winter Coat',
        sku: 'APP-010',
        type: 'Apparel',
        description: 'Insulated winter coat with waterproof exterior',
        rate: 129.99,
        quantity: 20
    },

    // Home & Garden
    {
        name: 'Ceramic Coffee Mug',
        sku: 'HOME-001',
        type: 'Home & Garden',
        description: 'Durable ceramic coffee mug with comfortable handle',
        rate: 8.99,
        quantity: 200
    },
    {
        name: 'Throw Pillow',
        sku: 'HOME-002',
        type: 'Home & Garden',
        description: 'Decorative throw pillow with removable cover',
        rate: 16.99,
        quantity: 120
    },
    {
        name: 'LED Desk Lamp',
        sku: 'HOME-003',
        type: 'Home & Garden',
        description: 'Adjustable LED desk lamp with touch controls',
        rate: 34.99,
        quantity: 70
    },
    {
        name: 'Garden Planter',
        sku: 'HOME-004',
        type: 'Home & Garden',
        description: 'Decorative ceramic planter for indoor plants',
        rate: 24.99,
        quantity: 85
    },
    {
        name: 'Kitchen Knife Set',
        sku: 'HOME-005',
        type: 'Home & Garden',
        description: 'Professional kitchen knife set with wooden block',
        rate: 89.99,
        quantity: 40
    },
    {
        name: 'Scented Candle',
        sku: 'HOME-006',
        type: 'Home & Garden',
        description: 'Soy wax scented candle with 40-hour burn time',
        rate: 19.99,
        quantity: 150
    },
    {
        name: 'Wall Mirror',
        sku: 'HOME-007',
        type: 'Home & Garden',
        description: 'Decorative wall mirror with modern frame',
        rate: 54.99,
        quantity: 30
    },
    {
        name: 'Storage Basket',
        sku: 'HOME-008',
        type: 'Home & Garden',
        description: 'Woven storage basket for organization',
        rate: 22.99,
        quantity: 90
    },

    // Books & Media
    {
        name: 'Business Strategy Book',
        sku: 'BOOK-001',
        type: 'Books & Media',
        description: 'Comprehensive guide to modern business strategy',
        rate: 29.99,
        quantity: 60
    },
    {
        name: 'Recipe Cookbook',
        sku: 'BOOK-002',
        type: 'Books & Media',
        description: 'Collection of easy-to-follow recipes for home cooking',
        rate: 24.99,
        quantity: 75
    },
    {
        name: 'Fiction Novel',
        sku: 'BOOK-003',
        type: 'Books & Media',
        description: 'Bestselling fiction novel with compelling storyline',
        rate: 16.99,
        quantity: 100
    },
    {
        name: 'Programming Guide',
        sku: 'BOOK-004',
        type: 'Books & Media',
        description: 'Complete guide to modern programming languages',
        rate: 39.99,
        quantity: 45
    },

    // Sports & Outdoors
    {
        name: 'Yoga Mat',
        sku: 'SPORT-001',
        type: 'Sports & Outdoors',
        description: 'Non-slip yoga mat with carrying strap',
        rate: 29.99,
        quantity: 80
    },
    {
        name: 'Water Bottle',
        sku: 'SPORT-002',
        type: 'Sports & Outdoors',
        description: 'Insulated stainless steel water bottle',
        rate: 19.99,
        quantity: 150
    },
    {
        name: 'Resistance Bands',
        sku: 'SPORT-003',
        type: 'Sports & Outdoors',
        description: 'Set of resistance bands for home workouts',
        rate: 24.99,
        quantity: 90
    },
    {
        name: 'Camping Tent',
        sku: 'SPORT-004',
        type: 'Sports & Outdoors',
        description: '2-person camping tent with weather protection',
        rate: 89.99,
        quantity: 25
    },
    {
        name: 'Hiking Backpack',
        sku: 'SPORT-005',
        type: 'Sports & Outdoors',
        description: 'Durable hiking backpack with multiple compartments',
        rate: 69.99,
        quantity: 35
    },

    // Beauty & Personal Care
    {
        name: 'Moisturizer Cream',
        sku: 'BEAUTY-001',
        type: 'Beauty & Personal Care',
        description: 'Hydrating moisturizer cream for daily skincare',
        rate: 18.99,
        quantity: 120
    },
    {
        name: 'Shampoo',
        sku: 'BEAUTY-002',
        type: 'Beauty & Personal Care',
        description: 'Gentle shampoo for all hair types',
        rate: 12.99,
        quantity: 180
    },
    {
        name: 'Lip Balm',
        sku: 'BEAUTY-003',
        type: 'Beauty & Personal Care',
        description: 'Nourishing lip balm with SPF protection',
        rate: 4.99,
        quantity: 250
    },
    {
        name: 'Face Mask',
        sku: 'BEAUTY-004',
        type: 'Beauty & Personal Care',
        description: 'Hydrating face mask for weekly skincare routine',
        rate: 14.99,
        quantity: 100
    },

    // Toys & Games
    {
        name: 'Puzzle Game',
        sku: 'TOY-001',
        type: 'Toys & Games',
        description: '1000-piece jigsaw puzzle with beautiful artwork',
        rate: 19.99,
        quantity: 70
    },
    {
        name: 'Board Game',
        sku: 'TOY-002',
        type: 'Toys & Games',
        description: 'Strategy board game for family entertainment',
        rate: 34.99,
        quantity: 50
    },
    {
        name: 'Building Blocks',
        sku: 'TOY-003',
        type: 'Toys & Games',
        description: 'Creative building blocks set for children',
        rate: 29.99,
        quantity: 85
    },

    // Automotive
    {
        name: 'Car Air Freshener',
        sku: 'AUTO-001',
        type: 'Automotive',
        description: 'Long-lasting car air freshener with pleasant scent',
        rate: 6.99,
        quantity: 200
    },
    {
        name: 'Phone Car Mount',
        sku: 'AUTO-002',
        type: 'Automotive',
        description: 'Secure phone mount for dashboard use',
        rate: 16.99,
        quantity: 95
    },
    {
        name: 'Car Charger',
        sku: 'AUTO-003',
        type: 'Automotive',
        description: 'Fast charging car charger with dual USB ports',
        rate: 14.99,
        quantity: 120
    }
];

// Function to generate random stock levels based on item type
function adjustStockLevels(items) {
    return items.map(item => {
        let stockMultiplier = 1;
        
        // Adjust stock based on item type and price
        if (item.rate < 20) {
            stockMultiplier = 1.5; // Higher stock for cheaper items
        } else if (item.rate > 100) {
            stockMultiplier = 0.6; // Lower stock for expensive items
        }
        
        // Add some randomness to make it more realistic
        const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        const newQuantity = Math.floor(item.quantity * stockMultiplier * randomFactor);
        
        return {
            ...item,
            quantity: Math.max(0, newQuantity) // Ensure non-negative
        };
    });
}

async function seedInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get a user to associate with inventory items
        const users = await User.find({});
        if (users.length === 0) {
            console.log('No users found. Please create a user first.');
            return;
        }
        const defaultUser = users[0];

        // Clear existing inventory
        await Inventory.deleteMany({});
        console.log('Cleared existing inventory');

        // Adjust stock levels for realism
        const adjustedItems = adjustStockLevels(inventoryItems);

        // Add user_id to each item
        const itemsWithUser = adjustedItems.map(item => ({
            ...item,
            user_id: defaultUser._id
        }));

        // Insert all items
        const createdItems = await Inventory.insertMany(itemsWithUser);
        console.log(`Created ${createdItems.length} inventory items`);

        // Display summary
        const categoryCounts = {};
        const lowStockItems = [];
        let totalValue = 0;

        for (const item of createdItems) {
            // Count by category
            categoryCounts[item.type] = (categoryCounts[item.type] || 0) + 1;
            
            // Check for low stock (less than 20)
            if (item.quantity < 20) {
                lowStockItems.push({
                    name: item.name,
                    quantity: item.quantity,
                    sku: item.sku
                });
            }
            
            // Calculate total value
            totalValue += item.quantity * item.rate;
        }

        console.log('\n📦 Inventory Summary:');
        console.log('====================');
        console.log('By Category:');
        Object.entries(categoryCounts).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} items`);
        });

        console.log(`\n💰 Total Inventory Value: $${totalValue.toFixed(2)}`);
        console.log(`📊 Average Item Value: $${(totalValue / createdItems.length).toFixed(2)}`);
        
        const totalQuantity = createdItems.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`📦 Total Items in Stock: ${totalQuantity}`);

        if (lowStockItems.length > 0) {
            console.log(`\n⚠️  Low Stock Items (< 20):`);
            lowStockItems.forEach(item => {
                console.log(`  ${item.name} (${item.sku}): ${item.quantity} units`);
            });
        }

        // Price range analysis
        const priceRanges = {
            'Under $10': 0,
            '$10-$30': 0,
            '$30-$60': 0,
            '$60-$100': 0,
            'Over $100': 0
        };

        createdItems.forEach(item => {
            if (item.rate < 10) priceRanges['Under $10']++;
            else if (item.rate < 30) priceRanges['$10-$30']++;
            else if (item.rate < 60) priceRanges['$30-$60']++;
            else if (item.rate < 100) priceRanges['$60-$100']++;
            else priceRanges['Over $100']++;
        });

        console.log('\n💲 Price Range Distribution:');
        Object.entries(priceRanges).forEach(([range, count]) => {
            console.log(`  ${range}: ${count} items`);
        });

        console.log('\n✅ Sample inventory created successfully!');
        console.log('🎯 All items have complete information (name, SKU, type, description, rate, quantity)');
        
    } catch (error) {
        console.error('Error seeding inventory:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seeding script
seedInventory();
