"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {

  const router = useRouter();

  const handleLogout = () => {

    localStorage.removeItem("token");

    router.push("/student/login");
  };

  return (

    <div className="w-64 bg-blue-700 text-white p-5 min-h-screen">

      <h1 className="text-2xl font-bold mb-10">
        Student Panel
      </h1>

      <ul className="space-y-4">

        <li>
          <Link
            href="/student/dashboard"
            className="block hover:bg-blue-800 p-3 rounded-lg"
          >
            Dashboard
          </Link>
        </li>

        <li>
          <Link
            href="/student/courses"
            className="block hover:bg-blue-800 p-3 rounded-lg"
          >
            Courses
          </Link>
        </li>

        <li>
          <Link
            href="/student/exams"
            className="block hover:bg-blue-800 p-3 rounded-lg"
          >
            Exams
          </Link>
        </li>

        <li>
          <button
            onClick={handleLogout}
            className="w-full text-left hover:bg-red-600 p-3 rounded-lg cursor-pointer"
          >
            Logout
          </button>
        </li>

      </ul>

    </div>
  );
}