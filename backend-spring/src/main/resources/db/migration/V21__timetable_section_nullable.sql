-- Allow class-level timetables when a school has no sections (was duplicate V14; renumbered for Flyway)
ALTER TABLE timetable_entries
    MODIFY COLUMN section_id BIGINT NULL;
