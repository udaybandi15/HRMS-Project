const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sequelize,
  Organisation,
  User,
  Employee,
  Team,
  Log,
} = require("./models");
const authMiddleware = require("./middleware/authMiddleware");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// --- HELPER: Audit Logger ---
const logAction = async (orgId, userId, action, meta = {}) => {
  try {
    await Log.create({ organisation_id: orgId, user_id: userId, action, meta });
  } catch (e) {
    console.error("Logging failed:", e);
  }
};

// --- ROUTES: AUTH ---

// 1. Register Organisation & Admin
app.post("/api/auth/register", async (req, res) => {
  const { orgName, adminName, email, password } = req.body;
  const t = await sequelize.transaction(); // Start transaction

  try {
    // Create Org
    const org = await Organisation.create(
      { name: orgName },
      { transaction: t }
    );
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create User
    const user = await User.create(
      {
        name: adminName,
        email,
        password_hash: hashedPassword,
        OrganisationId: org.id,
      },
      { transaction: t }
    );

    await t.commit();

    // Log it (outside transaction)
    await logAction(org.id, user.id, "organisation_created", { orgName });

    const token = jwt.sign(
      { userId: user.id, orgId: org.id },
      process.env.JWT_SECRET
    );
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, orgId: user.OrganisationId },
    process.env.JWT_SECRET
  );

  // Log login
  await logAction(user.OrganisationId, user.id, "user_login");

  res.json({ token });
});

// --- ROUTES: EMPLOYEES ---

app.get("/api/employees", authMiddleware, async (req, res) => {
  const employees = await Employee.findAll({
    where: { OrganisationId: req.user.orgId },
    include: Team, // Fetch teams they are in
  });
  res.json(employees);
});

app.post("/api/employees", authMiddleware, async (req, res) => {
  try {
    const emp = await Employee.create({
      ...req.body,
      OrganisationId: req.user.orgId,
    });
    await logAction(req.user.orgId, req.user.userId, "create_employee", {
      empId: emp.id,
      name: emp.first_name,
    });
    res.json(emp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ROUTES: TEAMS ---

app.get("/api/teams", authMiddleware, async (req, res) => {
  const teams = await Team.findAll({
    where: { OrganisationId: req.user.orgId },
    include: Employee,
  });
  res.json(teams);
});

app.post("/api/teams", authMiddleware, async (req, res) => {
  const team = await Team.create({
    ...req.body,
    OrganisationId: req.user.orgId,
  });
  await logAction(req.user.orgId, req.user.userId, "create_team", {
    teamId: team.id,
    name: team.name,
  });
  res.json(team);
});

// --- ROUTES: ASSIGNMENT (Many-to-Many) ---

app.post("/api/teams/assign", authMiddleware, async (req, res) => {
  const { employeeId, teamId } = req.body;

  // Validate ownership
  const emp = await Employee.findOne({
    where: { id: employeeId, OrganisationId: req.user.orgId },
  });
  const team = await Team.findOne({
    where: { id: teamId, OrganisationId: req.user.orgId },
  });

  if (!emp || !team)
    return res
      .status(404)
      .json({ error: "Employee or Team not found in this org" });

  await team.addEmployee(emp); // Sequelize magic method

  await logAction(req.user.orgId, req.user.userId, "assign_employee", {
    employeeId,
    teamId,
  });
  res.json({ message: "Assigned successfully" });
});

// --- ROUTES: LOGS ---

app.get("/api/logs", authMiddleware, async (req, res) => {
  try {
    // Fetch logs for this org, ordered by newest first
    const logs = await Log.findAll({
      where: { organisation_id: req.user.orgId },
      order: [["createdAt", "DESC"]],
      include: { model: User, attributes: ["name"] }, // Show who did it
    });

    console.log("DEBUG: Found these logs:", JSON.stringify(logs, null, 2));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Employee
app.put("/api/employees/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.update(req.body, {
      where: { id, OrganisationId: req.user.orgId },
    });
    await logAction(req.user.orgId, req.user.userId, "update_employee", {
      empId: id,
    });
    res.json({ message: "Updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE Employee
app.delete("/api/employees/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.destroy({
      where: { id, OrganisationId: req.user.orgId },
    });
    await logAction(req.user.orgId, req.user.userId, "delete_employee", {
      empId: id,
    });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ... existing GET and POST routes ...

// DELETE Team
app.delete("/api/teams/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Team.destroy({
      where: { id, OrganisationId: req.user.orgId },
    });
    await logAction(req.user.orgId, req.user.userId, "delete_team", {
      teamId: id,
    });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
