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
import { useEffect, useState } from "react";

function AttendanceTable({
    students,
    attendancePercentMap,
    isCreating,
    attendanceDate,
    attendanceTime,
    newAttendance,
    toggleAttendance,
    latestDates,
    editingSessionId,
    editableSession,
    setEditableSession,
    startUpdateSession,
    handleDeleteSession,
    deleteLoading,
}) {


    return (
        <Card className="h-full p-0">
            <CardContent className="p-0 h-full overflow-y-auto overflow-x-auto">
                <Table className="table-fixed">
                    <TableHeader className="sticky top-0 bg-blue-100 z-10">
                        <TableRow>
                            <TableHead className="w-[70px] text-center">Roll</TableHead>

                            <TableHead className="w-[80px] text-center whitespace-nowrap">
                                %
                            </TableHead>

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
                                            className="h-8 max-w-1/2 sm:max-w-3/4"
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
                            const attendanceMap = Object.fromEntries(
                                student.attendance.map((a) => [a.date, a.isPresent])
                            );

                            return (
                                <TableRow key={student._id}>
                                    <TableCell className="text-center">
                                        {student.roll_no}
                                    </TableCell>

                                    <TableCell className={`text-center font-semibold ${attendancePercentMap?.[student._id] < 75 ? "text-red-500" : "text-black"}`}>
                                        {attendancePercentMap?.[student._id] ?? 0}%
                                    </TableCell>

                                    <TableCell
                                        className="hidden sm:table-cell max-w-[180px] text-center font-medium truncate"
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
                                                onClick={() => toggleAttendance(student._id)}
                                            >
                                                {newAttendance[student._id] ? "P" : "A"}
                                            </Button>
                                        </TableCell>
                                    )}

                                    {latestDates.map((session) => {
                                        const isEditing = editingSessionId === session._id;
                                        const value = isEditing
                                            ? editableSession.students[student._id]
                                            : attendanceMap[session.date];

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
    );
}

export default AttendanceTable;
