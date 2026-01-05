import cron from "node-cron";
import { pool } from "./db";
import { storage } from "./storage";
import { UserRole } from "@shared/roles";

let visitsCron: any = null;
let creatorVisitsTableChecked = false;
let creatorVisitsTableExists = false;

async function ensureCreatorVisitsTableExists() {
  if (creatorVisitsTableChecked) return creatorVisitsTableExists;
  creatorVisitsTableChecked = true;
  try {
    const res = await pool.query(`SELECT to_regclass('public.creator_visits') as regclass;`);
    creatorVisitsTableExists = !!res.rows?.[0]?.regclass;
    if (!creatorVisitsTableExists) {
      console.warn(
        "⚠️ Visits automation disabled: creator_visits table missing. Run migrations or restart after schema is applied."
      );
    }
  } catch (e) {
    creatorVisitsTableExists = false;
    console.warn("⚠️ Visits automation disabled: unable to check creator_visits table existence.");
  }
  return creatorVisitsTableExists;
}

async function markOverdueUploadsAndNotify() {
  try {
    const ok = await ensureCreatorVisitsTableExists();
    if (!ok) return;

    // Find visits where upload is overdue (completed + upload not received + due date passed)
    const result = await pool.query(
      `
      SELECT v.id, v.client_id, v.creator_id
      FROM creator_visits v
      WHERE v.status = 'completed'
        AND v.upload_received = false
        AND COALESCE(v.upload_overdue, false) = false
        AND v.upload_due_at IS NOT NULL
        AND v.upload_due_at <= NOW()
      LIMIT 200
      `
    );

    if (result.rows.length === 0) return;

    // Mark overdue
    const ids = result.rows.map((r) => r.id);
    await pool.query(
      `UPDATE creator_visits SET upload_overdue = true WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    // Notify internal roles (ops + creator manager)
    const users = await storage.getUsers();
    const notifyUsers = users.filter(
      (u: any) =>
        u.role === UserRole.ADMIN ||
        u.role === UserRole.MANAGER ||
        u.role === UserRole.CREATOR_MANAGER
    );

    for (const row of result.rows) {
      for (const u of notifyUsers) {
        await storage.createNotification({
          userId: u.id,
          type: "warning",
          title: "⏰ Upload Overdue",
          message: `A visit upload is overdue (visit ${row.id}).`,
          category: "operations",
          actionUrl: `/visits/${row.id}`,
          isRead: false,
        });
      }
    }
  } catch (error) {
    console.error("Upload overdue automation failed:", error);
  }
}

export function startVisitsAutomation() {
  if (visitsCron) {
    visitsCron.stop();
    visitsCron = null;
  }

  // Run hourly
  visitsCron = cron.schedule(
    "0 * * * *",
    () => {
      markOverdueUploadsAndNotify();
    },
    { scheduled: true, timezone: "America/New_York" }
  );

  // Initial run shortly after boot
  setTimeout(() => {
    markOverdueUploadsAndNotify();
  }, 60_000);
}

export function stopVisitsAutomation() {
  if (!visitsCron) return;
  visitsCron.stop();
  visitsCron = null;
}





