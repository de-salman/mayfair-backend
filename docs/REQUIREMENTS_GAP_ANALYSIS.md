# Requirements Gap Analysis - Accounting Module

## ✅ **What's Currently Implemented:**

1. ✅ **Basic Profit & Loss Calculation** - Working
   - Revenue = seatsSold × avgFare
   - Profit = revenue − budgetPerFlight
   - Profit Margin = (profit / revenue) × 100

2. ✅ **Basic Filters** - Working
   - Airline/Aircraft filter
   - Route filter (origin-destination)
   - Date Range filter
   - Day of Week filter (but shows "Monday", not "D1")

3. ✅ **Summary Cards** - Working
   - Total Flights
   - Avg Load
   - Total Revenue
   - Total Profit

4. ✅ **Chart** - Basic implementation
   - Shows bookings/profit trend
   - But doesn't show booking cycle trends over time

5. ✅ **Detailed Table** - Working
   - Shows all flight data with profit/loss
   - But missing some required metrics

6. ✅ **Form to Add/Edit** - Working
   - Can create and edit flight accounting records

---

## ❌ **What's Missing or Incorrect:**

### 1. **Multi-Sector Routes** ❌
**Requirement:** Support routes like `MXP-DXB-MXP` (round trip with multiple sectors)
**Current:** Only supports `origin-destination` (single sector)
**Impact:** Cannot handle round trips or multi-sector flights

**Example:**
- Route: MXP (Milan) - DXB (Dubai) - MXP (Milan)
- Need to track: MXP→DXB sector and DXB→MXP sector separately

---

### 2. **Sector-Specific Taxes** ❌
**Requirement:** Different taxes per sector
- MXP-DXB: 34.00 EUR per sector per passenger
- DXB-MXP: 25.00 EUR per sector per passenger

**Current:** Single `sectorTaxes` field (cannot differentiate sectors)
**Impact:** Cannot accurately calculate taxes for multi-sector routes

---

### 3. **Average Net Cost per Seat** ❌
**Requirement:** Calculate Average Net Cost per Seat by:
- Route
- Sector

**Current:** NOT calculated
**Formula Needed:** `(totalCosts / seatsSold) by route/sector`

---

### 4. **Average Fare per Seat** ❌
**Requirement:** Calculate Average Fare per Seat by:
- Route  
- Sector

**Current:** NOT calculated
**Formula Needed:** `(totalRevenue / seatsSold) by route/sector`

---

### 5. **Booking Trends with Time Period** ❌
**Requirement:** Booking trends from June 2025 to November 2025
- Show booking load progression over time
- Compare: previous month vs current month
- Compare: previous year vs current year

**Current:** Basic chart exists but:
- Doesn't show booking cycle trends
- No month-over-month comparison
- No year-over-year comparison

---

### 6. **Month-Based Booking Load** ❌
**Requirement:** Booking load varies by month:
- December: 90%
- January: 75%
- February: 50%
- March: 40%
- April: 70%

**Current:** Static booking load per flight (not month-based)
**Impact:** Cannot track how booking load changes over months before flight date

---

### 7. **Price Range Filter** ❌
**Requirement:** Filter by price range (190EUR to 350EUR per sector per passenger)
**Current:** NOT implemented
**Impact:** Cannot filter flights by fare range

---

### 8. **Booking Source Tracking** ❌
**Requirement:** Track bookings from:
- Clients
- Travel Agencies
- Aggregators

**Current:** NOT tracked
**Impact:** Cannot analyze booking trends by source

---

### 9. **Financial Dashboard with Comparisons** ❌
**Requirement:** 
- Profit & Loss dashboard
- Compare: Previous month vs Current month
- Compare: Previous year vs Current year
- Inventory status (seats available vs fully booked)

**Current:** Basic summary cards exist but:
- No month-over-month comparison
- No year-over-year comparison
- No inventory status indicators

---

### 10. **Inventory Status Indicators** ❌
**Requirement:** Show if flight has:
- Seats available (can still sell)
- Fully booked (no more seats)

**Current:** Shows capacity and seats sold, but no clear status indicator
**Impact:** Cannot quickly see which flights need action

---

### 11. **Day of Week Format** ⚠️
**Requirement:** Filter by D1 (Monday), D2 (Tuesday), etc.
**Current:** Shows "Monday", "Tuesday" (not D1, D2 format)
**Impact:** Minor - format doesn't match requirement

---

### 12. **Sector Filter** ❌
**Requirement:** Filter by Sector (in addition to Route)
**Current:** Only has Route filter (origin-destination)
**Impact:** Cannot filter multi-sector routes by individual sectors

---

## 📊 **Summary**

| Requirement | Status | Priority |
|------------|--------|----------|
| Multi-Sector Routes | ❌ Missing | HIGH |
| Sector-Specific Taxes | ❌ Missing | HIGH |
| Avg Net Cost per Seat | ❌ Missing | MEDIUM |
| Avg Fare per Seat | ❌ Missing | MEDIUM |
| Booking Trends (time-based) | ⚠️ Partial | HIGH |
| Month-Based Booking Load | ❌ Missing | HIGH |
| Price Range Filter | ❌ Missing | MEDIUM |
| Booking Source Tracking | ❌ Missing | MEDIUM |
| Financial Dashboard Comparisons | ❌ Missing | HIGH |
| Inventory Status Indicators | ❌ Missing | MEDIUM |
| Day of Week Format (D1, D2) | ⚠️ Wrong Format | LOW |
| Sector Filter | ❌ Missing | MEDIUM |

---

## 🎯 **Recommended Next Steps**

### Phase 1 (Critical):
1. Add multi-sector route support
2. Add sector-specific taxes
3. Add month-based booking load tracking
4. Add Financial Dashboard with comparisons

### Phase 2 (Important):
5. Calculate Average Net Cost per Seat by Route/Sector
6. Calculate Average Fare per Seat by Route/Sector
7. Add booking source tracking
8. Add inventory status indicators

### Phase 3 (Nice to Have):
9. Add price range filter
10. Update Day of Week format to D1, D2
11. Add sector-specific filter

---

## 💡 **Key Issues to Address:**

1. **Flight Model** - Currently only has `origin` and `destination`. Need to support:
   - Multi-sector routes (array of sectors)
   - Each sector with its own tax

2. **FlightAccounting Model** - Need to add:
   - `sectors` array (each with tax)
   - `bookingLoadByMonth` (object with month-based loads)
   - `bookingSource` (Clients, Agencies, Aggregators)
   - `priceRange` (min/max fare)

3. **Calculations** - Need to add:
   - Average Net Cost per Seat (by route/sector)
   - Average Fare per Seat (by route/sector)
   - Month-over-month comparisons
   - Year-over-year comparisons

4. **Dashboard** - Need to add:
   - Comparison views (MoM, YoY)
   - Inventory status (available/fully booked)
   - Booking trend analysis
   - Sector-level breakdowns

