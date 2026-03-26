import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "31.97.118.239",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "project_monitoring",
  password: process.env.DB_PASSWORD || "!6uo8p32SH5Rcq_k",
  database: process.env.DB_NAME || "project_monitoring",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  const connection = await pool.getConnection();
  try {
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100)
      );
    `);

    // Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        owner_id VARCHAR(50),
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Project members (Collaboration)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id VARCHAR(50),
        user_id VARCHAR(50),
        role VARCHAR(20) DEFAULT 'editor',
        PRIMARY KEY (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Steps (scoped to project)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS steps (
        id VARCHAR(50),
        project_id VARCHAR(50),
        label TEXT,
        sort_order INT,
        PRIMARY KEY (id, project_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Tasks (scoped to project)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50),
        project_id VARCHAR(50),
        name TEXT,
        service TEXT,
        level TEXT,
        priority TEXT,
        PRIMARY KEY (id, project_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS task_steps (
        task_id VARCHAR(50),
        project_id VARCHAR(50),
        step_id VARCHAR(50),
        completed TINYINT(1),
        disabled TINYINT(1),
        PRIMARY KEY (task_id, project_id, step_id),
        FOREIGN KEY (task_id, project_id) REFERENCES tasks(id, project_id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS observations (
        id VARCHAR(50) PRIMARY KEY,
        task_id VARCHAR(50),
        project_id VARCHAR(50),
        text TEXT,
        type VARCHAR(20),
        completed TINYINT(1),
        FOREIGN KEY (task_id, project_id) REFERENCES tasks(id, project_id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50),
        date VARCHAR(20),
        type VARCHAR(20),
        category VARCHAR(50),
        amount DOUBLE,
        description TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

  } finally {
    connection.release();
  }
}

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      await pool.query("INSERT INTO users (id, email, password, username) VALUES (?, ?, ?, ?)", [id, email, hashedPassword, username]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      const user = (rows as any)[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json({ user: req.user });
  });

  // --- Project Routes ---
  app.get("/api/projects", authenticate, async (req: any, res) => {
    try {
      console.log('Fetching projects for user ID:', req.user.id);
      const [rows] = await pool.query(
        "SELECT p.*, pm.role FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ?",
        [req.user.id]
      );
      console.log('Projects found for user:', rows);
      res.json(rows);
    } catch (err: any) {
      console.error('Error in /api/projects:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects", authenticate, async (req: any, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { name, description } = req.body;
      const projectId = uuidv4();
      await connection.query("INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)", [projectId, name, description, req.user.id]);
      await connection.query("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')", [projectId, req.user.id]);
      
      // Default steps
      const steps = [
        ['cabling', 'Câblage', 1],
        ['sockets', 'Prises', 2],
        ['wifi', 'WiFi', 3],
        ['connection', 'Racc.', 4],
        ['test', 'Tests', 5]
      ];
      for (const step of steps) {
        await connection.query("INSERT INTO steps (id, project_id, label, sort_order) VALUES (?, ?, ?, ?)", [step[0], projectId, step[1], step[2]]);
      }

      await connection.commit();
      res.json({ id: projectId });
    } catch (err: any) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  app.post("/api/projects/:id/invite", authenticate, async (req: any, res) => {
    try {
      const { email } = req.body;
      const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      const userToInvite = (userRows as any)[0];
      if (!userToInvite) return res.status(404).json({ error: "User not found" });
      
      await pool.query("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'editor')", [req.params.id, userToInvite.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: "User already in project or error" });
    }
  });

  // --- Data Routes (Scoped to Project) ---
  app.get("/api/projects/:projectId/data", authenticate, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      // Verify access
      const [memberRows] = await pool.query("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?", [projectId, req.user.id]);
      if ((memberRows as any).length === 0) return res.status(403).json({ error: "Access denied" });

      const [configRows] = await pool.query("SELECT * FROM projects WHERE id = ?", [projectId]);
      const [stepsRows] = await pool.query("SELECT * FROM steps WHERE project_id = ? ORDER BY sort_order", [projectId]);
      const [tasksRows] = await pool.query("SELECT * FROM tasks WHERE project_id = ?", [projectId]);
      const [transactionsRows] = await pool.query("SELECT * FROM transactions WHERE project_id = ? ORDER BY date DESC", [projectId]);

      const tasks = tasksRows as any[];
      const fullTasks = await Promise.all(tasks.map(async (task) => {
        const [taskStepsRows] = await pool.query("SELECT * FROM task_steps WHERE task_id = ? AND project_id = ?", [task.id, projectId]);
        const [observationsRows] = await pool.query("SELECT * FROM observations WHERE task_id = ? AND project_id = ?", [task.id, projectId]);

        const stepsMap: Record<string, any> = {};
        (taskStepsRows as any[]).forEach(ts => {
          stepsMap[ts.step_id] = { completed: !!ts.completed, disabled: !!ts.disabled };
        });

        return {
          ...task,
          tasks: stepsMap,
          observations: (observationsRows as any[]).map(o => ({ ...o, completed: !!o.completed }))
        };
      }));

      res.json({
        config: { ...(configRows as any)[0], steps: stepsRows },
        tasks: fullTasks,
        transactions: transactionsRows
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:projectId/data", authenticate, async (req: any, res) => {
    const connection = await pool.getConnection();
    try {
      const { projectId } = req.params;
      const { config, tasks } = req.body;

      await connection.beginTransaction();
      
      await connection.query("UPDATE projects SET name = ?, description = ? WHERE id = ?", [config.name, config.description, projectId]);

      await connection.query("DELETE FROM steps WHERE project_id = ?", [projectId]);
      for (let i = 0; i < config.steps.length; i++) {
        const s = config.steps[i];
        await connection.query("INSERT INTO steps (id, project_id, label, sort_order) VALUES (?, ?, ?, ?)", [s.id, projectId, s.label, i]);
      }

      await connection.query("DELETE FROM tasks WHERE project_id = ?", [projectId]);
      // task_steps, observations will be deleted by ON DELETE CASCADE

      for (const task of tasks) {
        await connection.query("INSERT INTO tasks (id, project_id, name, service, level, priority) VALUES (?, ?, ?, ?, ?, ?)", 
          [task.id, projectId, task.name, task.service, task.level, task.priority]);
        
        for (const [stepId, status] of Object.entries(task.tasks) as [string, any][]) {
          await connection.query("INSERT INTO task_steps (task_id, project_id, step_id, completed, disabled) VALUES (?, ?, ?, ?, ?)", 
            [task.id, projectId, stepId, status.completed ? 1 : 0, status.disabled ? 1 : 0]);
        }

        for (const obs of task.observations) {
          await connection.query("INSERT INTO observations (id, task_id, project_id, text, type, completed) VALUES (?, ?, ?, ?, ?, ?)", 
            [uuidv4(), task.id, projectId, obs.text, obs.type, obs.completed ? 1 : 0]);
        }
      }

      await connection.commit();
      res.json({ success: true });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  app.post("/api/projects/:projectId/transactions", authenticate, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { date, type, category, amount, description } = req.body;
      const id = uuidv4();
      await pool.query("INSERT INTO transactions (id, project_id, date, type, category, amount, description) VALUES (?, ?, ?, ?, ?, ?, ?)", 
        [id, projectId, date, type, category, amount, description]);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:projectId/transactions/:id", authenticate, async (req: any, res) => {
    try {
      await pool.query("DELETE FROM transactions WHERE id = ? AND project_id = ?", [req.params.id, req.params.projectId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
