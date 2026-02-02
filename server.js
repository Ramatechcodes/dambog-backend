const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ======================
   ROOT
====================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ======================
   SUBMIT ORDER
====================== */
app.post("/order", async (req, res) => {
  const { fullname, email, phone, address, product, quantity, payment } = req.body;

  try {
    await pool.query(
      `INSERT INTO orders 
      (fullname, email, phone, address, product, quantity, payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [fullname, email, phone, address, product, quantity, payment]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ======================
   ADMIN LOGIN
====================== */
app.post("/admin/login", async (req, res) => {
  const { pin } = req.body;
  const valid = await bcrypt.compare(pin, process.env.ADMIN_PIN_HASH);
  if (!valid) return res.status(401).json({ success: false });

  res.json({ success: true, token: "ADMIN_AUTH_OK" });
});

/* ======================
   FETCH ORDERS
====================== */
app.get("/admin/orders", async (req, res) => {
  if (req.headers.authorization !== "ADMIN_AUTH_OK") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
