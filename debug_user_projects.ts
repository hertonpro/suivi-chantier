import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "31.97.118.239",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "project_monitoring",
  password: process.env.DB_PASSWORD || "!6uo8p32SH5Rcq_k",
  database: process.env.DB_NAME || "project_monitoring",
});

async function checkUserProjects() {
  const connection = await pool.getConnection();
  try {
    const email = "alvantyomihigo@gmail.com";
    console.log(`Checking projects for user: ${email}`);

    const [users] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
    if ((users as any[]).length === 0) {
      console.log("User not found.");
      return;
    }
    const user = (users as any[])[0];
    console.log("User found:", user.id, user.username);

    const [memberships] = await connection.query("SELECT * FROM project_members WHERE user_id = ?", [user.id]);
    console.log("Memberships found:", memberships);

    if ((memberships as any[]).length > 0) {
      const projectIds = (memberships as any[]).map(m => m.project_id);
      const [projects] = await connection.query("SELECT * FROM projects WHERE id IN (?)", [projectIds]);
      console.log("Projects found:", projects);
    } else {
      console.log("No memberships found in project_members table.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkUserProjects();
