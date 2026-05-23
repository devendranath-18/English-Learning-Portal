"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Course {
  id: number;
  title: string;
  description: string;
  progress_percentage: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<{ id: number; title: string; file_name: string; uploaded_at: string }[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const handleViewContent = async (course: Course) => {
    setSelectedCourse(course);
    setLoadingMaterials(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/student/courses/${course.id}/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/student/login");
      return;
    }

    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/student/courses", {
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
          throw new Error("Failed to fetch assigned courses");
        }

        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message || "Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    window.addEventListener("sync-data", fetchCourses);
    return () => {
      window.removeEventListener("sync-data", fetchCourses);
    };
  }, [router]);

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
        <Navbar title="My Courses" />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {error && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-2xl">
                📚
              </div>
              <h3 className="text-xl font-bold">No Courses Enrolled</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-2">
                You are currently not registered for any learning tracks. Please contact administration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-elp-blue"></span>
                      <span className="text-xs font-extrabold text-elp-blue uppercase tracking-wider">
                        Syllabus {course.id}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 leading-snug">
                      {course.title}
                    </h3>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {course.description || "No description provided."}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400">Course Progress</span>
                        <span className="text-elp-cyan">{course.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-elp-blue to-elp-cyan h-full rounded-full transition-all duration-300"
                          style={{ width: `${course.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => router.push(`/student/courses/${course.id}/learn`)}
                        className="flex-1 bg-elp-cyan/20 hover:bg-elp-cyan/30 text-slate-800 dark:text-elp-cyan py-2.5 rounded-xl text-xs font-black transition cursor-pointer text-center"
                      >
                        📚 Start Learning
                      </button>
                      <button
                        onClick={() => handleViewContent(course)}
                        className="flex-1 bg-elp-blue/10 hover:bg-elp-blue/20 text-elp-blue dark:text-elp-cyan py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer text-center"
                      >
                        📂 Study Files
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* View Materials Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-200 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Course Content</h3>
                  <p className="text-xs text-slate-400 mt-1">Course: <span className="font-bold text-elp-blue dark:text-elp-cyan">{selectedCourse.title}</span></p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Materials & Notes ({materials.length})</h4>
                
                {loadingMaterials ? (
                  <div className="text-center py-8 text-sm text-slate-400 animate-pulse">Loading study materials...</div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-sm text-slate-400">
                    No learning materials published for this course yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {materials.map(mat => (
                      <div key={mat.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{mat.title}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">{mat.file_name}</p>
                        </div>
                        <a
                          href={mat.file_name.startsWith("http") ? mat.file_name : `#`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-elp-blue/10 hover:bg-elp-blue/20 text-elp-blue dark:text-elp-cyan px-3 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0 cursor-pointer text-center"
                          onClick={(e) => {
                            if (!mat.file_name.startsWith("http")) {
                              e.preventDefault();
                              alert(`This is a local reference file: "${mat.file_name}". Contact your instructor to retrieve it.`);
                            }
                          }}
                        >
                          Open Resource
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}