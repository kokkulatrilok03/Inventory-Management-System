# Inventory Management System

A full-stack Inventory Management System built with React (Frontend) and Node.js/Express (Backend) with SQLite database. This project was developed for the Skillwise assignment.

## 🚀 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **SQLite3** - Database
- **Multer** - File upload handling
- **CSV-Parser** - CSV file processing
- **Express-Validator** - Request validation
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling

## 📁 Project Structure

```
skillwise/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── package.json       # Backend dependencies
│   ├── inventory.db       # SQLite database (auto-created)
│   ├── uploads/           # CSV upload directory (auto-created)
│   ├── .env               # Environment variables (create manually)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── api.js         # API client configuration
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Main styles
│   │   ├── index.js       # React entry point
│   │   └── components/
│   │       ├── HeaderControls.js    # Search, filter, import/export
│   │       ├── ProductTable.js      # Products table with inline editing
│   │       └── HistorySidebar.js    # Inventory history sidebar
│   ├── public/
│   │   └── index.html
│   ├── package.json       # Frontend dependencies
│   ├── .env               # Environment variables (create manually)
│   └── .gitignore
├── package.json           # Root scripts
└── README.md
```

## 🗄️ Database Schema

### Products Table
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `name` - TEXT NOT NULL UNIQUE
- `unit` - TEXT NOT NULL
- `category` - TEXT NOT NULL
- `brand` - TEXT NOT NULL
- `stock` - INTEGER NOT NULL DEFAULT 0
- `status` - TEXT NOT NULL DEFAULT 'active'
- `image` - TEXT
- `createdAt` - DATETIME DEFAULT CURRENT_TIMESTAMP
- `updatedAt` - DATETIME DEFAULT CURRENT_TIMESTAMP

### Inventory Logs Table
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `productId` - INTEGER NOT NULL (Foreign Key)
- `oldStock` - INTEGER NOT NULL
- `newStock` - INTEGER NOT NULL
- `changedBy` - TEXT DEFAULT 'system'
- `timestamp` - DATETIME DEFAULT CURRENT_TIMESTAMP

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. **Install all dependencies** (backend + frontend):
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables**

   Create `backend/.env`:
   ```env
   PORT=3001
   ```

   Create `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   ```

### Running the Application

#### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

#### Option 2: Use Root Scripts

```bash
# Install dependencies first
npm run install:all

# Then start both services
npm run start:backend
npm run start:frontend
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📡 API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (supports `?name=` and `?category=` query params) |
| GET | `/api/products/search?name=` | Case-insensitive product search |
| POST | `/api/products/import` | Import products from CSV file |
| GET | `/api/products/export` | Export all products as CSV |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/:id/history` | Get inventory history for a product |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## 📋 Features

### Frontend Features

✅ **Product Management**
- View all products in a table
- Search products by name (case-insensitive)
- Filter products by category
- Inline editing of product details
- Delete products with confirmation
- Product image display

✅ **CSV Import/Export**
- Import products from CSV file
- Export all products to CSV
- Import results summary (added, skipped, duplicates)

✅ **Inventory History**
- Click on any product row to view history
- Sidebar displays all stock changes
- Shows old stock → new stock transitions
- Displays timestamp and changed by information

✅ **UI/UX**
- Modern, responsive design
- Real-time updates after operations
- Loading states
- Error handling and user feedback

### Backend Features

✅ **Database Management**
- Auto-creates SQLite database and tables
- Case-insensitive product name uniqueness
- Foreign key constraints for inventory logs
- Automatic timestamp tracking

✅ **Data Validation**
- Request validation using express-validator
- Duplicate name checking (case-insensitive)
- Stock value validation

✅ **Inventory Logging**
- Automatically logs all stock changes
- Tracks old stock, new stock, and changed by
- Preserves complete audit trail

✅ **CSV Processing**
- Validates CSV file format
- Handles duplicate products
- Skips invalid rows
- Returns detailed import statistics

## 📊 CSV Format

### Import CSV Format

The CSV file should have the following headers:
```csv
name,unit,category,brand,stock,status,image
```

**Example:**
```csv
name,unit,category,brand,stock,status,image
Laptop,piece,Electronics,Dell,10,active,https://example.com/laptop.jpg
Mouse,piece,Electronics,Logitech,50,active,https://example.com/mouse.jpg
```

**Note:** Headers are case-insensitive (e.g., `Name` or `name` both work).

### Export CSV

The exported CSV will include all columns:
- name
- unit
- category
- brand
- stock
- status
- image

## 🚢 Deployment

### Backend Deployment (Render/Heroku)

1. Create a new service on Render (or Heroku)
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variable: `PORT` (Render sets this automatically)
6. The database file will persist in the service filesystem

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. **For Netlify:**
   - Connect repository or drag & drop `frontend/build` folder
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Add environment variable: `REACT_APP_API_URL=<your-backend-url>`

3. **For Vercel:**
   - Import repository
   - Set root directory to `frontend`
   - Add environment variable: `REACT_APP_API_URL=<your-backend-url>`

4. Update `frontend/.env` or environment variables with your deployed backend URL

## 🧪 Testing

### Manual Testing Checklist

- [ ] Import CSV file with valid data
- [ ] Import CSV with duplicate products
- [ ] Export products to CSV
- [ ] Search products by name
- [ ] Filter products by category
- [ ] Edit product inline (all fields)
- [ ] Update product stock (verify history log)
- [ ] Delete product
- [ ] View inventory history sidebar
- [ ] Test with empty database
- [ ] Test error handling (invalid CSV, network errors)

## 📝 Notes

- The database file (`inventory.db`) is created automatically on first run
- CSV files uploaded to `/backend/uploads` are deleted after processing
- Product names are case-insensitive for uniqueness checking
- Stock changes are automatically logged to `inventory_logs` table
- The frontend auto-refreshes data after import/update/delete operations

## 🤝 Contributing

This is an assignment project. Feel free to fork and extend for learning purposes.

## 📄 License

ISC

---

**Developed for Skillwise Assignment** 🎓



