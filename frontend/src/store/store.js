import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice.js'
import facultySubjectReducer from './facultySubjectSlice.js'

const store = configureStore({
    reducer: {
        auth: authReducer,
        facultySubjects: facultySubjectReducer,
    }
});

export default store;