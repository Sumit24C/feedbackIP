---

# College Feedback System

A web-based platform to streamline feedback collection from students about faculty, courses, and infrastructure. The system is department-centric and supports automated form creation, responses, and reporting.

---

## **Overview**

The College Feedback System allows administrators and faculty to:

* Create departments and manage students/faculty.
* Define feedback forms (theory, practical, infrastructure).
* Map subjects to faculty and classes.
* Collect structured feedback from student.
* Generate analytics for evaluation and reporting.

---

## **Features**

* Admin panel to manage departments, students, and faculty.
* Dynamic form creation with question templates allow reusability across forms.
* Department-centric feedback forms ensure students see only relevant subjects.
* Subject mapping for faculty per class/section.
* JWT-based authentication and role-based access control.
* Automated password hashing and secure login.
* Continuous feedback form UI for multiple subjects.
* Response storage mapped to question templates for analytics.

---

## **Tech Stack**

* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Authentication:** JWT, bcrypt
* **Frontend:** React.js, TailwindCSS, Axios

---

## **Database Schema**

* **users:** All users (students, faculty, admin).
* **students:** Student-specific info, linked to users.
* **faculty:** Faculty-specific info, linked to users.
* **departments:** Dept info with HOD reference.
* **subject_mapping:** Class, subject, faculty, and type.
* **feedback_forms:** Form info with selected question templates.
* **feedback_responses:** Stores student responses mapped to subjects and questions.

---

## **Setup & Installation**

### Backend

1. **Clone the repository:**

```bash
git clone https://github.com/Sumit24C/feedbackIP
cd feedbackIP/backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file** with required variables:

```
MONGO_URI=your_mongodb_connection
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=86400
CORS_ORIGIN=http://localhost:3000
```

4. **Start the server:**

```bash
npm run dev
```

### Frontend

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser at:

```
http://localhost:5173
```

---

## **Usage Workflow**

1. Admin creates **departments**.
2. Admin uploads **students and faculty** via Excel or manually.
3. Faculty is mapped to **subjects and classes**.
4. Admin/faculty creates **feedback forms** using question templates.
5. Students login and fill feedback forms for all subjects at once.
6. Responses are stored and can be viewed by **faculty/admin**.

---
