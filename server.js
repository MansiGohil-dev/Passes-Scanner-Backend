require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/admins");
const passRoutes = require("./routes/passes");
const app = express();
app.use(cors());
app.use(express.json());

// console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/newticket", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/admins", adminRoutes);
app.use("/api/passes", passRoutes);
const employeeRoutes = require("./routes/employees");
app.use("/api/employees", employeeRoutes);
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} and accessible from all network interfaces`));
