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
        <Card className="h-full py-0 overflow-hidden">
            <CardContent className="p-0 h-full overflow-auto">
                <Table className="min-w-max">
                    <TableHeader className="sticky top-0 z-50 bg-background">
                        <TableRow className="border-b">
                            <TableHead className="sticky top-0 left-0 z-40 bg-background w-[64px] text-center whitespace-nowrap">
                                Roll
                            </TableHead>

                            <TableHead className="sticky top-0 left-[64px] z-40 bg-background w-[72px] text-center whitespace-nowrap">
                                %
                            </TableHead>

                            <TableHead className="sticky top-0 left-[136px] z-40 bg-background w-[150px] whitespace-nowrap hidden sm:table-cell">
                                Name
                            </TableHead>


                            {isCreating && (
                                <TableHead className="sticky top-0 z-50 text-center whitespace-nowrap min-w-[120px] bg-background">
                                    {new Date(`${attendanceDate}T${attendanceTime}`).toLocaleString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    )}
                                </TableHead>
                            )}

                            {latestDates.map((session) => (
                                <TableHead
                                    key={session._id}
                                    className="text-center whitespace-nowrap "
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
                                            className="h-8 text-xs"
                                        />
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-2 font-medium"
                                                >
                                                    {new Date(session.date).toLocaleString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="center">
                                                <DropdownMenuItem
                                                    onClick={() => startUpdateSession(session._id)}
                                                >
                                                    Update
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteSession(session._id)}
                                                >
                                                    {deleteLoading ? "Deleting..." : "Delete"}
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
                                <TableRow key={student._id} className="hover:bg-muted/50">
                                    <TableCell className="sticky left-0 z-20 bg-background w-[64px] text-center font-medium">
                                        {student.roll_no}
                                    </TableCell>


                                    <TableCell
                                        className={`sticky left-[64px] z-20 bg-background w-[72px] text-center font-semibold ${attendancePercentMap?.[student._id] < 75
                                            ? "text-destructive"
                                            : "text-foreground"
                                            }`}
                                    >
                                        {attendancePercentMap?.[student._id] ?? 0}%
                                    </TableCell>


                                    <TableCell
                                        className="sticky left-[136px] z-20 bg-background w-[150px] hidden sm:table-cell truncate"
                                        title={student.fullname}
                                    >
                                        {student.fullname}
                                    </TableCell>


                                    {isCreating && (
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                variant={newAttendance[student._id] ? "default" : "destructive"}
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
                                            <TableCell key={session._id} className="text-center min-w-[120px]">
                                                {isEditing ? (
                                                    <button
                                                        className={`font-semibold px-4 bg-gray-200 hover:cursor-pointer rounded-2xl ${value ? "text-green-600" : "text-red-600"}`}
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
                                                    </button>
                                                ) : value === undefined ? (
                                                    <span className="text-muted-foreground">–</span>
                                                ) : value ? (
                                                    <span className="font-semibold text-green-600">P</span>
                                                ) : (
                                                    <span className="font-semibold text-red-600">A</span>
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
