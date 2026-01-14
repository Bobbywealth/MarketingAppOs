import { storage } from "./server/storage";

async function checkSara() {
  try {
    const users = await storage.getAllUsers();
    const sara = users.find(u => u.username.toLowerCase().includes('sara'));
    if (sara) {
      console.log("Sara found:", {
        id: sara.id,
        username: sara.username,
        role: sara.role,
        email: sara.email
      });
    } else {
      console.log("Sara not found. All users:", users.map(u => ({ username: u.username, role: u.role })));
    }
  } catch (err) {
    console.error("Error checking sara:", err);
  } finally {
    process.exit();
  }
}

checkSara();
