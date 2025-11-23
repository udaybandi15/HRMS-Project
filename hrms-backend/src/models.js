const { DataTypes } = require("sequelize");
const sequelize = require("./db");

// --- 1. Organisation ---
const Organisation = sequelize.define("Organisation", {
  name: { type: DataTypes.STRING, allowNull: false },
});

// --- 2. User ---
const User = sequelize.define("User", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
});

// --- 3. Employee ---
const Employee = sequelize.define("Employee", {
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
});

// --- 4. Team ---
const Team = sequelize.define("Team", {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
});

// --- 5. Log ---
const Log = sequelize.define("Log", {
  action: { type: DataTypes.STRING },
  meta: { type: DataTypes.JSONB },
  user_id: { type: DataTypes.INTEGER },
  organisation_id: { type: DataTypes.INTEGER },
});

// --- ASSOCIATIONS (The Important Part) ---

// Organisation Hierarchy
Organisation.hasMany(User);
User.belongsTo(Organisation);
Organisation.hasMany(Employee);
Employee.belongsTo(Organisation);
Organisation.hasMany(Team);
Team.belongsTo(Organisation);

// Many-to-Many (Employee <-> Team)
Employee.belongsToMany(Team, { through: "EmployeeTeams" });
Team.belongsToMany(Employee, { through: "EmployeeTeams" });

// Logs <-> Users (This fixes your error)
User.hasMany(Log, { foreignKey: "user_id" });
Log.belongsTo(User, { foreignKey: "user_id" });

module.exports = { sequelize, Organisation, User, Employee, Team, Log };
