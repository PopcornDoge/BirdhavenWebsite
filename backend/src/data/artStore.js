import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ART_JSON_PATH = path.join(__dirname, "art.json");

async function readArtFile() {
  try {
    const raw = await fs.readFile(ART_JSON_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeArtFile(data) {
  await fs.writeFile(ART_JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function getAllArt() {
  const art = await readArtFile();
  return art.sort((a, b) => {
    if (a.sortOrder != null && b.sortOrder != null) {
      return a.sortOrder - b.sortOrder;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export async function createArtRecord(record) {
  const art = await readArtFile();
  art.push(record);
  await writeArtFile(art);
  return record;
}

export async function updateArtRecord(id, updates) {
  const art = await readArtFile();
  const index = art.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  art[index] = {
    ...art[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeArtFile(art);
  return art[index];
}

export async function getArtById(id) {
  const art = await readArtFile();
  return art.find((item) => item.id === id) ?? null;
}