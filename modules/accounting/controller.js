const Accounting = require('./model');
const FlightAccounting = require('./FlightAccounting');
const Flight = require('../../models/Flight');
const { parse } = require('csv-parse/sync');
const { calculateFlightMetricsBulk, calculateFlightWithMetrics } = require('./calculations');

// @desc    Get accounting records with flights and calculations
// @route   GET /api/accounting?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Superadmin, Ops Admin)
const getAccountingRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date query for accounting records
    const accountingQuery = {};
    if (startDate || endDate) {
      accountingQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        accountingQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        accountingQuery.date.$lte = end;
      }
    }

    // Fetch accounting records
    const accountingRecords = await Accounting.find(accountingQuery)
      .sort({ date: -1 })
      .populate('createdBy', 'name email');

    // Build date query for flights
    const flightQuery = {};
    if (startDate || endDate) {
      flightQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        flightQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        flightQuery.date.$lte = end;
      }
    }

    // Fetch flights (populate returnFlightId for round trips)
    const flights = await Flight.find(flightQuery)
      .sort({ date: 1, time: 1 })
      .populate('uploadedBy', 'name email')
      .populate('returnFlightId', 'flightNo origin destination date time aircraft status');

    // Fetch flight accounting data
    const flightIds = flights.map(f => f._id);
    const flightAccountingData = await FlightAccounting.find({
      flightId: { $in: flightIds }
    })
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // Calculate totals from accounting records
    const totalIncome = accountingRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const totalExpense = accountingRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const netProfit = totalIncome - totalExpense;

    // Calculate totals from flight accounting
    const flightTotalRevenue = flightAccountingData.reduce((sum, f) => sum + (f.totalRevenue || 0), 0);
    const flightTotalCosts = flightAccountingData.reduce((sum, f) => sum + (f.totalCosts || 0), 0);
    const flightNetProfit = flightAccountingData.reduce((sum, f) => sum + (f.netProfit || 0), 0);

    // Use calculation helper for flight metrics
    const flightMetrics = calculateFlightMetricsBulk(flightAccountingData);

    // Combine flights with their accounting data and calculations
    // For round trips, combine outbound and return flights into one row
    const processedFlights = [];
    const processedFlightIds = new Set();
    
    flights.forEach(flight => {
      // Skip if already processed (as part of a round trip)
      if (processedFlightIds.has(flight._id.toString())) {
        return;
      }
      
      // Check if this is a round trip (has returnFlightId)
      // returnFlightId can be ObjectId or populated object
      const returnFlightId = flight.returnFlightId?._id || flight.returnFlightId;
      if (returnFlightId) {
        // Find the return flight
        const returnFlight = flights.find(f => 
          f._id.toString() === returnFlightId.toString() &&
          f._id.toString() !== flight._id.toString()
        );
        
        if (returnFlight) {
          // Get accounting data for both flights
          const outboundAccounting = flightAccountingData.find(fa => 
            fa.flightId && fa.flightId._id && fa.flightId._id.toString() === flight._id.toString()
          );
          const returnAccounting = flightAccountingData.find(fa => 
            fa.flightId && fa.flightId._id && fa.flightId._id.toString() === returnFlight._id.toString()
          );
          
          // Combine accounting data (use outbound as base, add return values)
          const outAcc = outboundAccounting || {};
          const retAcc = returnAccounting || {};
          const combinedAccounting = {
            capacity: outAcc.capacity || 0,
            bookingLoad: outAcc.bookingLoad || 0,
            baseFare: (outAcc.baseFare || 0) + (retAcc.baseFare || 0),
            sectorTaxes: (outAcc.sectorTaxes || 0) + (retAcc.sectorTaxes || 0),
            fuelSurcharge: (outAcc.fuelSurcharge || 0) + (retAcc.fuelSurcharge || 0),
            serviceCharges: (outAcc.serviceCharges || 0) + (retAcc.serviceCharges || 0),
            budgetPerFlight: (outAcc.budgetPerFlight || 0) + (retAcc.budgetPerFlight || 0),
            operatingCosts: (outAcc.operatingCosts || 0) + (retAcc.operatingCosts || 0),
            crewCosts: (outAcc.crewCosts || 0) + (retAcc.crewCosts || 0),
            fuelCosts: (outAcc.fuelCosts || 0) + (retAcc.fuelCosts || 0),
            maintenanceCosts: (outAcc.maintenanceCosts || 0) + (retAcc.maintenanceCosts || 0),
            totalRevenue: (outAcc.totalRevenue || 0) + (retAcc.totalRevenue || 0),
            totalCosts: (outAcc.totalCosts || 0) + (retAcc.totalCosts || 0),
            netProfit: (outAcc.netProfit || 0) + (retAcc.netProfit || 0),
            currency: outAcc.currency || 'USD',
            flightId: flight._id // Keep reference to outbound flight
          };
          
          // Create combined flight object with route as "MXP-DXB-MXP"
          const combinedFlight = {
            _id: flight._id,
            flightNo: flight.flightNo,
            origin: flight.origin,
            destination: flight.destination,
            date: flight.date,
            time: flight.time,
            aircraft: flight.aircraft,
            status: flight.status,
            route: `${flight.origin}-${flight.destination}-${returnFlight.destination}`,
            returnFlight: {
              _id: returnFlight._id,
              flightNo: returnFlight.flightNo,
              origin: returnFlight.origin,
              destination: returnFlight.destination,
              date: returnFlight.date,
              time: returnFlight.time
            }
          };
          
          // Calculate metrics with combined data
          const combinedMetrics = calculateFlightWithMetrics(combinedFlight, combinedAccounting);
          processedFlights.push(combinedMetrics);
          
          // Mark both flights as processed
          processedFlightIds.add(flight._id.toString());
          processedFlightIds.add(returnFlight._id.toString());
        }
      } else {
        // Single sector flight (not a round trip)
        const flightAccounting = flightAccountingData.find(fa => 
          fa.flightId && fa.flightId._id && fa.flightId._id.toString() === flight._id.toString()
        );
        const metrics = calculateFlightWithMetrics(flight, flightAccounting);
        processedFlights.push(metrics);
        processedFlightIds.add(flight._id.toString());
      }
    });
    
    const flightsWithCalculations = processedFlights;

    res.status(200).json({
      success: true,
      data: {
        accountingRecords: {
          count: accountingRecords.length,
          records: accountingRecords
        },
        flights: {
          count: flights.length,
          records: flights
        },
        flightAccounting: {
          count: flightAccountingData.length,
          records: flightAccountingData
        },
        flightsWithCalculations: flightsWithCalculations,
        calculations: {
          totalIncome,
          totalExpense,
          netProfit,
          totalFlights: flights.length,
          flightTotalRevenue,
          flightTotalCosts,
          flightNetProfit,
          combinedNetProfit: netProfit + flightNetProfit,
          // Flight metrics from calculation helper
          flightMetrics: {
            totals: flightMetrics.totals,
            averages: flightMetrics.averages,
            count: flightMetrics.count
          }
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching accounting data: ${error.message}`
    });
  }
};

// @desc    Get single accounting record
// @route   GET /api/accounting/:id
// @access  Private
const getAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.findById(req.params.id);
  
  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Create accounting record
// @route   POST /api/accounting
// @access  Private
const createAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.create({
    ...req.body,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Update accounting record
// @route   PUT /api/accounting/:id
// @access  Private
const updateAccountingRecord = async (req, res) => {
  let accountingRecord = await Accounting.findById(req.params.id);

  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  accountingRecord = await Accounting.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Delete accounting record
// @route   DELETE /api/accounting/:id
// @access  Private
const deleteAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.findById(req.params.id);

  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  await accountingRecord.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Get accounting summary with totals and averages
// @route   GET /api/accounting/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Superadmin, Ops Admin)
const getAccountingSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date query for accounting records
    const accountingQuery = {};
    if (startDate || endDate) {
      accountingQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        accountingQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        accountingQuery.date.$lte = end;
      }
    }

    // Fetch all accounting records
    const records = await Accounting.find(accountingQuery);

    // Calculate totals
    const incomeRecords = records.filter(r => r.type === 'income');
    const expenseRecords = records.filter(r => r.type === 'expense');
    
    const totalIncome = incomeRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpense = expenseRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Calculate averages
    const avgIncome = incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;
    const avgExpense = expenseRecords.length > 0 ? totalExpense / expenseRecords.length : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: records.filter(r => r.status === 'pending').length,
      paid: records.filter(r => r.status === 'paid').length,
      overdue: records.filter(r => r.status === 'overdue').length,
      cancelled: records.filter(r => r.status === 'cancelled').length
    };

    // Type breakdown
    const typeBreakdown = {
      income: incomeRecords.length,
      expense: expenseRecords.length
    };

    // Category breakdown
    const categoryBreakdown = {};
    records.forEach(record => {
      const category = record.category || 'general';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          total: 0
        };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].total += record.amount || 0;
    });

    // Fetch flight accounting data for date range
    const flightQuery = {};
    if (startDate || endDate) {
      flightQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        flightQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        flightQuery.date.$lte = end;
      }
    }

    // Get flights in date range
    const flights = await Flight.find(flightQuery).select('_id');
    const flightIds = flights.map(f => f._id);

    // Fetch flight accounting records
    const flightAccountingRecords = await FlightAccounting.find({
      flightId: { $in: flightIds }
    }).populate('flightId', 'flightNo origin destination date time aircraft status');

    // Use calculation helper for flight metrics
    const flightMetrics = calculateFlightMetricsBulk(flightAccountingRecords);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalIncome,
          totalExpense,
          netProfit,
          totalRecords: records.length
        },
        averages: {
          avgIncome,
          avgExpense,
          avgTransaction: records.length > 0 ? (totalIncome + totalExpense) / records.length : 0
        },
        breakdown: {
          status: statusBreakdown,
          type: typeBreakdown,
          category: categoryBreakdown
        },
        // Flight accounting summary using calculation helper
        flightAccounting: {
          count: flightAccountingRecords.length,
          totals: flightMetrics.totals,
          averages: flightMetrics.averages,
          individualMetrics: flightMetrics.individual
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching accounting summary: ${error.message}`
    });
  }
};

// @desc    Upload accounting records from CSV or manual entry
// @route   POST /api/accounting/upload
// @access  Private (Superadmin, Ops Admin)
const uploadAccountingRecords = async (req, res) => {
  try {
    let inserted = 0;
    let updated = 0;
    const errors = [];

    // Check if CSV file is uploaded
    if (req.file) {
      // CSV upload processing
      try {
        const csvContent = req.file.buffer.toString('utf-8');
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          cast: true,
          relax_column_count: true
        });

        // Process each CSV record
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          const rowNumber = i + 2; // +2 because header is row 1, and arrays are 0-indexed

          try {
            // Validate required fields
            if (!record.invoiceNo || !record.client || !record.amount || !record.type) {
              errors.push({
                row: rowNumber,
                error: 'Missing required fields (invoiceNo, client, amount, type)',
                data: record
              });
              continue;
            }

            // Parse date
            const recordDate = record.date ? new Date(record.date) : new Date();
            if (isNaN(recordDate.getTime())) {
              errors.push({
                row: rowNumber,
                error: 'Invalid date format',
                data: record
              });
              continue;
            }

            // Prepare accounting data
            const accountingData = {
              invoiceNo: record.invoiceNo.toString().trim(),
              client: record.client.toString().trim(),
              amount: parseFloat(record.amount) || 0,
              date: recordDate,
              type: record.type.toLowerCase(),
              category: record.category ? record.category.toString().trim() : 'general',
              status: record.status ? record.status.toLowerCase() : 'pending',
              description: record.description ? record.description.toString().trim() : '',
              paymentMethod: record.paymentMethod ? record.paymentMethod.toLowerCase() : 'bank transfer',
              dueDate: record.dueDate ? new Date(record.dueDate) : undefined,
              createdBy: req.user.id
            };

            // Validate type
            if (!['income', 'expense'].includes(accountingData.type)) {
              errors.push({
                row: rowNumber,
                error: 'Invalid type. Must be "income" or "expense"',
                data: record
              });
              continue;
            }

            // Upsert based on invoiceNo
            const existingRecord = await Accounting.findOne({
              invoiceNo: accountingData.invoiceNo
            });

            if (existingRecord) {
              await Accounting.findByIdAndUpdate(existingRecord._id, accountingData, {
                runValidators: true
              });
              updated++;
            } else {
              await Accounting.create(accountingData);
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
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Error parsing CSV: ${error.message}`
        });
      }
    } else {
      // Manual entry (single record from request body)
      try {
        const accountingData = {
          ...req.body,
          createdBy: req.user.id
        };

        // Validate required fields
        if (!accountingData.invoiceNo || !accountingData.client || !accountingData.amount || !accountingData.type) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: invoiceNo, client, amount, type'
          });
        }

        // Check if invoiceNo already exists
        const existingRecord = await Accounting.findOne({
          invoiceNo: accountingData.invoiceNo
        });

        if (existingRecord) {
          // Update existing record
          await Accounting.findByIdAndUpdate(existingRecord._id, accountingData, {
            runValidators: true,
            new: true
          });
          updated = 1;
        } else {
          // Create new record
          await Accounting.create(accountingData);
          inserted = 1;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Error processing manual entry: ${error.message}`
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        inserted,
        updated,
        errors: errors.length > 0 ? errors : [],
        message: req.file 
          ? `CSV processed: ${inserted} inserted, ${updated} updated, ${errors.length} errors`
          : `Record ${inserted > 0 ? 'created' : 'updated'} successfully`
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error uploading accounting records: ${error.message}`
    });
  }
};

// ==================== FLIGHT ACCOUNTING CRUD ====================

// @desc    Get all flight accounting records
// @route   GET /api/accounting/flights
// @access  Private (Superadmin, Ops Admin)
const getFlightAccountingRecords = async (req, res) => {
  try {
    const { startDate, endDate, flightId } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by flightId if provided
    if (flightId) {
      query.flightId = flightId;
    }
    
    // Date range filter (via flight date)
    if (startDate || endDate) {
      // We need to join with Flight collection to filter by date
      const flightQuery = {};
      if (startDate || endDate) {
        flightQuery.date = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          flightQuery.date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          flightQuery.date.$lte = end;
        }
      }
      
      const flights = await Flight.find(flightQuery).select('_id');
      const flightIds = flights.map(f => f._id);
      query.flightId = { $in: flightIds };
    }
    
    const flightAccountingRecords = await FlightAccounting.find(query)
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: flightAccountingRecords.length,
      data: flightAccountingRecords
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching flight accounting records: ${error.message}`
    });
  }
};

// @desc    Get single flight accounting record
// @route   GET /api/accounting/flights/:id
// @access  Private (Superadmin, Ops Admin)
const getFlightAccountingRecord = async (req, res) => {
  try {
    const flightAccountingRecord = await FlightAccounting.findById(req.params.id)
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!flightAccountingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Flight accounting record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: flightAccountingRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching flight accounting record: ${error.message}`
    });
  }
};

// @desc    Get flight accounting by flightId
// @route   GET /api/accounting/flights/by-flight/:flightId
// @access  Private (Superadmin, Ops Admin)
const getFlightAccountingByFlightId = async (req, res) => {
  try {
    const { flightId } = req.params;
    
    // Verify flight exists
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }
    
    const flightAccountingRecord = await FlightAccounting.findOne({ flightId })
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!flightAccountingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Flight accounting record not found for this flight',
        flight: {
          id: flight._id,
          flightNo: flight.flightNo,
          origin: flight.origin,
          destination: flight.destination,
          date: flight.date
        }
      });
    }

    res.status(200).json({
      success: true,
      data: flightAccountingRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error fetching flight accounting record: ${error.message}`
    });
  }
};

// @desc    Create flight accounting record
// @route   POST /api/accounting/flights
// @access  Private (Superadmin, Ops Admin)
const createFlightAccountingRecord = async (req, res) => {
  try {
    const { flightId } = req.body;
    
    // Verify flight exists
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }
    
    // Check if flight accounting already exists
    const existingRecord = await FlightAccounting.findOne({ flightId });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: 'Flight accounting record already exists for this flight. Use PUT to update.',
        existingRecordId: existingRecord._id
      });
    }
    
    const flightAccountingRecord = await FlightAccounting.create({
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    const populatedRecord = await FlightAccounting.findById(flightAccountingRecord._id)
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error creating flight accounting record: ${error.message}`
    });
  }
};

// @desc    Update flight accounting record
// @route   PUT /api/accounting/flights/:id
// @access  Private (Superadmin, Ops Admin)
const updateFlightAccountingRecord = async (req, res) => {
  try {
    let flightAccountingRecord = await FlightAccounting.findById(req.params.id);

    if (!flightAccountingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Flight accounting record not found'
      });
    }

    // If flightId is being updated, verify new flight exists
    if (req.body.flightId && req.body.flightId !== flightAccountingRecord.flightId.toString()) {
      const flight = await Flight.findById(req.body.flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Flight not found'
        });
      }
      
      // Check if another record already exists for the new flightId
      const existingRecord = await FlightAccounting.findOne({ flightId: req.body.flightId });
      if (existingRecord && existingRecord._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          error: 'Flight accounting record already exists for this flight'
        });
      }
    }

    // Update record
    flightAccountingRecord = await FlightAccounting.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('flightId', 'flightNo origin destination date time aircraft status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: flightAccountingRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error updating flight accounting record: ${error.message}`
    });
  }
};

// @desc    Upsert flight accounting record (create or update by flightId)
// @route   PUT /api/accounting/flights/by-flight/:flightId
// @access  Private (Superadmin, Ops Admin)
const upsertFlightAccountingByFlightId = async (req, res) => {
  try {
    const { flightId } = req.params;
    
    // Verify flight exists
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }
    
    // Find existing record
    let flightAccountingRecord = await FlightAccounting.findOne({ flightId });
    
    if (flightAccountingRecord) {
      // Update existing record
      flightAccountingRecord = await FlightAccounting.findByIdAndUpdate(
        flightAccountingRecord._id,
        {
          ...req.body,
          flightId, // Ensure flightId is not changed
          updatedBy: req.user.id
        },
        {
          new: true,
          runValidators: true
        }
      )
        .populate('flightId', 'flightNo origin destination date time aircraft status')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      res.status(200).json({
        success: true,
        data: flightAccountingRecord,
        action: 'updated'
      });
    } else {
      // Create new record
      flightAccountingRecord = await FlightAccounting.create({
        ...req.body,
        flightId,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      const populatedRecord = await FlightAccounting.findById(flightAccountingRecord._id)
        .populate('flightId', 'flightNo origin destination date time aircraft status')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      res.status(201).json({
        success: true,
        data: populatedRecord,
        action: 'created'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error upserting flight accounting record: ${error.message}`
    });
  }
};

// @desc    Delete flight accounting record
// @route   DELETE /api/accounting/flights/:id
// @access  Private (Superadmin, Ops Admin)
const deleteFlightAccountingRecord = async (req, res) => {
  try {
    const flightAccountingRecord = await FlightAccounting.findById(req.params.id);

    if (!flightAccountingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Flight accounting record not found'
      });
    }

    await flightAccountingRecord.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Error deleting flight accounting record: ${error.message}`
    });
  }
};

module.exports = {
  getAccountingRecords,
  getAccountingRecord,
  createAccountingRecord,
  updateAccountingRecord,
  deleteAccountingRecord,
  getAccountingSummary,
  uploadAccountingRecords,
  // Flight Accounting exports
  getFlightAccountingRecords,
  getFlightAccountingRecord,
  getFlightAccountingByFlightId,
  createFlightAccountingRecord,
  updateFlightAccountingRecord,
  upsertFlightAccountingByFlightId,
  deleteFlightAccountingRecord
};

