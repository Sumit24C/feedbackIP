import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { toast } from "sonner";
import Attendance from "@/components/attendance/Attendance";

function SubjectAttendancePage() {
  const { id } = useParams();
  const api = useAxiosPrivate();

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/attendance/class/${id}`);
        setMeta(res.data.data);
      } catch (error) {
        const msg = extractErrorMsg(error);
        setErrMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading class details…
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-destructive">
        {errMsg}
      </div>
    );
  }

  return (
    <div className="p-6 flex justify-center min-h-screen">
      <div className="w-full max-w-3xl rounded-xl border bg-background shadow-sm flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{meta.subject}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.formType.toUpperCase()} • {meta.facultyName}
          </p>
        </div>

        <Attendance facultySubjectId={id} />
      </div>
    </div>
  );
}

export default SubjectAttendancePage;
