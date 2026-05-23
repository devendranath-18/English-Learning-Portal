"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface UserProfile {
  user_id: number;
  profile_id: number;
  name: string;
  email: string;
  role: string;
  designation?: string;
  created_at: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
}

interface Exam {
  id: number;
  title: string;
  course_title: string;
  exam_date: string;
  duration_minutes: number;
  pass_key: string;
  question_count: number;
}

interface Analytics {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalExams: number;
  totalSubmissions: number;
}

interface ExamQuestionInput {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string; // 'A', 'B', 'C', 'D'
}

interface CourseEnrollment {
  id: number;
  student_name: string;
  student_email: string;
  course_title: string;
  progress_percentage: number;
}

interface FacultyMapping {
  id: number;
  student_name: string;
  student_email: string;
  faculty_name: string;
  designation: string;
}

interface ExamResult {
  id: number;
  exam_id: number;
  student_name: string;
  student_email: string;
  course_title: string;
  exam_title: string;
  score: number;
  total_questions: number;
  submitted_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "courses" | "mappings" | "exams" | "results">("analytics");

  // Data states
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [facultyList, setFacultyList] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [facultyMappings, setFacultyMappings] = useState<FacultyMapping[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<{ id: number; title: string; file_name: string; uploaded_at: string }[]>([]);
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState("");
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Chapters states
  const [activeModalSubTab, setActiveModalSubTab] = useState<"materials" | "chapters">("materials");
  const [courseChapters, setCourseChapters] = useState<{ id: number; title: string; content: string; sort_order: number; video_url?: string; audio_url?: string }[]>([]);
  const [editingChapter, setEditingChapter] = useState<{ id: number; title: string; content: string; sort_order: number; video_url?: string; audio_url?: string } | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterSortOrder, setChapterSortOrder] = useState("0");
  const [chapterVideoUrl, setChapterVideoUrl] = useState("");
  const [chapterAudioUrl, setChapterAudioUrl] = useState("");
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create User Form states
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("student");
  const [userDesignation, setUserDesignation] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  // Create Course Form states
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseSuccess, setCourseSuccess] = useState("");

  // Assign Mapping Form states
  const [assignType, setAssignType] = useState("course"); // 'course' or 'faculty'
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignTargetId, setAssignTargetId] = useState(""); // courseId or facultyId
  const [assignSuccess, setAssignSuccess] = useState("");

  // Create Exam Form states
  const [examTitle, setExamTitle] = useState("");
  const [examCourseId, setExamCourseId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examDuration, setExamDuration] = useState("");
  const [examPassKey, setExamPassKey] = useState("");
  const [examQuestions, setExamQuestions] = useState<ExamQuestionInput[]>([
    { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }
  ]);
  const [examSuccess, setExamSuccess] = useState("");

  const generatePasskey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 8; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setExamPassKey(key);
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      // 1. Fetch Analytics
      const analRes = await fetch("http://localhost:5000/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analRes.status === 401 || analRes.status === 403) {
        localStorage.removeItem("token");
        router.push("/admin/login");
        return;
      }
      const analData = await analRes.json();
      setAnalytics(analData);

      // 2. Fetch Users
      const usersRes = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setStudentsList(usersData.students);
      setFacultyList(usersData.faculty);
      if (usersData.students.length > 0) setAssignStudentId(usersData.students[0].profile_id.toString());
      if (usersData.faculty.length > 0) setAssignTargetId(usersData.faculty[0].profile_id.toString());

      // 3. Fetch Courses
      const coursesRes = await fetch("http://localhost:5000/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setExamCourseId(coursesData[0].id.toString());
        // Default target mapping selection
        if (assignType === "course") setAssignTargetId(coursesData[0].id.toString());
      }

      // 4. Fetch Exams
      const examsRes = await fetch("http://localhost:5000/api/admin/exams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const examsData = await examsRes.json();
      setExams(examsData);

      // 5. Fetch Mappings
      const mappingsRes = await fetch("http://localhost:5000/api/admin/mappings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mappingsRes.ok) {
        const mappingsData = await mappingsRes.json();
        setCourseEnrollments(mappingsData.courseEnrollments || []);
        setFacultyMappings(mappingsData.facultyMappings || []);
      }

      // 6. Fetch Results Log
      const resultsRes = await fetch("http://localhost:5000/api/admin/results", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setExamResults(resultsData || []);
      }

    } catch (err: any) {
      setError(err.message || "Failed to load admin metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Handle create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccess("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
          designation: userDesignation
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create user");

      setUserSuccess(`Successfully registered ${userRole} account!`);
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserDesignation("");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error creating account");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this account? This will clean up all associated progress and results.")) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete user");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error deleting user");
    }
  };

  // Handle create course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseSuccess("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDesc
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create course");

      setCourseSuccess("Successfully created course syllabus!");
      setCourseTitle("");
      setCourseDesc("");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error creating course");
    }
  };

  // Handle assignment
  const handleAssignMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSuccess("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/admin/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: assignType,
          studentId: assignStudentId,
          targetId: assignTargetId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to assign mapping");

      setAssignSuccess(`Mapping assignment executed successfully!`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error executing assignment mapping");
    }
  };

  const handleDeleteMapping = async (type: "course" | "faculty", id: number) => {
    if (!confirm("Are you sure you want to remove this mapping assignment?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/admin/mappings/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete mapping link");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error deleting mapping");
    }
  };

  const fetchCourseMaterials = async (courseId: number) => {
    setLoadingMaterials(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseMaterials(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleManageCourse = (course: Course) => {
    setManagingCourse(course);
    setNewMaterialTitle("");
    setNewMaterialFile("");
    fetchCourseMaterials(course.id);
    fetchCourseChapters(course.id);
    setActiveModalSubTab("materials");
    setEditingChapter(null);
    setChapterTitle("");
    setChapterContent("");
    setChapterSortOrder("0");
    setChapterVideoUrl("");
    setChapterAudioUrl("");
  };

  const fetchCourseChapters = async (courseId: number) => {
    setLoadingChapters(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}/chapters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseChapters(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCourse || !chapterTitle || !chapterContent) return;
    const token = localStorage.getItem("token");
    setSavingChapter(true);
    try {
      const method = editingChapter ? "PUT" : "POST";
      const url = editingChapter 
        ? `http://localhost:5000/api/admin/chapters/${editingChapter.id}`
        : `http://localhost:5000/api/admin/courses/${managingCourse.id}/chapters`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: chapterTitle,
          content: chapterContent,
          sortOrder: parseInt(chapterSortOrder) || 0,
          videoUrl: chapterVideoUrl,
          audioUrl: chapterAudioUrl
        })
      });

      if (res.ok) {
        setChapterTitle("");
        setChapterContent("");
        setChapterSortOrder("0");
        setChapterVideoUrl("");
        setChapterAudioUrl("");
        setEditingChapter(null);
        fetchCourseChapters(managingCourse.id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save chapter");
      }
    } catch (err) {
      alert("Error saving chapter");
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm("Are you sure you want to delete this chapter? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/chapters/${chapterId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (managingCourse) fetchCourseChapters(managingCourse.id);
      } else {
        alert("Failed to delete chapter");
      }
    } catch (err) {
      alert("Error deleting chapter");
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCourse || !newMaterialTitle || !newMaterialFile) return;
    const token = localStorage.getItem("token");
    setAddingMaterial(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${managingCourse.id}/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newMaterialTitle,
          fileName: newMaterialFile
        })
      });
      if (res.ok) {
        setNewMaterialTitle("");
        setNewMaterialFile("");
        fetchCourseMaterials(managingCourse.id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add material");
      }
    } catch (err) {
      alert("Error adding course material");
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this course content?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/materials/${materialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (managingCourse) fetchCourseMaterials(managingCourse.id);
      } else {
        alert("Failed to delete material");
      }
    } catch (err) {
      alert("Error deleting material");
    }
  };

  const handleDownloadExcel = () => {
    const targetResults = selectedExamFilter === "all"
      ? examResults
      : examResults.filter(r => r.exam_id.toString() === selectedExamFilter);

    const headers = ["Student Name", "Student Email", "Course Track", "Exam Title", "Score Obtained", "Total Questions", "Submission Date"];
    const rows = targetResults.map(res => [
      res.student_name,
      res.student_email,
      res.course_title,
      res.exam_title,
      res.score,
      res.total_questions,
      new Date(res.submitted_at).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_results_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const targetResults = selectedExamFilter === "all"
      ? examResults
      : examResults.filter(r => r.exam_id.toString() === selectedExamFilter);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the report.");
      return;
    }

    const tableRows = targetResults.map(res => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${res.student_name}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${res.student_email}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${res.course_title}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${res.exam_title}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${res.score} / ${res.total_questions}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(res.submitted_at).toLocaleString()}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Examination Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 40px; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #0f172a; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .header-table { width: 100%; margin-bottom: 20px; border: none; }
            .header-table td { border: none; padding: 0; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1>Academic Examination Report</h1>
                <p>Generated on ${new Date().toLocaleString()} | Administrator Resource</p>
              </td>
              <td style="text-align: right; font-weight: bold; color: #ef4444; font-size: 14px;">
                English Learning Portal
              </td>
            </tr>
          </table>
          
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Course Syllabus</th>
                <th>Exam Name</th>
                <th style="text-align: center;">Marks Obtained</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align:center;">No results logged in system.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            © ${new Date().getFullYear()} English Learning Portal. Confidential - Internal Staff Use Only.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Manage exam question arrays
  const handleAddQuestionField = () => {
    setExamQuestions(prev => [
      ...prev,
      { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }
    ]);
  };

  const handleUpdateQuestionField = (idx: number, field: keyof ExamQuestionInput, value: string) => {
    setExamQuestions(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
      return updated;
    });
  };

  const handleRemoveQuestionField = (idx: number) => {
    if (examQuestions.length <= 1) return;
    setExamQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle create exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamSuccess("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: examTitle,
          courseId: examCourseId,
          examDate: examDate,
          durationMinutes: parseInt(examDuration) || 30,
          passKey: examPassKey,
          questions: examQuestions
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create exam");

      setExamSuccess("Syllabus MCQ exam and questions created successfully!");
      setExamTitle("");
      setExamDate("");
      setExamDuration("");
      setExamPassKey("");
      setExamQuestions([{ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }]);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error creating exam");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <span className="w-12 h-12 border-4 border-elp-red border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Admin Console" />

        {/* Tab Headers */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-8 flex gap-8 overflow-x-auto">
          {[
            { id: "analytics", label: "Analytics" },
            { id: "users", label: "Accounts" },
            { id: "courses", label: "Courses" },
            { id: "mappings", label: "Assignments" },
            { id: "exams", label: "MCQ Exams" },
            { id: "results", label: "Results Log" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // Reset form outputs
                setUserSuccess("");
                setCourseSuccess("");
                setAssignSuccess("");
                setExamSuccess("");
              }}
              className={`py-4 font-bold text-sm border-b-2 transition cursor-pointer flex-shrink-0 ${
                activeTab === tab.id 
                  ? "border-elp-red text-elp-red" 
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {error && (
            <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-2xl text-sm font-semibold mb-8">
              {error}
            </div>
          )}

          {/* TAB 1: Analytics & Metrics */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              <h3 className="text-xl font-extrabold">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Total Registered Students", val: analytics?.totalStudents || 0, color: "text-elp-cyan", icon: "S" },
                  { title: "Total Faculty Members", val: analytics?.totalFaculty || 0, color: "text-elp-blue", icon: "F" },
                  { title: "Total Syllabus Courses", val: analytics?.totalCourses || 0, color: "text-elp-navy", icon: "C" },
                  { title: "Total MCQ Exam Sessions", val: analytics?.totalExams || 0, color: "text-elp-orange", icon: "E" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.title}</h4>
                      <p className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.val}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-slate-500">
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm space-y-6">
                <h4 className="font-extrabold text-lg">Submissions Log</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Vel Tech currently records a total of <strong>{analytics?.totalSubmissions || 0} exam submissions</strong> completed by students. Database transaction locks, secure hashing algorithms, and proctor modules are running continuously to protect curriculum metrics.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Accounts Management */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form creation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-1">
                <h3 className="text-lg font-extrabold">Register Account</h3>
                {userSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-xl text-xs font-bold">
                    {userSuccess}
                  </div>
                )}
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm font-semibold"
                      value={userRole}
                      onChange={(e) => {
                        setUserRole(e.target.value);
                        setUserDesignation("");
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jack Sparrow"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jack@elp.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                    />
                  </div>
                  {userRole === "faculty" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Professor"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                        value={userDesignation}
                        onChange={(e) => setUserDesignation(e.target.value)}
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-elp-red text-white py-3 rounded-xl font-bold hover:bg-elp-red/90 transition shadow-lg shadow-elp-red/10 cursor-pointer"
                  >
                    Register User
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="space-y-6 lg:col-span-2">
                <h3 className="text-lg font-extrabold">Registered Users</h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm max-h-[500px] overflow-y-auto space-y-6">
                  {/* Faculty list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Instructors ({facultyList.length})</h4>
                    <div className="space-y-2">
                      {facultyList.map(fac => (
                        <div key={fac.user_id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                          <div>
                            <p className="text-sm font-bold">{fac.name}</p>
                            <p className="text-xs text-slate-400">{fac.email} • <span className="font-semibold text-elp-cyan">{fac.designation}</span></p>
                          </div>
                          <button
                            onClick={() => handleDeleteUser(fac.user_id)}
                            className="text-xs font-bold text-elp-red hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Student list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Students ({studentsList.length})</h4>
                    <div className="space-y-2">
                      {studentsList.map(stud => (
                        <div key={stud.user_id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                          <div>
                            <p className="text-sm font-bold">{stud.name}</p>
                            <p className="text-xs text-slate-400">{stud.email}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteUser(stud.user_id)}
                            className="text-xs font-bold text-elp-red hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Course Management */}
          {activeTab === "courses" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form creation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-1">
                <h3 className="text-lg font-extrabold">Create Course</h3>
                {courseSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-xl text-xs font-bold">
                    {courseSuccess}
                  </div>
                )}
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Course Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Advanced TOEFL Writing"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      rows={4}
                      placeholder="e.g. Course focusing on grammar rules and sentence structures required for written exams."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-elp-red text-white py-3 rounded-xl font-bold hover:bg-elp-red/90 transition shadow-lg shadow-elp-red/10 cursor-pointer"
                  >
                    Add Course
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="space-y-6 lg:col-span-2">
                <h3 className="text-lg font-extrabold">Active Course Tracks</h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
                  {courses.map(course => (
                    <div key={course.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">{course.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{course.description || "No description logged."}</p>
                      </div>
                      <button
                        onClick={() => handleManageCourse(course)}
                        className="bg-elp-blue/15 hover:bg-elp-blue/25 text-elp-blue dark:text-elp-cyan px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer animate-hover"
                      >
                        Manage Content
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Mappings & Mapped Assignments */}
          {activeTab === "mappings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form creation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-1">
                <div>
                  <h3 className="text-lg font-extrabold">Assign Mapping</h3>
                  <p className="text-slate-400 text-xs mt-1">Enroll a student in a course syllabus, or map them to an instructor.</p>
                </div>

                {assignSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-xl text-xs font-bold">
                    {assignSuccess}
                  </div>
                )}

                <form onSubmit={handleAssignMapping} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mapping Type</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm font-semibold"
                      value={assignType}
                      onChange={(e) => {
                        setAssignType(e.target.value);
                        // Reset target selections depending on dropdown
                        if (e.target.value === "course" && courses.length > 0) setAssignTargetId(courses[0].id.toString());
                        if (e.target.value === "faculty" && facultyList.length > 0) setAssignTargetId(facultyList[0].profile_id.toString());
                      }}
                    >
                      <option value="course">Enroll Student in Course</option>
                      <option value="faculty">Assign Student to Faculty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Student</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm font-semibold"
                      value={assignStudentId}
                      onChange={(e) => setAssignStudentId(e.target.value)}
                    >
                      {studentsList.map(st => (
                        <option key={st.profile_id} value={st.profile_id}>{st.name} ({st.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {assignType === "course" ? "Select Target Course" : "Select Target Instructor"}
                    </label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm font-semibold"
                      value={assignTargetId}
                      onChange={(e) => setAssignTargetId(e.target.value)}
                    >
                      {assignType === "course" 
                        ? courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                        : facultyList.map(f => <option key={f.profile_id} value={f.profile_id}>{f.name} ({f.designation})</option>)
                      }
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-elp-red text-white py-3.5 rounded-xl font-bold hover:bg-elp-red/90 transition shadow-lg shadow-elp-red/10 cursor-pointer"
                  >
                    Create Assignment Link
                  </button>
                </form>
              </div>

              {/* Lists of current mappings */}
              <div className="space-y-6 lg:col-span-2">
                <h3 className="text-lg font-extrabold">Active Student Assignments</h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm max-h-[500px] overflow-y-auto space-y-6">
                  {/* Student-Course Mappings */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Course Enrollments ({courseEnrollments.length})</h4>
                    <div className="space-y-2">
                      {courseEnrollments.map(mapping => (
                        <div key={mapping.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                          <div>
                            <p className="text-sm font-bold">{mapping.student_name}</p>
                            <p className="text-xs text-slate-400">Enrolled in: <span className="font-semibold text-elp-blue">{mapping.course_title}</span></p>
                          </div>
                          <button
                            onClick={() => handleDeleteMapping("course", mapping.id)}
                            className="text-xs font-bold text-elp-red hover:underline cursor-pointer"
                          >
                            Unenroll
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Student-Faculty Mappings */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Faculty Assignments ({facultyMappings.length})</h4>
                    <div className="space-y-2">
                      {facultyMappings.map(mapping => (
                        <div key={mapping.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                          <div>
                            <p className="text-sm font-bold">{mapping.student_name}</p>
                            <p className="text-xs text-slate-400">Assigned Tutor: <span className="font-semibold text-elp-blue">{mapping.faculty_name}</span> ({mapping.designation})</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMapping("faculty", mapping.id)}
                            className="text-xs font-bold text-elp-red hover:underline cursor-pointer"
                          >
                            Remove Tutor
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Exams Setup */}
          {activeTab === "exams" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form creation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-1 max-h-[700px] overflow-y-auto">
                <div>
                  <h3 className="text-lg font-extrabold">Create MCQ Exam</h3>
                  <p className="text-slate-400 text-xs mt-1">Set date/time window, and add options.</p>
                </div>
                
                {examSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-xl text-xs font-bold">
                    {examSuccess}
                  </div>
                )}
                
                <form onSubmit={handleCreateExam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unit 2 Mid-Term Quiz"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Syllabus Course</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm font-semibold"
                      value={examCourseId}
                      onChange={(e) => setExamCourseId(e.target.value)}
                    >
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Start Date</label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-xs"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Min)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 30"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red text-sm"
                        value={examDuration}
                        onChange={(e) => setExamDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Passkey</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter key or generate"
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none focus:border-elp-red font-mono text-center text-sm uppercase tracking-wide"
                        value={examPassKey}
                        onChange={(e) => setExamPassKey(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        onClick={generatePasskey}
                        className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3.5 rounded-xl text-xs font-bold hover:bg-slate-350 transition cursor-pointer"
                      >
                        Gen
                      </button>
                    </div>
                  </div>

                  {/* Question Builder List */}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Questions ({examQuestions.length})</span>
                      <button
                        type="button"
                        onClick={handleAddQuestionField}
                        className="text-xs font-bold text-elp-blue hover:underline cursor-pointer"
                      >
                        + Add Question
                      </button>
                    </div>

                    {examQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionField(idx)}
                          className="absolute top-2 right-2 text-elp-red hover:bg-elp-red/10 p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                        <span className="text-xs font-bold text-slate-400 block">Question {idx + 1}</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Choose the correct spelling."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none focus:border-elp-red"
                          value={q.questionText}
                          onChange={(e) => handleUpdateQuestionField(idx, "questionText", e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Option A"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none"
                            value={q.optionA}
                            onChange={(e) => handleUpdateQuestionField(idx, "optionA", e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            placeholder="Option B"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none"
                            value={q.optionB}
                            onChange={(e) => handleUpdateQuestionField(idx, "optionB", e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            placeholder="Option C"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none"
                            value={q.optionC}
                            onChange={(e) => handleUpdateQuestionField(idx, "optionC", e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            placeholder="Option D"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none"
                            value={q.optionD}
                            onChange={(e) => handleUpdateQuestionField(idx, "optionD", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer Option</label>
                          <select
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-lg text-xs outline-none font-bold"
                            value={q.correctOption}
                            onChange={(e) => handleUpdateQuestionField(idx, "correctOption", e.target.value)}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-elp-red text-white py-3.5 rounded-xl font-bold hover:bg-elp-red/90 transition shadow-lg shadow-elp-red/10 cursor-pointer"
                  >
                    Build Exam Session
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="space-y-6 lg:col-span-2">
                <h3 className="text-lg font-extrabold">Active MCQ Schedules</h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
                  {exams.map(ex => {
                    const examDateStr = new Date(ex.exam_date).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short"
                    });
                    return (
                      <div key={ex.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">{ex.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">Course: <span className="font-semibold">{ex.course_title}</span> • Questions: <span className="font-semibold">{ex.question_count}</span></p>
                          <p className="text-xs text-slate-500 mt-1">Schedule: {examDateStr} ({ex.duration_minutes} Mins)</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Access Key</span>
                          <span className="px-2.5 py-1 rounded-lg bg-elp-orange/15 text-elp-orange font-mono font-bold text-sm tracking-wide border border-elp-orange/20">
                            {ex.pass_key}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Results Log */}
          {activeTab === "results" && (() => {
            const filteredResults = selectedExamFilter === "all"
              ? examResults
              : examResults.filter(r => r.exam_id.toString() === selectedExamFilter);

            // Get unique exams that have submissions to populate the dropdown
            const uniqueExams = Array.from(new Set(examResults.map(r => JSON.stringify({ id: r.exam_id, title: r.exam_title }))))
              .map(str => JSON.parse(str) as { id: number; title: string });

            return (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold">Student Exam Results Log</h3>
                    <p className="text-slate-400 text-xs mt-1">Confidential database records of completed student submissions.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Filter:</span>
                      <select
                        value={selectedExamFilter}
                        onChange={(e) => setSelectedExamFilter(e.target.value)}
                        className="bg-transparent text-xs font-extrabold outline-none border-none cursor-pointer text-slate-800 dark:text-white font-sans max-w-[200px] truncate"
                      >
                        <option value="all" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">All Examinations</option>
                        {uniqueExams.map((ex) => (
                          <option key={ex.id} value={ex.id.toString()} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">
                            {ex.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadExcel}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/10 transition cursor-pointer"
                      >
                        <span>📊</span>
                        Export to Excel (CSV)
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-elp-blue hover:bg-elp-blue/90 text-white rounded-xl text-xs font-bold shadow-md shadow-elp-blue/15 transition cursor-pointer"
                      >
                        <span>🖨️</span>
                        Print PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 text-xs font-bold uppercase border-b border-slate-250 dark:border-white/5">
                          <th className="p-4 pl-6">Student Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Course Track</th>
                          <th className="p-4">Exam Name</th>
                          <th className="p-4 text-center">Score</th>
                          <th className="p-4 pr-6">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                        {filteredResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                              No student exam submissions found matching the selection.
                            </td>
                          </tr>
                        ) : (
                          filteredResults.map((result) => {
                            return (
                              <tr key={result.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                                <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white">{result.student_name}</td>
                                <td className="p-4 font-mono text-xs text-slate-400">{result.student_email}</td>
                                <td className="p-4 text-slate-500 dark:text-slate-400">{result.course_title}</td>
                                <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">{result.exam_title}</td>
                                <td className="p-4 text-center font-extrabold text-elp-blue dark:text-elp-cyan">
                                  {result.score} <span className="text-xs font-normal text-slate-400">/ {result.total_questions}</span>
                                </td>
                                <td className="p-4 pr-6 text-xs text-slate-400">
                                  {new Date(result.submitted_at).toLocaleString([], {
                                    dateStyle: "short",
                                    timeStyle: "short"
                                  })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>

        {/* Manage Course Content Modal */}
        {managingCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Manage Course Content</h3>
                  <p className="text-slate-400 text-xs mt-1">Course: <span className="font-bold text-elp-blue dark:text-elp-cyan">{managingCourse.title}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingCourse(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Sub Tabs */}
              <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveModalSubTab("materials")}
                  className={`pb-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    activeModalSubTab === "materials"
                      ? "border-elp-red text-elp-red"
                      : "border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Study Files & Links
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalSubTab("chapters")}
                  className={`pb-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    activeModalSubTab === "chapters"
                      ? "border-elp-red text-elp-red"
                      : "border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Interactive Tutorial Chapters (W3Schools Style)
                </button>
              </div>

              {/* SUB TAB 1: Materials (Files & Links) */}
              {activeModalSubTab === "materials" && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Upload form */}
                  <form onSubmit={handleAddMaterial} className="bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Publish New Material</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resource Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TOEFL Essay Templates"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl outline-none focus:border-elp-red text-xs"
                          value={newMaterialTitle}
                          onChange={(e) => setNewMaterialTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Name / Link URL</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. toefl_essay_templates.pdf"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl outline-none focus:border-elp-red text-xs font-mono"
                          value={newMaterialFile}
                          onChange={(e) => setNewMaterialFile(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addingMaterial}
                      className="w-full bg-elp-red text-white py-2.5 rounded-xl font-bold hover:bg-elp-red/90 transition text-xs shadow-md shadow-elp-red/10 cursor-pointer disabled:opacity-50"
                    >
                      {addingMaterial ? "Publishing..." : "Publish Content Material"}
                    </button>
                  </form>

                  {/* List of current materials */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Materials ({courseMaterials.length})</h4>
                    
                    {loadingMaterials ? (
                      <div className="text-center py-4 text-xs text-slate-400 animate-pulse">Loading materials...</div>
                    ) : courseMaterials.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-xs text-slate-400">
                        No materials published for this course yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {courseMaterials.map(mat => (
                          <div key={mat.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-white/5 gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{mat.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{mat.file_name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(mat.id)}
                              className="text-xs font-bold text-elp-red hover:underline cursor-pointer flex-shrink-0"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 2: Chapters (W3Schools HTML Content) */}
              {activeModalSubTab === "chapters" && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Chapter Form */}
                  <form onSubmit={handleSaveChapter} className="bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        {editingChapter ? "Edit Chapter Details" : "Publish New Chapter"}
                      </h4>
                      {editingChapter && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingChapter(null);
                            setChapterTitle("");
                            setChapterContent("");
                            setChapterSortOrder("0");
                            setChapterVideoUrl("");
                            setChapterAudioUrl("");
                          }}
                          className="text-[10px] text-elp-blue hover:underline cursor-pointer font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapter Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Introduction to HTML"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-xl outline-none text-xs"
                          value={chapterTitle}
                          onChange={(e) => setChapterTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Order</label>
                        <input
                          type="number"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-xl outline-none text-xs text-center font-bold"
                          value={chapterSortOrder}
                          onChange={(e) => setChapterSortOrder(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Video URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. YouTube or MP4 Link"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-xl outline-none text-xs"
                          value={chapterVideoUrl}
                          onChange={(e) => setChapterVideoUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. MP3 Audio Link"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-xl outline-none text-xs"
                          value={chapterAudioUrl}
                          onChange={(e) => setChapterAudioUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">HTML/Markdown Content</label>
                      <textarea
                        rows={5}
                        required
                        placeholder="e.g. <h1 class='text-2xl font-black'>Title</h1><p>Body...</p>"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl outline-none text-xs font-mono"
                        value={chapterContent}
                        onChange={(e) => setChapterContent(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingChapter}
                      className="w-full bg-elp-red text-white py-2.5 rounded-xl font-bold hover:bg-elp-red/90 transition text-xs shadow-md shadow-elp-red/10 cursor-pointer disabled:opacity-50"
                    >
                      {savingChapter ? "Saving..." : editingChapter ? "Update Chapter Content" : "Publish Interactive Chapter"}
                    </button>
                  </form>

                  {/* Chapters List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter Outlines ({courseChapters.length})</h4>
                    
                    {loadingChapters ? (
                      <div className="text-center py-4 text-xs text-slate-400 animate-pulse">Loading outline...</div>
                    ) : courseChapters.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-xs text-slate-400">
                        No chapters published for this course track yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto">
                        {courseChapters.map(ch => (
                          <div key={ch.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-white/5 gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                <span className="px-2 py-0.5 rounded bg-slate-255 dark:bg-slate-800 text-[10px] mr-2 font-mono text-slate-400">#{ch.sort_order}</span>
                                {ch.title}
                              </p>
                              {(ch.video_url || ch.audio_url) && (
                                <div className="flex gap-2.5 mt-1.5">
                                  {ch.video_url && <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded">📹 Video</span>}
                                  {ch.audio_url && <span className="text-[9px] bg-blue-500/10 text-blue-500 font-bold px-1.5 py-0.5 rounded">🎵 Audio</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChapter(ch);
                                  setChapterTitle(ch.title);
                                  setChapterContent(ch.content);
                                  setChapterSortOrder(ch.sort_order.toString());
                                  setChapterVideoUrl(ch.video_url || "");
                                  setChapterAudioUrl(ch.audio_url || "");
                                }}
                                className="text-xs font-bold text-elp-blue hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(ch.id)}
                                className="text-xs font-bold text-elp-red hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setManagingCourse(null)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Close Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}