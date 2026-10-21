import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database.json");

export function getDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initial = { users: [] };
      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data || '{"users":[]}');
  } catch (error) {
    console.error("Error reading database:", error);
    return { users: [] };
  }
}

export function saveDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

export function upsertUser(userData) {
  const db = getDatabase();
  const existingIndex = db.users.findIndex((u) => u.id === userData.id);

  if (existingIndex >= 0) {
    db.users[existingIndex] = {
      ...db.users[existingIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };
  } else {
    db.users.push({
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveDatabase(db);
  return userData;
}

export function getUserById(id) {
  const db = getDatabase();
  return db.users.find((u) => u.id === id) || null;
}

