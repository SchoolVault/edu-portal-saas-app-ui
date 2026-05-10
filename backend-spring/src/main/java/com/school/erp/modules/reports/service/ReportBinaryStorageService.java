package com.school.erp.modules.reports.service;

import com.school.erp.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

@Service
public class ReportBinaryStorageService {

    @Value("${app.storage.report-binary-dir:tmp/report-binaries}")
    private String reportBinaryDirectory;

    @Value("${app.reports.storage.keep-db-copy:false}")
    private boolean keepDbCopy;

    public record StoredBinary(String provider, String path, long sizeBytes) {}

    public StoredBinary store(String tenantId, Long jobId, String fileName, byte[] content) {
        if (tenantId == null || tenantId.isBlank() || jobId == null || content == null) {
            throw new BusinessException("Invalid report storage request");
        }
        LocalDate today = LocalDate.now();
        String safeName = sanitizeFileName(fileName != null ? fileName : "report.bin");
        Path dir = Paths.get(reportBinaryDirectory, tenantId, String.valueOf(today.getYear()), String.format("%02d", today.getMonthValue()));
        Path path = dir.resolve(jobId + "_" + safeName);
        try {
            Files.createDirectories(dir);
            Files.write(path, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            return new StoredBinary("local-fs", path.toString(), content.length);
        } catch (IOException ex) {
            throw new BusinessException("Failed to persist generated report file");
        }
    }

    public byte[] read(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return new byte[0];
        }
        try {
            return Files.readAllBytes(Paths.get(storagePath));
        } catch (IOException ex) {
            throw new BusinessException("Stored report file is unavailable");
        }
    }

    public boolean keepDbCopy() {
        return keepDbCopy;
    }

    public Path storageRoot() {
        return Paths.get(reportBinaryDirectory).toAbsolutePath().normalize();
    }

    public List<Path> listStoredFiles() {
        Path root = storageRoot();
        if (!Files.exists(root)) {
            return List.of();
        }
        try (Stream<Path> pathStream = Files.walk(root)) {
            return pathStream
                    .filter(Files::isRegularFile)
                    .toList();
        } catch (IOException ex) {
            throw new BusinessException("Failed to list stored report files");
        }
    }

    public boolean deleteIfExists(Path path) {
        try {
            return Files.deleteIfExists(path);
        } catch (IOException ex) {
            throw new BusinessException("Failed to delete stored report file");
        }
    }

    private static String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
