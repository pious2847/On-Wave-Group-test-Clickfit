const path   = require('path');
const fs     = require('fs');
const express = require('express');
const multer  = require('multer');

const app  = express();
const PORT = process.env.PORT || 3000;


const UPLOAD_DIR = path.join(__dirname, 'upload-images');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
                   .replace(/[^a-zA-Z0-9_-]/g, '_')  
                   .slice(0, 40);                      
    const stamp = Date.now();
    const rand  = Math.floor(Math.random() * 1e4);
    cb(null, `${base}_${stamp}_${rand}${ext}`);
  }
});

const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const fileFilter = function (req, file, cb) {
  if (ALLOWED_MIME.indexOf(file.mimetype) !== -1) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type: ' + file.mimetype), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 10                  
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/upload-images', express.static(UPLOAD_DIR, {
  maxAge: '7d',
  index: false
}));

app.use(express.static(path.join(__dirname)));


app.get('/health', function (req, res) {
  res.json({ ok: true, ts: Date.now() });
});

app.post('/upload', function (req, res, next) {
  upload.array('images', 10)(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Upload failed'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files received' });
    }

    const files = req.files.map(function (f) {
      return {
        originalName: f.originalname,
        filename: f.filename,
        size: f.size,
        mimeType: f.mimetype,
        url: '/upload-images/' + f.filename
      };
    });

    res.json({
      message: 'Uploaded ' + files.length + ' file(s)',
      files: files
    });
  });
});

app.get('/uploads', function (req, res) {
  fs.readdir(UPLOAD_DIR, function (err, entries) {
    if (err) {
      return res.status(500).json({ error: 'Could not list uploads' });
    }
    const list = entries
      .filter(function (n) { return n.charAt(0) !== '.'; })
      .map(function (n) {
        return {
          filename: n,
          url: '/upload-images/' + n
        };
      });
    res.json({ files: list });
  });
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(function (err, req, res, next) {
  console.error('[server] error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, function () {
  console.log('==================================================');
  console.log('  Click Fit server');
  console.log('  Local:  http://localhost:' + PORT);
  console.log('  Uploads saved to: ' + UPLOAD_DIR);
  console.log('==================================================');
});
