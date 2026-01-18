import { Routes, Route } from 'react-router-dom'
import App from './App'
import {
    Home,
    Login,
    UnAuthorized,
    NotFound,
    RegisterInstitute,
    Contacts
} from "../src/pages/index"
import { Authorization, AuthLayout, PersistLogin } from './components/auth'
import { CreateDepartment, Department, DepartmentList, StudentTab, FacultyTab, SubjectTab, ClassTab, FacultySubjectTab, ElectiveTab } from './pages/admin'
import { AttendanceList, FeedbackForm, FeedbackFormList, StudentProfilePage, SubjectAttendance } from './pages/student'
import { FacultyProfilePage, ClassAttendance, AttendanceDashboard } from './pages/faculty'
import { AllForms, CreateFeedbackForm, OverallSummary, QuestionSummary, FeedbackResponse, WeeklyFeedback, FacultySubjectResponse } from './pages/forms'
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
                            <Route path='create-department' element={<CreateDepartment />} />
                            <Route path='department' element={<DepartmentList />} />
                            <Route path="/admin/department/:dept_id" element={<Department />}>
                                <Route index element={<StudentTab />} />
                                <Route path="faculties" element={<FacultyTab />} />
                                <Route path="subjects" element={<SubjectTab />} />
                                <Route path="classess" element={<ClassTab />} />
                                <Route path='faculty-subjects' element={<FacultySubjectTab />} />
                                <Route path='electives' element={<ElectiveTab />} />
                            </Route>
                        </Route>

                        {/* Student routes */}
                        <Route path="student" element={<Authorization role="student" />}>
                            <Route path='profile' element={<StudentProfilePage />} />
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
                                <Route path="entity/:_id" element={<QuestionSummary />} />
                            </Route>
                            <Route path='weekly-feedback' element={<WeeklyFeedback />} >
                                <Route path="entity/:_id" element={<FacultySubjectResponse />} />
                            </Route>
                            <Route path="all-forms" element={<AllForms />} />
                            <Route path='view-attendance' element={<AttendanceDashboard />} />
                            <Route path='class-attendance/:id' element={<ClassAttendance />} />
                        </Route>
                        <Route path="unauthorized" element={<UnAuthorized />} />
                    </Route>
                </Route>

                {/* Public Routes */}
                <Route element={<AuthLayout authenticated={false} />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<RegisterInstitute />} />
                    <Route path="/no-access" element={<NoAccess />} />
                    <Route path="/contacts" element={<Contacts />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default AppRouter
