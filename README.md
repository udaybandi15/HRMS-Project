# Evallo HRMS - Tutoring Business Automation

A full-stack Human Resource Management System (HRMS) built with **Node.js**, **PostgreSQL**, and **React**. This application handles multi-tenant organization management, employee/team tracking, and maintains a comprehensive audit log of all system activities.

## 🚀 Features

* **Multi-Tenancy:** Organizations are isolated. A user belongs to one specific organization.
* **Authentication:** Secure JWT-based Login and Registration.
* **Employee Management:** Add and view employees.
* **Team Management:** Create teams and view members.
* **Complex Relationships:** Many-to-Many assignment (Assign an Employee to multiple Teams).
* **Audit Trails:** A dedicated "Logs" page that tracks every action (Creation, Assignment, Login) with timestamps.
* **Responsive UI:** A modern, clean interface built with React and CSS Grid.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), CSS3 (Custom Responsive Design), Axios.
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL.
* **ORM:** Sequelize (for SQL management and relations).
* **Security:** bcrypt (Password hashing), jsonwebtoken (JWT).

---

## 📂 Project Structure

```text
hrms-project/
├── hrms-backend/       # Node.js API Server
│   ├── src/
│   │   ├── models/     # Sequelize Schemas (User, Org, Log, etc.)
│   │   ├── index.js    # Main Server & Routes
│   │   └── db.js       # Database Connection
│   └── .env            # Environment Variables (Not committed)
│
└── frontend/           # React UI
    ├── src/
    │   ├── App.jsx     # Main Frontend Logic & Components
    │   └── App.css     # Styling
    └── vite.config.js

⚙️ Setup & Installation
Follow these steps to run the project locally.
Prerequisites:
-Node.js installed (v18+ recommended).
-PostgreSQL installed and running locally.
1. Database SetupOpen your SQL Shell (psql) or pgAdmin and run:SQLCREATE DATABASE hrms_db;
2. Backend Setup
Navigate to the backend folder and install dependencies
--cd hrms-backend
--npm install
Create a .env file in the hrms-backend folder with your credentials
  PORT=5000
  DB_HOST=127.0.0.1
  DB_USER=postgres
  DB_PASS=YOUR_POSTGRES_PASSWORD_HERE
  DB_NAME=hrms_db
  DB_DIALECT=postgres
  JWT_SECRET=supersecretkey123
Start the server:
  -npm start
The terminal should say "Database synced" and "Server running on port 5000".
3. Frontend Setup:
  Open a new terminal, navigate to the frontend folder
  --cd ../frontend
  --npm install
Start the React app:
  --npm run dev
Open your browser to the link provided (usually http://localhost:5173).
