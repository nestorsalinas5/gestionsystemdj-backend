// --------- PARTE 1: CONFIGURACIÓN DE LA BASE DE DATOS ---------
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbFile = 'database.db';
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error("Error al abrir la base de datos", err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        // Leemos el archivo .sql y lo ejecutamos para crear las tablas si no existen
        const sqlScript = fs.readFileSync('ai_studio_code.sql').toString(); //
        db.exec(sqlScript, (err) => {
            if (err) {
                // No mostramos error si las tablas ya existen
                if (!err.message.includes("already exists")) {
                    console.error("Error al ejecutar el script SQL:", err.message);
                }
            } else {
                console.log("Tablas creadas o ya existentes.");
            }
        });
    }
});


// --------- PARTE 2: CONFIGURACIÓN DEL SERVIDOR WEB (API) ---------
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Usaremos el puerto 3001 para el backend

// Middlewares: son configuraciones que se ejecutan antes de nuestras rutas
app.use(cors()); // Permite que el frontend se comunique con el backend
app.use(express.json()); // Permite al servidor entender JSON que envía el frontend

// --------- PARTE 3: NUESTRA PRIMERA RUTA DE LA API ---------
// Esta es una ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
    res.json({ message: "¡El backend de GestionSystemDj está funcionando correctamente!" });
});


// --------- PARTE 4: INICIAR EL SERVIDOR ---------
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});