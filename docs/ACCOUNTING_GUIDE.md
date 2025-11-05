# Flight Accounting Data - How to Add

There are **3 main ways** to add flight accounting data (with profit and margin calculations):

## 1. **Through the UI (Accounting Page)** ⭐ Recommended

### Steps:
1. Navigate to `/accounting` page (requires accounting module access)
2. Click **"+ Add Flight Accounting"** button at the top
3. Fill in the form:
   - **Select Flight** (dropdown with all flights)
   - **Capacity** (number of seats)
   - **Booking Load** (percentage: 0-100)
   - **Base Fare** (required)
   - **Sector Taxes** (optional)
   - **Fuel Surcharge** (optional)
   - **Service Charges** (optional)
   - **Budget Per Flight** (required)
   - **Operating Costs** (optional)
   - **Crew Costs** (optional)
   - **Fuel Costs** (optional)
   - **Maintenance Costs** (optional)
   - **Currency** (USD, EUR, GBP, AED, INR, PKR)
   - **Notes** (optional)

4. Click **"Create"** button
5. Profit and margin are **automatically calculated** based on:
   - `avgFare = baseFare + sectorTaxes`
   - `seatsSold = capacity × (bookingLoad / 100)`
   - `revenue = seatsSold × avgFare`
   - `profit = revenue − budgetPerFlight`
   - `profitMargin = (profit / revenue) × 100`

### To Edit Existing Records:
- Click **"Edit"** button in the Actions column of the table
- Modify the values
- Click **"Update"**

### To Add to Existing Flights:
- Click **"Add"** button in the Actions column (if no accounting data exists)
- Fill in the form
- Click **"Create"**

---

## 2. **Through API Endpoints** (Programmatic Access)

### Available Endpoints:

#### **Create Flight Accounting Record**
```http
POST /api/accounting/flights
Authorization: Bearer <token>
Content-Type: application/json

{
  "flightId": "507f1f77bcf86cd799439011",
  "capacity": 396,
  "bookingLoad": 0.75,  // 0-1 range (75% = 0.75)
  "baseFare": 1500.00,
  "sectorTaxes": 250.00,
  "fuelSurcharge": 150.00,
  "serviceCharges": 50.00,
  "budgetPerFlight": 50000.00,
  "operatingCosts": 10000.00,
  "crewCosts": 8000.00,
  "fuelCosts": 15000.00,
  "maintenanceCosts": 5000.00,
  "currency": "USD",
  "notes": "Optional notes"
}
```

#### **Upsert by Flight ID** (Create or Update)
```http
PUT /api/accounting/flights/by-flight/:flightId
Authorization: Bearer <token>
Content-Type: application/json

{
  "capacity": 396,
  "bookingLoad": 0.75,
  "baseFare": 1500.00,
  "sectorTaxes": 250.00,
  "budgetPerFlight": 50000.00,
  // ... other fields
}
```
**Note:** This will create if doesn't exist, or update if exists.

#### **Update Existing Record**
```http
PUT /api/accounting/flights/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "capacity": 400,
  "bookingLoad": 0.80,
  // ... updated fields
}
```

#### **Get Flight Accounting by Flight ID**
```http
GET /api/accounting/flights/by-flight/:flightId
Authorization: Bearer <token>
```

#### **Get All Flight Accounting Records**
```http
GET /api/accounting/flights?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

---

## 3. **Through Database Seed Script** (Bulk Data)

### Run the seed script:
```bash
cd backend
node seed/seed.js
```

This will:
- Create demo users (superadmin, ops admin, hr admin, marketing admin)
- Create flights (today + next 3 days)
- **Create FlightAccounting records for ~60% of flights** with realistic data
- Create other sample data (employees, campaigns, clients, tasks, announcements)

### Fields Generated in Seed:
- **Capacity**: Based on aircraft type (180-853 seats)
- **Booking Load**: Random 60-95% (0.6 to 0.95)
- **Base Fare**: Random $500-$5000
- **Sector Taxes**: Random $50-$500
- **Fuel Surcharge**: Random $100-$800
- **Service Charges**: Random $50-$300
- **Budget Per Flight**: Calculated based on capacity and fare
- **Costs**: Operating, crew, fuel, maintenance (calculated as percentages of budget)

---

## Quick Reference: Calculation Formulas

When you add/update flight accounting data, these calculations happen automatically:

| Calculation | Formula |
|------------|---------|
| **Avg Fare** | `baseFare + sectorTaxes` |
| **Seats Sold** | `capacity × bookingLoad` (rounded) |
| **Revenue** | `seatsSold × avgFare` |
| **Profit** | `revenue − budgetPerFlight` |
| **Profit Margin** | `(profit / revenue) × 100` (if revenue > 0) |

**Note:** These are calculated automatically when you save the record.

---

## Access Control

- **Superadmin**: Full access to all endpoints
- **Ops Admin**: Access to accounting endpoints (requires `accounting` module or `operations`/`flightManagement` module)
- **HR/Marketing Admin**: No access (excluded from accounting module)

---

## Example: Adding Accounting Data via API

### Using cURL:
```bash
curl -X PUT http://localhost:5001/api/accounting/flights/by-flight/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": 396,
    "bookingLoad": 0.75,
    "baseFare": 1500.00,
    "sectorTaxes": 250.00,
    "fuelSurcharge": 150.00,
    "serviceCharges": 50.00,
    "budgetPerFlight": 50000.00,
    "operatingCosts": 10000.00,
    "crewCosts": 8000.00,
    "fuelCosts": 15000.00,
    "maintenanceCosts": 5000.00,
    "currency": "USD"
  }'
```

### Using JavaScript/Fetch:
```javascript
const response = await fetch('http://localhost:5001/api/accounting/flights/by-flight/FLIGHT_ID', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    capacity: 396,
    bookingLoad: 0.75,  // 75% = 0.75
    baseFare: 1500.00,
    sectorTaxes: 250.00,
    budgetPerFlight: 50000.00,
    // ... other fields
  })
});
```

---

## Tips

1. **Booking Load**: Enter as percentage (0-100) in UI, but API expects decimal (0-1)
   - UI: `75.5` means 75.5%
   - API: `0.755` means 75.5%

2. **Required Fields**:
   - `flightId` (or select from dropdown in UI)
   - `capacity`
   - `bookingLoad`
   - `baseFare`
   - `budgetPerFlight`

3. **Optional Fields** (will default to 0):
   - Sector taxes, fuel surcharge, service charges
   - Operating costs, crew costs, fuel costs, maintenance costs

4. **Auto-calculations**: Revenue, profit, and margin are calculated automatically when you save.

---

## Troubleshooting

**Q: Why are all values showing 0?**
A: You need to create FlightAccounting records for your flights. Use the "+ Add Flight Accounting" button or the API endpoints.

**Q: Can I bulk import flight accounting data?**
A: Currently, you need to use the API endpoints or create records one by one. CSV bulk import for flight accounting can be added as a future feature.

**Q: How do I update existing records?**
A: Click "Edit" in the table, or use `PUT /api/accounting/flights/:id` or `PUT /api/accounting/flights/by-flight/:flightId`

