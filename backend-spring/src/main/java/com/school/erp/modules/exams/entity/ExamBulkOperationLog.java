package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_bulk_operation_logs", indexes = {
        @Index(name = "idx_exam_bulk_lookup", columnList = "tenant_id, operation_type, created_at, is_deleted")
})
public class ExamBulkOperationLog extends BaseEntity {
    @Column(name = "operation_type", nullable = false, length = 60)
    private String operationType;
    @Column(name = "request_id", nullable = false, length = 120)
    private String requestId;
    @Column(name = "exam_id")
    private Long examId;
    @Column(nullable = false, length = 30)
    private String status = "COMPLETED";
    @Column(name = "response_json", columnDefinition = "json")
    private String responseJson;

    public String getOperationType() { return operationType; }
    public void setOperationType(String operationType) { this.operationType = operationType; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }
}
