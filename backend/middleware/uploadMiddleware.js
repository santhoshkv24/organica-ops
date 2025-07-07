const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  }
};

// Create upload directories
const profileUploadsDir = path.join(__dirname, '../../uploads/profile');
createDirIfNotExists(profileUploadsDir);
console.log('Profile uploads directory:', profileUploadsDir);

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('File upload destination:', profileUploadsDir);
    cb(null, profileUploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with user ID and timestamp
    const userId = req.user ? req.user.user_id : 'unknown';
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const filename = `user_${userId}_${timestamp}${fileExt}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  console.log('Received file:', file.originalname, file.mimetype);
  // Accept only image files
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    console.error('File rejected: not an image');
    return cb(new Error('Only image files are allowed!'), false);
  }
  console.log('File accepted');
  cb(null, true);
};

// Create multer upload instances
const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFilter
});

// Middleware for profile picture upload
const uploadProfilePicture = (req, res, next) => {
  console.log('Upload middleware called');
  profileUpload.single('profilePicture')(req, res, function(err) {
    if (err) {
      console.error('Error in multer upload:', err);
      return res.status(400).json({ message: err.message });
    }
    console.log('File uploaded successfully:', req.file ? req.file.filename : 'No file');
    next();
  });
};

const excelStorage = multer.memoryStorage();

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'text/csv'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only .xlsx, .xls, and .csv files are allowed!'), false);
  }
};

const uploadExcel = multer({ storage: excelStorage, fileFilter: excelFilter });

module.exports = {
  uploadProfilePicture,
  uploadExcel,
}; 