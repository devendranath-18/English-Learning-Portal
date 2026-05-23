"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface DashboardStats {
  totalCourses: number;
  totalExams: number;
  progressPercentage: number;
  faculty: {
    name: string;
    email: string;
    designation: string;
  }[] | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/student/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/student/dashboard", {
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
          throw new Error("Failed to fetch dashboard metrics");
        }

        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    window.addEventListener("sync-data", fetchStats);
    return () => {
      window.removeEventListener("sync-data", fetchStats);
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
        <Navbar title="Student Dashboard" />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {error && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Courses Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wider uppercase">
                  Total Enrolled Courses
                </h3>
                <p className="text-4xl font-extrabold text-elp-navy dark:text-white mt-2">
                  {stats?.totalCourses || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-elp-blue/15 text-elp-blue flex items-center justify-center font-bold text-lg">
                C
              </div>
            </div>

            {/* Total Exams Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wider uppercase">
                  Pending/Active Exams
                </h3>
                <p className="text-4xl font-extrabold text-elp-navy dark:text-white mt-2">
                  {stats?.totalExams || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-elp-orange/15 text-elp-orange flex items-center justify-center font-bold text-lg">
                E
              </div>
            </div>

            {/* Progress Percentage Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wider uppercase">
                  Overall Completion Rate
                </h3>
                <p className="text-4xl font-extrabold text-elp-cyan mt-2">
                  {stats?.progressPercentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-elp-cyan/15 text-elp-cyan flex items-center justify-center font-bold text-lg">
                P
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Progress Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6">
                Curriculum Progression
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Syllabus Target Achievement</span>
                    <span className="text-elp-cyan">{stats?.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-elp-blue to-elp-cyan h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats?.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                  Note: Your progression rate represents the weighted average completion of lectures and assignments logged by your instructor. Please connect with your assigned tutor for revisions.
                </p>
              </div>
            </div>

            {/* Assigned Faculty Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6">
                Assigned Instructors
              </h3>

              {stats?.faculty && stats.faculty.length > 0 ? (
                <div className="space-y-4">
                  {stats.faculty.map((tutor, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-white/5">
                      <div className="w-12 h-12 rounded-full bg-elp-navy text-white flex items-center justify-center font-bold">
                        {tutor.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{tutor.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{tutor.designation}</p>
                        <p className="text-xs text-elp-blue mt-1 hover:underline cursor-pointer">{tutor.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold mb-3 text-slate-500">
                    !
                  </div>
                  <p className="font-semibold text-sm">No Faculty Assigned Yet</p>
                  <p className="text-xs max-w-xs mt-1">Please contact your administrator to map your student profile to a course tutor.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}