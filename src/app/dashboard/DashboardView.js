"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Copy,
  Check,
  RotateCcw,
  LogOut,
  Key,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Clock,
} from "lucide-react";
import InteractiveDotGrid from "@/components/InteractiveDotGrid";

export default function DashboardView({ initialUser, initialLicense, getLicenseUrl }) {
  const [user] = useState(initialUser);
  const [license, setLicense] = useState(initialLicense);
  const [hasLicense, setHasLicense] = useState(
    Boolean(
      initialLicense &&
        initialLicense.licenseKey &&
        initialLicense.status === "Active" &&
        (!initialLicense.expiresAt || new Date(initialLicense.expiresAt) > new Date())
    )
  );

  // User Profile Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Loaders Tab State
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [activateSuccess, setActivateSuccess] = useState("");

  // HWID Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResettingHwid, setIsResettingHwid] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  // License Logout Modal State (Unlink Key, NOT Discord account)
  const [showLicenseLogoutModal, setShowLicenseLogoutModal] = useState(false);
  const [isLoggingOutLicense, setIsLoggingOutLicense] = useState(false);

  // Account Logout Modal State (Discord Account)
  const [showAccountLogoutModal, setShowAccountLogoutModal] = useState(false);

  // Expiration countdown (formatted as 23:50:43 or ∞ for permanent key)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!initialLicense?.expiresAt || initialLicense?.expiresAt === "permanent" || initialLicense?.expiresAt === "lifetime") {
      return "∞";
    }
    return "--:--:--";
  });

  useEffect(() => {
    const isPermanent =
      !license?.expiresAt ||
      license.expiresAt === "permanent" ||
      license.expiresAt === "lifetime" ||
      license.isPermanent;

    if (isPermanent) {
      setTimeLeft(hasLicense ? "∞" : "");
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(license.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setHasLicense(false);
        return;
      }

      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n) => String(n).padStart(2, "0");
      if (days > 0) {
        setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [license, hasLicense]);

  // Loader Script string
  const userKeyString = license?.licenseKey || "USER_KEY";
  const loaderScript = `License = "${userKeyString}"\nloadstring(game:HttpGet("https://raw.githubusercontent.com/vita8it/Novel/main/main.luau"))()`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(loaderScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyKey = () => {
    if (!license?.licenseKey) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Activate / Confirm License Key
  const handleActivate = async (e) => {
    e?.preventDefault();
    if (!inputKey.trim()) {
      setActivateError("Please enter your license key");
      return;
    }

    setIsActivating(true);
    setActivateError("");
    setActivateSuccess("");

    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: inputKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setActivateError(data.error || "Invalid license key or already in use.");
      } else {
        setLicense(data.license);
        setHasLicense(true);
        setInputKey("");
        setActivateSuccess("License activated successfully!");
      }
    } catch (err) {
      setActivateError("Network error. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  // Reset HWID Confirmation
  const handleConfirmResetHwid = async () => {
    setIsResettingHwid(true);
    setResetMessage(null);

    try {
      const res = await fetch("/api/license/reset-hwid", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setResetMessage({
          type: "error",
          text: data.error || "Failed to reset HWID.",
        });
      } else {
        setResetMessage({
          type: "success",
          text: "HWID reset successfully.",
        });
        if (license) {
          setLicense((prev) => ({ ...prev, hwids: [] }));
        }
        setTimeout(() => {
          setShowResetModal(false);
          setResetMessage(null);
        }, 1500);
      }
    } catch (err) {
      setResetMessage({
        type: "error",
        text: "Connection error. Please try again.",
      });
    } finally {
      setIsResettingHwid(false);
    }
  };

  // License Logout Confirmation (Unlink license key from user account)
  const handleConfirmLicenseLogout = async () => {
    setIsLoggingOutLicense(true);

    try {
      const res = await fetch("/api/license/logout", {
        method: "POST",
      });

      if (res.ok) {
        setLicense(null);
        setHasLicense(false);
        setShowLicenseLogoutModal(false);
      }
    } catch (err) {
      console.error("License logout error:", err);
    } finally {
      setIsLoggingOutLicense(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0d0d0d] text-white flex flex-col justify-between antialiased select-none overflow-x-hidden">
      {/* Interactive Dot Grid Background from Auth page */}
      <InteractiveDotGrid />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: Brand on Left, Profile on Top Right               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-6 sm:px-10 py-5 w-full max-w-7xl mx-auto">
        {/* Brand: "Novel" + Star Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-[600] tracking-tight text-white leading-none">
            Novel
          </span>
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
            <Image
              src="/Images/Logo.png"
              alt="Novel logo"
              width={32}
              height={32}
              priority
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* Profile on the Top Right */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/[0.15] shrink-0">
              <Image
                src={user?.avatar || "/Images/Logo.png"}
                alt={user?.username || "Avatar"}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-white/90 hidden sm:inline max-w-[120px] truncate">
              {user?.globalName || user?.username}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8e95a0]" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#141416] border border-white/[0.08] rounded-2xl p-2 shadow-2xl z-50">
                {/* User info header */}
                <div className="px-3 py-3 border-b border-white/[0.06] mb-1">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/[0.1] shrink-0">
                      <Image
                        src={user?.avatar || "/Images/Logo.png"}
                        alt={user?.username || "Avatar"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.globalName || user?.username}
                      </p>
                      <p className="text-xs text-[#8e95a0] truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                  {user?.email && (
                    <p className="text-[11px] text-[#8e95a0] truncate mt-2 font-mono">
                      {user?.email}
                    </p>
                  )}
                </div>

                {/* Status overview */}
                <div className="px-3 py-2 space-y-1.5 text-xs text-[#8e95a0]">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {hasLicense ? "Active License" : "No License"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Provider</span>
                    <span className="text-white/80 font-medium">Novel Provider</span>
                  </div>
                </div>

                {/* Logout action */}
                <div className="pt-1 mt-1 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowAccountLogoutModal(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out of Account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT: Frameless / Transparent Center Area            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        {hasLicense ? (
          /* ═══════════════════════════════════════════════════════════ */
          /* ACTIVE LICENSE: Frameless / Transparent Floating Design     */
          /* ═══════════════════════════════════════════════════════════ */
          <div className="w-full max-w-[500px] flex flex-col items-center">
            {/* 1. Giant Countdown Clock (e.g. 23:50:43 or ∞ for Permanent) */}
            <div className="w-full text-center select-none pt-2 pb-8 sm:pb-9 flex items-center justify-center">
              <span className={`tracking-tight leading-none bg-gradient-to-b from-[#f4f4f5] via-[#d4d4d8] to-[#80808a] bg-clip-text text-transparent drop-shadow-md ${timeLeft === "∞" ? "text-7xl sm:text-8xl md:text-[8rem] font-light leading-none select-none" : "text-6xl sm:text-7xl md:text-[5.4rem] font-medium tabular-nums"}`}>
                {timeLeft}
              </span>
            </div>

            {/* 2. Middle Row: [ Key Pill ] [ Reset HWID ] [ Logout ] */}
            <div className="w-full flex items-center gap-2.5 sm:gap-3">
              {/* License Key Pill */}
              <button
                type="button"
                onClick={handleCopyKey}
                title="Click to copy license key"
                className="flex-1 min-w-0 bg-[#161618] hover:bg-[#1e1e22] border border-white/[0.08] rounded-full py-3 px-5 flex items-center justify-center transition-all duration-150 group cursor-pointer active:scale-[0.99] shadow-lg backdrop-blur-sm"
              >
                <span className="text-xs sm:text-[13px] font-mono text-[#9ca3af] group-hover:text-white truncate tracking-normal">
                  {copiedKey ? "Copied Key!" : userKeyString}
                </span>
              </button>

              {/* Reset HWID Circular Button */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                title="Reset HWID"
                className="w-12 h-12 rounded-full bg-[#161618] hover:bg-[#1f1f24] border border-white/[0.08] text-zinc-200 hover:text-white flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0 shadow-lg backdrop-blur-sm"
              >
                <RotateCcw className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* License Logout Circular Button (Unlink License Key) */}
              <button
                type="button"
                onClick={() => setShowLicenseLogoutModal(true)}
                title="Log out from License Key"
                className="w-12 h-12 rounded-full bg-[#161618] hover:bg-red-500/15 border border-white/[0.08] text-[#ef4444] hover:text-red-400 flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0 shadow-lg backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* 3. Bottom Big Button: Copy Script Loader with Copy Icon */}
            <button
              type="button"
              onClick={handleCopyScript}
              className="w-full mt-4 sm:mt-5 py-3.5 sm:py-4 px-6 rounded-full bg-white text-[#111111] font-semibold text-base sm:text-[17px] hover:bg-[#ededed] active:scale-[0.98] transition-all duration-150 shadow-xl flex items-center justify-center gap-2.5 select-none"
            >
              {copiedScript ? (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 stroke-[2.5]" />
                  <span>Copied Script!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-[#111111]" />
                  <span>Copy Script Loader</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════ */
          /* NO LICENSE / EXPIRED: Frameless / Transparent View          */
          /* ═══════════════════════════════════════════════════════════ */
          <div className="w-full max-w-[500px] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6 shadow-md backdrop-blur-sm">
              <Key className="w-7 h-7 text-[#8e95a0]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-[600] tracking-tight text-white mb-2.5">
              Active your license.
            </h2>
            <p className="text-[#8e95a0] text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Enter your license key below to unlock Novel Hub.
            </p>

            {/* Activation Form */}
            <form onSubmit={handleActivate} className="w-full space-y-4">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-[#161618] border border-white/[0.08] focus:border-white/30 rounded-full px-5 py-3.5 text-sm text-white placeholder-[#666] outline-none transition-all font-mono text-center tracking-wider shadow-lg backdrop-blur-sm"
              />

              {activateError && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs sm:text-sm text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{activateError}</span>
                </div>
              )}

              {activateSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs sm:text-sm text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{activateSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isActivating}
                  className="flex-1 py-3.5 px-6 rounded-full bg-white text-[#111111] font-semibold text-sm sm:text-base hover:bg-[#ededed] active:scale-[0.98] transition-all duration-150 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActivating ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm</span>
                    </>
                  )}
                </button>

                <a
                  href={getLicenseUrl || "https://discord.gg/your-server"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#27272b] hover:bg-[#323238] text-zinc-100 hover:text-white border border-white/[0.12] font-medium text-sm sm:text-base active:scale-[0.98] transition-all duration-150 shadow-xl flex items-center justify-center gap-2"
                >
                  <span>Get License</span>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOOTER (Subtle minimal copyright / branding)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#8e95a0]/60 select-none">
        Novel Hub &bull; Novel Provider
      </footer>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* HWID RESET CONFIRMATION MODAL                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.08] rounded-[24px] p-6 sm:p-7 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-[600] text-white tracking-tight">
              Reset HWID
            </h3>
            <p className="text-sm text-[#8e95a0] mt-2 leading-relaxed">
              This will unbind your license from the current device. You will be
              able to execute Novel Hub on a new machine.
            </p>

            {resetMessage && (
              <div
                className={`mt-4 p-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
                  resetMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/15 text-red-400"
                }`}
              >
                {resetMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{resetMessage.text}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!isResettingHwid) {
                    setShowResetModal(false);
                    setResetMessage(null);
                  }
                }}
                disabled={isResettingHwid}
                className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#8e95a0] hover:text-white text-sm font-medium border border-white/[0.08] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetHwid}
                disabled={isResettingHwid}
                className="px-5 py-2.5 rounded-full bg-white text-[#111111] text-sm font-semibold hover:bg-[#ededed] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isResettingHwid ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LICENSE LOGOUT CONFIRMATION MODAL (Unlink License Key)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showLicenseLogoutModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.08] rounded-[24px] p-6 sm:p-7 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <LogOut className="w-4 h-4" />
            </div>

            <h3 className="text-lg font-[600] text-white tracking-tight">
              Log out from License
            </h3>
            <p className="text-sm text-[#8e95a0] mt-2 leading-relaxed">
              Are you sure you want to log out from this license key? You will remain signed in to your Discord account, and can enter another license key anytime.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLicenseLogoutModal(false)}
                disabled={isLoggingOutLicense}
                className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#8e95a0] hover:text-white text-sm font-medium border border-white/[0.08] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLicenseLogout}
                disabled={isLoggingOutLicense}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold active:scale-[0.98] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOutLicense ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out License</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACCOUNT LOGOUT CONFIRMATION MODAL (Discord Account)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAccountLogoutModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.08] rounded-[24px] p-6 sm:p-7 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-[600] text-white tracking-tight">
              Log out of Account
            </h3>
            <p className="text-sm text-[#8e95a0] mt-2 leading-relaxed">
              Are you sure you want to sign out of your Novel Hub account?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAccountLogoutModal(false)}
                className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#8e95a0] hover:text-white text-sm font-medium border border-white/[0.08] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <a
                href="/api/auth/logout"
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold active:scale-[0.98] transition-all shadow-sm flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
