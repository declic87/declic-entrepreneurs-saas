-- Table des templates
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  subject TEXT,
  body TEXT,
  trigger TEXT,
  target_type TEXT, -- Note: ton code JS utilise 'targetType', vérifie la correspondance
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES email_templates(id),
  recipient_email TEXT,
  recipient_name TEXT,
  subject TEXT,
  body TEXT,
  status TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);