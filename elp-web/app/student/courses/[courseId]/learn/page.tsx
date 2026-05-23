"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Chapter {
  id: number;
  title: string;
  content: string;
  sort_order: number;
  video_url?: string;
  audio_url?: string;
}

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  const [courseTitle, setCourseTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/student/login");
      return;
    }

    const fetchCourseData = async () => {
      try {
        // 1. Fetch course details to get title
        const coursesRes = await fetch("http://localhost:5000/api/student/courses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coursesRes.status === 401 || coursesRes.status === 403) {
          localStorage.removeItem("token");
          router.push("/student/login");
          return;
        }
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const currentCourse = coursesData.find((c: any) => c.id.toString() === courseId);
          if (currentCourse) {
            setCourseTitle(currentCourse.title);
          }
        }

        // 2. Fetch course chapters outline
        const chaptersRes = await fetch(`http://localhost:5000/api/student/courses/${courseId}/chapters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!chaptersRes.ok) {
          throw new Error("Failed to load course chapters.");
        }
        const chaptersData = await chaptersRes.json();
        setChapters(chaptersData);
      } catch (err: any) {
        setError(err.message || "Failed to load course content.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, router]);

  const handlePrev = () => {
    if (activeChapterIdx > 0) {
      setActiveChapterIdx(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeChapterIdx < chapters.length - 1) {
      setActiveChapterIdx(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <span className="w-12 h-12 border-4 border-elp-blue border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center max-w-md w-full">
          <span className="text-3xl block mb-4">⚠️</span>
          <h3 className="text-xl font-bold mb-2">Access Error</h3>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/student/courses")}
            className="w-full bg-elp-blue text-white py-3 rounded-xl font-bold hover:bg-elp-blue/90 transition cursor-pointer"
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const activeChapter = chapters[activeChapterIdx];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/student/courses")}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-350 hover:text-white transition cursor-pointer"
            title="Back to Courses"
          >
            ←
          </button>
          <div>
            <span className="text-[10px] text-elp-cyan font-bold uppercase tracking-wider block">Course Reader Workspace</span>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight truncate max-w-[250px] md:max-w-md">{courseTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-350">
            Chapter {chapters.length > 0 ? activeChapterIdx + 1 : 0} of {chapters.length}
          </span>
          <button
            onClick={() => router.push("/student/courses")}
            className="hidden md:block bg-elp-cyan text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-elp-cyan/90 transition shadow-md shadow-elp-cyan/15 cursor-pointer"
          >
            Close Reader
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Chapters Sidebar (W3Schools Style) */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50 flex flex-col overflow-y-auto shrink-0 hidden md:flex">
          <div className="p-4 border-b border-slate-200 dark:border-white/5">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chapters Outline</h3>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {chapters.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 italic text-center">No syllabus chapters logged.</div>
            ) : (
              chapters.map((ch, idx) => {
                const isActive = idx === activeChapterIdx;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapterIdx(idx)}
                    className={`w-full flex items-start gap-2.5 p-3 rounded-xl text-left text-xs font-bold transition cursor-pointer select-none ${
                      isActive 
                        ? "bg-elp-blue text-white shadow-md shadow-elp-blue/15" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-850 text-slate-500"
                    }`}>
                      {ch.sort_order}
                    </span>
                    <span className="truncate leading-relaxed">{ch.title}</span>
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        {/* Right Content Pane (W3Schools Style Content) */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-950">
          {chapters.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-4xl mb-4">📚</span>
              <h3 className="text-xl font-bold">No course content available</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-2">
                This course syllabus is currently being populated. Check back shortly for reference materials and notes!
              </p>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto p-6 md:p-12 space-y-8 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Top Prev/Next Navigation */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
                  <button
                    onClick={handlePrev}
                    disabled={activeChapterIdx === 0}
                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ❮ Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={activeChapterIdx === chapters.length - 1}
                    className="flex items-center gap-1 bg-elp-cyan hover:bg-elp-cyan/95 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next ❯
                  </button>
                </div>

                {/* Media Players (Video & Audio) */}
                {(activeChapter?.video_url || activeChapter?.audio_url) && (
                  <div className="space-y-6 my-6 bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    {/* Video Player */}
                    {activeChapter.video_url && (() => {
                      const embedUrl = getEmbedVideoUrl(activeChapter.video_url);
                      return (
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <span className="text-lg">📹</span> Lecture Video Guide
                          </h4>
                          {embedUrl ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg">
                              <iframe
                                src={embedUrl}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full border-none"
                              ></iframe>
                            </div>
                          ) : (
                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg bg-black">
                              <video
                                src={activeChapter.video_url}
                                controls
                                className="w-full max-h-[420px] bg-black"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Audio Player */}
                    {activeChapter.audio_url && (
                      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/5">
                        <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-lg">🎵</span> Audio Lesson Practice
                        </h4>
                        <audio
                          src={activeChapter.audio_url}
                          controls
                          className="w-full bg-slate-100 dark:bg-slate-950 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Chapter Main Reader Section */}
                <article 
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 select-text"
                  dangerouslySetInnerHTML={{ __html: activeChapter?.content || "" }}
                />
              </div>

              {/* Bottom Prev/Next Navigation */}
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-8 mt-12">
                <button
                  onClick={handlePrev}
                  disabled={activeChapterIdx === 0}
                  className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  ❮ Previous Chapter
                </button>
                <button
                  onClick={handleNext}
                  disabled={activeChapterIdx === chapters.length - 1}
                  className="flex items-center gap-1 bg-elp-cyan hover:bg-elp-cyan/95 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next Chapter ❯
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
