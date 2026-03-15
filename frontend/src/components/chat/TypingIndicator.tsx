export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 animate-fade-in">
      <div className="flex items-center gap-1.5 glass rounded-2xl px-4 py-2">
        <span className="text-xs text-indigo-300 font-medium">Claude is thinking</span>
        <div className="flex gap-1 ml-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
