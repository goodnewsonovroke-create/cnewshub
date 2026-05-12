const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();

// --- 1. MIDDLEWARE SETUP ---
// This fixes the "req.body is undefined" error
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as the engine
app.set('view engine', 'ejs');

// Static folders for CSS, Images, and Uploads
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// --- 2. DATABASE CONNECTION ---
// When you move to a cloud DB (Aiven/Tidb), you will update these values
const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cnewshub_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// --- 3. IMAGE UPLOAD SETUP (MULTER) ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'cnews-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 4. ROUTES ---

// Home Page - Displays all stories
app.get('/', (req, res) => {
    db.query('SELECT * FROM news_posts ORDER BY created_at DESC', (err, results) => {
        if (err) throw err;
        // Pass the results as 'articles' to index.ejs
        res.render('index', { articles: results });
    });
});

// Submit/Admin Page
app.get('/submit', (req, res) => {
    res.render('submit'); 
});

// Publish Route - Fixes the "title is not defined" ReferenceError
app.post('/admin/publish', upload.single('news_image'), (req, res) => {
    // Variables must be defined INSIDE this function block
    const { title, category, content } = req.body; 
    const img = req.file ? '/uploads/' + req.file.filename : '/uploads/default.jpg';
    
    const sql = 'INSERT INTO news_posts (title, category, image_url, content) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, category, img, content], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error: Could not save post.");
        }
        res.redirect('/');
    });
});

// --- 5. RENDER PORT CONFIGURATION ---
// Render looks for process.env.PORT. If not found, it defaults to 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CNEWS HUB is live at http://localhost:${PORT}`);
});