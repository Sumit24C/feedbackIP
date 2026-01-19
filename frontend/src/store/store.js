import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice.js'
import facultySubjectReducer from './facultySubjectSlice.js'
import studentFormReducer from "./studentForm.js"

const store = configureStore({
    reducer: {
        auth: authReducer,
        facultySubjects: facultySubjectReducer,
        studentForms: studentFormReducer,
    }
});

export default store;