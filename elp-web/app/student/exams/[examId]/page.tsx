"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface Exam {
  id: number;
  title: string;
  duration_minutes: number;
}

export default function ExamSessionPage({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  
  // Resolve params using React.use() to comply with Next.js 15+ dynamic route specifications
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [warnings, setWarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [error, setError] = useState("");

  // 1. Verify access permissions on load
  useEffect(() => {
    const verified = sessionStorage.getItem(`exam_access_${examId}`);
    if (verified !== "true") {
      router.push("/student/exams");
      return;
    }

    const fetchExamDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`http://localhost:5000/api/student/exams/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to load exam questions.");
        }

        const data = await response.json();
        setExam(data.exam);
        setQuestions(data.questions);
        setTimeLeft(data.exam.duration_minutes * 60);
      } catch (err: any) {
        setError(err.message || "Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId, router]);

  // 2. Timer Countdown & Auto Submission on Timeout
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) {
      if (timeLeft === 0 && !loading && !submitted) {
        // Trigger auto submit
        handleSubmitExam(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, submitted]);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setHasEnteredFullscreen(true);
    } catch (err) {
      alert("Failed to enter fullscreen mode. Please ensure you have granted permission.");
    }
  };

  // 3. Security listeners (Prevent copy-paste, right-click, tab switches, fullscreen exits)
  useEffect(() => {
    if (loading || submitted) return;

    // A. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Right-click is disabled during the exam session.");
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // B. Block keyboard shortcuts (Ctrl+C, Ctrl+V, F12, Inspect Shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
      const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";
      const isInspect = (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i");
      const isF12 = e.key === "F12";

      if (isCopy || isPaste || isInspect || isF12) {
        e.preventDefault();
        alert("Keyboard shortcuts are blocked during this secure exam session.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // C. Detect Window Focus Loss (Tab Switch / App switch)
    const handleBlur = () => {
      setWarnings(prev => {
        const nextWarnings = prev + 1;
        if (nextWarnings >= 3) {
          alert("Maximum warning threshold exceeded (3). Your exam is being submitted automatically.");
          handleSubmitExam(true);
          return nextWarnings;
        } else {
          alert(`Warning: Tab/Window switching detected! (${nextWarnings}/3). Switching tabs again will cause automatic exam submission.`);
          return nextWarnings;
        }
      });
    };
    window.addEventListener("blur", handleBlur);

    // D. Detect Fullscreen Exit
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === null && hasEnteredFullscreen) {
        setHasEnteredFullscreen(false);
        setWarnings(prev => {
          const nextWarnings = prev + 1;
          if (nextWarnings >= 3) {
            alert("Maximum warning threshold exceeded (3). Your exam is being submitted automatically.");
            handleSubmitExam(true);
            return nextWarnings;
          } else {
            alert(`Warning: Fullscreen Mode exited! (${nextWarnings}/3). Exiting fullscreen again will cause automatic exam submission.`);
            return nextWarnings;
          }
        });
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, submitted, answers, hasEnteredFullscreen]);

  const handleSelectOption = (questionId: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmitExam = async (forced = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit exam");
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      setSubmitted(true);
      sessionStorage.removeItem(`exam_access_${examId}`);
    } catch (err: any) {
      alert(err.message || "Error submitting exam. Please contact your administrator.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <span className="w-12 h-12 border-4 border-elp-blue border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white px-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6 text-3xl">
            ✓
          </div>
          <h2 className="text-3xl font-extrabold mb-2">Exam Submitted</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your responses were submitted successfully. Results have been compiled and forwarded to administration.
          </p>

          <button
            onClick={() => router.push("/student/exams")}
            className="w-full bg-elp-blue text-white py-4 rounded-xl font-bold hover:bg-elp-blue/90 transition cursor-pointer"
          >
            Back to Exams List
          </button>
        </div>
      </div>
    );
  }

  if (!hasEnteredFullscreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white px-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-elp-orange/10 text-elp-orange flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Proctor Verification</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            This exam requires **Fullscreen Mode** for integrity and monitoring purposes. Switching tabs, exiting fullscreen, or minimizing the browser will be flagged as an infraction.
          </p>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Exam Rules:</h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Do not press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">Esc</kbd> or close the fullscreen window.</li>
              <li>Warning limit: <span className="text-elp-orange font-bold">3 infractions</span> will trigger automatic submittal.</li>
              <li>Keyboard copy/paste and inspector panels are locked.</li>
            </ul>
          </div>

          {warnings > 0 && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-3 rounded-xl text-xs font-bold animate-bounce">
              Infractions detected: {warnings} of 3
            </div>
          )}

          <button
            onClick={enterFullscreen}
            className="w-full bg-elp-blue text-white py-4 rounded-xl font-extrabold hover:bg-elp-blue/90 transition shadow-lg shadow-elp-blue/15 cursor-pointer animate-pulse"
          >
            {warnings > 0 ? "Resume Exam Session" : "Authorize & Start Exam"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans select-none">
      {/* Sticky Security Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div>
          <span className="text-[10px] text-elp-orange font-bold uppercase tracking-widest block">Secure Proctored Exam</span>
          <h1 className="text-lg font-extrabold text-white">{exam?.title}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-elp-orange/10 border border-elp-orange/20 text-elp-orange text-xs font-bold">
            <span>Warnings: {warnings}/3</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-lg font-bold">
            <svg className="w-5 h-5 text-elp-cyan animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Exam Grid */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-8 overflow-y-auto">
        {questions.map((q, idx) => (
          <div 
            key={q.id}
            className="bg-slate-900/50 border border-white/10 p-8 rounded-3xl shadow-sm space-y-6"
          >
            <div className="flex gap-4">
              <span className="w-8 h-8 rounded-lg bg-elp-blue/15 text-elp-blue font-bold flex items-center justify-center text-sm flex-shrink-0">
                {idx + 1}
              </span>
              <p className="text-lg font-bold text-white leading-relaxed">
                {q.question_text}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
              {[
                { label: "A", text: q.option_a },
                { label: "B", text: q.option_b },
                { label: "C", text: q.option_c },
                { label: "D", text: q.option_d }
              ].map(opt => {
                const isSelected = answers[q.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(q.id, opt.label)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition cursor-pointer ${
                      isSelected 
                        ? "bg-elp-blue/15 border-elp-blue text-white" 
                        : "bg-slate-950/40 border-white/5 hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected ? "bg-elp-blue text-white" : "bg-white/10 text-slate-400"
                    }`}>
                      {opt.label}
                    </span>
                    <span className="font-semibold text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit Actions */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to submit your responses? This action cannot be undone.")) {
                handleSubmitExam();
              }
            }}
            disabled={submitting}
            className="bg-elp-blue text-white px-8 py-4 rounded-2xl hover:bg-elp-blue/90 font-extrabold text-base transition shadow-lg shadow-elp-blue/15 cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Exam Session"}
          </button>
        </div>
      </main>
    </div>
  );
}
