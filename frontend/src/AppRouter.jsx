import { Routes, Route } from 'react-router-dom'
import App from './App'
import {
    Home,
    Login,
    Signup,
    UnAuthorized,
    NotFound
} from "../src/pages/index"
import { Authorization, AuthLayout, PersistLogin } from './components/auth'
import { CreateDepartment, AdminDashboard, Department, DepartmentList, UploadFacultySubject } from './pages/admin'
import { AttendanceList, FeedbackForm, FeedbackFormList, StudentDashboard, StudentProfilePage, SubjectAttendance } from './pages/student'
import { FacultyProfilePage, CreateAttendance, ClassAttendance, AttendanceDashboard } from './pages/faculty'
import { AllForms, CreateFeedbackForm, OverallSummary, QuestionSummary, FeedbackResponse } from './pages/forms'
import NoAccess from './pages/NoAccess'

function AppRouter() {
    return (
        <Routes>
            <Route element={<PersistLogin />}>
                {/* Protected Routes */}
                <Route element={<AuthLayout authenticated={true} />}>
                    <Route path="/" element={<App />}>
                        {/* Admin routes */}
                        <Route path="admin" element={<Authorization role="admin" />}>
                            <Route path='dashboard' element={<AdminDashboard />} />
                            <Route path='create-department' element={<CreateDepartment />} />
                            <Route path='department' element={<DepartmentList />} />
                            <Route path='faculty-subject' element={<UploadFacultySubject />} />
                            <Route path='department/:dept_id' element={<Department />} />
                        </Route>

                        {/* Student routes */}
                        <Route path="student" element={<Authorization role="student" />}>
                            <Route path='profile' element={<StudentProfilePage />} />
                            <Route path='dashboard' element={<StudentDashboard />} />
                            <Route path='attendance' element={<AttendanceList />} />
                            <Route path='attendance/:id' element={<SubjectAttendance />} />
                            <Route path="forms" element={<FeedbackFormList />} />
                            <Route path="form/:form_id/:fs_id?" element={<FeedbackForm />} />
                        </Route>

                        {/* Faculty routes */}
                        <Route path="faculty" element={<Authorization role="faculty" />}>
                            <Route path='profile' element={<FacultyProfilePage />} />
                            <Route path="create-form" element={<CreateFeedbackForm />} />
                            <Route path="form/:form_id" element={<CreateFeedbackForm />} />
                            <Route path='feedback/:formType/:form_id' element={<FeedbackResponse />} >
                                <Route index element={<OverallSummary />} />
                                <Route path="subject/:subjectId" element={<QuestionSummary />} />
                            </Route>
                            <Route path="all-forms" element={<AllForms />} />
                            <Route path='view-attendance' element={<AttendanceDashboard />} />
                            <Route path='class-attendance/:id' element={<ClassAttendance />} />
                            <Route path='create-attendance/:id' element={<CreateAttendance />} />
                        </Route>
                        <Route path="unauthorized" element={<UnAuthorized />} />
                    </Route>
                </Route>

                {/* Public Routes */}
                <Route element={<AuthLayout authenticated={false} />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/no-access" element={<NoAccess />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default AppRouter
