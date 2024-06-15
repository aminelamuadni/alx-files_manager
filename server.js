const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

// Import routes
const routes = require('./routes/index');

// Use Routes
app.use(routes);

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
