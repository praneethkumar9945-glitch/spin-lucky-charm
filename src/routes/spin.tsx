import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { triggerRemoteSpin, useWheelSettings } from "@/lib/wheel-store";

export const Route = createFileRoute("/spin")({
  head: () => ({
    meta: [
      { title: "Spin Buzzer — Lucky Spin Wheel" },
      { name: "description", content: "Hit the buzzer to spin the lucky wheel on every screen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SpinPanel,
});

function SpinPanel() {
  const { settings, loading } = useWheelSettings();
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const hitBuzzer = async () => {
    if (busy || loading) return;
    setBusy(true);
    setError(null);
    setPressed(true);
    try {
      await triggerRemoteSpin();
    } catch {
      setError("Could not start the spin. Check your connection and try again.");
    } finally {
      setBusy(false);
      resetTimer.current = window.setTimeout(() => setPressed(false), 5500);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-10">
      <header className="text-center">
        <Link to="/" className="link-admin mb-6 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to wheel
        </Link>
        <p className="font-display text-sm tracking-[0.4em] text-primary uppercase">Host panel</p>
        <h1 className="font-display mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Spin <span className="text-gold">Buzzer</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Hit the buzzer and the wheel starts spinning on every connected screen.
        </p>
      </header>

      <div className="buzzer-stage">
        <div className={`buzzer-ring ${pressed ? "buzzer-ring-live" : ""}`} aria-hidden />
        <button
          onClick={hitBuzzer}
          disabled={busy || loading}
          className={`buzzer ${pressed ? "buzzer-pressed" : ""}`}
          aria-label="Spin the wheel on all screens"
        >
          <span className="buzzer-gloss" aria-hidden />
          <Zap className="buzzer-icon" aria-hidden />
          <span className="buzzer-label">{pressed ? "SPINNING!" : "SPIN"}</span>
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {settings.forcedIndex >= 0
          ? `This spin will stop on “${settings.labels[settings.forcedIndex]}”.`
          : "This spin lands on a random prize."}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </main>
  );
}
