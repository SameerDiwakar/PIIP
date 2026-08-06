require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { seedDemoUser } = require('../services/seedService');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/piip');
    console.log('Connected to MongoDB');

    const result = await seedDemoUser();
    console.log('\n✅ Demo data seeded successfully!\n');
    console.log('Login credentials:');
    console.log('  Email:    demo@piip.com');
    console.log('  Password: demo1234');
    console.log('\nSeeded:', result);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

run();
