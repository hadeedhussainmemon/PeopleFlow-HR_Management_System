const User = require('../models/User');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not found in environment variables. Skipping seed.');
      return;
    }

    // 1. Find all existing admins
    const existingAdmins = await User.find({ role: 'admin' });

    // 2. Remove admins that don't match the env email
    for (const admin of existingAdmins) {
      if (admin.email !== adminEmail) {
        await User.findByIdAndDelete(admin._id);
        console.log(`Removed unauthorized admin: ${admin.email}`);
      }
    }

    // 3. Create or Update the Env Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const envAdmin = await User.findOne({ email: adminEmail });

    if (envAdmin) {
      // Update password and ensure role is admin
      envAdmin.password = hashedPassword;
      envAdmin.role = 'admin'; // Just in case
      await envAdmin.save();
      console.log(`Admin user updated: ${adminEmail}`);
    } else {
      // Create new admin
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        department: 'IT',
        leaveBalance: {
          vacation: 0,
          sick: 0,
          casual: 0
        }
      });
      console.log(`Admin user created: ${adminEmail}`);
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

module.exports = seedAdmin;
