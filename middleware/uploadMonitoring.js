const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(
  __dirname,
  '..',
  'uploads',
  'monitoring'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9);

    const extension =
      path.extname(file.originalname);

    cb(
      null,
      uniqueName + extension
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        'File harus berupa PDF, JPG, PNG, DOC, atau DOCX.'
      ),
      false
    );
  }

  cb(null, true);
};

const uploadMonitoring = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = uploadMonitoring;