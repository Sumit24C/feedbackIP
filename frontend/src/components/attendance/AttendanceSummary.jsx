function AttendanceSummary({ stats }) {
    if (!stats) return null;

    return (
        <div>
            <div className="rounded-xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                    Average Attendance
                </p>
                <p
                    className={`text-2xl font-semibold ${stats.avg < 75 ? "text-destructive" : "text-primary"
                        }`}
                >
                    {stats.avg}%
                </p>
            </div>
        </div>
    );
}

export default AttendanceSummary;
