import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PartyPopper, Sparkles, Trophy } from "lucide-react";
import { SpinWheel, targetRotationFor } from "@/components/SpinWheel";
import { Button } from "@/components/ui/button";
import { SEGMENT_COUNT, useWheelSettings } from "@/lib/wheel-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucky Spin Wheel — Spin & Win" },
      {
        name: "description",
        content: "Spin the lucky wheel with 11 prizes and see where fortune lands. Admin-controlled outcomes for fair event play.",
      },
      { property: "og:title", content: "Lucky Spin Wheel — Spin & Win" },
      {
        property: "og:description",
        content: "Spin the lucky wheel with 11 prizes and see where fortune lands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpinPage,
});

function SpinPage() {
  const { settings } = useWheelSettings();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const rotationRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const spinRef = useRef<() => void>(() => {});
  const lastNonce = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);




  const spin = () => {
    if (spinning) return;
    setResult(null);
    const target =
      settings.forcedIndex >= 0
        ? settings.forcedIndex
        : Math.floor(Math.random() * SEGMENT_COUNT);
    const next = targetRotationFor(target, rotationRef.current);
    rotationRef.current = next;
    setRotation(next);
    setSpinning(true);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(settings.labels[target] ?? `Prize ${target + 1}`);
    }, 5300);
  };

  spinRef.current = spin;

  // A spin started from the admin device
  useEffect(() => {
    const nonce = settings.spinNonce;
    if (lastNonce.current === null) {
      lastNonce.current = nonce;
      return;
    }
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce;
      spinRef.current();
    }
  }, [settings.spinNonce]);

  const isTryAgain = result?.trim().toLowerCase() === "try again";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="text-center">
        <p className="font-display text-sm tracking-[0.4em] text-primary uppercase">Feeling lucky?</p>
        <h1 className="font-display mt-2 text-4xl font-black tracking-tight sm:text-6xl">
          Lucky <span className="text-gold">Spin</span> Wheel
        </h1>
      </header>

      {mounted ? (
        <SpinWheel labels={settings.labels} rotation={rotation} spinning={spinning} />
      ) : (
        <div className="wheel-shell" aria-hidden />
      )}

      <div className="flex min-h-24 flex-col items-center gap-4">
        <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
          {spinning ? "Spinning…" : "Waiting for the buzzer"}
        </p>
      </div>

      <div
        className="celebration-screen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        hidden={!result}
      >
        {!isTryAgain && (
          <div className="confetti" aria-hidden>
            {Array.from({ length: 48 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        )}
        <div className="celebration-content">
          <div className="celebration-icon" aria-hidden>
            {isTryAgain ? <PartyPopper /> : <Trophy />}
          </div>
          <p className="celebration-kicker">{isTryAgain ? "Almost there" : "Congratulations!"}</p>
          <h2 id="celebration-title">
            {isTryAgain ? "Try Again" : "You won"}
          </h2>
          {!isTryAgain && <p className="celebration-prize">{result ?? ""}</p>}
          <Button className="btn-spin celebration-button" onClick={() => setResult(null)} autoFocus={Boolean(result)}>
            <Sparkles />
            Spin Again
          </Button>
        </div>
      </div>
    </main>
  );
}
