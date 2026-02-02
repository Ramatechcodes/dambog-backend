/* ==============================
   PAYMENT TOGGLE
================================ */
function toggleBank() {
  const payment = document.getElementById("payment").value;
  document.getElementById("bankDetails").style.display =
    payment === "Transfer" ? "block" : "none";
}

/* ==============================
   SUBMIT ORDER
================================ */
const orderForm = document.getElementById("orderForm");
const modal = document.getElementById("successModal");
const okBtn = document.getElementById("modalOkBtn");

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const order = {
    fullname: fullname.value,
    email: email.value,
    phone: phone.value,
    address: address.value,
    product: product.value,
    quantity: quantity.value,
    payment: payment.value,
  };

  try {
    const res = await fetch("https://dambog-backend.onrender.com/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!res.ok) throw new Error("Order failed");

    modal.style.display = "block";

    okBtn.onclick = () => {
      modal.style.display = "none";
      orderForm.reset();
      document.getElementById("bankDetails").style.display = "none";
    };
  } catch (err) {
    console.error(err);
    alert("Error submitting order. Please try again.");
  }
});

/* ==============================
   ADMIN AUTH
================================ */
let adminToken = "";
let cachedOrders = [];

async function loginAdmin() {
  const pin = document.getElementById("pin").value;

  try {
    const res = await fetch(
      "https://dambog-backend.onrender.com/admin/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      }
    );

    if (!res.ok) {
      alert("Wrong PIN");
      return;
    }

    const data = await res.json();
    adminToken = data.token;

    document.getElementById("login").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";

    loadOrders();
  } catch (err) {
    alert("Server error");
  }
}

/* ==============================
   LOAD ORDERS
================================ */
async function loadOrders() {
  try {
    const res = await fetch(
      "https://dambog-backend.onrender.com/admin/orders",
      {
        headers: { Authorization: adminToken },
      }
    );

    if (!res.ok) throw new Error("Unauthorized");

    const orders = await res.json();
    cachedOrders = orders;

    const ordersDiv = document.getElementById("orders");
    ordersDiv.innerHTML = "";

    if (orders.length === 0) {
      ordersDiv.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    orders.forEach((o, index) => {
      ordersDiv.innerHTML += `
        <div class="order-card">
          <strong>Order ${index + 1}</strong><br>
          Name: ${o.fullname}<br>
          Email: ${o.email || ""}<br>
          Phone: ${o.phone}<br>
          Address: ${o.address || ""}<br>
          Product: ${o.product}<br>
          Quantity: ${o.quantity}<br>
          Payment: ${o.payment}<br>
          Date: ${new Date(o.created_at).toLocaleString()}
        </div>
      `;
    });
  } catch (err) {
    alert("Failed to load orders");
  }
}

/* ==============================
   DOWNLOAD PDF
================================ */
function downloadPDF() {
  if (cachedOrders.length === 0) {
    alert("No orders available");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text("DAMBOG NIG LTD", 10, y);
  y += 7;

  doc.setFontSize(10);
  doc.text(
    "Nylon Production & Printing Company\n" +
      "Dada Asaila, Obasanjo, Ota, Ogun State, Nigeria",
    10,
    y
  );
  y += 15;

  cachedOrders.forEach((o, index) => {
    if (y > 270) {
      doc.addPage();
      y = 10;
    }

    doc.setFontSize(12);
    doc.text(`Order ${index + 1}`, 10, y);
    y += 6;

    doc.setFontSize(10);
    doc.text(`Full Name: ${o.fullname}`, 10, y); y += 5;
    doc.text(`Email: ${o.email || ""}`, 10, y); y += 5;
    doc.text(`Phone: ${o.phone}`, 10, y); y += 5;
    doc.text(`Address: ${o.address || ""}`, 10, y); y += 5;
    doc.text(`Product: ${o.product}`, 10, y); y += 5;
    doc.text(`Quantity: ${o.quantity}`, 10, y); y += 5;
    doc.text(`Payment: ${o.payment}`, 10, y); y += 5;
    doc.text(
      `Date: ${new Date(o.created_at).toLocaleString()}`,
      10,
      y
    );
    y += 8;

    doc.line(10, y, 200, y);
    y += 6;
  });

  doc.save("dambog-orders.pdf");
}

/* ==============================
   HERO SLIDER
================================ */
let slides = document.querySelectorAll(".hero-slider img");
let current = 0;

function nextSlide() {
  slides[current].classList.remove("active");
  current = (current + 1) % slides.length;
  slides[current].classList.add("active");
}

setInterval(nextSlide, 3000);
