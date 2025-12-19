import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ClassAttendance() {
  const api = useAxiosPrivate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
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

  const fetchAttendance = async (page) => {
    try {
      setLoading(true);
      const res = await api.get(
        `/attendance/f/s/${id}?page=${page}&limit=${limit}`
      );

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
        initial[s._id] = false;
      });
      setNewAttendance(initial);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async function () {
      await fetchAttendance(page);
    })();
  }, [id, page]);

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
      await api.post(`/attendance/${id}`, payload);

      setPage(1);
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
      await api.delete(`/attendance/${sessionId}`);
      await fetchAttendance(page);
    } catch (error) {
      alert(extractErrorMsg(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!confirm("Update this attendance session?")) return;
    try {
      await api.patch(`/attendance/${editableSession._id}`, {
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
    } catch (error) {
      alert(extractErrorMsg(error));
    }
  };

  if (loading) {
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
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {facultySubject.subject.name}
        </h2>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Class Attendance
          </span>
          <span>•</span>
          <span>{facultySubject.classSection}</span>
          <span>•</span>
          <span>{facultySubject.classYear}</span>
          <span>•</span>
          <span className="capitalize">{facultySubject.formType}</span>
        </div>
      </div>

      <Card className="mb-4 p-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-0 sm:p-3">
          <div className="flex flex-wrap items-center gap-2 p-0">
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-[120px] h-9 sm:w-4xs"
            />

            <Input
              type="time"
              step="1800"
              value={attendanceTime}
              onChange={(e) => setAttendanceTime(e.target.value)}
              className="w-[110px] h-9 sm:w-4xs"
            />

            <Button
              className="cursor-pointer"
              size="sm"
              onClick={() => handleCreateAttendance()}
              disabled={!attendanceTime}
            >
              Create
            </Button>

            {isCreating && (
              <div className="flex items-center gap-2">

                <Button
                  size="sm"
                  variant="success"
                  className="cursor-pointer bg-black text-white"
                  onClick={submitAttendance}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {editingSessionId && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="success"
                  className="cursor-pointer bg-black text-white"
                  onClick={handleUpdateSession}
                >
                  Save Update
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingSessionId(null);
                    setEditableSession(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
      <div
        className={`grid gap-6 ${studentChunks.length > 1
          ? "grid-cols-1 lg:grid-cols-2"
          : "grid-cols-1"
          }`}
      >
        {studentChunks.map((students, idx) => (
          <Card key={idx} className="p-0">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px] text-center">Roll</TableHead>

                    <TableHead className="max-w-[180px] truncate text-center hidden sm:table-cell">
                      Name
                    </TableHead>


                    {isCreating && (
                      <TableHead className="text-center whitespace-nowrap">
                        {new Date(
                          `${attendanceDate}T${attendanceTime}`
                        ).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableHead>
                    )}

                    {latestDates.map((session) => (
                      <TableHead
                        key={session._id}
                        className="text-center whitespace-nowrap"
                      >
                        {editingSessionId === session._id ? (
                          <Input
                            type="datetime-local"
                            value={editableSession.date.slice(0, 16)}
                            onChange={(e) =>
                              setEditableSession((prev) => ({
                                ...prev,
                                date: new Date(e.target.value).toISOString(),
                              }))
                            }
                            className="h-8 w-2/3"
                          />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="font-medium hover:underline">
                                {new Date(session.date).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="center" className="w-28">
                              <DropdownMenuItem
                                onClick={() => startUpdateSession(session._id)}
                              >
                                Update
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteSession(session._id)}
                              >
                                {deleteLoading ? "deleting.." : "delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableHead>

                    ))}

                  </TableRow>
                </TableHeader>


                <TableBody>
                  {students.map((student) => {
                    const map = Object.fromEntries(
                      student.attendance.map((a) => [a.date, a.isPresent])
                    );

                    return (
                      <TableRow key={student._id}>
                        <TableCell className="text-center">{student.roll_no}</TableCell>
                        <TableCell
                          className="hidden sm:table-cell max-w-[180px] text-center font-medium overflow-hidden whitespace-nowrap text-ellipsis"
                          title={student.fullname}
                        >
                          {student.fullname}
                        </TableCell>

                        {isCreating && (
                          <TableCell className="text-center">
                            <Button
                              className="h-5 w-5"
                              variant={
                                newAttendance[student._id]
                                  ? "success"
                                  : "destructive"
                              }
                              onClick={() =>
                                toggleAttendance(student._id)
                              }
                            >
                              {newAttendance[student._id] ? "P" : "A"}
                            </Button>
                          </TableCell>
                        )}

                        {latestDates.map((session) => {
                          const isEditing = editingSessionId === session._id;
                          const value = isEditing
                            ? editableSession.students[student._id]
                            : map[session.date];

                          return (
                            <TableCell key={session._id} className="text-center">
                              {isEditing ? (
                                <Button
                                  className="h-5 w-5"
                                  variant={value ? "success" : "destructive"}
                                  onClick={() =>
                                    setEditableSession((prev) => ({
                                      ...prev,
                                      students: {
                                        ...prev.students,
                                        [student._id]: !value,
                                      },
                                    }))
                                  }
                                >
                                  {value ? "P" : "A"}
                                </Button>
                              ) : value === undefined ? (
                                <span className="text-muted-foreground">–</span>
                              ) : value ? (
                                <span className="text-green-600 font-semibold">P</span>
                              ) : (
                                <span className="text-red-600 font-semibold">A</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div >
  );
}

export default ClassAttendance;
