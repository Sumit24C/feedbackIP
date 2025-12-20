import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function AttendanceList() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const api = useAxiosPrivate();
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

    if (!attendance.length) {
        return (
            <div className="flex justify-center items-center h-[60vh] text-muted-foreground">
                No attendance records found
            </div>
        );
    }

    return (
        <div className="p-6 flex justify-center">
            <div className="w-full max-w-4xl rounded-2xl border border-primary/20 bg-background shadow-sm">

                {/* Header */}
                <div className="px-6 py-4 border-b border-primary/10 bg-primary/5 rounded-t-2xl">
                    <h2 className="text-lg font-semibold text-primary">
                        Attendance Overview
                    </h2>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary/5 hover:bg-primary/5">
                            <TableHead>Subject</TableHead>
                            <TableHead>Faculty</TableHead>
                            <TableHead className="text-center">Type</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Present</TableHead>
                            <TableHead className="text-center">Attendance</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {attendance.map((item, index) => {
                            const isLow = item.totalPercentage < 75;

                            return (
                                <TableRow
                                    key={index}
                                    className="transition hover:bg-primary/5"
                                >
                                    <TableCell className="font-medium">
                                        <Link to={`${item._id}`}>
                                            {item.subject}
                                        </Link>
                                    </TableCell>

                                    <TableCell>{item.faculty}</TableCell>

                                    <TableCell className="text-center">
                                        {item.formType}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        {item.totalClassess}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        {item.totalPresent}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <span
                                            className={`inline-flex items-center justify-center min-w-[64px] px-3 py-1 rounded-full text-sm font-semibold ${isLow
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-primary/10 text-primary"
                                                }`}
                                        >
                                            {item.totalPercentage}%
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default AttendanceList;
