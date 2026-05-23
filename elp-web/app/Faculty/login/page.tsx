"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FacultyLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.role !== "faculty") {
        throw new Error("Access Denied: Only faculty members are allowed here.");
      }

      // Store auth credentials
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to Faculty dashboard
      router.push("/Faculty/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 font-sans text-white px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-elp-cyan/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-elp-navy/20 rounded-full blur-3xl -z-10"></div>

      <div className="bg-slate-900/60 border border-white/10 p-8 rounded-3xl shadow-2xl w-[450px] backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-elp-cyan to-elp-blue flex items-center justify-center font-black text-xl text-white shadow-lg mb-4">
            LS
          </Link>
          <h1 className="text-3xl font-extrabold text-center tracking-tight">
            Faculty Login
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your credentials to manage your student curriculum
          </p>
        </div>

        {error && (
          <div className="bg-elp-red/15 border border-elp-red/30 text-elp-red p-4 rounded-xl text-sm font-semibold mb-6 flex gap-2 items-center">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. faculty@elp.com"
              className="w-full bg-slate-950/80 border border-white/10 focus:border-elp-cyan p-4 rounded-xl outline-none transition text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-white/10 focus:border-elp-cyan p-4 rounded-xl outline-none transition text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-elp-cyan text-slate-950 py-4 rounded-xl hover:bg-elp-cyan/90 font-bold transition shadow-lg shadow-elp-cyan/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 border-t border-white/5 pt-6">
          <span>Are you a student? </span>
          <Link href="/student/login" className="text-elp-blue font-bold hover:underline">
            Student Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}