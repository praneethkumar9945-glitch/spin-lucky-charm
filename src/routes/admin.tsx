import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Dices, Save, Sparkles, Target } from "lucide-react";
import {
  saveSettings,
  SEGMENT_COUNT,
  triggerRemoteSpin,
  useWheelSettings,
} from "@/lib/wheel-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Controls — Lucky Spin Wheel" },
      { name: "description", content: "Edit the 10 wheel prizes and control where the lucky wheel stops." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { settings, setSettings, loading } = useWheelSettings(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spinSent, setSpinSent] = useState(false);

  const remoteSpin = async () => {
    setError(null);
    try {
      await triggerRemoteSpin();
      setSpinSent(true);
      window.setTimeout(() => setSpinSent(false), 4000);
    } catch {
      setError("Could not start the spin. Check your connection and try again.");
    }
  };

  const updateLabel = (i: number, value: string) => {
    setSettings((s) => {
      const labels = [...s.labels];
      labels[i] = value.slice(0, 24);
      return { ...s, labels };
    });
    setSaved(false);
  };

  const setForced = (i: number) => {
    setSettings((s) => ({ ...s, forcedIndex: s.forcedIndex === i ? -1 : i }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveSettings({
        labels: settings.labels.map((l, i) => (l.trim() ? l : `Prize ${i + 1}`)),
        forcedIndex: settings.forcedIndex,
        spinNonce: settings.spinNonce,
      });
      setSaved(true);
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <Link to="/" className="link-admin mb-6 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to wheel
      </Link>

      <h1 className="font-display text-3xl font-black tracking-tight">Admin Controls</h1>
      <p className="mt-2 text-muted-foreground">
        Edit the 10 prizes and choose where the wheel will stop. Leave the target on
        “Random” for a fair spin. Changes sync live to every device showing the wheel.
      </p>
      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading shared settings…</p>}

      <section className="mt-8 space-y-3">
        {settings.labels.map((label, i) => {
          const forced = settings.forcedIndex === i;
          return (
            <div key={i} className={`admin-row ${forced ? "admin-row-forced" : ""}`}>
              <span className="admin-index">{i + 1}</span>
              <input
                value={label}
                onChange={(e) => updateLabel(i, e.target.value)}
                maxLength={24}
                className="admin-input"
                aria-label={`Prize ${i + 1} label`}
              />
              <button
                onClick={() => setForced(i)}
                className={forced ? "btn-target btn-target-active" : "btn-target"}
                aria-pressed={forced}
              >
                <Target className="h-4 w-4" />
                {forced ? "Will stop here" : "Stop here"}
              </button>
            </div>
          );
        })}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={() => setSettings((s) => ({ ...s, forcedIndex: -1 }))} className="btn-target">
          <Dices className="h-4 w-4" /> Random outcome
        </button>
        <button onClick={save} className="btn-spin" disabled={saving || loading}>
          <Save className="h-5 w-5" /> {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={remoteSpin} className="btn-spin" disabled={loading}>
          <Sparkles className="h-5 w-5" />
          {spinSent ? "Spinning now!" : "Spin the wheel remotely"}
        </button>
        <span className="text-sm text-muted-foreground">
          Starts the spin on every device showing the wheel.
        </span>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}


      <p className="mt-4 text-sm text-muted-foreground">
        {settings.forcedIndex >= 0
          ? `Next spin is rigged to stop on “${settings.labels[settings.forcedIndex]}”. Remember to save.`
          : `Outcome is currently random across all ${SEGMENT_COUNT} prizes.`}
      </p>
    </main>
  );
}
