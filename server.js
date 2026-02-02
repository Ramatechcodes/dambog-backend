/* ==============================
   DEPENDENCIES
============================== */
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

/* ==============================
   APP SETUP
============================== */
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   DATABASE CONNECTION (RENDER)
============================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/* ==============================
   ROOT ROUTE
============================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ==============================
   SETUP DATABASE (RUN ONCE)
============================== */
app.get("/setup-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        fullname TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        product TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        payment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.send("✅ Orders table created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Database setup failed");
  }
});


/* ==============================
   SUBMIT ORDER
============================== */
app.post("/order", async (req, res) => {
  const { fullname, email, phone, address, product, quantity, payment } = req.body;

  if (!fullname || !phone || !product || !quantity || !payment) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    await pool.query(
      `INSERT INTO orders
      (fullname, email, phone, address, product, quantity, payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [fullname, email, phone, address, quantity ? Number(quantity) : 0, payment]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ORDER INSERT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ==============================
   ADMIN LOGIN
============================== */
app.post("/admin/login", async (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ success: false, message: "PIN required" });
  }

  try {
    const valid = await bcrypt.compare(pin, process.env.ADMIN_PIN_HASH);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid PIN" });
    }

    res.json({ success: true, token: "ADMIN_AUTH_OK" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ==============================
   FETCH ORDERS (ADMIN ONLY)
============================== */
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
    console.error("FETCH ORDERS ERROR:", err);
    res.status(500).json([]);
  }
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
