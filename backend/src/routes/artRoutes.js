import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createArtRecord, getAllArt, updateArtRecord } from "../data/artStore.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads/art");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    const safeBase = slugify(base || "art");
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PNG, JPEG, and WEBP files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", async (_req, res) => {
  try {
    const art = await getAllArt();
    return res.json(art);
  } catch (error) {
    console.error("GET /api/art error:", error);
    return res.status(500).json({ message: "Failed to load art" });
  }
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, alt, published } = req.body;
    const rawTags = req.body.tags;

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    if (!title || !alt) {
      return res.status(400).json({ message: "Title and alt text are required" });
    }

    let tags = [];
    if (rawTags) {
      try {
        const parsed = JSON.parse(rawTags);
        if (Array.isArray(parsed)) {
          tags = parsed.map((tag) => String(tag).trim()).filter(Boolean);
        }
      } catch {
        return res.status(400).json({ message: "Tags must be valid JSON" });
      }
    }

    const id = `${Date.now()}`;
    const imageUrl = `/uploads/art/${req.file.filename}`;

    const record = {
      id,
      title: String(title).trim(),
      alt: String(alt).trim(),
      file: req.file.filename,
      imageUrl,
      tags,
      published: String(published) === "true",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: null,
    };

    const saved = await createArtRecord(record);
    return res.status(201).json(saved);
  } catch (error) {
    console.error("POST /api/art error:", error);
    return res.status(500).json({ message: "Failed to upload art" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, alt, tags, published } = req.body ?? {};

    const updates = {};

    if (typeof title === "string") {
      updates.title = title.trim();
    }

    if (typeof alt === "string") {
      updates.alt = alt.trim();
    }

    if (Array.isArray(tags)) {
      updates.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    if (typeof published === "boolean") {
      updates.published = published;
    }

    const updated = await updateArtRecord(id, updates);

    if (!updated) {
      return res.status(404).json({ message: "Art record not found" });
    }

    return res.json(updated);
  } catch (error) {
    console.error("PATCH /api/art/:id error:", error);
    return res.status(500).json({ message: "Failed to update art" });
  }
});

export default router;