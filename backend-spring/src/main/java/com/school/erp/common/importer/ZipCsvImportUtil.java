package com.school.erp.common.importer;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Backward-compatible entry point for ZIP/CSV/Excel bulk imports.
 *
 * @deprecated Prefer {@link TabularImportFileReader#readRows(MultipartFile, String, int)} with explicit max row cap.
 */
@Deprecated(since = "1.1", forRemoval = false)
public final class ZipCsvImportUtil {
    private ZipCsvImportUtil() {
    }

    public static List<Map<String, String>> readRows(MultipartFile file, String preferredEntryName) {
        return TabularImportFileReader.readRows(file, preferredEntryName, TabularImportFileReader.defaultMaxXlsxRows());
    }
}
