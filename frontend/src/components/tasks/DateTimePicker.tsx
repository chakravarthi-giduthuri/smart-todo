interface Props {
  date: string | null; time: string | null;
  onDateChange: (d: string) => void; onTimeChange: (t: string) => void;
}
export function DateTimePicker({ date, time, onDateChange, onTimeChange }: Props) {
  return (
    <div className="flex gap-3 py-1">
      <input type="date" value={date ?? ''} onChange={(e) => onDateChange(e.target.value)}
        className="flex-1 glass text-white rounded-xl px-3 h-12 text-sm outline-none focus:border-indigo-500/50 transition-colors cursor-pointer" />
      <input type="time" value={time ?? ''} onChange={(e) => onTimeChange(e.target.value)}
        className="flex-1 glass text-white rounded-xl px-3 h-12 text-sm outline-none focus:border-indigo-500/50 transition-colors cursor-pointer" />
    </div>
  );
}
