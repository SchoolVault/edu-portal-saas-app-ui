CREATE TABLE IF NOT EXISTS exam_classes (
    exam_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    PRIMARY KEY (exam_id, class_id),
    CONSTRAINT fk_exam_classes_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
);
