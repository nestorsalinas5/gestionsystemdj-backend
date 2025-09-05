// --------- PARTE 1: CONFIGURACIÓN E INICIALIZACIÓN ---------
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');

// Configuración de la Base de Datos
const dbFile = 'database.db';
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos", err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    try {
      const sqlScript = fs.readFileSync('ai_studio_code.sql').toString();
      db.exec(sqlScript, (execErr) => {
        if (execErr && !execErr.message.includes("already exists")) {
          console.error("Error al ejecutar el script SQL:", execErr.message);
          return;
        }

        // Seed: crear usuario admin si no existe (login en texto plano para desbloquear)
        db.run(
          `INSERT OR IGNORE INTO users (id, username, password, role, activeUntil, isActive, lastPaymentAmount, subscriptionTier)
           VALUES ('admin-1','admin','admin123','admin','2099-12-31',1,NULL,'Mensual')`,
          (seedErr) => {
            if (seedErr) {
              console.error("Error al insertar seed de usuario:", seedErr.message);
            } else {
              console.log("Seed de usuario admin listo (o ya existía).");
            }
          }
        );
      });
    } catch (e) {
      console.warn("No se encontró ai_studio_code.sql, continuando sin inicializar script.");
      // Opcional: también puedes sembrar aquí si ya existen tablas en DB
    }
  }
});

// Configuración del Servidor Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
app.use(cors({
  origin: [
    "http://localhost:3000",           // frontend local
    "https://nestorsalinas5.github.io" // frontend en GitHub Pages
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// --------- PARTE 2: RUTAS DE LA API ---------

// --- RUTA RAÍZ ---
app.get("/", (req, res) => {
  res.send("API de GestionSystemDj funcionando 🚀");
});

// --- AUTENTICACIÓN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, user) => {
    if (err) return res.status(500).json({ message: "Error en el servidor." });
    if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos." });
    if (!user.isActive || new Date(user.activeUntil) < new Date()) {
      return res.status(403).json({ message: "Tu cuenta está inactiva o tu suscripción ha expirado." });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });
});

// --- EVENTOS ---
app.get('/api/events', (req, res) => {
  const { userId } = req.query;
  db.all("SELECT * FROM events WHERE user_id = ? ORDER BY date DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener eventos."});
    res.json(rows);
  });
});

app.post('/api/events', (req, res) => {
  const { user_id, client_id, eventName, date, location, incomeCategory, amountCharged, notes, expenses } = req.body;
  const eventSql = `INSERT INTO events (id, user_id, client_id, eventName, date, location, incomeCategory, amountCharged, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const eventId = `evt_${crypto.randomUUID()}`;

  db.run(eventSql, [eventId, user_id, client_id, eventName, date, location, incomeCategory, amountCharged, notes], function(err) {
    if (err) return res.status(500).json({ message: "Error al crear el evento."});

    const expenseSql = `INSERT INTO expenses (id, event_id, category, amount) VALUES (?, ?, ?, ?)`;
    if (expenses && Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach(exp => {
        const expenseId = `exp_${crypto.randomUUID()}`;
        db.run(expenseSql, [expenseId, eventId, exp.category, exp.amount]);
      });
    }
    res.status(201).json({ id: eventId, ...req.body });
  });
});

// --- CLIENTES ---
app.get('/api/clients', (req, res) => {
  const { userId } = req.query;
  db.all("SELECT * FROM clients WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener clientes."});
    res.json(rows);
  });
});

app.post('/api/clients', (req, res) => {
  const { user_id, name, phone, email } = req.body;
  const sql = `INSERT INTO clients (id, user_id, name, phone, email) VALUES (?, ?, ?, ?, ?)`;
  const clientId = `cli_${crypto.randomUUID()}`;
  db.run(sql, [clientId, user_id, name, phone, email], function(err) {
    if (err) return res.status(500).json({ message: "Error al crear el cliente." });
    res.status(201).json({ id: clientId, ...req.body });
  });
});

// --- USUARIOS (ADMIN) ---
app.get('/api/users', (req, res) => {
  db.all("SELECT id, username, role, activeUntil, isActive, lastPaymentAmount, subscriptionTier FROM users WHERE role != 'admin'", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener usuarios." });
    res.json(rows);
  });
});

// --------- PARTE 3: INICIAR EL SERVIDOR ---------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
