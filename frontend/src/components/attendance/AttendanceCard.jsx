import { Link } from 'react-router-dom'

function AttendanceCard({ attendance }) {
    return (
        <div className={`w-full min-w-60 max-w-lg sm:min-w-lg p-2 sm:p-2.5 m-2 relative font-sans border-2 rounded-2xl shadow-md transition hover:shadow-lg border-gray-300`}>
            <Link to={`/faculty/class-attendance/${attendance.facultySubject.toString()}`}>
                <div className='flex justify-between items-center'>
                    <div className=''>
                        <div className=' text-blue-950 font-bold flex flex-col flex-wrap'>
                            <span>{attendance.department}</span>
                            <span>{attendance.subject}</span>
                        </div>
                        <div className='text-gray-700'>
                            <div className='flex space-x-2 items-center'>
                                <span>{attendance.formType}</span>
                                {attendance.formType === "theory" ? (
                                    <span>{attendance.class_name}</span>
                                ) : (
                                    <span>{attendance.batch_code}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <span className='bg-white border-gray-400 rounded-full shadow-2xl p-4 text-center font-bold border-1'>
                            {attendance.class_year}
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