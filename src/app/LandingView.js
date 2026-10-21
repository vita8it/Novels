"use client";

import { useEffect } from "react";
import Image from "next/image";
import InteractiveDotGrid from "@/components/InteractiveDotGrid";

export default function LandingView() {
  // Client-side fallback check: redirect to /dashboard if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          window.location.href = "/dashboard";
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#0d0d0d] text-white px-6 select-none overflow-hidden">
      {/* Interactive Dot Grid Background */}
      <InteractiveDotGrid />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Brand Header: "Novel" + Star Logo */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4">
          <span className="text-6xl sm:text-7xl md:text-[6.5rem] font-[600] tracking-tight text-white leading-none">
            Novel
          </span>
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-[6.5rem] md:h-[6.5rem] flex items-center justify-center flex-shrink-0">
            <Image
              src="/Images/Logo.png"
              alt="Novel logo"
              width={104}
              height={104}
              priority
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[#8e95a0] text-base sm:text-lg md:text-[1.4rem] font-normal leading-relaxed mb-9 max-w-lg">
          Novel is a simple Roblox automation hub
          <br />
          built for faster, stability, and ease of use.
        </p>

        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {/* Google Login Button */}
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-white text-[#111111] font-medium text-[15px] sm:text-base hover:bg-[#ededed] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Login with Google</span>
          </button>

          {/* Discord Login Button */}
          <a
            href="/api/auth/discord"
            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#5865F2] text-white font-medium text-[15px] sm:text-base hover:bg-[#4752c4] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <svg
              className="w-5 h-5 flex-shrink-0 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Login with Discord</span>
          </a>
        </div>

        {/* Tip / Tutorial */}
        <p className="mt-8 text-sm sm:text-base text-[#8e95a0] font-normal">
          Don&apos;t know anything? watch the{" "}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-neutral-200 underline underline-offset-4 decoration-neutral-500 hover:decoration-white transition-colors"
          >
            tutorial
          </a>
        </p>
      </div>
    </main>
  );
}
