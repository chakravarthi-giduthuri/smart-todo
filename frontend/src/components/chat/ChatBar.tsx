import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff, MessageCircle, X } from 'lucide-react';
import { useCreateTask } from '../../hooks/useTasks';
import { useQueryClient } from '@tanstack/react-query';
import { sendConversationMessage } from '../../api/conversation';
import { TypingIndicator } from './TypingIndicator';
import type { ConversationMessage } from '../../types/api';
import type { EnergyLevel } from '../../types/task';

interface Props {
  energyLevel?: EnergyLevel;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

export function ChatBar({ energyLevel, prefill, onPrefillConsumed }: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Auto-fill input from share target
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onPrefillConsumed?.();
      inputRef.current?.focus();
    }
  }, [prefill]);
  const [micError, setMicError] = useState<string | null>(null);
  const [convMode, setConvMode] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [assistantQ, setAssistantQ] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const { mutate: createTask, isPending, error: createError } = useCreateTask();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
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

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false); }

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

  function buildCurrentDate() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const off = -now.getTimezoneOffset();
    const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off)/60))}:${pad(Math.abs(off)%60)}`;
    return `${local}${tz}`;
  }

  async function handleConvSubmit() {
    const trimmed = input.trim();
    if (!trimmed || convLoading) return;
    if (isListening) stopListening();
    setInput('');
    const newMessages: ConversationMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setAssistantQ(null);
    setConvLoading(true);
    try {
      const currentDate = buildCurrentDate();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await sendConversationMessage(newMessages, currentDate, timezone);
      if (result.type === 'question') {
        setAssistantQ(result.content);
        setMessages([...newMessages, { role: 'assistant', content: result.content }]);
      } else {
        // Task created on backend — invalidate
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        setConvMode(false);
        setMessages([]);
        setAssistantQ(null);
      }
    } catch (err) {
      setAssistantQ(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConvLoading(false);
    }
  }

  function handleDirectSubmit() {
    if (isListening) stopListening();
    const trimmed = input.trim();
    if (!trimmed || isPending) return;
    setInput('');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const off = -now.getTimezoneOffset();
    const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off)/60))}:${pad(Math.abs(off)%60)}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    createTask({ raw_input: trimmed, current_date: `${local}${tz}`, timezone, energy_level: energyLevel });
    inputRef.current?.blur();
  }

  function exitConvMode() {
    setConvMode(false);
    setMessages([]);
    setAssistantQ(null);
    setInput('');
  }

  const isWorking = isPending || convLoading;

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-40 pb-safe animate-slide-up">
      {isWorking && !convLoading && (
        <div className="px-4 pb-1"><TypingIndicator /></div>
      )}
      {convLoading && (
        <div className="px-4 pb-1"><TypingIndicator /></div>
      )}
      {createError && (
        <div className="px-4 pb-1 animate-fade-in">
          <p className="text-xs text-rose-400 bg-rose-500/10 rounded-xl px-3 py-2">
            {createError instanceof Error ? createError.message : 'Failed to create task'}
          </p>
        </div>
      )}
      {micError && (
        <div className="px-4 pb-1 animate-fade-in">
          <p className="text-xs text-rose-400 bg-rose-500/10 rounded-xl px-3 py-2">Mic: <span className="font-semibold">{micError}</span></p>
        </div>
      )}

      {/* Conversation question bubble */}
      {convMode && assistantQ && (
        <div className="mx-3 mb-2 px-4 py-2.5 rounded-2xl border animate-fade-in" style={{ background: 'rgba(236,91,19,0.08)', borderColor: 'rgba(236,91,19,0.2)' }}>
          <p className="text-xs text-[#f97316]">{assistantQ}</p>
        </div>
      )}

      <div className="mx-3 glass-strong rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl shadow-black/50 transition-all duration-300 focus-within:border-[#ec5b13]/30 focus-within:shadow-[#ec5b13]/10">
        {/* Conversation mode toggle */}
        <button
          onClick={() => convMode ? exitConvMode() : setConvMode(true)}
          disabled={isWorking}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shrink-0 ${
            convMode ? 'bg-[#ec5b13] text-white shadow-lg shadow-[#ec5b13]/40' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
          title={convMode ? 'Exit conversation mode' : 'Conversation mode'}
        >
          {convMode ? <X size={16} /> : <MessageCircle size={16} />}
        </button>

        {/* Mic */}
        {micSupported && (
          <button
            onClick={toggleMic}
            disabled={isWorking}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (convMode ? handleConvSubmit() : handleDirectSubmit())}
          placeholder={
            convLoading ? 'Thinking...' :
            isListening ? 'Listening...' :
            convMode ? (assistantQ ? 'Reply...' : 'Tell me what you need...') :
            'What do you need to do?'
          }
          disabled={isWorking}
          className={`flex-1 bg-transparent text-white text-[15px] font-medium outline-none py-2 transition-colors duration-200 disabled:opacity-50 ${
            isListening ? 'placeholder-rose-400/60' : convMode ? 'placeholder-orange-400/50' : 'placeholder-white/25'
          }`}
        />

        <button
          onClick={convMode ? handleConvSubmit : handleDirectSubmit}
          disabled={!input.trim() || isWorking}
          className="w-11 h-11 rounded-2xl bg-gradient-accent flex items-center justify-center text-white shadow-lg shadow-[#ec5b13]/30 disabled:opacity-30 active:scale-90 transition-all duration-150 cursor-pointer shrink-0 hover:shadow-xl hover:shadow-[#ec5b13]/40 hover:scale-105"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
