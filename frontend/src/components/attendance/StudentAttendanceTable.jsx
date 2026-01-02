import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function StudentAttendanceTable({
  attendance,
  filterType,
  setFilterType,
}) {
  const filteredAttendance =
    filterType === "all"
      ? attendance
      : attendance.filter(
          (item) => item.formType.toLowerCase() === filterType
        );

  return (
    <div className="rounded-2xl border bg-background shadow-sm">
      <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="max-w-32 w-auto">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="theory">Theory</SelectItem>
            <SelectItem value="practical">Practical</SelectItem>
            <SelectItem value="tutorial">Tutorial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Faculty</TableHead>
            <TableHead className="text-center">Type</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">Present</TableHead>
            <TableHead className="text-center">%</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredAttendance.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                No records for this filter
              </TableCell>
            </TableRow>
          ) : (
            filteredAttendance.map((item) => {
              const isLow = item.totalPercentage < 75;
              const isMedium =
                item.totalPercentage >= 75 &&
                item.totalPercentage < 85;

              return (
                <TableRow
                  key={item._id}
                >
                  <TableCell className="font-medium">
                    <Link
                      to={`${item._id}`}
                      className="hover:underline"
                    >
                      {item.subject}
                    </Link>
                  </TableCell>

                  <TableCell>{item.faculty}</TableCell>

                  <TableCell className="text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted">
                      {item.formType.toUpperCase()}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    {item.totalClassess}
                  </TableCell>

                  <TableCell className="text-center">
                    {item.totalPresent}
                  </TableCell>

                  <TableCell className="text-center">
                    <span
                      className={`inline-flex min-w-[64px] justify-center rounded-full px-3 py-1 text-sm font-semibold ${
                        isLow
                          ? "bg-destructive/10 text-destructive"
                          : isMedium
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {item.totalPercentage}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default StudentAttendanceTable;
