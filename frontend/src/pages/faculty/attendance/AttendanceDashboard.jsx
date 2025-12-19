import React, { useEffect, useState } from 'react'
import { useAxiosPrivate } from '@/hooks/useAxiosPrivate'
import AttendanceCard from "@/components/AttendanceCard";
import { extractErrorMsg } from '@/utils/extractErrorMsg';

function AttendanceDashboard() {
    const api = useAxiosPrivate();
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    useEffect(() => {
        ; (async () => {
            try {
                const res = await api.get('/attendance/f/s');
                setAttendanceRecords(res.data.data);
            } catch (error) {
                console.error('viewAttendance :: error :: ', error);
                setErrMsg(extractErrorMsg(error));
            } finally {
                setLoading(false);
            }
        })()
    }, []);

    if (loading)
        return (
            <div className="flex flex-col justify-center items-center gap-4 mt-32">
                <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />
            </div>
        );

    if (errMsg) {
        return <p>{errMsg}</p>
    }

    return (
        <div>
            <div className='flex flex-col items-center p-10'>
                {attendanceRecords.length > 0 &&
                    attendanceRecords.map((attendance) => (
                        <AttendanceCard key={attendance.facultySubject.toString()} attendance={attendance} />
                    ))
                }
            </div>
        </div>
    )
}

export default AttendanceDashboard