import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
      {/* Header/Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-elp-blue to-elp-cyan flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-elp-blue/20">
            VT
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-elp-cyan bg-clip-text text-transparent">
            Vel Tech
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/student/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-300 hover:text-white transition"
          >
            Student Portal
          </Link>
          <Link
            href="/Faculty/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-300 hover:text-white transition"
          >
            Faculty Portal
          </Link>
          <Link
            href="/admin/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition border border-white/15"
          >
            Admin Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-6xl mx-auto text-center w-full">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-elp-cyan/30 bg-elp-cyan/10 text-elp-cyan text-sm font-medium animate-pulse">
          <span className="w-2 h-2 rounded-full bg-elp-cyan"></span>
          Now Open for Academic Year 2026-2027
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
          Master the English Language <br />
          <span className="bg-gradient-to-r from-elp-blue via-elp-cyan to-white bg-clip-text text-transparent">
            With Intelligent Guidance
          </span>
        </h1>
        
        <p className="max-w-2xl text-slate-400 text-lg md:text-xl mb-12 font-medium">
          A secure, multi-role portal connecting students with expert faculty and powerful administration tools to accelerate speaking, grammar, and vocabulary learning.
        </p>

        {/* Portals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl text-left">
          {/* Student Portal Card */}
          <Link 
            href="/student/login"
            className="group relative p-8 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-elp-blue/50 transition-all duration-300 hover:shadow-2xl hover:shadow-elp-blue/10 backdrop-blur-md overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-elp-blue/10 rounded-full blur-2xl group-hover:bg-elp-blue/20 transition-all"></div>
            <div className="w-12 h-12 rounded-xl bg-elp-blue/10 text-elp-blue flex items-center justify-center font-bold text-xl mb-6 border border-elp-blue/20">
              S
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-elp-blue transition">Student Portal</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Access assigned courses, check schedules, take secure interactive MCQ exams, and track your learning progress.
            </p>
            <div className="flex items-center text-sm font-semibold text-elp-cyan group-hover:translate-x-1 transition-transform">
              Enter Student Space &rarr;
            </div>
          </Link>

          {/* Faculty Portal Card */}
          <Link 
            href="/Faculty/login"
            className="group relative p-8 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-elp-cyan/50 transition-all duration-300 hover:shadow-2xl hover:shadow-elp-cyan/10 backdrop-blur-md overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-elp-cyan/10 rounded-full blur-2xl group-hover:bg-elp-cyan/20 transition-all"></div>
            <div className="w-12 h-12 rounded-xl bg-elp-cyan/10 text-elp-cyan flex items-center justify-center font-bold text-xl mb-6 border border-elp-cyan/20">
              F
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-elp-cyan transition">Faculty Portal</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Monitor student engagement, grade performances, and analyze test completions.
            </p>
            <div className="flex items-center text-sm font-semibold text-elp-cyan group-hover:translate-x-1 transition-transform">
              Enter Faculty Space &rarr;
            </div>
          </Link>

          {/* Admin Portal Card */}
          <Link 
            href="/admin/login"
            className="group relative p-8 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-elp-orange/50 transition-all duration-300 hover:shadow-2xl hover:shadow-elp-orange/10 backdrop-blur-md overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-elp-orange/10 rounded-full blur-2xl group-hover:bg-elp-orange/20 transition-all"></div>
            <div className="w-12 h-12 rounded-xl bg-elp-orange/10 text-elp-orange flex items-center justify-center font-bold text-xl mb-6 border border-elp-orange/20">
              A
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-elp-orange transition">Admin Portal</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Create curriculum, register students & instructors, generate exam codes, configure passkeys, and view platform metrics.
            </p>
            <div className="flex items-center text-sm font-semibold text-elp-cyan group-hover:translate-x-1 transition-transform">
              Enter Admin Space &rarr;
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-white/5 text-slate-500 text-sm bg-slate-950">
        &copy; {new Date().getFullYear()} Vel Tech English Learning Portal. All Rights Reserved.
      </footer>
    </div>
  );
}
