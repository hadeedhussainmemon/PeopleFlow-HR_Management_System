# PeopleFlow HR - Comprehensive Documentation

## 1. Project Overview

PeopleFlow HR is a full-stack Human Resources management application designed to streamline leave requests and employee management. Built with the MERN stack (MongoDB, Express.js, React, Node.js), it provides a modern, role-based interface for employees, managers, and administrators.

The application features a secure authentication system using JSON Web Tokens (JWTs) stored in HttpOnly cookies. The frontend is a responsive single-page application built with Vite and React, styled with Tailwind CSS and the `shadcn/ui` component library. The backend is a robust Node.js and Express server that handles business logic, database interactions, and API requests.

## 2. Tech Stack

-   **Frontend:**
    -   **Framework:** React (with Vite)
    -   **Styling:** Tailwind CSS
    -   **UI Components:** `shadcn/ui`
    -   **State Management:** Zustand (for global auth state), TanStack React Query (for server state)
    -   **Routing:** React Router
    -   **HTTP Client:** Axios
    -   **Date Utility:** `date-fns` & `react-datepicker`

-   **Backend:**
    -   **Framework:** Node.js, Express.js
    -   **Database:** MongoDB with Mongoose ODM
    -   **Authentication:** JSON Web Tokens (JWT)
    -   **Middleware:** `cookie-parser`, `cors`, `bcrypt`

## 3. Core Features

-   **Role-Based Access Control (RBAC):** Three distinct user roles (Employee, Manager, Admin) with granular permissions.
-   **Secure Authentication:** JWT-based authentication with password hashing (`bcrypt`) and secure cookie storage.
-   **Leave Application System:** Employees can apply for sick, casual, or vacation leave.
-   **Smart Business Day Calculation:** Automatically calculates the number of working days to be deducted, excluding weekends and public holidays.
-   **Manager Dashboard:** Managers can view, approve, or reject leave requests from their team members.
-   **Conflict Warning System:** Managers are alerted if a new leave request overlaps with an existing approved leave within the same team.
-   **Admin Panel:** Administrators can add new users and define public holidays for the entire organization.
-   **Modern UI:** A clean, responsive, and consistent user interface built with `shadcn/ui`.

## 4. Application Flow & User Journeys

### a. First-Time Setup & Admin Registration

1.  The database is initially empty. There is no public "Sign Up" button for regular employees.
2.  The first user must be an administrator. They navigate to the `/register` page.
3.  After filling out the registration form, an `admin` account is created. This user can now manage the system.

### b. Login

1.  Any registered user navigates to the `/login` page.
2.  They enter their email and password.
3.  The backend verifies the credentials. If successful, a JWT is generated and sent back to the client in a secure, `HttpOnly` cookie.
4.  The frontend stores user information in a global state (Zustand) and redirects the user to their dashboard.

### c. Role Permissions

-   **Employee:**
    -   Can view their own dashboard with leave balances.
    -   Can apply for leave.
    -   Can view their own leave history.
    -   **Cannot** see other employees' requests or access admin settings.

-   **Manager:**
    -   Has all the permissions of an **Employee**.
    -   Can access the "Team Requests" page to see pending leave requests for users they manage.
    -   Can approve or reject these requests and see conflict warnings.
    -   **Cannot** access admin settings.

-   **Admin:**
    -   Has all the permissions of a **Manager**.
    -   Can access the "Admin Settings" page.
    -   Can create new users of any role (Employee, Manager, Admin).
    -   Can add new public holidays to the system.

### d. Applying for Leave (Employee)

1.  The employee navigates to the "Apply for Leave" page.
2.  They select a leave type, a start date, and an end date using the date picker.
3.  The UI provides a real-time preview of how many *business days* will be deducted.
4.  Upon submission, the backend validates the request against the employee's remaining leave balance.
5.  If valid, a new `LeaveRequest` document is created with a `pending` status.

### e. Managing Leave (Manager)

1.  The manager navigates to the "Team Requests" page.
2.  A table displays all `pending` leave requests from employees who share the same `managerId`.
3.  The manager can click "View Details" on any request.
4.  A dialog opens, showing the leave details and a **conflict warning** if applicable.
5.  The manager can approve or reject the request. If approved, the employee's `leaveBalance` is automatically decremented.

## 5. Database Schema

### User (`User.js`)

```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  department: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leaveBalance: {
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 12 },
    vacation: { type: Number, default: 20 },
  },
});
```

### Leave Request (`LeaveRequest.js`)

```javascript
const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveType: { type: String, enum: ['sick', 'casual', 'vacation'], required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  daysCalculated: { type: Number },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String }
}, { timestamps: true });
```

### Holiday (`Holiday.js`)

```javascript
const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, unique: true }
});
```

## 6. API Endpoints

| Method | Path                  | Required Role | Description                                       |
| :----- | :-------------------- | :------------ | :------------------------------------------------ |
| `POST` | `/api/auth/register`  | Public        | Creates the first admin user.                     |
| `POST` | `/api/auth/login`     | Public        | Authenticates a user and returns a JWT cookie.    |
| `POST` | `/api/auth/logout`    | Authenticated | Clears the JWT cookie to log the user out.        |
| `GET`  | `/api/auth/me`        | Authenticated | Returns the profile of the currently logged-in user. |
| `POST` | `/api/users`          | Admin         | Creates a new user (by an admin).                 |
| `POST` | `/api/leaves/apply`   | Authenticated | Submits a new leave request.                      |
| `GET`  | `/api/leaves/my-leaves` | Authenticated | Fetches all leave requests for the current user.  |
| `GET`  | `/api/leaves/pending` | Manager/Admin | Fetches all pending leave requests for the manager's team. |
| `GET`  | `/api/leaves/approved`| Manager/Admin | Fetches all approved leaves for conflict checking. |
| `PATCH`| `/api/leaves/:id/status`| Manager/Admin | Approves or rejects a leave request.              |
| `POST` | `/api/holidays`       | Admin         | Creates a new public holiday.                     |
| `GET`  | `/api/holidays`       | Authenticated | Fetches all public holidays.                      |


## 7. Getting Started

1.  **Install and Run MongoDB:**
    *   Ensure you have a MongoDB server instance running. You can download it from the [official website](https://www.mongodb.com/try/download/community).

2.  **Configure Environment Variables:**
    *   In the `backend` directory, open the `.env` file.
    *   Verify the `MONGO_URI`. The default `mongodb://127.0.0.1:27017/peopleflow` should work for a standard local installation.

3.  **Install Dependencies:**
    *   Open a terminal in the `backend` directory and run `npm install`.
    *   Open another terminal in the `frontend` directory and run `npm install`.

4.  **Run the Servers:**
    *   In the `backend` terminal, run `npm run dev`. Wait for the "Connected to MongoDB" message.
    *   In the `frontend` terminal, run `npm run dev`.

5.  **Create First User & Use Application:**
    *   Open your browser and navigate to `http://localhost:5173/register` (or the port shown in your frontend terminal).
    *   Create your admin account. You will be logged in automatically.
    *   You can now use the application, create more users via the Admin Settings page, and explore the features.

## 8. Folder Structure

```
.
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── index.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/       # shadcn/ui components
    │   │   └── *.jsx
    │   ├── context/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   └── utils/
    ├── jsconfig.json
    ├── tailwind.config.js
    └── vite.config.js
```