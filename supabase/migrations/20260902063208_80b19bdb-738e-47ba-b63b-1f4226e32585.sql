CREATE TABLE public.wheel_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  labels TEXT[] NOT NULL,
  forced_index INTEGER NOT NULL DEFAULT -1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wheel_settings TO anon, authenticated;
GRANT ALL ON public.wheel_settings TO service_role;

ALTER TABLE public.wheel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wheel settings" ON public.wheel_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update wheel settings" ON public.wheel_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert wheel settings" ON public.wheel_settings FOR INSERT WITH CHECK (true);

INSERT INTO public.wheel_settings (id, labels, forced_index) VALUES (
  'default',
  ARRAY['🎁 Mystery Box','💰 500 Coins','⭐ 2x Points','🎟️ Free Ticket','🍀 Lucky Charm','💎 Gem Pack','🔥 Hot Streak','🎉 Party Pop','🏆 Jackpot','🔁 Spin Again'],
  -1
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.wheel_settings;