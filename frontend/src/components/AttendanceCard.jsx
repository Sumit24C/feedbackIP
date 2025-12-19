import { Link } from 'react-router-dom'

function AttendanceCard({ attendance }) {
    return (
        <div className="w-full min-w-60 max-w-lg sm:min-w-lg border-blue-200 border-4 rounded-xl shadow-xl bg-gray-50 p-2 sm:p-2.5 relative font-sans m-2">
            <Link to={`/faculty/class-attendance/${attendance.facultySubject.toString()}`}>
                <div className='flex justify-between items-center'>
                    <div className=''>
                        <div className=' text-blue-950 font-bold flex flex-col flex-wrap'>
                            <span>{attendance.department}</span>
                            <span>{attendance.subject}</span>
                        </div>
                        <div className='text-gray-700'>
                            <span>{attendance.formType}</span> . <span>{attendance.classSection}</span>
                        </div>
                    </div>
                    <div>
                        <span className='bg-white border-gray-400 rounded-full shadow-2xl p-4 text-center font-bold border-1'>
                            {attendance.classYear}
                        </span>
                    </div>
                </div>
                <div className='flex space-x-2'>
                    <span className='font-semibold'>class - {attendance.totalClassess}</span>
                    <span className='font-semibold'>percent - {attendance.totalPercentage}</span>
                </div>
            </Link>
        </div>
    )
}

export default AttendanceCard