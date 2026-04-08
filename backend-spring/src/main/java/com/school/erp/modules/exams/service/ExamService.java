package com.school.erp.modules.exams.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.entity.*;
import com.school.erp.modules.exams.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepo;
    private final MarkRecordRepository markRepo;

    @Transactional(readOnly = true)
    public List<ExamDTOs.ExamResponse> getExams() {
        return examRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()).stream()
                .map(e -> ExamDTOs.ExamResponse.builder()
                        .id(e.getId()).name(e.getName()).academicYearId(e.getAcademicYearId())
                        .startDate(e.getStartDate() != null ? e.getStartDate().toString() : null)
                        .endDate(e.getEndDate() != null ? e.getEndDate().toString() : null)
                        .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null).build()
                ).collect(Collectors.toList());
    }

    @Transactional
    public ExamDTOs.ExamResponse createExam(ExamDTOs.CreateExamRequest req) {
        Exam exam = Exam.builder()
                .name(req.getName()).academicYearId(req.getAcademicYearId())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .status(Enums.ExamStatus.UPCOMING).build();
        exam.setTenantId(TenantContext.getTenantId());
        examRepo.save(exam);
        log.info("Exam created: {}", exam.getName());
        return ExamDTOs.ExamResponse.builder().id(exam.getId()).name(exam.getName())
                .startDate(exam.getStartDate() != null ? exam.getStartDate().toString() : null)
                .endDate(exam.getEndDate() != null ? exam.getEndDate().toString() : null)
                .status("upcoming").build();
    }

    @Transactional
    public ExamDTOs.ExamResponse updateExamStatus(Long examId, String status) {
        Exam exam = examRepo.findById(examId).orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        exam.setStatus(Enums.ExamStatus.valueOf(status.toUpperCase()));
        examRepo.save(exam);
        return ExamDTOs.ExamResponse.builder().id(exam.getId()).name(exam.getName())
                .status(exam.getStatus().name().toLowerCase()).build();
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> getMarksByExam(Long examId) {
        return markRepo.findByTenantIdAndExamId(TenantContext.getTenantId(), examId).stream()
                .map(this::toMarkResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> getMarksByStudent(Long studentId) {
        return markRepo.findByTenantIdAndStudentId(TenantContext.getTenantId(), studentId).stream()
                .map(this::toMarkResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<ExamDTOs.MarkResponse> saveMarks(ExamDTOs.BulkMarksRequest req) {
        String t = TenantContext.getTenantId();
        List<MarkRecord> records = req.getMarks().stream().map(m -> {
            double pct = m.getMaxMarks() > 0 ? (m.getMarksObtained() / m.getMaxMarks()) * 100 : 0;
            String grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";

            MarkRecord rec = MarkRecord.builder()
                    .examId(req.getExamId()).studentId(m.getStudentId()).studentName(m.getStudentName())
                    .subjectName(m.getSubjectName()).marksObtained(m.getMarksObtained()).maxMarks(m.getMaxMarks())
                    .grade(grade).classId(m.getClassId()).build();
            rec.setTenantId(t);
            return rec;
        }).collect(Collectors.toList());

        markRepo.saveAll(records);
        log.info("Marks saved: exam={} count={}", req.getExamId(), records.size());
        return records.stream().map(this::toMarkResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExamDTOs.ReportCardResponse getReportCard(Long studentId, Long examId) {
        String t = TenantContext.getTenantId();
        List<MarkRecord> marks = examId != null
                ? markRepo.findByTenantIdAndExamId(t, examId).stream().filter(m -> m.getStudentId().equals(studentId)).collect(Collectors.toList())
                : markRepo.findByTenantIdAndStudentId(t, studentId);

        double totalObtained = marks.stream().mapToDouble(MarkRecord::getMarksObtained).sum();
        double totalMax = marks.stream().mapToDouble(MarkRecord::getMaxMarks).sum();
        double overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        String overallGrade = overallPct >= 90 ? "A+" : overallPct >= 80 ? "A" : overallPct >= 70 ? "B+" : overallPct >= 60 ? "B" : overallPct >= 50 ? "C" : "D";

        return ExamDTOs.ReportCardResponse.builder()
                .studentId(studentId).studentName(marks.isEmpty() ? "" : marks.get(0).getStudentName())
                .subjects(marks.stream().map(this::toMarkResponse).collect(Collectors.toList()))
                .totalMarks(totalObtained).totalMaxMarks(totalMax)
                .overallPercentage(Math.round(overallPct * 10) / 10.0).overallGrade(overallGrade)
                .build();
    }

    private ExamDTOs.MarkResponse toMarkResponse(MarkRecord m) {
        return ExamDTOs.MarkResponse.builder()
                .id(m.getId()).examId(m.getExamId()).studentId(m.getStudentId())
                .studentName(m.getStudentName()).subjectName(m.getSubjectName())
                .marksObtained(m.getMarksObtained()).maxMarks(m.getMaxMarks())
                .grade(m.getGrade()).classId(m.getClassId())
                .percentage(m.getMaxMarks() > 0 ? Math.round((m.getMarksObtained() / m.getMaxMarks()) * 1000) / 10.0 : 0)
                .build();
    }
}
