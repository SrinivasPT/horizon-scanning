require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const scannerRoutes = require('./routes/scannerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

// Routes
app.use('/api', scannerRoutes);
app.use('/api/scanner', scannerRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
