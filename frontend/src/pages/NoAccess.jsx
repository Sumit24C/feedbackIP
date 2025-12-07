import React from 'react'

function NoAccess() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600">You need access</h1>
        <p className="mt-3 text-gray-700">
          Your Google account is not registered in the system.
          Please contact the administrator if you believe this is an error.
        </p>
      </div>
    </div>
  )
}

export default NoAccess