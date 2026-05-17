-- Expand testimonial seed set so public marketing pages can render richer customer proof blocks.
-- Uses deterministic IDs and upsert semantics for safe refresh across environments.
INSERT INTO marketing_testimonials (
  id, name, designation, institution, quote, rating, avatar_url, featured, published, display_order
) VALUES
  ('mt-0003-0000-0000-0000-000000000003', 'Meera Shah', 'CFO', 'Lakeside Academy Trust',
   'Rollout was calm and predictable. Finance, academics, and parent communication now operate on one aligned timeline.', 5, NULL, b'1', b'1', 30),
  ('mt-0004-0000-0000-0000-000000000004', 'Elena Vogt', 'IT Director', 'Stadt Gymnasium',
   'Role-based access is granular without feeling heavy. Our teams adopted SchoolVault quickly with minimal support overhead.', 5, NULL, b'1', b'1', 40),
  ('mt-0005-0000-0000-0000-000000000005', 'Sanjay Rao', 'Operations Manager', 'Northbridge Public School',
   'Attendance, fee follow-ups, and timetable coordination are now standardized. Daily operational delays dropped significantly.', 5, NULL, b'1', b'1', 50),
  ('mt-0006-0000-0000-0000-000000000006', 'Priya Nair', 'School Administrator', 'Horizon International School',
   'The executive dashboard gives leadership real visibility. We can spot bottlenecks early and act before they impact families.', 5, NULL, b'1', b'1', 60)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  designation = VALUES(designation),
  institution = VALUES(institution),
  quote = VALUES(quote),
  rating = VALUES(rating),
  avatar_url = VALUES(avatar_url),
  featured = VALUES(featured),
  published = VALUES(published),
  display_order = VALUES(display_order);
