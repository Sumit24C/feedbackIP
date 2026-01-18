import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Header from './components/navigation/Header'
import { Toaster } from "sonner"
import MobileBottomNav from "./components/navigation/MobileBottomNav";
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacultySubjects } from './store/facultySubjectSlice';

function App() {

  const dispatch = useDispatch();
  const { lastFetched } = useSelector(
    (state) => state.facultySubjects
  );
  const { userData } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!lastFetched && userData?.role === "faculty") {
      dispatch(fetchFacultySubjects());
    }
  }, [dispatch, lastFetched]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className='pb-16 pt-16 sm:pb-0'>
        <Toaster richColors position="bottom-right" />
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}

export default App
