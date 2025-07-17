const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcrypt');

const generateUsers = async () => {
    try {
        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        const usersToCreate = [
            {
                name: 'Admin User',
                email: 'admin@quantix.com',
                password: await bcrypt.hash('admin123', 10),
                role: 'admin'
            },
            {
                name: 'John Smith',
                email: 'john.smith@quantix.com',
                password: await bcrypt.hash('staff123', 10),
                role: 'staff'
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@quantix.com',
                password: await bcrypt.hash('staff123', 10),
                role: 'staff'
            },
            {
                name: 'Mike Davis',
                email: 'mike.davis@quantix.com',
                password: await bcrypt.hash('staff123', 10),
                role: 'staff'
            },
            {
                name: 'Emily Chen',
                email: 'emily.chen@quantix.com',
                password: await bcrypt.hash('staff123', 10),
                role: 'staff'
            },
            {
                name: 'David Wilson',
                email: 'david.wilson@quantix.com',
                password: await bcrypt.hash('staff123', 10),
                role: 'staff'
            }
        ];

        // Create users
        const createdUsers = [];
        for (const userData of usersToCreate) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
            console.log(`✅ Created user: ${user.name} (${user.email})`);
        }

        console.log(`\n📊 User Summary:`);
        console.log(`====================`);
        console.log(`Total Users Created: ${createdUsers.length}`);
        console.log(`Admin Users: ${createdUsers.filter(u => u.role === 'admin').length}`);
        console.log(`Staff Users: ${createdUsers.filter(u => u.role === 'staff').length}`);
        console.log(`\n🔐 Login Credentials:`);
        console.log(`Admin: admin@quantix.com / admin123`);
        console.log(`Staff: john.smith@quantix.com / staff123`);
        console.log(`       sarah.johnson@quantix.com / staff123`);
        console.log(`       mike.davis@quantix.com / staff123`);
        console.log(`       emily.chen@quantix.com / staff123`);
        console.log(`       david.wilson@quantix.com / staff123`);
        console.log(`\n✅ User seeding completed successfully!`);
        
    } catch (error) {
        console.error('Error generating users:', error);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/quantix', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const main = async () => {
    await connectDB();
    await generateUsers();
    await mongoose.connection.close();
    console.log('Database connection closed');
};

main();
