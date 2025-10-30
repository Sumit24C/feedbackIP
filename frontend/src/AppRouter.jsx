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
import { CreateDepartment, AdminDashboard, Department, DepartmentList } from './pages/admin'
import { FeedbackForm, FeedbackFormList, StudentDashboard, StudentProfilePage } from './pages/student'
import { AllForms, CreateFeedbackForm, CreateQuesTemplate, FacultyDashboard, FacultyProfilePage, OverallSummary, Questions, QuestionSummary } from './pages/faculty'
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
                            <Route path='department/:dept_id' element={<Department />} />
                        </Route>

                        {/* Student routes */}
                        <Route path="student" element={<Authorization role="student" />}>
                            <Route path='profile' element={<StudentProfilePage />} />
                            <Route path='dashboard' element={<StudentDashboard />} />
                            <Route path="forms" element={<FeedbackFormList />} />
                            <Route path="form/:form_id" element={<FeedbackForm />} />
                        </Route>

                        {/* Faculty routes */}
                        <Route path="faculty" element={<Authorization role="faculty" />}>
                            <Route path='profile' element={<FacultyProfilePage />} />
                            <Route path="create-form" element={<CreateFeedbackForm />} />
                            <Route path="form/:form_id" element={<CreateFeedbackForm />} />
                            <Route path='dashboard/:form_id' element={<FacultyDashboard />} >
                                <Route index element={<OverallSummary />} />
                                <Route path="subject/:subjectId" element={<QuestionSummary />} />
                            </Route>
                            <Route path="all-forms" element={<AllForms />} />
                            <Route path="questions" element={<Questions />} />
                            <Route path="create-question-template" element={<CreateQuesTemplate />} />
                        </Route>
                    </Route>
                </Route>

                {/* Public Routes */}
                <Route element={<AuthLayout authenticated={false} />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Route>

                <Route path="/unauthorized" element={<UnAuthorized />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default AppRouter
