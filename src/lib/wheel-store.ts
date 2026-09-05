import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SEGMENT_COUNT = 11;

export interface WheelSettings {
  labels: string[];
  /** 0-based index the wheel must land on, or -1 for a random outcome */
  forcedIndex: number;
  /** Increments each time the admin triggers a remote spin */
  spinNonce: number;
}

export const DEFAULT_LABELS = [
  "Free",
  "5%",
  "10%",
  "15%",
  "20%",
  "25%",
  "50%",
  "80%",
  "try again",
  "mystery box",
  "better luck next time",
];

const ROW_ID = "default";

export const DEFAULT_SETTINGS: WheelSettings = {
  labels: DEFAULT_LABELS,
  forcedIndex: -1,
  spinNonce: 0,
};

function normalize(
  labels: unknown,
  forcedIndex: unknown,
  spinNonce: unknown = 0,
): WheelSettings {
  const list = Array.isArray(labels) ? labels : [];
  return {
    labels: Array.from({ length: SEGMENT_COUNT }, (_, i) => {
      const raw = list[i];
      return typeof raw === "string" && raw.trim()
        ? raw.slice(0, 24)
        : (DEFAULT_LABELS[i] ?? `Prize ${i + 1}`);
    }),
    forcedIndex:
      typeof forcedIndex === "number" &&
      forcedIndex >= -1 &&
      forcedIndex < SEGMENT_COUNT
        ? forcedIndex
        : -1,
    spinNonce: typeof spinNonce === "number" ? spinNonce : 0,
  };
}

export async function fetchSettings(): Promise<WheelSettings> {
  const { data, error } = await supabase
    .from("wheel_settings")
    .select("labels, forced_index, spin_nonce")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return normalize(data.labels, data.forced_index, data.spin_nonce);
}

/** Save prizes/forced outcome. Requires the admin PIN — verified server-side. */
export async function saveSettings(settings: WheelSettings, pin: string) {
  const { data, error } = await supabase.rpc("update_wheel_settings", {
    _pin: pin,
    _labels: settings.labels,
    _forced_index: settings.forcedIndex,
  });
  if (error) throw error;
  if (data !== true) throw new Error("Incorrect admin PIN");
}

/** Ask every connected wheel to spin right now. */
export async function triggerRemoteSpin() {
  const { error } = await supabase.rpc("request_spin");
  if (error) throw error;
}

/** Shared settings, kept in sync live across every device. */
export function useWheelSettings(live = true) {
  const [settings, setSettings] = useState<WheelSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSettings().then((s) => {
      if (!active) return;
      setSettings(s);
      setLoading(false);
    });

    const channel = supabase
      .channel("wheel-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wheel_settings" },
        (payload) => {
          const row = payload.new as
            | { labels?: unknown; forced_index?: unknown; spin_nonce?: unknown }
            | undefined;
          if (row && live)
            setSettings(normalize(row.labels, row.forced_index, row.spin_nonce));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [live]);

  return { settings, setSettings, loading };
}
