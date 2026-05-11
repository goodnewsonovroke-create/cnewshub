const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DATABASE CONNECTION
// Note: On Render, you'll eventually need a cloud DB like Aiven or PlanetScale
const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cnewshub_db'
});

// Multer for Images
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'cnews-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ROUTES ---
app.get('/', (req, res) => {
    db.query('SELECT * FROM news_posts ORDER BY created_at DESC', (err, results) => {
        if (err) throw err;
        // We pass "articles" (plural) to the index page
        res.render('index', { articles: results });
    });
});

// Ensure 'upload.single' comes before the (req, res) function
app.post('/admin/publish', upload.single('news_image'), (req, res) => {
    // Now req.body will NOT be undefined
    const { title, category, content } = req.body; 
    // ... rest of your code
});
    
    db.query('INSERT INTO news_posts (title, category, image_url, content) VALUES (?, ?, ?, ?)', 
    [title, category, img, content], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error saving post");
        }
        res.redirect('/');
    });

app.get('/submit', (req, res) => {
    res.render('submit'); // Ensure you have a submit.ejs file in your views folder
});

// RENDER PORT FIX
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));