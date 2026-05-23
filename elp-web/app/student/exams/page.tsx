"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Exam {
  id: number;
  title: string;
  course_title: string;
  exam_date: string;
  duration_minutes: number;
  score: number | null;
  has_taken: number;
  status: "upcoming" | "active" | "closed";
}

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [passKey, setPassKey] = useState("");
  const [modalError, setModalError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchExams = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/student/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/student/exams", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        router.push("/student/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch upcoming exams");
      }

      const data = await response.json();
      setExams(data);
    } catch (err: any) {
      setError(err.message || "Failed to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    window.addEventListener("sync-data", fetchExams);
    return () => {
      window.removeEventListener("sync-data", fetchExams);
    };
  }, [router]);

  const handleOpenAttendModal = (exam: Exam) => {
    setSelectedExam(exam);
    setPassKey("");
    setModalError("");
  };

  const handleCloseModal = () => {
    setSelectedExam(null);
  };

  const handleVerifyPassKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    setModalError("");
    setVerifying(true);

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/student/exams/attend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          examId: selectedExam.id,
          passKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Passkey verification failed");
      }

      // If success, store temporary session flag and redirect
      sessionStorage.setItem(`exam_access_${selectedExam.id}`, "true");
      router.push(`/student/exams/${selectedExam.id}`);
    } catch (err: any) {
      setModalError(err.message || "Invalid passkey or expired time window.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <span className="w-12 h-12 border-4 border-elp-blue border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      <Sidebar role="student" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Upcoming Exams" />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {error && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-2xl">
                📝
              </div>
              <h3 className="text-xl font-bold">No Exams Scheduled</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-2">
                There are currently no mid-terms, quizzes, or final exams mapped to your registered courses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const examDateStr = new Date(exam.exam_date).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short"
                });

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400">
                          {exam.course_title}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-extrabold text-elp-cyan">
                          {exam.duration_minutes} Mins
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                        {exam.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Scheduled Time: {examDateStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {exam.has_taken ? (
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                            Completed
                          </span>
                          {/* Scores hidden from student view */}
                        </div>
                      ) : exam.status === "active" ? (
                        <button
                          onClick={() => handleOpenAttendModal(exam)}
                          className="bg-elp-blue text-white px-6 py-3 rounded-xl hover:bg-elp-blue/90 font-bold transition shadow-md shadow-elp-blue/15 cursor-pointer"
                        >
                          Attend Exam
                        </button>
                      ) : exam.status === "upcoming" ? (
                        <span className="px-4 py-2 rounded-xl bg-elp-orange/10 text-elp-orange text-sm font-bold border border-elp-orange/20">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-sm font-bold border border-slate-300 dark:border-white/5">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Passkey Verification Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-white/5 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">
              Enter Passkey
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Please enter the unique alphanumeric passkey provided by your instructor or administrator to open <strong>{selectedExam.title}</strong>.
            </p>

            {modalError && (
              <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-3 rounded-xl text-xs font-bold mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleVerifyPassKey} className="space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. EXAMCODE101"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 focus:border-elp-blue p-4 rounded-xl outline-none font-mono text-center tracking-wider text-slate-800 dark:text-white uppercase"
                value={passKey}
                onChange={(e) => setPassKey(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 bg-elp-blue text-white py-3 rounded-xl font-bold hover:bg-elp-blue/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Open Exam"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}