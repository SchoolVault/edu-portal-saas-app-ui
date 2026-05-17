CREATE TABLE marketing_videos (
  id CHAR(36) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(220) NOT NULL,
  summary VARCHAR(1000),
  youtube_url VARCHAR(600) NOT NULL,
  thumbnail_url VARCHAR(600),
  category VARCHAR(80),
  tags VARCHAR(500),
  featured BIT(1) NOT NULL,
  published BIT(1) NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_marketing_video_slug (slug),
  KEY idx_marketing_video_published (published),
  KEY idx_marketing_video_featured (featured),
  KEY idx_marketing_video_order (display_order)
) ENGINE=InnoDB;

INSERT INTO marketing_videos (
  id, slug, title, summary, youtube_url, thumbnail_url, category, tags, featured, published, display_order
) VALUES
  (
    UUID(), 'eduportal-overview', 'EduPortal Platform Overview',
    'A complete walkthrough of EduPortal modules and role-based workflows.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL, 'Overview', 'overview,platform,erp', b'1', b'1', 10
  ),
  (
    UUID(), 'fees-and-collections', 'Fees and Collections Deep Dive',
    'See fee setup, payment capture, reconciliation and reminders in action.',
    'https://www.youtube.com/watch?v=FTQbiNvZqaY',
    NULL, 'Finance', 'fees,finance,collections', b'0', b'1', 20
  );
