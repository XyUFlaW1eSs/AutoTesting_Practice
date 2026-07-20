import { Input } from "./input";
import { Label } from "./label";

interface TimePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export const TimePicker = ({ date, onChange }: TimePickerProps) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!time || !date) return;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    onChange(newDate);
  };

  const timeValue = date ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : "";

  return (
    <div className="flex flex-col gap-2 p-3 border-t border-zinc-800">
      <Label className="text-xs text-zinc-400">选择具体时间</Label>
      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className="bg-zinc-800 border-zinc-700 text-zinc-100"
      />
    </div>
  );
};