const Flight = require('../models/Flight');
const { parse } = require('csv-parse/sync');

// @desc    Get all flights (with query filters: startDate, endDate, status)
// @route   GET /api/flights?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=scheduled
// @access  Private
const getFlights = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query object
    const query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    const flights = await Flight.find(query)
      .populate('uploadedBy', 'name email')
      .populate('returnFlightId', 'flightNo origin destination date time aircraft status')
      .sort({ date: 1, time: 1 });
    
    res.status(200).json({
      success: true,
      count: flights.length,
      data: flights
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching flights: ${error.message}`
    });
  }
};

// @desc    Get single flight
// @route   GET /api/flights/:id
// @access  Private
const getFlight = async (req, res) => {
  const flight = await Flight.findById(req.params.id).populate('uploadedBy', 'name email');
  
  if (!flight) {
    return res.status(404).json({
      success: false,
      error: 'Flight not found'
    });
  }

  res.status(200).json({
    success: true,
    data: flight
  });
};

// @desc    Create flight
// @route   POST /api/flights
// @access  Private
const createFlight = async (req, res) => {
  // Add uploadedBy from authenticated user
  req.body.uploadedBy = req.user.id;
  
  const flight = await Flight.create(req.body);
  
  const populatedFlight = await Flight.findById(flight._id)
    .populate('uploadedBy', 'name email')
    .populate('returnFlightId', 'flightNo origin destination date time aircraft status');
  
  res.status(201).json({
    success: true,
    data: populatedFlight
  });
};

// @desc    Update flight
// @route   PUT /api/flights/:id
// @access  Private
const updateFlight = async (req, res) => {
  let flight = await Flight.findById(req.params.id);

  if (!flight) {
    return res.status(404).json({
      success: false,
      error: 'Flight not found'
    });
  }

  flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('uploadedBy', 'name email')
    .populate('returnFlightId', 'flightNo origin destination date time aircraft status');

  res.status(200).json({
    success: true,
    data: flight
  });
};

// @desc    Delete flight
// @route   DELETE /api/flights/:id
// @access  Private
const deleteFlight = async (req, res) => {
  const flight = await Flight.findById(req.params.id);

  if (!flight) {
    return res.status(404).json({
      success: false,
      error: 'Flight not found'
    });
  }

  await flight.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Upload flights from CSV
// @route   POST /api/flights/upload
// @access  Private (requires flightManagement module)
const uploadFlights = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No CSV file uploaded'
    });
  }

  let inserted = 0;
  let updated = 0;
  const errors = [];

  try {
    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      relax_column_count: true
    });

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because header is row 1, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!record.flightNo || !record.origin || !record.destination || !record.date || !record.time) {
          errors.push({
            row: rowNumber,
            error: 'Missing required fields (flightNo, origin, destination, date, time)',
            data: record
          });
          continue;
        }

        // Parse date
        const flightDate = new Date(record.date);
        if (isNaN(flightDate.getTime())) {
          errors.push({
            row: rowNumber,
            error: 'Invalid date format',
            data: record
          });
          continue;
        }

        // Prepare flight data
        const flightData = {
          flightNo: record.flightNo.toString().trim().toUpperCase(),
          origin: record.origin.toString().trim(),
          destination: record.destination.toString().trim(),
          date: flightDate,
          time: record.time.toString().trim(),
          aircraft: record.aircraft ? record.aircraft.toString().trim() : undefined,
          status: record.status || 'scheduled',
          uploadedBy: req.user.id
        };

        // Upsert flight based on flightNo and date combination
        const existingFlight = await Flight.findOne({
          flightNo: flightData.flightNo,
          date: flightData.date
        });

        if (existingFlight) {
          // Update existing flight
          await Flight.findByIdAndUpdate(existingFlight._id, flightData, {
            runValidators: true
          });
          updated++;
        } else {
          // Insert new flight
          await Flight.create(flightData);
          inserted++;
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message || 'Error processing row',
          data: record
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        inserted,
        updated,
        errors: errors.length > 0 ? errors : [],
        totalProcessed: records.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error parsing CSV: ${error.message}`
    });
  }
};

// @desc    Get today's flights
// @route   GET /api/flights/today
// @access  Private
const getTodayFlights = async (req, res) => {
  try {
    // Get today's date (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const flights = await Flight.find({
      date: {
        $gte: today,
        $lte: todayEnd
      }
    })
      .populate('uploadedBy', 'name email')
      .populate('returnFlightId', 'flightNo origin destination date time aircraft status')
      .sort({ time: 1 }); // Sort by time ascending

    res.status(200).json({
      success: true,
      count: flights.length,
      date: today.toISOString().split('T')[0],
      data: flights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching today's flights: ${error.message}`
    });
  }
};

// @desc    Get flight summary for a specific date (aggregated counts by status and hourly timeline)
// @route   GET /api/flights/summary?date=YYYY-MM-DD
// @access  Private
const getFlightsSummary = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }
    
    // Parse date and set time range
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all flights for the date
    const flights = await Flight.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // Aggregate by status
    const statusCounts = {};
    const validStatuses = ['scheduled', 'delayed', 'cancelled', 'completed', 'in-progress'];
    
    validStatuses.forEach(status => {
      statusCounts[status] = 0;
    });
    
    flights.forEach(flight => {
      const flightStatus = flight.status || 'scheduled';
      statusCounts[flightStatus] = (statusCounts[flightStatus] || 0) + 1;
    });
    
    // Format status counts for Recharts
    const statusData = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));
    
    // Aggregate by hour (hourly timeline)
    const hourlyData = {};
    
    // Initialize all 24 hours with 0 counts
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      hourlyData[hourStr] = 0;
    }
    
    // Count flights by hour
    flights.forEach(flight => {
      if (flight.time) {
        // Extract hour from time string (e.g., "08:30" -> "08:00")
        const timeMatch = flight.time.match(/^(\d{1,2})/);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const hourStr = hour.toString().padStart(2, '0') + ':00';
          hourlyData[hourStr] = (hourlyData[hourStr] || 0) + 1;
        }
      }
    });
    
    // Format hourly data for Recharts
    const hourlyTimeline = Object.keys(hourlyData)
      .map(time => ({
        time,
        count: hourlyData[time]
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    
    res.status(200).json({
      success: true,
      date: date,
      data: {
        byStatus: statusData,
        hourlyTimeline: hourlyTimeline,
        totalFlights: flights.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching flight summary: ${error.message}`
    });
  }
};

module.exports = {
  getFlights,
  getFlight,
  createFlight,
  updateFlight,
  deleteFlight,
  uploadFlights,
  getTodayFlights,
  getFlightsSummary
};

