import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/api/api";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { toast } from "sonner";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import StudentAttendanceTable from "@/components/attendance/StudentAttendanceTable";

function AttendanceList() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/attendance/student");
        setAttendance(res.data.data);
      } catch (error) {
        const msg = extractErrorMsg(error);
        setErrMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!attendance.length) {
      return {
        avg: 0,
        totalSubjects: 0,
        lowCount: 0
      }
    }

    const totalSubjects = attendance?.length;
    const avg =
      attendance.reduce((sum, a) => sum + a.totalPercentage, 0) /
      totalSubjects;

    const lowCount = attendance.filter(
      (a) => a.totalPercentage < 75
    ).length;

    return {
      totalSubjects,
      avg: Math.round(avg),
      lowCount,
    };
  }, [attendance]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-destructive">
        {errMsg}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <AttendanceSummary stats={stats} />

      <StudentAttendanceTable
        attendance={attendance}
        filterType={filterType}
        setFilterType={setFilterType}
      />
    </div>
  );
}

export default AttendanceList;
