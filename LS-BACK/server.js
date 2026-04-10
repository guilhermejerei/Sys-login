require("dotenv").config();

const nodemailer = require("nodemailer");
const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const rate_limit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const app = express();


const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.on("error", (erro) => {
    console.error("Erro no pool MySQL:", erro);
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const limite = rate_limit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: { erro: "Muitas tentativas. Tente novamente em 10 minutos." }
});

app.use(cookieParser());
app.use(compression());
app.use(helmet());
app.use(express.json());
const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

app.use("/confirmar", limite);
app.use("/login", limite);
app.use("/register", limite);

app.use("/LS-FRONT", express.static(path.join(__dirname, "../LS-FRONT")));

app.get("/", (_req, res) => {
    res.redirect("/LS-FRONT/index.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});

const rotas_auth = require("./routes/auth");
const rotas_senha = require("./routes/senha");
const rotas_usuario = require("./routes/usuario");

app.use("/", rotas_auth(db, transporter));
app.use("/", rotas_senha(db, transporter));
app.use("/", rotas_usuario(db));