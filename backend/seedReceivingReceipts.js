const mongoose = require('mongoose');
const ReceivingReceipt = require('./models/receivingReceiptModel');
const PurchaseOrder = require('./models/purchaseOrderModel');
const User = require('./models/userModel');

const generateReceivingReceipts = async () => {
    try {
        // Clear existing receiving receipts
        await ReceivingReceipt.deleteMany({});
        console.log('Cleared existing receiving receipts');

        // Get users and purchase orders
        const users = await User.find({});
        const purchaseOrders = await PurchaseOrder.find({});
        
        console.log(`Found ${users.length} users`);
        console.log(`Found ${purchaseOrders.length} purchase orders`);
        
        // Filter eligible purchase orders
        const eligiblePOs = purchaseOrders.filter(po => 
            ['Sent', 'Acknowledged', 'Partially Received'].includes(po.status)
        );
        
        console.log(`Found ${eligiblePOs.length} eligible purchase orders`);

        if (users.length === 0 || eligiblePOs.length === 0) {
            console.log('No users or eligible purchase orders found. Create purchase orders first.');
            return;
        }

        const getRandomUser = () => users[Math.floor(Math.random() * users.length)];
        const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const carriers = ['DHL', 'FedEx', 'UPS', 'USPS', 'Local Delivery', 'Pickup'];
        const conditions = ['Good', 'Damaged', 'Defective', 'Partial'];
        const statuses = ['Received', 'Inspected', 'Approved', 'Rejected', 'Partial'];
        const locations = ['Warehouse A', 'Warehouse B', 'Storage Room 1', 'Storage Room 2', 'Receiving Dock'];

        const receipts = [];

        // Generate receiving receipts for approved purchase orders
        for (let i = 0; i < Math.min(15, eligiblePOs.length); i++) {
            const order = eligiblePOs[i];
            const receivedBy = getRandomUser();
            const inspectedBy = getRandomUser();
            const approvedBy = getRandomUser();

            // Process items - randomly receive partial or full quantities
            const processedItems = order.items.map(item => {
                const maxReceivable = item.quantity - (item.receivedQuantity || 0);
                const quantityReceived = Math.floor(Math.random() * maxReceivable) + 1;
                
                return {
                    purchaseOrderId: order._id,
                    purchaseOrderItemId: item._id,
                    productId: item.productId,
                    productName: item.productName,
                    sku: item.sku,
                    quantityOrdered: item.quantity,
                    quantityReceived: quantityReceived,
                    unitPrice: item.unitPrice,
                    totalValue: quantityReceived * item.unitPrice,
                    condition: getRandomElement(conditions),
                    location: getRandomElement(locations),
                    batchNumber: `BATCH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    serialNumber: Math.random() > 0.7 ? `SN-${Math.random().toString(36).substr(2, 10).toUpperCase()}` : null,
                    expiryDate: Math.random() > 0.8 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
                    notes: Math.random() > 0.6 ? `Item received in ${getRandomElement(['excellent', 'good', 'fair', 'poor'])} condition` : ''
                };
            });

            const totalValue = processedItems.reduce((sum, item) => sum + item.totalValue, 0);
            const deliveryDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

            const receipt = {
                purchaseOrderId: order._id,
                poNumber: order.poNumber,
                vendorName: order.vendorName,
                vendorEmail: order.vendorEmail,
                items: processedItems,
                deliveryDate: deliveryDate,
                trackingNumber: `TRK-${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
                carrier: getRandomElement(carriers),
                totalValue: totalValue,
                qualityInspection: {
                    passed: Math.random() > 0.15,
                    inspectedBy: inspectedBy._id,
                    inspectionDate: new Date(deliveryDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
                    inspectionNotes: Math.random() > 0.5 ? 'Quality inspection completed successfully' : 'Minor cosmetic issues noted'
                },
                status: getRandomElement(statuses),
                receivingLocation: getRandomElement(locations),
                storageLocation: getRandomElement(locations),
                notes: Math.random() > 0.4 ? 'All items received as expected' : 'Some items required additional inspection',
                discrepancyNotes: Math.random() > 0.8 ? 'Quantity discrepancy noted and reported' : null,
                receivedBy: receivedBy._id,
                inspectedBy: Math.random() > 0.3 ? inspectedBy._id : null,
                approvedBy: Math.random() > 0.5 ? approvedBy._id : null,
                receivedAt: deliveryDate,
                inspectedAt: Math.random() > 0.4 ? new Date(deliveryDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
                approvedAt: Math.random() > 0.6 ? new Date(deliveryDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
                createdBy: receivedBy._id
            };

            receipts.push(receipt);
        }

        // Create receipts one by one to trigger pre-save hooks
        let createdCount = 0;
        let totalValue = 0;
        let totalItems = 0;

        for (const receiptData of receipts) {
            try {
                const receipt = new ReceivingReceipt(receiptData);
                await receipt.save();
                createdCount++;
                totalValue += receipt.totalValue;
                totalItems += receipt.items.length;
                
                console.log(`Created receipt ${receipt.receiptNumber} for PO ${receipt.poNumber} - $${receipt.totalValue.toFixed(2)}`);
            } catch (error) {
                console.error('Error creating receipt:', error.message);
            }
        }

        console.log('\n🎉 Receiving Receipt Seeding Complete!');
        console.log(`📊 Created ${createdCount} receiving receipts`);
        console.log(`💰 Total value received: $${totalValue.toLocaleString()}`);
        console.log(`📦 Total items processed: ${totalItems}`);
        console.log(`📋 Average receipt value: $${(totalValue / createdCount).toFixed(2)}`);

        // Show status breakdown
        const statusBreakdown = receipts.reduce((acc, receipt) => {
            acc[receipt.status] = (acc[receipt.status] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📈 Status Breakdown:');
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

    } catch (error) {
        console.error('Error seeding receiving receipts:', error);
    }
};

// Connect to MongoDB and run the seeding
const connectAndSeed = async () => {
    try {
        await mongoose.connect(process.env.MONG_URI || 'mongodb://localhost:27017/fyp', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        await generateReceivingReceipts();
        
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Connection error:', error);
        process.exit(1);
    }
};

// Run if this file is executed directly
if (require.main === module) {
    connectAndSeed();
}

module.exports = { generateReceivingReceipts };
