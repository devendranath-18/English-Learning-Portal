"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  role: "student" | "faculty" | "admin";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Direct back to landing or specific portal login
    router.push(`/${role === "faculty" ? "Faculty" : role}/login`);
  };

  const studentLinks = [
    { name: "Dashboard", href: "/student/dashboard" },
    { name: "My Courses", href: "/student/courses" },
    { name: "Upcoming Exams", href: "/student/exams" }
  ];

  const facultyLinks = [
    { name: "Dashboard", href: "/Faculty/dashboard" }
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard" }
  ];

  const links =
    role === "student"
      ? studentLinks
      : role === "faculty"
      ? facultyLinks
      : adminLinks;

  const roleLabels = {
    student: "Student Space",
    faculty: "Faculty Space",
    admin: "Admin Console"
  };

  return (
    <aside className="w-64 bg-elp-navy text-white flex flex-col min-h-screen shadow-2xl z-10 border-r border-white/5">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-elp-blue to-elp-cyan flex items-center justify-center font-bold text-sm text-white">
          VT
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight leading-none">
            Vel Tech
          </h1>
          <span className="text-[10px] text-elp-cyan font-bold tracking-widest uppercase">
            {roleLabels[role]}
          </span>
        </div>
      </div>

      {/* Sidebar Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-xl transition duration-200 font-medium ${
                isActive
                  ? "bg-white/10 text-elp-cyan border-l-4 border-elp-cyan font-semibold shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area with Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-elp-red/10 text-elp-red hover:bg-elp-red hover:text-white font-semibold transition duration-300"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
