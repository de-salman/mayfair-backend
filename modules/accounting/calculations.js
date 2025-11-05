/**
 * Flight Accounting Calculation Helper
 * 
 * Calculates financial metrics for flight records based on:
 * - Flight accounting data (baseFare, sectorTaxes, capacity, bookingLoad, budgetPerFlight)
 * 
 * @param {Object} flightAccountingRecord - FlightAccounting document with populated flightId
 * @returns {Object} Calculated metrics
 */

const calculateFlightMetrics = (flightAccountingRecord) => {
  // Extract values with defaults
  const baseFare = flightAccountingRecord?.baseFare || 0;
  const sectorTaxes = flightAccountingRecord?.sectorTaxes || 0;
  const capacity = flightAccountingRecord?.capacity || 0;
  const bookingLoad = flightAccountingRecord?.bookingLoad || 0;
  const budgetPerFlight = flightAccountingRecord?.budgetPerFlight || flightAccountingRecord?.budget || 0;

  // Calculate average fare
  // avgFare = baseFare + avg(sectorTaxes)
  // Since sectorTaxes is already a single value, we use it directly
  const avgFare = baseFare + sectorTaxes;

  // Calculate seats sold
  // seatsSold = capacity × bookingLoad
  const seatsSold = Math.round(capacity * bookingLoad);

  // Calculate revenue
  // revenue = seatsSold × avgFare
  const revenue = seatsSold * avgFare;

  // Calculate profit
  // profit = revenue − budgetPerFlight
  const profit = revenue - budgetPerFlight;

  // Calculate profit margin
  // profitMargin = profit / revenue × 100
  let profitMargin = 0;
  if (revenue > 0) {
    profitMargin = (profit / revenue) * 100;
  }

  return {
    avgFare: parseFloat(avgFare.toFixed(2)),
    seatsSold,
    revenue: parseFloat(revenue.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    profitMargin: parseFloat(profitMargin.toFixed(2)),
    capacity,
    bookingLoad: parseFloat((bookingLoad * 100).toFixed(2)), // Convert to percentage for display
    budgetPerFlight: parseFloat(budgetPerFlight.toFixed(2))
  };
};

/**
 * Calculate metrics for multiple flight accounting records
 * 
 * @param {Array} flightAccountingRecords - Array of FlightAccounting documents
 * @returns {Object} Aggregated calculations
 */
const calculateFlightMetricsBulk = (flightAccountingRecords) => {
  const calculations = flightAccountingRecords.map(record => calculateFlightMetrics(record));
  
  // Aggregate totals
  const totalRevenue = calculations.reduce((sum, calc) => sum + calc.revenue, 0);
  const totalProfit = calculations.reduce((sum, calc) => sum + calc.profit, 0);
  const totalBudgetPerFlight = calculations.reduce((sum, calc) => sum + calc.budgetPerFlight, 0);
  const totalSeatsSold = calculations.reduce((sum, calc) => sum + calc.seatsSold, 0);
  const totalCapacity = calculations.reduce((sum, calc) => sum + calc.capacity, 0);
  
  // Calculate averages
  const avgFare = calculations.length > 0
    ? calculations.reduce((sum, calc) => sum + calc.avgFare, 0) / calculations.length
    : 0;
  
  const avgBookingLoad = totalCapacity > 0
    ? (totalSeatsSold / totalCapacity) * 100
    : 0;
  
  const avgProfitMargin = calculations.length > 0
    ? calculations.reduce((sum, calc) => sum + calc.profitMargin, 0) / calculations.length
    : 0;
  
  // Overall profit margin
  const overallProfitMargin = totalRevenue > 0
    ? (totalProfit / totalRevenue) * 100
    : 0;

  return {
    individual: calculations,
    totals: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalBudgetPerFlight: parseFloat(totalBudgetPerFlight.toFixed(2)),
      totalSeatsSold,
      totalCapacity
    },
    averages: {
      avgFare: parseFloat(avgFare.toFixed(2)),
      avgBookingLoad: parseFloat(avgBookingLoad.toFixed(2)),
      avgProfitMargin: parseFloat(avgProfitMargin.toFixed(2)),
      overallProfitMargin: parseFloat(overallProfitMargin.toFixed(2))
    },
    count: calculations.length
  };
};

/**
 * Calculate metrics for a single flight with optional flight accounting data
 * 
 * @param {Object} flight - Flight document
 * @param {Object} flightAccountingRecord - Optional FlightAccounting document
 * @returns {Object} Calculated metrics with flight info
 */
const calculateFlightWithMetrics = (flight, flightAccountingRecord = null) => {
  const metrics = flightAccountingRecord 
    ? calculateFlightMetrics(flightAccountingRecord)
    : {
        avgFare: 0,
        seatsSold: 0,
        revenue: 0,
        profit: 0,
        profitMargin: 0,
        capacity: 0,
        bookingLoad: 0,
        budgetPerFlight: 0
      };

  return {
    flight: {
      id: flight._id,
      flightNo: flight.flightNo,
      origin: flight.origin,
      destination: flight.destination,
      date: flight.date,
      time: flight.time,
      aircraft: flight.aircraft,
      status: flight.status
    },
    accounting: flightAccountingRecord ? {
      id: flightAccountingRecord._id,
      baseFare: flightAccountingRecord.baseFare,
      sectorTaxes: flightAccountingRecord.sectorTaxes,
      capacity: flightAccountingRecord.capacity,
      bookingLoad: flightAccountingRecord.bookingLoad,
      budgetPerFlight: flightAccountingRecord.budgetPerFlight || flightAccountingRecord.budget,
      totalRevenue: flightAccountingRecord.totalRevenue,
      totalCosts: flightAccountingRecord.totalCosts,
      netProfit: flightAccountingRecord.netProfit,
      profitMargin: flightAccountingRecord.profitMargin
    } : null,
    calculations: metrics
  };
};

module.exports = {
  calculateFlightMetrics,
  calculateFlightMetricsBulk,
  calculateFlightWithMetrics
};

