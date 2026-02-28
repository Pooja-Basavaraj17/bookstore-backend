require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json()); // for JSON (Postman)
app.use(express.urlencoded({ extended: true })); // for HTML form


//const JWT_SECRET = "mysecretkey"; // later move to .env

const JWT_SECRET = process.env.JWT_SECRET;

// ================= ROOT ROUTE (NEW - so browser works) =================
app.get("/", (req, res) => {
  res.send("🚀 Bookstore API is Running");
});


// ================= REGISTER FORM (BROWSER) =================
app.get("/register", (req, res) => {
  res.send(`
    <h2>Register</h2>
    <form method="POST" action="/register">
      <input name="name" placeholder="Name" required /><br/><br/>
      <input name="email" placeholder="Email" required /><br/><br/>
      <input name="password" type="password" placeholder="Password" required /><br/><br/>
      <button type="submit">Register</button>
    </form>
  `);
});


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


// ================= LOGIN FORM (BROWSER) =================
app.get("/login", (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST" action="/login">
      <input name="email" placeholder="Email" required /><br/><br/>
      <input name="password" type="password" placeholder="Password" required /><br/><br/>
      <button type="submit">Login</button>
    </form>
  `);
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
//app.get("/books", authenticateToken, async (req, res) => {
app.get("/books", async (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ================= SIMPLE WEB UI =================
app.get("/ui", async (req, res) => {
  const [books] = await db.query("SELECT * FROM books");

  let html = `
  <html>
  <head>
    <title>Bookstore UI</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      table { border-collapse: collapse; width: 70%; }
      th, td { border: 1px solid #ddd; padding: 8px; }
      th { background: #f2f2f2; }
      button { padding: 5px 10px; }
    </style>
  </head>
  <body>
    <h1>📚 Bookstore Mini Web App</h1>

    <h3>Add Book</h3>
    <form method="POST" action="/ui/add">
      <input name="title" placeholder="Title" required />
      <input name="author" placeholder="Author" required />
      <input name="price" placeholder="Price" required />
      <button type="submit">Add</button>
    </form>

    <h3>Book List</h3>
    <table>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Author</th>
        <th>Price</th>
        <th>Actions</th>
      </tr>
  `;

  books.forEach(book => {
    html += `
      <tr>
        <td>${book.id}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.price}</td>
        <td>
          <form style="display:inline;" method="POST" action="/ui/delete/${book.id}">
            <button type="submit">Delete</button>
          </form>

          <form style="display:inline;" method="GET" action="/ui/edit/${book.id}">
            <button type="submit">Edit</button>
          </form>
        </td>
      </tr>
    `;
  });

  html += `
    </table>
  </body>
  </html>
  `;

  res.send(html);
});

// ===== UI ADD =====
app.post("/ui/add", async (req, res) => {
  const { title, author, price } = req.body;
  await db.query(
    "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
    [title, author, price]
  );
  res.redirect("/ui");
});

// ===== UI DELETE =====
app.post("/ui/delete/:id", async (req, res) => {
  await db.query("DELETE FROM books WHERE id=?", [req.params.id]);
  res.redirect("/ui");
});

// ===== UI EDIT PAGE =====
app.get("/ui/edit/:id", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM books WHERE id=?",
    [req.params.id]
  );
  const book = rows[0];

  res.send(`
    <h2>Edit Book</h2>
    <form method="POST" action="/ui/update/${book.id}">
      <input name="title" value="${book.title}" required />
      <input name="author" value="${book.author}" required />
      <input name="price" value="${book.price}" required />
      <button type="submit">Update</button>
    </form>
    <br>
    <a href="/ui">Back</a>
  `);
});

// ===== UI UPDATE =====
app.post("/ui/update/:id", async (req, res) => {
  const { title, author, price } = req.body;
  await db.query(
    "UPDATE books SET title=?, author=?, price=? WHERE id=?",
    [title, author, price, req.params.id]
  );
  res.redirect("/ui");
});
