require('dotenv').config();
const mongoose = require('mongoose');
const PurchaseOrder = require('./models/purchaseOrderModel');
const Inventory = require('./models/inventoryModel');
const User = require('./models/userModel');

const seedPurchaseOrders = async () => {
    try {
        console.log('🌱 Starting Purchase Order seeding...');
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing purchase orders
        await PurchaseOrder.deleteMany({});
        console.log('🧹 Cleared existing purchase orders');

        // Get users and inventory for references
        const users = await User.find({}).limit(3);
        const inventory = await Inventory.find({}).limit(20);

        if (users.length === 0 || inventory.length === 0) {
            console.log('❌ Need users and inventory items in database first');
            return;
        }

        // Sample vendors
        const vendors = [
            {
                name: 'TechSupply Solutions',
                email: 'orders@techsupply.com',
                phone: '+1-555-0123',
                address: '1234 Tech Park Ave, San Francisco, CA 94107'
            },
            {
                name: 'Global Electronics Inc',
                email: 'purchasing@globalelectronics.com',
                phone: '+1-555-0456',
                address: '5678 Commerce Blvd, Los Angeles, CA 90028'
            },
            {
                name: 'Office Essentials Co',
                email: 'orders@officeessentials.com',
                phone: '+1-555-0789',
                address: '9012 Business Park Dr, Austin, TX 78701'
            },
            {
                name: 'Industrial Supply Corp',
                email: 'sales@industrialsupply.com',
                phone: '+1-555-0321',
                address: '3456 Industrial Way, Chicago, IL 60601'
            },
            {
                name: 'Fashion Forward Wholesale',
                email: 'orders@fashionforward.com',
                phone: '+1-555-0654',
                address: '7890 Fashion Ave, New York, NY 10001'
            },
            {
                name: 'Home & Garden Suppliers',
                email: 'orders@homegardensupp.com',
                phone: '+1-555-0987',
                address: '2345 Garden Lane, Portland, OR 97201'
            },
            {
                name: 'BookWorld Distributors',
                email: 'orders@bookworlddist.com',
                phone: '+1-555-0147',
                address: '6789 Literary Blvd, Boston, MA 02101'
            },
            {
                name: 'Sports Equipment Direct',
                email: 'orders@sportsequipmentdirect.com',
                phone: '+1-555-0258',
                address: '4567 Athletic Ave, Denver, CO 80201'
            }
        ];

        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const statuses = ['Draft', 'Sent', 'Acknowledged', 'Partially Received', 'Received'];
        const paymentTerms = ['Net 30', 'Net 15', 'Net 60', 'Due on Receipt', 'COD'];

        const purchaseOrders = [];

        for (let i = 0; i < 20; i++) {
            const vendor = vendors[Math.floor(Math.random() * vendors.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentTerm = paymentTerms[Math.floor(Math.random() * paymentTerms.length)];

            // Select 1-5 random items for each purchase order
            const itemCount = Math.floor(Math.random() * 5) + 1;
            const shuffledInventory = [...inventory].sort(() => 0.5 - Math.random());
            const selectedItems = shuffledInventory.slice(0, itemCount);

            const orderItems = [];
            let subtotal = 0;

            for (const item of selectedItems) {
                const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 items
                const unitPrice = parseFloat((item.rate * (0.8 + Math.random() * 0.4)).toFixed(2)); // ±20% price variation
                const totalPrice = quantity * unitPrice;

                // Calculate received quantity based on status
                let receivedQuantity = 0;
                if (status === 'Received') {
                    receivedQuantity = quantity;
                } else if (status === 'Partially Received') {
                    receivedQuantity = Math.floor(quantity * (0.3 + Math.random() * 0.4)); // 30-70% received
                }

                orderItems.push({
                    productId: item._id,
                    productName: item.name,
                    sku: item.sku,
                    description: item.description || '',
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice,
                    receivedQuantity: receivedQuantity,
                    pendingQuantity: quantity - receivedQuantity
                });

                subtotal += totalPrice;
            }

            // Calculate additional costs
            const tax = parseFloat((subtotal * 0.08).toFixed(2));
            const discount = Math.random() < 0.3 ? parseFloat((subtotal * 0.05).toFixed(2)) : 0;
            const shippingCost = parseFloat((50 + Math.random() * 100).toFixed(2));
            const total = subtotal + tax - discount + shippingCost;

            // Calculate dates
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // 0-30 days ago

            const expectedDelivery = new Date(orderDate);
            expectedDelivery.setDate(expectedDelivery.getDate() + Math.floor(Math.random() * 14) + 7); // 7-21 days from order

            let actualDelivery = null;
            if (status === 'Received') {
                actualDelivery = new Date(orderDate);
                actualDelivery.setDate(actualDelivery.getDate() + Math.floor(Math.random() * 10) + 5); // 5-15 days from order
            }

            // Update receiving status based on items
            let receivingStatus = 'Pending';
            const totalOrdered = orderItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalReceived = orderItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
            
            if (totalReceived > 0) {
                receivingStatus = totalReceived < totalOrdered ? 'Partially Received' : 'Fully Received';
            }

            const purchaseOrder = {
                vendorName: vendor.name,
                vendorEmail: vendor.email,
                vendorPhone: vendor.phone,
                vendorAddress: vendor.address,
                items: orderItems,
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                shippingCost: shippingCost,
                total: total,
                status: status,
                priority: priority,
                orderDate: orderDate,
                expectedDelivery: expectedDelivery,
                actualDelivery: actualDelivery,
                notes: `Purchase order for ${vendor.name} - ${priority} priority`,
                internalNotes: `Created via seeding script - ${orderItems.length} items ordered`,
                approvalStatus: status === 'Draft' ? 'Pending' : 'Approved',
                approvedBy: status === 'Draft' ? null : randomUser._id,
                approvedAt: status === 'Draft' ? null : orderDate,
                paymentStatus: status === 'Received' ? 'Paid' : 'Pending',
                paymentTerms: paymentTerm,
                receivingStatus: receivingStatus,
                trackingNumber: status === 'Sent' || status === 'Acknowledged' || status === 'Partially Received' || status === 'Received' 
                    ? `TR${Math.random().toString(36).substr(2, 9).toUpperCase()}` 
                    : null,
                carrier: status === 'Sent' || status === 'Acknowledged' || status === 'Partially Received' || status === 'Received' 
                    ? ['FedEx', 'UPS', 'DHL', 'USPS'][Math.floor(Math.random() * 4)]
                    : null,
                department: ['Operations', 'IT', 'Sales', 'Marketing', 'HR'][Math.floor(Math.random() * 5)],
                deliveryLocation: ['Main Warehouse', 'Office Building A', 'Retail Store', 'Distribution Center'][Math.floor(Math.random() * 4)],
                createdBy: randomUser._id,
                statusHistory: [
                    {
                        status: 'Draft',
                        changedAt: orderDate,
                        changedBy: randomUser._id,
                        notes: 'Purchase order created'
                    },
                    ...(status !== 'Draft' ? [{
                        status: 'Sent',
                        changedAt: new Date(orderDate.getTime() + 3600000), // 1 hour later
                        changedBy: randomUser._id,
                        notes: 'Purchase order sent to vendor'
                    }] : []),
                    ...(status === 'Acknowledged' || status === 'Partially Received' || status === 'Received' ? [{
                        status: 'Acknowledged',
                        changedAt: new Date(orderDate.getTime() + 7200000), // 2 hours later
                        changedBy: randomUser._id,
                        notes: 'Vendor acknowledged purchase order'
                    }] : []),
                    ...(status === 'Partially Received' || status === 'Received' ? [{
                        status: status === 'Received' ? 'Received' : 'Partially Received',
                        changedAt: actualDelivery || new Date(orderDate.getTime() + 86400000 * 7), // 7 days later
                        changedBy: randomUser._id,
                        notes: `Items ${status === 'Received' ? 'fully' : 'partially'} received`
                    }] : [])
                ]
            };

            purchaseOrders.push(purchaseOrder);
        }

        // Create purchase orders one by one to trigger pre-save hooks
        const createdOrders = [];
        for (const orderData of purchaseOrders) {
            const order = new PurchaseOrder(orderData);
            const savedOrder = await order.save();
            createdOrders.push(savedOrder);
            console.log(`✅ Created PO: ${savedOrder.poNumber}`);
        }
        
        console.log(`✅ Created ${createdOrders.length} purchase orders`);
        
        // Calculate totals
        const totalOrderValue = createdOrders.reduce((sum, order) => sum + order.total, 0);
        const totalItems = createdOrders.reduce((sum, order) => sum + order.items.length, 0);
        
        console.log(`📊 Total Purchase Order Value: $${totalOrderValue.toFixed(2)}`);
        console.log(`📦 Total Items Ordered: ${totalItems}`);
        
        // Status breakdown
        const statusBreakdown = createdOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        
        console.log('📈 Status Breakdown:');
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} orders`);
        });
        
        // Priority breakdown
        const priorityBreakdown = createdOrders.reduce((acc, order) => {
            acc[order.priority] = (acc[order.priority] || 0) + 1;
            return acc;
        }, {});
        
        console.log('🎯 Priority Breakdown:');
        Object.entries(priorityBreakdown).forEach(([priority, count]) => {
            console.log(`   ${priority}: ${count} orders`);
        });

        console.log('🎉 Purchase Order seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding purchase orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run if called directly
if (require.main === module) {
    seedPurchaseOrders();
}

module.exports = seedPurchaseOrders;
