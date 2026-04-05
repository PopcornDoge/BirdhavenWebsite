import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import {fileURLToPath} from "url";

import authRoutes from "./routes/authRoutes.js";
import artRoutes from "./routes/artRoutes.js";
import {requireAuth} from "./middleware/requireAuth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

app.get("/api/health", (_req, res) => {
    res.json({ok: true});
});

app.use("/api/auth", authRoutes);
app.use("/api/art", artRoutes);

app.get("/api/admin/test", requireAuth, (req, res) => {
    res.json({
        message: "You are authenticated as admin",
        user: req.user,
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});