import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Header from './components/navigation/Header'
import { Toaster } from "sonner"
import MobileBottomNav from "./components/navigation/MobileBottomNav";

function App() {

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className='pb-16 pt-16 sm:pb-0'>
        <Toaster richColors position="bottom-right" />
        <Outlet />
      </main>
      <MobileBottomNav/>
    </div>
  )
}

export default App
