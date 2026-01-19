import { Skeleton } from "@/components/ui/skeleton";

export function ProfileField({ label, value, loading = false }) {
  return (
    <div>
      <p className="text-gray-500 text-sm">{label}</p>

      {loading ? (
        <Skeleton className="h-5 w-32 mt-1" />
      ) : (
        <p className="font-semibold">{value || "-"}</p>
      )}
    </div>
  );
}
