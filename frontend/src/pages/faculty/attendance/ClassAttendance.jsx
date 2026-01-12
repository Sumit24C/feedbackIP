import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import AttendanceControls from "@/components/attendance/AttendanceControls";

function ClassAttendance() {
  const api = useAxiosPrivate();
  const { id } = useParams();

  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [attendanceRecord, setAttendanceRecord] = useState([]);
  const [facultySubject, setFacultySubject] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceTime, setAttendanceTime] = useState("");
  const [newAttendance, setNewAttendance] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editableSession, setEditableSession] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);

  const fetchAttendance = async (page) => {
    setAttendanceLoading(true);
    try {
      const res = await api.get(`/attendance/faculty/student/class/${id}?page=${page}&limit=${limit}`);

      const {
        attendance_record,
        totalPages: pages,
        currentPage,
        facultySubject: fs,
      } = res.data.data;
      setAttendanceRecord(attendance_record);
      setTotalPages(pages);
      setFacultySubject(fs);
      const initial = {};
      attendance_record.forEach((s) => {
        initial[s._id] = true;
      });
      setNewAttendance(initial);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    } finally {
      setAttendanceLoading(false);
    }
  }

  const fetchAttendanceSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get(`/attendance/faculty/student/summary/${id}`);
      setAttendanceSummary(res.data.data);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    (async function () {
      await fetchAttendance(page);
    })();
  }, [id, page]);

  useEffect(() => {
    (async () => {
      await fetchAttendanceSummary();
    })();
  }, [id]);

  const attendancePercentMap = useMemo(() => {
    return Object.fromEntries(
      attendanceSummary?.map(s => [s.studentId, s.totalAttendancePercent])
    );
  }, [attendanceSummary]);

  const toggleAttendance = (studentId) => {
    setNewAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const submitAttendance = async () => {
    if (!attendanceTime) return alert("Please select lecture time");

    const payload = {
      createdAt: new Date(
        `${attendanceDate}T${attendanceTime}`
      ).toISOString(),
      attendance: Object.entries(newAttendance).map(
        ([student, isPresent]) => ({
          student,
          isPresent,
        })
      ),
    };

    try {
      setSubmitLoading(true);
      await api.post(`/attendance/faculty/student/${id}`, payload);

      await fetchAttendance(1);
      await fetchAttendanceSummary();
      setIsCreating(false);
      setAttendanceTime("");
    } catch (error) {
      alert(extractErrorMsg(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const latestDates = useMemo(() => {
    if (!attendanceRecord.length) return [];
    return attendanceRecord[0].attendance.map((a) => ({ date: a.date, _id: a._id }));
  }, [attendanceRecord]);

  const studentChunks = useMemo(() => {
    if (attendanceRecord.length < 20) return [attendanceRecord];

    const mid = Math.ceil(attendanceRecord.length / 2);
    return [
      attendanceRecord.slice(0, mid),
      attendanceRecord.slice(mid),
    ];
  }, [attendanceRecord]);

  const handleCreateAttendance = () => {
    setEditableSession(null);
    setEditingSessionId(null);
    setIsCreating(true);
  }

  const startUpdateSession = (sessionId) => {
    setIsCreating(false);
    const session = latestDates.find((s) => s._id === sessionId);
    const studentStates = {}
    attendanceRecord.forEach((student) => {
      const entry = student.attendance.find((a) => a._id === sessionId);
      studentStates[student._id] = entry?.isPresent ?? false;
    })
    setEditableSession({
      _id: sessionId,
      date: session.date,
      students: studentStates
    });
    setEditingSessionId(sessionId);
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("Delete this attendance session?")) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/attendance/faculty/a/${sessionId}`);
      await fetchAttendance(1);
      await fetchAttendanceSummary();
    } catch (error) {
      alert(extractErrorMsg(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!confirm("Update this attendance session?")) return;
    try {
      await api.patch(`/attendance/faculty/a/${editableSession._id}`, {
        createdAt: editableSession.date,
        attendance: Object.entries(editableSession.students).map(
          ([student, isPresent]) => ({
            student,
            isPresent,
          })
        ),
      });

      setEditingSessionId(null);
      setEditableSession(null);
      await fetchAttendance(page);
      await fetchAttendanceSummary();
    } catch (error) {
      alert(extractErrorMsg(error));
    }
  };

  if (attendanceLoading || summaryLoading) {
    return (
      <div className="flex justify-center mt-32">
        <div className="w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (errMsg) {
    return <p className="text-red-500 text-center mt-10">{errMsg}</p>;
  }

  return (
    <div className="h-[calc(100vh-64px)] px-4 py-4 flex flex-col">
      <div className="mb-6 rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {facultySubject.subject}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                Class Attendance
              </span>

              <span className="rounded-full bg-muted px-2 py-0.5">
                {facultySubject.formType === "theory"
                  ? facultySubject?.class_name
                  : facultySubject?.batch_code}
              </span>

              <span className="rounded-full bg-muted px-2 py-0.5">
                {facultySubject?.class_year}
              </span>

              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                {facultySubject.formType}
              </span>
            </div>
          </div>

          <AttendanceControls
            attendanceDate={attendanceDate}
            setAttendanceDate={setAttendanceDate}
            attendanceTime={attendanceTime}
            setAttendanceTime={setAttendanceTime}

            isCreating={isCreating}
            submitLoading={submitLoading}
            editingSessionId={editingSessionId}

            onCreate={handleCreateAttendance}
            onSubmit={submitAttendance}
            onUpdate={handleUpdateSession}
            onCancelCreate={() => setIsCreating(false)}
            onCancelEdit={() => {
              setEditingSessionId(null);
              setEditableSession(null);
            }}

            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <div
          className={`grid h-full min-h-0 gap-4 ${studentChunks.length > 1
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1"
            }`}
        >
          {studentChunks.map((students, idx) => (
            <div key={idx} className="sm:h-full min-h-100 sm:min-h-0">
              <AttendanceTable
                students={students}
                attendancePercentMap={attendancePercentMap}
                isCreating={isCreating}
                attendanceDate={attendanceDate}
                attendanceTime={attendanceTime}
                newAttendance={newAttendance}
                toggleAttendance={toggleAttendance}
                latestDates={latestDates}
                editingSessionId={editingSessionId}
                editableSession={editableSession}
                setEditableSession={setEditableSession}
                startUpdateSession={startUpdateSession}
                handleDeleteSession={handleDeleteSession}
                deleteLoading={deleteLoading}
              />
            </div>
          ))}
        </div>
      </div>

    </div >
  );
}

export default ClassAttendance;
