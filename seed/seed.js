require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Flight = require('../models/Flight');
const Campaign = require('../models/Campaign');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Announcement = require('../models/Announcement');

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Flight.deleteMany({});
    await Campaign.deleteMany({});
    await Client.deleteMany({});
    await Task.deleteMany({});
    await Announcement.deleteMany({});
    console.log('✓ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    // Superadmin
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'super@mayfair.test',
      password: hashedPassword,
      role: 'superadmin',
      allowedModules: ['hrms', 'flightManagement', 'campaigns', 'clients']
    });
    console.log('✓ Created superadmin:', superadmin.email);

    // Admin - Operations (Ops)
    const opsAdmin = await User.create({
      name: 'Ops Admin',
      email: 'ops@mayfair.test',
      password: hashedPassword,
      role: 'admin',
      allowedModules: ['flightManagement', 'clients']
    });
    console.log('✓ Created Ops Admin:', opsAdmin.email);

    // Admin - HR
    const hrAdmin = await User.create({
      name: 'HR Admin',
      email: 'hr@mayfair.test',
      password: hashedPassword,
      role: 'admin',
      allowedModules: ['hrms']
    });
    console.log('✓ Created HR Admin:', hrAdmin.email);

    // Admin - Marketing
    const marketingAdmin = await User.create({
      name: 'Marketing Admin',
      email: 'marketing@mayfair.test',
      password: hashedPassword,
      role: 'admin',
      allowedModules: ['campaigns', 'clients']
    });
    console.log('✓ Created Marketing Admin:', marketingAdmin.email);

    // Regular users with varying modules
    const user1 = await User.create({
      name: 'Flight User',
      email: 'flight.user@mayfair.test',
      password: hashedPassword,
      role: 'user',
      allowedModules: ['flightManagement']
    });

    const user2 = await User.create({
      name: 'HR User',
      email: 'hr.user@mayfair.test',
      password: hashedPassword,
      role: 'user',
      allowedModules: ['hrms']
    });

    const user3 = await User.create({
      name: 'Multi Module User',
      email: 'multi.user@mayfair.test',
      password: hashedPassword,
      role: 'user',
      allowedModules: ['flightManagement', 'campaigns']
    });

    const user4 = await User.create({
      name: 'Limited User',
      email: 'limited@mayfair.test',
      password: hashedPassword,
      role: 'user',
      allowedModules: []
    });

    console.log('✓ Created regular users');

    return {
      superadmin,
      opsAdmin,
      hrAdmin,
      marketingAdmin,
      user1,
      user2,
      user3,
      user4
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed employees
const seedEmployees = async (hrAdmin) => {
  try {
    const employees = await Employee.insertMany([
      {
        name: 'John Doe',
        department: 'Operations',
        position: 'Flight Operations Manager',
        joinDate: new Date('2022-01-15'),
        status: 'active'
      },
      {
        name: 'Jane Smith',
        department: 'HR',
        position: 'HR Manager',
        joinDate: new Date('2021-06-20'),
        status: 'active'
      },
      {
        name: 'Mike Johnson',
        department: 'Marketing',
        position: 'Marketing Director',
        joinDate: new Date('2020-03-10'),
        status: 'active'
      },
      {
        name: 'Sarah Williams',
        department: 'Operations',
        position: 'Flight Coordinator',
        joinDate: new Date('2023-02-01'),
        status: 'active'
      },
      {
        name: 'David Brown',
        department: 'HR',
        position: 'Recruiter',
        joinDate: new Date('2022-11-15'),
        status: 'active'
      },
      {
        name: 'Emily Davis',
        department: 'Marketing',
        position: 'Social Media Manager',
        joinDate: new Date('2023-05-01'),
        status: 'active'
      },
      {
        name: 'Robert Miller',
        department: 'Operations',
        position: 'Pilot',
        joinDate: new Date('2019-08-20'),
        status: 'active'
      },
      {
        name: 'Lisa Anderson',
        department: 'HR',
        position: 'HR Assistant',
        joinDate: new Date('2023-09-01'),
        status: 'on-leave'
      }
    ]);
    console.log(`✓ Created ${employees.length} employees`);
    return employees;
  } catch (error) {
    console.error('Error seeding employees:', error);
    throw error;
  }
};

// Seed flights (today + next 3 days)
const seedFlights = async (users) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const flights = [];
    const statuses = ['scheduled', 'scheduled', 'delayed', 'scheduled', 'cancelled', 'scheduled', 'in-progress', 'completed'];
    const origins = ['JFK', 'LAX', 'DXB', 'LHR', 'CDG', 'SIN', 'NRT', 'SYD'];
    const destinations = ['LAX', 'JFK', 'LHR', 'DXB', 'SIN', 'CDG', 'SYD', 'NRT'];
    const aircrafts = ['Boeing 777', 'Airbus A380', 'Boeing 787', 'Airbus A350', 'Boeing 737', 'Airbus A320', 'Boeing 747', 'Airbus A330'];
    
    // Generate flights for today and next 3 days
    for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      
      // Generate 8-12 flights per day
      const flightsPerDay = 8 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < flightsPerDay; i++) {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const flightNoIndex = i % 10;
        const originIndex = (i + dayOffset) % origins.length;
        const destIndex = (i + dayOffset + 1) % destinations.length;
        
        flights.push({
          flightNo: `MF${1000 + (dayOffset * 100) + i}`,
          origin: origins[originIndex],
          destination: destinations[destIndex],
          date: new Date(date),
          time: timeStr,
          aircraft: aircrafts[i % aircrafts.length],
          status: statuses[i % statuses.length],
          uploadedBy: users.opsAdmin._id
        });
      }
    }
    
    const createdFlights = await Flight.insertMany(flights);
    console.log(`✓ Created ${createdFlights.length} flights (today + next 3 days)`);
    return createdFlights;
  } catch (error) {
    console.error('Error seeding flights:', error);
    throw error;
  }
};

// Seed campaigns
const seedCampaigns = async (marketingAdmin) => {
  try {
    const campaigns = await Campaign.insertMany([
      {
        name: 'Summer Travel Promotion',
        budget: 50000,
        platform: 'Facebook, Instagram',
        performance: {
          impressions: 125000,
          clicks: 3200,
          conversions: 145,
          ctr: 2.56
        },
        status: 'active'
      },
      {
        name: 'Business Class Upgrade',
        budget: 30000,
        platform: 'Google Ads, LinkedIn',
        performance: {
          impressions: 85000,
          clicks: 2100,
          conversions: 89,
          ctr: 2.47
        },
        status: 'active'
      },
      {
        name: 'Holiday Special Deal',
        budget: 75000,
        platform: 'Facebook, Twitter, Email',
        performance: {
          impressions: 200000,
          clicks: 5800,
          conversions: 312,
          ctr: 2.9
        },
        status: 'completed'
      },
      {
        name: 'New Route Announcement',
        budget: 25000,
        platform: 'Instagram, TikTok',
        performance: {
          impressions: 95000,
          clicks: 1800,
          conversions: 67,
          ctr: 1.89
        },
        status: 'active'
      },
      {
        name: 'Loyalty Program Launch',
        budget: 100000,
        platform: 'Multi-channel',
        performance: {
          impressions: 350000,
          clicks: 12000,
          conversions: 890,
          ctr: 3.43
        },
        status: 'paused'
      },
      {
        name: 'Weekend Getaway Offer',
        budget: 40000,
        platform: 'Facebook',
        performance: {
          impressions: 110000,
          clicks: 2900,
          conversions: 134,
          ctr: 2.64
        },
        status: 'draft'
      }
    ]);
    console.log(`✓ Created ${campaigns.length} campaigns`);
    return campaigns;
  } catch (error) {
    console.error('Error seeding campaigns:', error);
    throw error;
  }
};

// Seed clients
const seedClients = async () => {
  try {
    const today = new Date();
    const clients = await Client.insertMany([
      {
        name: 'Corporate Travel Inc.',
        company: 'Corporate Travel Solutions',
        contact: 'contact@corporatetravel.com',
        lastFlightDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Premium client, prefers business class'
      },
      {
        name: 'Tech Startup Co.',
        company: 'Tech Startup Solutions',
        contact: 'travel@techstartup.com',
        lastFlightDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Frequent travelers, group bookings'
      },
      {
        name: 'Luxury Tours Ltd.',
        company: 'Luxury Travel Agency',
        contact: 'bookings@luxurytours.com',
        lastFlightDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        notes: 'High-value clients, VIP treatment required'
      },
      {
        name: 'Event Planning Group',
        company: 'Event Planning Professionals',
        contact: 'admin@eventplanning.com',
        lastFlightDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Regular bookings for events'
      },
      {
        name: 'International Business',
        company: 'Global Business Corp',
        contact: 'travel@globalbusiness.com',
        lastFlightDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        notes: 'Bulk bookings, corporate rates'
      },
      {
        name: 'Adventure Seekers',
        company: 'Adventure Travel Agency',
        contact: 'bookings@adventure.com',
        lastFlightDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        notes: 'Seasonal bookings'
      },
      {
        name: 'Family Travel Co.',
        company: 'Family Vacation Planner',
        contact: 'info@familytravel.com',
        lastFlightDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Family packages, child-friendly'
      },
      {
        name: 'Executive Travel',
        company: 'Executive Travel Services',
        contact: 'admin@executivetravel.com',
        lastFlightDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
        notes: 'C-level executives, first class only'
      }
    ]);
    console.log(`✓ Created ${clients.length} clients`);
    return clients;
  } catch (error) {
    console.error('Error seeding clients:', error);
    throw error;
  }
};

// Seed tasks
const seedTasks = async (users) => {
  try {
    const today = new Date();
    const tasks = await Task.insertMany([
      {
        title: 'Review flight schedules for next week',
        assignedTo: users.user1._id,
        module: 'flightManagement',
        status: 'pending',
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdBy: users.opsAdmin._id
      },
      {
        title: 'Update employee handbook',
        assignedTo: users.user2._id,
        module: 'hrms',
        status: 'in-progress',
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        createdBy: users.hrAdmin._id
      },
      {
        title: 'Create social media campaign',
        assignedTo: users.user3._id,
        module: 'campaigns',
        status: 'in-progress',
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        createdBy: users.marketingAdmin._id
      },
      {
        title: 'Follow up with new client',
        assignedTo: users.user3._id,
        module: 'clients',
        status: 'pending',
        dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        createdBy: users.marketingAdmin._id
      },
      {
        title: 'Process flight data upload',
        assignedTo: users.user1._id,
        module: 'flightManagement',
        status: 'completed',
        dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdBy: users.opsAdmin._id
      },
      {
        title: 'Conduct employee performance reviews',
        assignedTo: users.user2._id,
        module: 'hrms',
        status: 'pending',
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        createdBy: users.hrAdmin._id
      },
      {
        title: 'Analyze campaign performance metrics',
        assignedTo: users.user3._id,
        module: 'campaigns',
        status: 'in-progress',
        dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        createdBy: users.marketingAdmin._id
      },
      {
        title: 'Update client contact information',
        assignedTo: users.user3._id,
        module: 'clients',
        status: 'completed',
        dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdBy: users.marketingAdmin._id
      }
    ]);
    console.log(`✓ Created ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error('Error seeding tasks:', error);
    throw error;
  }
};

// Seed announcements
const seedAnnouncements = async (users) => {
  try {
    const today = new Date();
    const announcements = await Announcement.insertMany([
      {
        title: 'Welcome to Mayfair Jets System',
        message: 'We are excited to launch our new integrated management system. Please familiarize yourself with the modules you have access to.',
        createdBy: users.superadmin._id,
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Flight Schedule Update',
        message: 'Please note that flight schedules for the upcoming week have been updated. Review your assigned flights and ensure all information is accurate.',
        createdBy: users.opsAdmin._id,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'New Employee Onboarding',
        message: 'We have new team members joining this week. Please welcome them and assist with any questions they may have.',
        createdBy: users.hrAdmin._id,
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Campaign Performance Report',
        message: 'The Q1 campaign performance report is now available. Great job team on achieving our targets!',
        createdBy: users.marketingAdmin._id,
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur this Sunday from 2 AM to 4 AM. The system will be unavailable during this time.',
        createdBy: users.superadmin._id,
        date: new Date(today.getTime())
      },
      {
        title: 'Client Feedback Survey',
        message: 'We value your feedback! Please complete the client satisfaction survey to help us improve our services.',
        createdBy: users.marketingAdmin._id,
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✓ Created ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error seeding announcements:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    const users = await seedUsers();
    const employees = await seedEmployees(users.hrAdmin);
    const flights = await seedFlights(users);
    const campaigns = await seedCampaigns(users.marketingAdmin);
    const clients = await seedClients();
    const tasks = await seedTasks(users);
    const announcements = await seedAnnouncements(users);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Superadmin: super@mayfair.test / Password123');
    console.log('   Ops Admin:  ops@mayfair.test / Password123');
    console.log('   HR Admin:   hr@mayfair.test / Password123');
    console.log('   Marketing:  marketing@mayfair.test / Password123');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();

