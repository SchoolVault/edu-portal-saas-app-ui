package com.school.erp.common.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String entity, Long id) {
        super(entity + " not found with id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
