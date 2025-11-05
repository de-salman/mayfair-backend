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
const FlightAccounting = require('../modules/accounting/FlightAccounting');

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
    await FlightAccounting.deleteMany({});
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

    // Superadmin - All modules
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'super@mayfair.test',
      password: hashedPassword,
      role: 'superadmin',
      allowedModules: ['hrms', 'operations', 'flightManagement', 'campaigns', 'clients', 'accounting']
    });
    console.log('✓ Created superadmin:', superadmin.email);

    // Admin - Operations (Ops) - Add accounting
    const opsAdmin = await User.create({
      name: 'Ops Admin',
      email: 'ops@mayfair.test',
      password: hashedPassword,
      role: 'admin',
      allowedModules: ['flightManagement', 'clients', 'accounting']
    });
    console.log('✓ Created Ops Admin:', opsAdmin.email);

    // Admin - HR - Exclude accounting
    const hrAdmin = await User.create({
      name: 'HR Admin',
      email: 'hr@mayfair.test',
      password: hashedPassword,
      role: 'admin',
      allowedModules: ['hrms']
    });
    console.log('✓ Created HR Admin:', hrAdmin.email);

    // Admin - Marketing - Exclude accounting
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

// Seed flights (today + next 3 days + historical data across multiple months)
const seedFlights = async (users) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const flights = [];
    const statuses = ['scheduled', 'scheduled', 'delayed', 'scheduled', 'cancelled', 'scheduled', 'in-progress', 'completed'];
    
    // Define round trip routes (outbound and return pairs)
    const roundTripRoutes = [
      { outbound: { origin: 'MXP', destination: 'DXB' }, return: { origin: 'DXB', destination: 'MXP' }, aircraft: 'Boeing 777' },
      { outbound: { origin: 'JFK', destination: 'LAX' }, return: { origin: 'LAX', destination: 'JFK' }, aircraft: 'Boeing 787' },
      { outbound: { origin: 'LHR', destination: 'DXB' }, return: { origin: 'DXB', destination: 'LHR' }, aircraft: 'Airbus A380' },
      { outbound: { origin: 'CDG', destination: 'MXP' }, return: { origin: 'MXP', destination: 'CDG' }, aircraft: 'Airbus A320' },
      { outbound: { origin: 'SIN', destination: 'DXB' }, return: { origin: 'DXB', destination: 'SIN' }, aircraft: 'Boeing 777' },
      { outbound: { origin: 'NRT', destination: 'DXB' }, return: { origin: 'DXB', destination: 'NRT' }, aircraft: 'Boeing 787' },
      { outbound: { origin: 'SYD', destination: 'DXB' }, return: { origin: 'DXB', destination: 'SYD' }, aircraft: 'Airbus A350' }
    ];
    
    // Single sector routes (non-round trips)
    const singleSectorRoutes = [
      { origin: 'MXP', destination: 'CDG', aircraft: 'Airbus A320' },
      { origin: 'CDG', destination: 'LHR', aircraft: 'Airbus A320' },
      { origin: 'LAX', destination: 'SFO', aircraft: 'Boeing 737' }
    ];
    
    // Generate flights for:
    // 1. Today and next 3 days (current flights)
    // 2. Past 3 months (historical data for trends)
    // 3. Future 2 months (upcoming flights)
    
    const monthOffsets = [-3, -2, -1, 0, 1, 2]; // 3 months back, current month, 2 months forward
    
    for (const monthOffset of monthOffsets) {
      const monthStart = new Date(today);
      monthStart.setMonth(today.getMonth() + monthOffset, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      // Generate flights for each day of the month (sample days)
      const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
      const daysToGenerate = monthOffset === 0 ? 7 : Math.min(7, daysInMonth); // More days for current month
      
      for (let day = 0; day < daysToGenerate; day++) {
        const date = new Date(monthStart);
        date.setDate(1 + day);
        
        // Generate 4-6 round trip pairs per day (8-12 flights total)
        const roundTripsPerDay = 4 + Math.floor(Math.random() * 3);
        const roundTripPairs = [];
        
        for (let i = 0; i < roundTripsPerDay; i++) {
          const routeIndex = (day * roundTripsPerDay + i) % roundTripRoutes.length;
          const roundTrip = roundTripRoutes[routeIndex];
          
          // Outbound flight time (morning/afternoon)
          const outboundHour = 8 + Math.floor(Math.random() * 8); // 8 AM to 3 PM
          const outboundMinute = Math.floor(Math.random() * 60);
          const outboundTime = `${outboundHour.toString().padStart(2, '0')}:${outboundMinute.toString().padStart(2, '0')}`;
          
          // Return flight time (evening, same day or next day)
          const returnDate = new Date(date);
          const returnHour = 18 + Math.floor(Math.random() * 6); // 6 PM to 11 PM
          const returnMinute = Math.floor(Math.random() * 60);
          const returnTime = `${returnHour.toString().padStart(2, '0')}:${returnMinute.toString().padStart(2, '0')}`;
          
          // Generate flight numbers
          const baseFlightNo = 1000 + (monthOffset + 3) * 100 + day * 10 + i;
          const outboundFlightNo = `MF${baseFlightNo}`;
          const returnFlightNo = `MF${baseFlightNo + 1}`;
          
          // Create outbound flight
          const outboundFlight = {
            flightNo: outboundFlightNo,
            origin: roundTrip.outbound.origin,
            destination: roundTrip.outbound.destination,
            date: new Date(date),
            time: outboundTime,
            aircraft: roundTrip.aircraft,
            status: statuses[i % statuses.length],
            uploadedBy: users.opsAdmin._id,
            isRoundTrip: true
          };
          
          // Create return flight (will be linked after insertion)
          const returnFlight = {
            flightNo: returnFlightNo,
            origin: roundTrip.return.origin,
            destination: roundTrip.return.destination,
            date: returnDate,
            time: returnTime,
            aircraft: roundTrip.aircraft,
            status: statuses[i % statuses.length],
            uploadedBy: users.opsAdmin._id,
            isRoundTrip: true
          };
          
          roundTripPairs.push({ outbound: outboundFlight, return: returnFlight });
        }
        
        // Add some single-sector flights (non-round trips)
        const singleSectorCount = Math.floor(Math.random() * 2); // 0-1 single sector flights per day
        for (let j = 0; j < singleSectorCount; j++) {
          const singleRouteIndex = (day * singleSectorCount + j) % singleSectorRoutes.length;
          const singleRoute = singleSectorRoutes[singleRouteIndex];
          
          const hour = 10 + Math.floor(Math.random() * 10);
          const minute = Math.floor(Math.random() * 60);
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          flights.push({
            flightNo: `MF${2000 + (monthOffset + 3) * 100 + day * 10 + j}`,
            origin: singleRoute.origin,
            destination: singleRoute.destination,
            date: new Date(date),
            time: timeStr,
            aircraft: singleRoute.aircraft,
            status: statuses[j % statuses.length],
            uploadedBy: users.opsAdmin._id,
            isRoundTrip: false
          });
        }
        
        // Add all round trip flights to the array
        roundTripPairs.forEach(pair => {
          flights.push(pair.outbound);
          flights.push(pair.return);
        });
      }
    }
    
    // Insert all flights first
    const createdFlights = await Flight.insertMany(flights);
    console.log(`✓ Created ${createdFlights.length} flights (across 6 months)`);
    
    // Now link round trip pairs (outbound → return)
    let roundTripsLinked = 0;
    for (let i = 0; i < createdFlights.length - 1; i++) {
      const flight = createdFlights[i];
      if (flight.isRoundTrip && !flight.returnFlightId) {
        // Find the matching return flight (same route, same date, different direction)
        const returnFlight = createdFlights.find(f => 
          f.isRoundTrip &&
          f.origin === flight.destination &&
          f.destination === flight.origin &&
          f.date.getTime() === flight.date.getTime() &&
          f._id.toString() !== flight._id.toString() &&
          !f.returnFlightId
        );
        
        if (returnFlight) {
          // Link outbound to return
          await Flight.findByIdAndUpdate(flight._id, { returnFlightId: returnFlight._id });
          // Update the in-memory object as well
          flight.returnFlightId = returnFlight._id;
          roundTripsLinked++;
        }
      }
    }
    
    // Refresh flights to get updated returnFlightId
    const refreshedFlights = await Flight.find({})
      .populate('returnFlightId', 'flightNo origin destination date time aircraft status')
      .sort({ date: 1, time: 1 });
    
    console.log(`✓ Linked ${roundTripsLinked} round trip pairs`);
    console.log(`✓ Verified: ${refreshedFlights.filter(f => f.returnFlightId).length} flights have returnFlightId`);
    return refreshedFlights;
  } catch (error) {
    console.error('Error seeding flights:', error);
    throw error;
  }
};

// Seed flight accounting records with multi-sector support and month-based booking loads
const seedFlightAccounting = async (flights, users) => {
  try {
    const flightAccountingRecords = [];
    
    // Aircraft capacity mapping
    const aircraftCapacities = {
      'Boeing 777': 396,
      'Airbus A380': 853,
      'Boeing 787': 242,
      'Airbus A350': 366,
      'Boeing 737': 189,
      'Airbus A320': 180,
      'Boeing 747': 467,
      'Airbus A330': 335
    };
    
    // Sector-specific taxes (different taxes per sector)
    const sectorTaxesMap = {
      'MXP-DXB': 34,  // MXP to DXB: 34 EUR
      'DXB-MXP': 25,  // DXB to MXP: 25 EUR (round trip return)
      'MXP-CDG': 28,  // MXP to CDG: 28 EUR
      'CDG-MXP': 28,  // CDG to MXP: 28 EUR
      'LHR-DXB': 45,  // LHR to DXB: 45 GBP
      'DXB-LHR': 45,  // DXB to LHR: 45 GBP
      'JFK-LAX': 75,  // JFK to LAX: 75 USD
      'LAX-JFK': 75,  // LAX to JFK: 75 USD
      'SIN-DXB': 38,  // SIN to DXB: 38 SGD
      'DXB-SIN': 38,  // DXB to SIN: 38 SGD
      'NRT-DXB': 42,  // NRT to DXB: 42 JPY (converted)
      'DXB-NRT': 42,  // DXB to NRT: 42 JPY (converted)
      'SYD-DXB': 55,  // SYD to DXB: 55 AUD
      'DXB-SYD': 55   // DXB to SYD: 55 AUD
    };
    
    // Month-based booking load patterns (simulating seasonal variations)
    // December: 90%, January: 75%, February: 50%, March: 65%, April: 70%, May: 80%
    const getMonthBasedBookingLoad = (date) => {
      const month = date.getMonth(); // 0-11
      const baseLoads = {
        0: 0.75,  // January: 75%
        1: 0.50,  // February: 50%
        2: 0.65,  // March: 65%
        3: 0.70,  // April: 70%
        4: 0.80,  // May: 80%
        5: 0.85,  // June: 85%
        6: 0.90,  // July: 90%
        7: 0.88,  // August: 88%
        8: 0.75,  // September: 75%
        9: 0.70,  // October: 70%
        10: 0.65, // November: 65%
        11: 0.90  // December: 90%
      };
      const baseLoad = baseLoads[month] || 0.75;
      // Add some variation (±5%)
      return Math.max(0.5, Math.min(0.95, baseLoad + (Math.random() * 0.1 - 0.05)));
    };
    
    // Determine currency based on route
    const getCurrencyForRoute = (origin, destination) => {
      if (origin === 'MXP' || origin === 'CDG' || destination === 'MXP' || destination === 'CDG') {
        return 'EUR';
      }
      if (origin === 'LHR' || destination === 'LHR') {
        return 'GBP';
      }
      if (origin === 'JFK' || origin === 'LAX' || destination === 'JFK' || destination === 'LAX') {
        return 'USD';
      }
      if (origin === 'SIN' || destination === 'SIN') {
        return 'SGD';
      }
      if (origin === 'NRT' || destination === 'NRT') {
        return 'USD'; // Using USD for JPY conversion
      }
      if (origin === 'SYD' || destination === 'SYD') {
        return 'AUD';
      }
      return 'USD'; // Default
    };
    
    // Generate realistic base fare based on route and currency
    const getBaseFareForRoute = (origin, destination, currency) => {
      const routeKey = `${origin}-${destination}`;
      
      // MXP-DXB routes: 190-350 EUR (as per requirements)
      if (routeKey === 'MXP-DXB' || routeKey === 'DXB-MXP') {
        return 190 + (Math.random() * 160); // 190-350 EUR
      }
      
      // European short-haul routes: 150-300 EUR
      if ((origin === 'MXP' || origin === 'CDG' || destination === 'MXP' || destination === 'CDG') && 
          currency === 'EUR') {
        return 150 + (Math.random() * 150);
      }
      
      // Long-haul routes: higher fares
      if (currency === 'USD') {
        return 500 + (Math.random() * 2000); // 500-2500 USD
      }
      if (currency === 'GBP') {
        return 400 + (Math.random() * 1500); // 400-1900 GBP
      }
      if (currency === 'EUR') {
        return 300 + (Math.random() * 1200); // 300-1500 EUR
      }
      if (currency === 'AUD') {
        return 600 + (Math.random() * 1800); // 600-2400 AUD
      }
      if (currency === 'SGD') {
        return 500 + (Math.random() * 1500); // 500-2000 SGD
      }
      
      return 500 + (Math.random() * 2000); // Default
    };
    
    // Create accounting records for ALL flights (100% coverage)
    // Handle round trips separately - each flight (outbound and return) gets its own accounting record
    // The controller will combine them when displaying
    for (let i = 0; i < flights.length; i++) {
      const flight = flights[i];
      const aircraft = flight.aircraft || 'Boeing 737';
      const capacity = aircraftCapacities[aircraft] || 200;
      
      // Determine if this is part of a round trip
      const isRoundTrip = flight.isRoundTrip || false;
      const routeKey = `${flight.origin}-${flight.destination}`;
      
      // Check if this flight is the return flight of a round trip
      // (i.e., if another flight has this flight as its returnFlightId)
      const isReturnFlight = isRoundTrip && flights.some(f => {
        const fReturnId = f.returnFlightId?._id || f.returnFlightId;
        return fReturnId && fReturnId.toString() === flight._id.toString();
      });
      
      // Get month-based booking load (simulates seasonal variations)
      // For round trips, use same booking load for both outbound and return
      const bookingLoad = getMonthBasedBookingLoad(flight.date);
      
      // Determine currency based on route
      const currency = getCurrencyForRoute(flight.origin, flight.destination);
      
      // Get base fare based on route and currency
      // For round trips, outbound and return may have different fares
      const baseFare = getBaseFareForRoute(flight.origin, flight.destination, currency);
      
      // Get sector-specific taxes (different for outbound vs return in round trips)
      // Example: MXP-DXB: 34 EUR, DXB-MXP: 25 EUR
      const sectorTaxes = sectorTaxesMap[routeKey] || (30 + Math.random() * 40); // Default 30-70
      
      // Generate fuel surcharge (varies by route length)
      const isLongHaul = ['JFK', 'LAX', 'SYD', 'NRT', 'SIN'].includes(flight.origin) || 
                         ['JFK', 'LAX', 'SYD', 'NRT', 'SIN'].includes(flight.destination);
      const fuelSurcharge = isLongHaul 
        ? (100 + Math.random() * 200)  // Long-haul: 100-300
        : (50 + Math.random() * 100);    // Short-haul: 50-150
      
      // Generate service charges (50 to 150)
      const serviceCharges = 50 + (Math.random() * 100);
      
      // Calculate budget per flight (baseFare * capacity * bookingLoad * 0.4 to 0.6)
      // Budget accounts for expected revenue
      // For round trips, each sector (outbound/return) has its own budget
      const expectedRevenue = baseFare * capacity * bookingLoad;
      const budgetPerFlight = expectedRevenue * (0.4 + Math.random() * 0.2);
      
      // Generate operating costs (budget * 0.25 to 0.35)
      const operatingCosts = budgetPerFlight * (0.25 + Math.random() * 0.1);
      
      // Generate crew costs (budget * 0.15 to 0.25)
      const crewCosts = budgetPerFlight * (0.15 + Math.random() * 0.1);
      
      // Generate fuel costs (budget * 0.25 to 0.35)
      const fuelCosts = budgetPerFlight * (0.25 + Math.random() * 0.1);
      
      // Generate maintenance costs (budget * 0.1 to 0.15)
      const maintenanceCosts = budgetPerFlight * (0.1 + Math.random() * 0.05);
      
      // Build notes with round trip information
      let notes = `Route: ${routeKey}, Month: ${flight.date.toLocaleString('default', { month: 'long' })}`;
      if (isRoundTrip) {
        if (isReturnFlight) {
          notes += ` (Return sector of round trip)`;
        } else {
          notes += ` (Outbound sector of round trip)`;
        }
      }
      
      flightAccountingRecords.push({
        flightId: flight._id,
        capacity: capacity,
        bookingLoad: Math.round(bookingLoad * 1000) / 1000, // Round to 3 decimals
        baseFare: Math.round(baseFare * 100) / 100,
        sectorTaxes: Math.round(sectorTaxes * 100) / 100, // Sector-specific tax
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        serviceCharges: Math.round(serviceCharges * 100) / 100,
        budgetPerFlight: Math.round(budgetPerFlight * 100) / 100,
        operatingCosts: Math.round(operatingCosts * 100) / 100,
        crewCosts: Math.round(crewCosts * 100) / 100,
        fuelCosts: Math.round(fuelCosts * 100) / 100,
        maintenanceCosts: Math.round(maintenanceCosts * 100) / 100,
        currency: currency,
        notes: notes,
        createdBy: users.opsAdmin._id,
        updatedBy: users.opsAdmin._id
      });
    }
    
    const createdAccounting = await FlightAccounting.insertMany(flightAccountingRecords);
    
    // Count round trip accounting records
    const roundTripCount = flightAccountingRecords.filter((_, idx) => {
      const flight = flights[idx];
      return flight && flight.isRoundTrip;
    }).length;
    
    console.log(`✓ Created ${createdAccounting.length} flight accounting records (100% coverage)`);
    console.log(`  - ${roundTripCount} round trip sectors (outbound + return)`);
    console.log(`  - Multi-sector routes with sector-specific taxes (MXP-DXB: 34 EUR, DXB-MXP: 25 EUR)`);
    console.log(`  - Month-based booking loads (seasonal variations)`);
    console.log(`  - Route-specific currencies (EUR, USD, GBP, AUD, SGD)`);
    console.log(`  - MXP-DXB fare range: 190-350 EUR`);
    console.log(`  - Round trips will be combined into single rows in the Accounting page`);
    return createdAccounting;
  } catch (error) {
    console.error('Error seeding flight accounting:', error);
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
    const flightAccounting = await seedFlightAccounting(flights, users);
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

