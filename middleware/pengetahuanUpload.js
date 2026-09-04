const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const tempDir = path.join(
  process.cwd(),
  'storage',
  'pengetahuan',
  'tmp'
);

fs.mkdirSync(tempDir, { recursive: true });

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',

  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',

  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },

  filename: (req, file, cb) => {
    const ext = extensionByMime[file.mimetype];

    if (!ext) {
      return cb(new Error('Tipe file tidak didukung'));
    }

    const filename = `${crypto.randomUUID()}${ext}`;

    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (!extensionByMime[file.mimetype]) {
    return cb(
      new Error(
        'File harus berupa gambar, audio, atau video yang didukung'
      )
    );
  }

  cb(null, true);
};

const uploadDokumentasi = multer({
  storage,
  fileFilter,

  // Technical safeguard.
  // Sesuaikan nanti jika proyek punya batas ukuran resmi.
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

module.exports = uploadDokumentasi;