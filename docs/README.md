# Mayfair Jets API Documentation

## Postman Collection

This directory contains a Postman collection for testing the Mayfair Jets API.

### Setup

1. Import the `postman_collection.json` file into Postman
2. Create a new environment in Postman with the following variables:
   - `base_url`: `http://localhost:5000` (or your server URL)
   - `auth_token`: (will be automatically set after login)
   - `user_id`: (will be automatically set after login)

### Usage Workflow

The collection is organized in folders representing different API modules. The typical workflow is:

1. **Auth → Login as Superadmin**
   - Login with `super@mayfair.test` / `Password123`
   - This automatically sets the `auth_token` variable

2. **Users → Create Admin User**
   - Create a new admin user with specific modules

3. **Users → Create Regular User**
   - Create a regular user with allowed modules

4. **Flights → Upload Flights CSV**
   - Upload a CSV file with flight data
   - CSV should have columns: `flightNo`, `origin`, `destination`, `date`, `time`, `aircraft` (optional), `status` (optional)

5. **Flights → List All Flights**
   - View all uploaded flights

6. **Campaigns → Create Campaign**
   - Create a new marketing campaign

7. **Announcements → Create Announcement**
   - Create a new announcement

### Example CSV for Flight Upload

```csv
flightNo,origin,destination,date,time,aircraft,status
MF1001,JFK,LAX,2024-01-20,08:00,Boeing 777,scheduled
MF1002,LAX,JFK,2024-01-20,14:30,Airbus A380,scheduled
MF1003,DXB,LHR,2024-01-21,10:15,Boeing 787,delayed
```

### Endpoints Overview

- **Auth**: `/api/auth/*` - Authentication endpoints
- **Users**: `/api/users/*` - User management (admin/superadmin only)
- **Flights**: `/api/flights/*` - Flight management (requires `flightManagement` module)
- **Employees**: `/api/employees/*` - Employee management (requires `hrms` module)
- **Campaigns**: `/api/campaigns/*` - Campaign management (requires `campaigns` module)
- **Clients**: `/api/clients/*` - Client management (requires `clients` module)
- **Tasks**: `/api/tasks/*` - Task management
- **Announcements**: `/api/announcements/*` - Announcement management

### Authentication

Most endpoints require authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is automatically captured and stored after logging in.

### Module Access

Different endpoints require specific module access:
- `hrms` - Required for employees endpoints
- `flightManagement` - Required for flights endpoints
- `campaigns` - Required for campaigns endpoints
- `clients` - Required for clients endpoints

Superadmin has access to all modules.

