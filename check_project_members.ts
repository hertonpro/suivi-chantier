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

async function checkProjectMembers() {
  const connection = await pool.getConnection();
  try {
    const [members] = await connection.query("SELECT * FROM project_members");
    console.table(members);
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkProjectMembers();
