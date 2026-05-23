"use client";

import { useEffect, useState } from "react";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setUserName(parsed.name);
          setUserEmail(parsed.email);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [spinning, setSpinning] = useState(false);

  const handleSyncClick = () => {
    setSpinning(true);
    window.dispatchEvent(new Event("sync-data"));
    setTimeout(() => {
      setSpinning(false);
    }, 1000);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-8 py-4 flex items-center justify-between shadow-sm z-0">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
        {title}
      </h2>
      <div className="flex items-center gap-4">
        {/* Sync Data Action */}
        <button
          onClick={handleSyncClick}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 hover:border-elp-blue text-slate-600 dark:text-slate-300 hover:text-elp-blue text-xs font-bold transition duration-300 cursor-pointer shadow-sm"
          title="Sync Latest Course & Exam Assignments"
        >
          <svg
            className={`w-3.5 h-3.5 ${spinning ? "animate-spin text-elp-blue" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Sync Data
        </button>

        <div className="flex flex-col text-right">
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm leading-tight">
            {userName}
          </span>
          {userEmail && (
            <span className="text-[11px] text-slate-400 font-medium">
              {userEmail}
            </span>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-elp-blue to-elp-cyan flex items-center justify-center font-bold text-white text-sm shadow-md">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
