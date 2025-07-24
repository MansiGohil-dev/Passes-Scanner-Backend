require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/admins");
const passRoutes = require("./routes/passes");
const app = express();

// CORS configuration to allow frontend domain
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://passes-scanner-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/newticket", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Passes Scanner Backend API is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use("/api/admins", adminRoutes);
app.use("/api/passes", passRoutes);
const employeeRoutes = require("./routes/employees");
app.use("/api/employees", employeeRoutes);
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} and accessible from all network interfaces`));
