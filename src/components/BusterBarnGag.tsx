import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import type { AppId } from "@/config/appRegistryData";

/**
 * Easter egg: a pair of fake "malware" popups that escape the OS chrome. The
 * first (a millionth-visitor prize) appears ~2 min in — late enough that it
 * surfaces only for a lingering visitor, not on arrival; if it isn't accepted,
 * a fake "Run BusterBarn_Setup.exe" warning escalates at ~2:30. Accepting
 * either launches Buster-Barn full-screen — like clicking its desktop icon.
 */
const SESSION_KEY = "ryos:barn-gag-shown";
export const PRIZE_DELAY_MS = 120_000;
export const EXE_DELAY_MS = 150_000;
// Above the OS chrome, below the full-screen Buster-Barn takeover (999999).
const GAG_Z = 990000;

type Stage = "none" | "prize" | "exe";

export function BusterBarnGag() {
  const launchApp = useLaunchApp();
  const [stage, setStage] = useState<Stage>("none");
  const [seconds, setSeconds] = useState(9);
  const doneRef = useRef(false);

  // Arm the two timed popups, once per browser session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* sessionStorage unavailable — just run the gag */
    }
    const t1 = window.setTimeout(() => {
      if (!doneRef.current) setStage("prize");
    }, PRIZE_DELAY_MS);
    const t2 = window.setTimeout(() => {
      // Escalate: replaces the prize popup if it's still sitting there.
      if (!doneRef.current) setStage("exe");
    }, EXE_DELAY_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // The fake "offer expires" countdown — loops, because the offer never ends.
  useEffect(() => {
    if (stage !== "prize") return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 0 ? 9 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const finish = () => {
    doneRef.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const accept = () => {
    // Same path as clicking the Buster-Barn icon → full-screen takeover.
    launchApp("buster-barn" as AppId);
    finish();
    setStage("none");
  };
  const dismissPrize = () => setStage("none"); // the .exe popup still comes at 30s
  const dismissExe = () => {
    finish();
    setStage("none");
  };

  if (stage === "none") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: GAG_Z }}
    >
      {stage === "prize" ? (
        <PrizePopup
          seconds={seconds}
          onClaim={accept}
          onClose={dismissPrize}
        />
      ) : (
        <ExePopup onRun={accept} onCancel={dismissExe} />
      )}
    </div>,
    document.body
  );
}

function PrizePopup({
  seconds,
  onClaim,
  onClose,
}: {
  seconds: number;
  onClaim: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="pointer-events-auto w-[340px] max-w-full overflow-hidden rounded-md border border-black/30 shadow-[0_14px_55px_rgba(0,0,0,0.55)]"
      style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
      role="dialog"
      aria-label="Congratulations"
    >
      <div
        className="flex items-center justify-between px-2 py-1 text-white"
        style={{ background: "linear-gradient(90deg,#7b2ff7,#f107a3)" }}
      >
        <span className="text-[12px] font-bold">🎉 CONGRATULATIONS!!! 🎉</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-4 items-center justify-center rounded-[2px] bg-white/30 text-[10px] leading-none text-white hover:bg-white/50"
        >
          ✕
        </button>
      </div>
      <div className="bg-gradient-to-b from-yellow-50 to-pink-100 px-5 py-4 text-center text-black">
        <div className="text-[13px] font-bold leading-tight text-fuchsia-700">
          YOU ARE VISITOR
        </div>
        <div className="my-1 text-[30px] font-black leading-none text-fuchsia-600 [text-shadow:1px_1px_0_#fff]">
          #1,000,000
        </div>
        <p className="mb-2 text-[12px] font-bold text-black">
          You've been selected to win a{" "}
          <span className="text-green-600">FREE*</span> mystery prize! 🎁
        </p>
        <div className="mb-3 inline-block rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
          ⏰ Offer expires in 0:0{seconds}
        </div>
        <button
          type="button"
          onClick={onClaim}
          className="w-full animate-pulse rounded-md border-2 border-green-700 bg-gradient-to-b from-green-400 to-green-600 px-3 py-2 text-[14px] font-black text-white shadow hover:from-green-300 hover:to-green-500"
        >
          ✨ CLAIM PRIZE 🎁 ✨
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 block w-full text-[10px] text-neutral-500 underline hover:text-neutral-700"
        >
          no thanks, I don't want free stuff
        </button>
        <p className="mt-2 text-[8px] leading-tight text-neutral-400">
          *Prize, terms, and existence not guaranteed. No purchase necessary.
        </p>
      </div>
    </div>
  );
}

function ExePopup({
  onRun,
  onCancel,
}: {
  onRun: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="pointer-events-auto w-[420px] max-w-full overflow-hidden rounded-[6px] border border-[#0a246a] shadow-[0_14px_55px_rgba(0,0,0,0.55)]"
      style={{ fontFamily: 'Tahoma, "Segoe UI", sans-serif' }}
      role="dialog"
      aria-label="Open File - Security Warning"
    >
      <div
        className="flex items-center justify-between px-2 py-1 text-white"
        style={{ background: "linear-gradient(90deg,#0058e6,#3a93ff)" }}
      >
        <span className="text-[12px] font-bold">
          Open File - Security Warning
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex h-4 w-5 items-center justify-center rounded-[2px] border border-white/60 bg-[#d24a3d] text-[10px] font-bold leading-none text-white hover:bg-[#e25a4d]"
        >
          ✕
        </button>
      </div>
      <div className="bg-[#ece9d8] px-4 py-4 text-black">
        <p className="mb-3 text-[12px] font-bold">Do you want to run this file?</p>
        <div className="mb-3 flex items-start gap-3">
          <div className="text-[26px] leading-none">📄</div>
          <div className="text-[11px] leading-relaxed">
            <div>
              <span className="font-bold">Name:</span> BusterBarn_Setup.exe
            </div>
            <div>
              <span className="font-bold">Publisher:</span>{" "}
              <span className="text-blue-700">Unknown Publisher</span>
            </div>
            <div>
              <span className="font-bold">Type:</span> Application
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-start gap-2 text-[11px] leading-snug">
          <span className="text-[18px] leading-none text-yellow-500">⚠</span>
          <span>
            While files from the Internet can be useful, this file type can
            potentially harm your computer. Only run software from publishers
            you trust.
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onRun}
            className="min-w-[74px] rounded-[3px] border border-[#707070] bg-gradient-to-b from-white to-[#dcdcdc] px-3 py-1 text-[11px] hover:from-[#fffbe6] active:translate-y-px"
          >
            Run
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[74px] rounded-[3px] border border-[#707070] bg-gradient-to-b from-white to-[#dcdcdc] px-3 py-1 text-[11px] hover:from-[#f0f0f0] active:translate-y-px"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
