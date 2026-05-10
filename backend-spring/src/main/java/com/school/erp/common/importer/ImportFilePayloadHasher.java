package com.school.erp.common.importer;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Stable SHA-256 fingerprint of uploaded bytes (for idempotent job submission).
 */
public final class ImportFilePayloadHasher {

    private ImportFilePayloadHasher() {
    }

    public static String sha256Hex(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream in = Files.newInputStream(path);
                 DigestInputStream din = new DigestInputStream(in, digest)) {
                byte[] buf = new byte[65536];
                while (din.read(buf) >= 0) {
                    // digest updated by DigestInputStream
                }
            }
            return toHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
