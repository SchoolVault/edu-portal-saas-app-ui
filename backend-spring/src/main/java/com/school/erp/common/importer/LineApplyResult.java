package com.school.erp.common.importer;

/**
 * Return type for idempotent import row handlers: domain payload plus ledger-friendly outcome.
 *
 * @param <T> response DTO (student, teacher, fee structure, etc.)
 */
public record LineApplyResult<T>(T value, ImportLineOutcome outcome, String naturalKey) {
}
