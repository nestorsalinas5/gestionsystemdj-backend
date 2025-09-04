-- -----------------------------------------------------
-- Tabla: users
-- Almacena las cuentas de los DJs y administradores.
-- -----------------------------------------------------
CREATE TABLE users (
  id TEXT PRIMARY KEY,                      -- Identificador único (UUID)
  username TEXT NOT NULL UNIQUE,            -- Nombre de usuario para el login
  password TEXT NOT NULL,                   -- ¡IMPORTANTE! Siempre guardar la contraseña con HASH, nunca en texto plano.
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')), -- Rol del usuario
  activeUntil TEXT NOT NULL,                -- Fecha de vencimiento de la suscripción (formato ISO 8601)
  isActive BOOLEAN NOT NULL DEFAULT 1,      -- Estado de la cuenta (activada/desactivada por el admin)
  lastPaymentAmount INTEGER,                -- Monto del último pago
  subscriptionTier TEXT                     -- Tipo de plan (Ej: "Mensual", "Anual")
);


-- -----------------------------------------------------
-- Tabla: clients
-- Almacena los clientes, cada uno perteneciente a un DJ.
-- -----------------------------------------------------
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- A qué DJ pertenece este cliente
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE -- Si se borra un usuario, se borran sus clientes.
);


-- -----------------------------------------------------
-- Tabla: events
-- Registra los eventos, vinculados a un DJ y un cliente.
-- -----------------------------------------------------
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- A qué DJ pertenece este evento
  client_id TEXT NOT NULL,                  -- Cliente asociado al evento
  eventName TEXT NOT NULL,
  date TEXT NOT NULL,                       -- Fecha del evento (formato ISO 8601)
  location TEXT,
  incomeCategory TEXT NOT NULL,
  amountCharged INTEGER NOT NULL,           -- Monto cobrado (en Guaraníes, como entero)
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE, -- Si se borra un usuario, se borran sus eventos.
  FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT -- Evita borrar un cliente si tiene eventos.
);


-- -----------------------------------------------------
-- Tabla: expenses
-- Registra los gastos de cada evento.
-- -----------------------------------------------------
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,                   -- Evento al que pertenece el gasto
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,                  -- Monto del gasto (en Guaraníes, como entero)
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE -- Si se borra un evento, se borran sus gastos.
);