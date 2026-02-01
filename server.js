/* ===== Dependencies ===== */
const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // Load .env once

const app = express();
app.use(express.json());
app.use(cors()); // Allow all origins, you can restrict later

const ORDERS_FILE = "./orders.json";

/* ===== Serve Front-end ===== */
app.use(express.static(path.join(__dirname, "public")));

/* ===== Root Route ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== Helper Function to Read Orders ===== */
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, "[]");
    }
    const data = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading orders:", err);
    return [];
  }
}

/* ===== Helper Function to Write Orders ===== */
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("Error writing orders:", err);
  }
}

/* ===== Submit Order ===== */
app.post("/order", (req, res) => {
  const orders = readOrders();
  orders.push({ ...req.body, date: new Date().toISOString() });
  writeOrders(orders);
  res.json({ success: true });
});

/* ===== Admin Login ===== */
app.post("/admin/login", async (req, res) => {
  const { pin } = req.body;

  if (!pin) return res.status(400).json({ success: false, message: "PIN required" });

  try {
    const valid = await bcrypt.compare(pin, process.env.ADMIN_PIN_HASH);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid PIN" });

    res.json({ success: true, token: "ADMIN_AUTH_OK" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===== Fetch Orders (Admin Only) ===== */
app.get("/admin/orders", (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== "ADMIN_AUTH_OK") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const orders = readOrders();
  res.json(orders);
});

/* ===== Start Server ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
