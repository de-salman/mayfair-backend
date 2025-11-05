const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (for CSV parsing)
const storage = multer.memoryStorage();

// File filter - only accept CSV files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;


