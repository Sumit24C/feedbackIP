---

# ClassSetu

### Institute-Scale Feedback & Attendance Management System

ClassSetu is a modern, scalable **academic management platform** designed to handle **feedback collection, attendance tracking, and faculty evaluation** across institutes.
It follows a clean **Institute → Department → Class** hierarchy and is built to support real-world academic workflows with strong data integrity.

---

## Overview

ClassSetu enables institutes to:

* Manage institutes, departments, classes, students, and faculty
* Map faculty to subjects, classes, and batches
* Conduct **attendance tracking** (session-based, editable)
* Create and distribute **feedback forms** at class, department, or institute level
* Collect structured responses and generate analytics
* Enforce strict role-based access and data isolation per institute

The system is designed to scale from a **single department** to **multiple institutes** within one deployment.

---

## Core Architecture

```
Institute
 └── Department
      └── Class (Section)
           ├── Students
           ├── Faculty
           └── FacultySubject (Theory / Practical / Tutorial)
```

All critical workflows (attendance, feedback, analytics) are anchored to **FacultySubject**, ensuring consistency across the system.

---

## Key Features

### Institute & Department Management

* Multi-institute support
* Institute-based admin roles
* Email-domain based institute identity
* Safe cascade deletion using MongoDB transactions

### Faculty–Subject Mapping

* Dedicated `FacultySubject` model
* Supports:

  * Theory / Practical / Tutorial
  * Batch-wise allocation
  * Class-wise mapping
* Single source of truth for attendance & feedback

### Feedback System

* Dynamic feedback form creation
* Reusable question templates
* Form targeting:

  * CLASS
  * DEPARTMENT
  * INSTITUTE
* Continuous feedback UI for multiple subjects
* Secure response storage for analytics

### Attendance Management

* Session-based attendance
* Edit & delete past sessions
* Batch-aware attendance
* Automatic attendance percentage calculation
* Pagination support for large classes

### Authentication & Authorization

* JWT-based authentication
* Refresh token support
* Role-based access control
* Institute-level data isolation
* Secure password hashing

### Data Integrity & Safety

* Transaction-based deletes
* No orphaned records
* Strict authorization checks
* Controlled cascading across models

---

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* bcrypt

### Frontend

* React.js
* TailwindCSS
* Axios
* React Hook Form
* Redux Toolkit

---

## Database Models

```
* User – All users (admin, faculty, student)
* OAuth – External authentication provider mappings (Google, etc.)
* Institute – Institute-level identity & configuration
* Department – Belongs to an institute
* Admin – Institute / department scoped admin
* Student – Student profile linked to user
* Faculty – Faculty profile linked to user
* ClassSection – Academic year + section
* Subject – Academic subject metadata
* FacultySubject – Faculty ↔ Subject ↔ Class ↔ Form type mapping
* Form – Feedback form metadata and targeting
* Question – Reusable question templates
* Response – Student feedback responses
* Attendance – Session-based attendance records
```

---

## Setup & Installation

### Backend Setup

```bash
git clone https://github.com/Sumit24C/feedbackIP
cd feedbackIP/backend
npm install
```

Create a `.env` file:

```env
# Server
PORT=8000
NODE_ENV=production

# Database
MONGO_URI=your_mongodb_connection_string

# JWT Authentication
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=86400

# CORS
CORS_ORIGIN=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

```

Start backend:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd feedbackIP/frontend
npm install
npm run dev
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Open browser:

```
http://localhost:5173
```

---

## Usage Workflow

1. **Institute Admin registers institute**
2. Admin creates **departments**
3. Admin uploads **students & faculty** (Excel or manual)
4. Admin creates **classes and batches**
5. Faculty is mapped to **subjects & classes**
6. Faculty manages **attendance**
7. Admin/Faculty creates **feedback forms**
8. Students submit feedback
9. Admin & faculty analyze results

---
