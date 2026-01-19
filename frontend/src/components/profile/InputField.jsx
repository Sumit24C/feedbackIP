import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InputField({ label, type, value, onChange }) {
    return (
        <div className="flex flex-col gap-1">
            <Label className="text-sm">{label}</Label>
            <Input type={type} value={value} onChange={onChange} required />
        </div>
    );
}