import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Header from './components/navigation/Header'
import { Toaster } from "sonner"

function App() {

  return (
    <div className="flex flex-col">
      <Header />
      <main className='mt-16'>
        <Toaster richColors position="bottom-right" />
        <Outlet />
      </main>
    </div>
  )
}

export default App
