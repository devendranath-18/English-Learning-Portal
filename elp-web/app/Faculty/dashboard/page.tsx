"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Course {
  courseId: number;
  title: string;
  progress: number;
}

interface Student {
  studentId: number;
  name: string;
  email: string;
  courses: Course[];
}

interface ExamResult {
  id: number;
  score: number;
  total_questions: number;
  submitted_at: string;
  exam_title: string;
  student_name: string;
  course_title: string;
}

interface PlatformCourse {
  id: number;
  title: string;
  description: string;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"students" | "results">("students");

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [courses, setCourses] = useState<PlatformCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states: Update progress
  const [editingStudent, setEditingStudent] = useState<{ studentId: number; courseId: number; progress: number } | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/Faculty/login");
      return;
    }

    try {
      // 1. Fetch Students
      const studentRes = await fetch("http://localhost:5000/api/faculty/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studentRes.status === 401 || studentRes.status === 403) {
        localStorage.removeItem("token");
        router.push("/Faculty/login");
        return;
      }
      const studentData = await studentRes.json();
      setStudents(studentData);

      // 2. Fetch Results
      const resultsRes = await fetch("http://localhost:5000/api/faculty/results", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resultsData = await resultsRes.json();
      setResults(resultsData);

      // 3. Fetch Courses
      const coursesRes = await fetch("http://localhost:5000/api/faculty/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();
      setCourses(coursesData);
    } catch (err: any) {
      setError(err.message || "Failed to load faculty metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Handle progress updates
  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setUpdatingProgress(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/faculty/students/${editingStudent.studentId}/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: editingStudent.courseId,
          progressPercentage: editingStudent.progress
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update student progression rate");
      }

      setEditingStudent(null);
      await fetchData(); // Reload list
    } catch (err: any) {
      alert(err.message || "Error updating progress");
    } finally {
      setUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <span className="w-12 h-12 border-4 border-elp-cyan border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      <Sidebar role="faculty" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Faculty Dashboard" />

        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("students")}
            className={`py-4 font-bold text-sm border-b-2 transition cursor-pointer ${
              activeTab === "students" 
                ? "border-elp-cyan text-elp-cyan" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Assigned Students
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`py-4 font-bold text-sm border-b-2 transition cursor-pointer ${
              activeTab === "results" 
                ? "border-elp-cyan text-elp-cyan" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Exam Submissions
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {error && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-2xl text-sm font-semibold mb-8">
              {error}
            </div>
          )}

          {/* Tab 1: Assigned Students list */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold mb-4">Assigned Students</h3>
              {students.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-2xl text-center text-slate-400">
                  No students assigned to your profile. Please contact the administrator.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-white/5">
                          <th className="p-4 pl-6">Student Name</th>
                          <th className="p-4">Email Address</th>
                          <th className="p-4">Courses Enrolled & Progression</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm">
                        {students.map((student) => (
                          <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                            <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-elp-cyan/15 text-elp-cyan font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[150px]">{student.name}</span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-xs">{student.email}</td>
                            <td className="p-4">
                              {student.courses.length > 0 ? (
                                <div className="space-y-3">
                                  {student.courses.map((course) => (
                                    <div key={course.courseId} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                                      <span className="font-semibold text-slate-700 dark:text-slate-350 min-w-[140px] truncate">{course.title}</span>
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-elp-cyan h-full rounded-full" 
                                            style={{ width: `${course.progress || 0}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-elp-cyan font-extrabold">{course.progress || 0}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No courses enrolled</span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              {student.courses.map((course) => (
                                <button
                                  key={course.courseId}
                                  onClick={() => setEditingStudent({
                                    studentId: student.studentId,
                                    courseId: course.courseId,
                                    progress: course.progress
                                  })}
                                  className="text-[10px] font-black text-elp-blue bg-elp-blue/10 hover:bg-elp-blue/20 hover:text-elp-blue px-2.5 py-1.5 rounded-lg transition cursor-pointer ml-2 first:ml-0 inline-block align-middle"
                                >
                                  Update {course.title.split(' ')[0]} Progress
                                </button>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Exam Results */}
          {activeTab === "results" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold mb-4">Student MCQ Exam Submissions</h3>
              {results.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-2xl text-center text-slate-400">
                  No exam submissions logged for your students.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-white/5">
                          <th className="p-4">Student</th>
                          <th className="p-4">Exam Details</th>
                          <th className="p-4">Course</th>
                          <th className="p-4">Marks Awarded</th>
                          <th className="p-4">Date Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm">
                        {results.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                            <td className="p-4 font-bold text-slate-800 dark:text-white">{res.student_name}</td>
                            <td className="p-4 font-semibold">{res.exam_title}</td>
                            <td className="p-4 text-slate-400">{res.course_title}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-elp-blue/10 text-elp-blue font-extrabold">
                                  {res.score} / {res.total_questions}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                  ({res.total_questions > 0 ? Math.round((res.score / res.total_questions) * 100) : 0}%)
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-400">
                              {new Date(res.submitted_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* Edit Student Progress Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-extrabold mb-2">Edit Progress</h3>
            <p className="text-slate-400 text-xs mb-6">
              Enter target completion percentage for the course (0-100).
            </p>

            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <input
                type="number"
                min="0"
                max="100"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-4 rounded-xl outline-none focus:border-elp-cyan text-center font-bold text-2xl"
                value={editingStudent.progress}
                onChange={(e) => setEditingStudent({
                  ...editingStudent,
                  progress: parseInt(e.target.value) || 0
                })}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProgress}
                  className="flex-1 bg-elp-cyan text-slate-950 py-3 rounded-xl font-bold hover:bg-elp-cyan/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingProgress ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
