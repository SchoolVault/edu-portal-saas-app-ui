package com.school.erp.modules.documents.service;

import com.school.erp.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class DocumentBinaryStoreService {
    private final Path root;

    public record StoredFile(String storageKey, String checksumSha256, long sizeBytes, String mimeType) {}

    public DocumentBinaryStoreService(@Value("${app.storage.documents-root:./data/documents}") String rootPath) {
        this.root = Path.of(rootPath).toAbsolutePath().normalize();
    }

    public StoredFile store(String tenantId, Long academicYearId, String storageKey, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required.");
        }
        Path target = resolvePath(tenantId, academicYearId, storageKey);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String sha = sha256Hex(target);
            String mime = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            return new StoredFile(storageKey, sha, Files.size(target), mime);
        } catch (IOException ex) {
            throw new BusinessException("Failed to store file.");
        }
    }

    public Resource load(String tenantId, Long academicYearId, String storageKey) {
        Path path = resolvePath(tenantId, academicYearId, storageKey);
        if (!Files.exists(path)) {
            throw new BusinessException("Document binary not found.");
        }
        return new FileSystemResource(path);
    }

    private Path resolvePath(String tenantId, Long academicYearId, String storageKey) {
        Path path = root.resolve(tenantId).resolve("ay-" + (academicYearId == null ? "NA" : academicYearId)).resolve(storageKey).normalize();
        if (!path.startsWith(root)) {
            throw new BusinessException("Invalid storage key.");
        }
        return path;
    }

    private static String sha256Hex(Path path) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] data = Files.readAllBytes(path);
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException | IOException ex) {
            throw new BusinessException("Failed to compute file checksum.");
        }
    }
}
