import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
  Navigate,
} from "react-router-dom";
import api from "./api";
import "./App.css";

// --- HELPER: Redirect to Dashboard if already logged in ---
// This wrapper checks if a token exists. If yes, it pushes you to Dashboard.
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
};

// --- HELPER: Protect Dashboard ---
// This checks if token is missing. If yes, pushes you to Login.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

// --- 1. Login Component ---
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your HR Portal</p>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Email Address"
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" type="submit">
            Login
          </button>
        </form>
        <div style={{ marginTop: "1rem" }}>
          <Link to="/register">Create new Organisation</Link>
        </div>
      </div>
    </div>
  );
}

// --- 2. Register Component ---
function Register() {
  const [form, setForm] = useState({
    orgName: "",
    adminName: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Setup Organisation</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Create your company workspace
        </p>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="e.g. Acme Corp"
            required
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
          />
          <input
            placeholder="Your Full Name"
            required
            onChange={(e) => setForm({ ...form, adminName: e.target.value })}
          />
          <input
            placeholder="admin@company.com"
            type="email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Password (min 6 chars)"
            type="password"
            required
            minLength={6}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn" type="submit">
            Register & Login
          </button>
        </form>
        <div style={{ marginTop: "1rem" }}>
          <Link to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

// --- 3. Logs Component ---
function Logs() {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/logs")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Failed to fetch logs:", err));
  }, []);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Audit Trail</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </nav>
      <div className="card">
        <h3>System Activity</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid #eee",
                backgroundColor: "#f9fafb",
              }}
            >
              <th style={{ padding: "12px" }}>Action</th>
              <th style={{ padding: "12px" }}>User</th>
              <th style={{ padding: "12px" }}>Details</th>
              <th style={{ padding: "12px" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ padding: "20px", textAlign: "center" }}
                >
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: "#4f46e5",
                    }}
                  >
                    {log.action}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {log.User?.name || "System"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: "0.85em",
                      color: "#555",
                    }}
                  >
                    {log.meta
                      ? JSON.stringify(log.meta)
                          .replace(/[{"}]/g, "")
                          .replace(/:/g, ": ")
                      : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 4. Dashboard Component ---
function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [empForm, setEmpForm] = useState({
    id: null,
    first_name: "",
    email: "",
  });
  const [newTeam, setNewTeam] = useState("");
  const [assignData, setAssignData] = useState({ employeeId: "", teamId: "" });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const empRes = await api.get("/employees");
      const teamRes = await api.get("/teams");
      setEmployees(empRes.data);
      setTeams(teamRes.data);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    if (empForm.id) {
      await api.put(`/employees/${empForm.id}`, empForm);
    } else {
      await api.post("/employees", empForm);
    }
    setEmpForm({ id: null, first_name: "", email: "" });
    fetchData();
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Are you sure?")) return;
    await api.delete(`/employees/${id}`);
    fetchData();
  };

  const editEmployee = (emp) => {
    setEmpForm({ id: emp.id, first_name: emp.first_name, email: emp.email });
  };

  const addTeam = async (e) => {
    e.preventDefault();
    await api.post("/teams", { name: newTeam });
    setNewTeam("");
    fetchData();
  };

  const deleteTeam = async (id) => {
    if (!confirm("Delete this team?")) return;
    await api.delete(`/teams/${id}`);
    fetchData();
  };

  const assignTeam = async (e) => {
    e.preventDefault();
    await api.post("/teams/assign", assignData);
    fetchData();
    alert("Assigned successfully!");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>HRMS Portal</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/logs">
            <button
              className="btn"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              View Logs
            </button>
          </Link>
          <button className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="grid-layout">
        <div className="card">
          <h3>{empForm.id ? "Edit Employee" : "Add Employee"}</h3>
          <form onSubmit={handleEmpSubmit} style={{ marginBottom: "20px" }}>
            <input
              placeholder="Name"
              value={empForm.first_name}
              required
              onChange={(e) =>
                setEmpForm({ ...empForm, first_name: e.target.value })
              }
            />
            <input
              placeholder="Email"
              value={empForm.email}
              required
              onChange={(e) =>
                setEmpForm({ ...empForm, email: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn" type="submit">
                {empForm.id ? "Update" : "+ Add"}
              </button>
              {empForm.id && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setEmpForm({ id: null, first_name: "", email: "" })
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <h4>Employee List</h4>
          <ul>
            {employees.map((e) => (
              <li
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{e.first_name}</strong>
                  <br />
                  <small>{e.email}</small>
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={() => editEmployee(e)}
                    style={{ cursor: "pointer", padding: "5px" }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteEmployee(e.id)}
                    style={{ cursor: "pointer", padding: "5px", color: "red" }}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card">
            <h3>Manage Teams</h3>
            <form onSubmit={addTeam}>
              <input
                placeholder="New Team Name"
                value={newTeam}
                required
                onChange={(e) => setNewTeam(e.target.value)}
              />
              <button className="btn" type="submit">
                + Create Team
              </button>
            </form>
            <ul style={{ marginTop: "20px" }}>
              {teams.map((t) => (
                <li
                  key={t.id}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>
                    {t.name} ({t.Employees ? t.Employees.length : 0})
                  </span>
                  <button
                    onClick={() => deleteTeam(t.id)}
                    style={{
                      cursor: "pointer",
                      color: "red",
                      border: "none",
                      background: "none",
                    }}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="card"
            style={{ borderLeft: "4px solid var(--primary)" }}
          >
            <h3>Assign Members</h3>
            <form onSubmit={assignTeam}>
              <select
                required
                onChange={(e) =>
                  setAssignData({ ...assignData, employeeId: e.target.value })
                }
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name}
                  </option>
                ))}
              </select>
              <select
                required
                onChange={(e) =>
                  setAssignData({ ...assignData, teamId: e.target.value })
                }
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button className="btn" type="submit">
                Assign to Team
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN ROUTING LOGIC ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* If logged in, go to Dashboard. Else show Login */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* If logged in, go to Dashboard. Else show Register */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* If NOT logged in, go to Login. Else show Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
