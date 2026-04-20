CREATE TABLE plugin_missions_8ceb7cd69c.mission_issue_links (
  mission_issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  generated_issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  generated_kind text NOT NULL,
  generated_key text NOT NULL,
  origin_kind text NOT NULL,
  origin_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_issue_id, generated_kind, generated_key),
  UNIQUE (generated_issue_id),
  UNIQUE (origin_id)
);
