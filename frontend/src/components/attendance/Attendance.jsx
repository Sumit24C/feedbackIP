import React, { useEffect, useRef, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { toast } from "sonner";

function Attendance({ facultySubjectId }) {
    const api = useAxiosPrivate();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [lastCursor, setLastCursor] = useState(null);
    const hasMoreRef = useRef(true);

    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    const limit = 5;

    const fetchAttendance = async (cursor = "") => {
        if (loading || !hasMoreRef.current) return;

        setLoading(true);
        try {
            const res = await api.get(
                `/attendance/student/${facultySubjectId}?limit=${limit}&cursorDate=${cursor}`
            );

            const { attendance, nextCursor } = res.data.data;

            setRecords(prev => [...prev, ...attendance]);

            if (!nextCursor) {
                hasMoreRef.current = false;
            }

            setLastCursor(nextCursor);
        } catch (error) {
            const msg = extractErrorMsg(error);
            setErrMsg(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setRecords([]);
        setLastCursor(null);
        hasMoreRef.current = true;
        fetchAttendance();
    }, [facultySubjectId]);

    useEffect(() => {
        if (!sentinelRef.current) return;

        observerRef.current = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && lastCursor) {
                    fetchAttendance(lastCursor);
                }
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 1.0,
            }
        );

        observerRef.current.observe(sentinelRef.current);

        return () => observerRef.current?.disconnect();
    }, [lastCursor]);

    if (errMsg && !records.length) {
        return (
            <div className="py-10 text-center text-destructive">
                {errMsg}
            </div>
        );
    }

    return (
        <div className="px-6 py-4 space-y-4">
            {records.map((item, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-muted/40 transition"
                >
                    <div>
                        <p className="text-sm font-medium">
                            {new Date(item.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Attendance Status
                        </p>
                    </div>

                    <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold ${item.isPresent
                            ? "bg-green-100 text-green-700"
                            : "bg-destructive/10 text-destructive"
                            }`}
                    >
                        {item.isPresent ? "Present" : "Absent"}
                    </span>
                </div>
            ))}

            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {loading && (
                    <span className="text-sm text-muted-foreground">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                    </span>
                )}
                {!hasMoreRef.current && (
                    <span className="text-sm text-muted-foreground">
                        End of attendance records
                    </span>
                )}
            </div>
        </div>
    );
}

export default Attendance;
