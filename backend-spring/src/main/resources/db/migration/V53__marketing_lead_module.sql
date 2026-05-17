CREATE TABLE marketing_leads (
  id CHAR(36) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  work_email VARCHAR(180) NOT NULL,
  phone VARCHAR(30),
  school_name VARCHAR(180),
  role VARCHAR(80),
  student_strength_range VARCHAR(40),
  city VARCHAR(80),
  country VARCHAR(80),
  message VARCHAR(2000),
  preferred_contact_time VARCHAR(60),
  source VARCHAR(20) NOT NULL,
  utm_source VARCHAR(80),
  utm_medium VARCHAR(80),
  utm_campaign VARCHAR(80),
  page_path VARCHAR(200),
  status VARCHAR(20) NOT NULL,
  privacy_consent BIT(1) NOT NULL,
  marketing_consent BIT(1) NOT NULL,
  ip_hash VARCHAR(64),
  user_agent VARCHAR(400),
  notes VARCHAR(4000),
  idempotency_key VARCHAR(80),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_marketing_lead_idem (idempotency_key),
  KEY idx_marketing_lead_status (status),
  KEY idx_marketing_lead_created (created_at),
  KEY idx_marketing_lead_source (source)
) ENGINE=InnoDB;

CREATE TABLE marketing_feature_modules (
  id CHAR(36) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  short_description VARCHAR(280) NOT NULL,
  detailed_description LONGTEXT,
  highlights VARCHAR(1000),
  enabled_for_marketing BIT(1) NOT NULL,
  sort_order INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_marketing_feature_slug (slug),
  KEY idx_marketing_feature_category (category),
  KEY idx_marketing_feature_enabled (enabled_for_marketing),
  KEY idx_marketing_feature_sort (sort_order)
) ENGINE=InnoDB;

CREATE TABLE marketing_testimonials (
  id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  designation VARCHAR(120),
  institution VARCHAR(180),
  quote VARCHAR(1500) NOT NULL,
  rating INT NOT NULL,
  avatar_url VARCHAR(400),
  featured BIT(1) NOT NULL,
  published BIT(1) NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_marketing_testimonial_published (published),
  KEY idx_marketing_testimonial_featured (featured),
  KEY idx_marketing_testimonial_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE marketing_newsletter_subscribers (
  id CHAR(36) NOT NULL,
  email VARCHAR(180) NOT NULL,
  source VARCHAR(80),
  active BIT(1) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_marketing_news_email (email)
) ENGINE=InnoDB;

INSERT INTO marketing_feature_modules (
  id, slug, name, category, short_description, detailed_description, highlights, enabled_for_marketing, sort_order, status
) VALUES
  (UUID(), 'dashboard', 'Unified Dashboard', 'Dashboard',
   'A single command center for academic, financial and operational health.',
   'Role-based dashboards for principals, owners, finance and operations teams.',
   'Role-based widgets|KPI trends|Drill-down analytics', b'1', 10, 'LIVE'),
  (UUID(), 'academic', 'Academic Management', 'Academic',
   'Curriculum, classes, subjects and calendars unified.',
   'Manage academic years, curriculum mapping and class/subject assignment workflows.',
   'Curriculum mapping|Teacher allocation|Academic calendar', b'1', 20, 'LIVE'),
  (UUID(), 'fees', 'Fees & Collections', 'Finance',
   'Structures, collections, reminders and reconciliation.',
   'Support offline and online fee collections with reconciliation and audit traceability.',
   'Payment reminders|Online payments|Reconciliation', b'1', 30, 'LIVE'),
  (UUID(), 'communication', 'Communication & Inbox', 'Communication',
   'Targeted communication for school, teacher and parent stakeholders.',
   'Run announcements, targeted updates and role-based inbox communication.',
   'Targeted broadcasts|Role inbox|Delivery tracking', b'1', 40, 'LIVE');

INSERT INTO marketing_testimonials (
  id, name, designation, institution, quote, rating, avatar_url, featured, published, display_order
) VALUES
  (UUID(), 'Anita Mehra', 'Principal', 'Greenfield Public School',
   'SchoolVault unified our admissions, attendance and communication workflows in a single platform.', 5, NULL, b'1', b'1', 10),
  (UUID(), 'Rahul Sharma', 'Trust Operations Head', 'Knowledge Valley Group',
   'The dashboard visibility and role controls helped us standardize operations across campuses.', 5, NULL, b'1', b'1', 20);
