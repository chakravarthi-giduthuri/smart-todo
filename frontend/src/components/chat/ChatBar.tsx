import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff } from 'lucide-react';
import { useCreateTask } from '../../hooks/useTasks';
import { TypingIndicator } from './TypingIndicator';

export function ChatBar() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const { mutate: createTask, isPending } = useCreateTask();
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  const micSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    transcriptRef.current = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: { error: string }) => {
      setIsListening(false);
      setMicError(e.error);
      setTimeout(() => setMicError(null), 4000);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setMicError(null);
    } catch (err) {
      setIsListening(false);
      setMicError(String(err));
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function toggleMic() {
    if (isListening) { stopListening(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError('Microphone access denied');
      setTimeout(() => setMicError(null), 4000);
      return;
    }
    startListening();
  }

  function handleSubmit() {
    if (isListening) stopListening();
    const trimmed = input.trim();
    if (!trimmed || isPending) return;
    setInput('');
    transcriptRef.current = '';
    createTask(trimmed);
    inputRef.current?.blur();
  }

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-40 pb-safe">
      {/* Typing / error indicators above the bar */}
      {isPending && (
        <div className="px-4 pb-1">
          <TypingIndicator />
        </div>
      )}
      {micError && (
        <div className="px-4 pb-1 animate-fade-in">
          <p className="text-xs text-rose-400 bg-rose-500/10 rounded-xl px-3 py-2">
            Mic: <span className="font-semibold">{micError}</span>
          </p>
        </div>
      )}

      {/* Input bar */}
      <div className="mx-3 glass-strong rounded-3xl px-3 py-2 flex items-center gap-2 shadow-2xl shadow-black/50">
        {/* Mic */}
        {micSupported && (
          <button
            onClick={toggleMic}
            disabled={isPending}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={isListening ? 'Listening...' : 'What do you need to do?'}
          disabled={isPending}
          className={`flex-1 bg-transparent text-white text-[15px] font-medium outline-none py-2 transition-colors duration-200 disabled:opacity-50 ${
            isListening ? 'placeholder-rose-400/60' : 'placeholder-white/25'
          }`}
        />

        {/* Send */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isPending}
          className="w-11 h-11 rounded-2xl bg-gradient-accent flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 disabled:opacity-30 active:scale-90 transition-all duration-150 cursor-pointer shrink-0"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
