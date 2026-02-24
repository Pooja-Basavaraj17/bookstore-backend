require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

//const JWT_SECRET = "mysecretkey"; // later move to .env

const JWT_SECRET = process.env.JWT_SECRET;


// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
}

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    res.json({ message: "User Registered Successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration Failed" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0)
      return res.status(400).json({ message: "User Not Found" });

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login Failed" });
  }
});

// ================= GET BOOKS (PROTECTED) =================
app.get("/books", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM books");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
});

// ================= ADD BOOK (PROTECTED) =================
app.post("/books", authenticateToken, async (req, res) => {
  const { title, author, price } = req.body;

  try {
    await db.query(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title, author, price]
    );

    res.json({ message: "Book Added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
});

// ================= UPDATE BOOK (PROTECTED) =================
app.put("/books/:id", authenticateToken, async (req, res) => {
  const { title, author, price } = req.body;

  try {
    await db.query(
      "UPDATE books SET title=?, author=?, price=? WHERE id=?",
      [title, author, price, req.params.id]
    );

    res.json({ message: "Book Updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
});

// ================= DELETE BOOK (PROTECTED) =================
app.delete("/books/:id", authenticateToken, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM books WHERE id=?",
      [req.params.id]
    );

    res.json({ message: "Book Deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

