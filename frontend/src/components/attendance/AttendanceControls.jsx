import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AttendanceControls({
  attendanceDate,
  setAttendanceDate,
  attendanceTime,
  setAttendanceTime,

  isCreating,
  submitLoading,
  editingSessionId,

  onCreate,
  onSubmit,
  onUpdate,
  onCancelCreate,
  onCancelEdit,

  page,
  totalPages,
  setPage,
}) {
  return (
    <Card className="mb-4 p-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-0 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-[120px] h-9"
          />

          <Input
            type="time"
            step="1800"
            value={attendanceTime}
            onChange={(e) => setAttendanceTime(e.target.value)}
            className="w-[110px] h-9"
          />

          {!isCreating && !editingSessionId && (
            <Button
              size="sm"
              onClick={onCreate}
              disabled={!attendanceTime}
            >
              Create
            </Button>
          )}

          {isCreating && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="success"
                className="bg-black text-white"
                onClick={onSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? "Saving…" : "Save"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onCancelCreate}
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
                className="bg-black text-white"
                onClick={onUpdate}
              >
                Save Update
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onCancelEdit}
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
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AttendanceControls;
