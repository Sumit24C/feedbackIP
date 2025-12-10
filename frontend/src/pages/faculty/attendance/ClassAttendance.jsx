import React, { useEffect, useState } from 'react'
import { useAxiosPrivate } from '@/hooks/useAxiosPrivate'
import AttendanceCard from "@/components/AttendanceCard";
import { extractErrorMsg } from '@/utils/extractErrorMsg';
import { useParams } from 'react-router-dom';

function ClassAttendance() {
  const api = useAxiosPrivate();
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const { id } = useParams();
  useEffect(() => {
    ; (async () => {
      try {
        const res = await api.get(`/attendance/f/s/${id}`);
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
    <div>ClassAttendance</div>
  )
}

export default ClassAttendance