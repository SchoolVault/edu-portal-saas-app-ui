package com.school.erp.common.importer;

import com.school.erp.common.exception.BusinessException;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class ZipCsvImportUtil {
    private ZipCsvImportUtil() {
    }

    public static List<Map<String, String>> readRows(MultipartFile file, String preferredEntryName) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        if (!filename.endsWith(".zip")) {
            throw new BusinessException("Only ZIP archives are supported");
        }
        try (InputStream inputStream = file.getInputStream(); ZipInputStream zipInputStream = new ZipInputStream(inputStream, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            byte[] csvBytes = null;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String entryName = entry.getName().toLowerCase(Locale.ROOT);
                if (entryName.endsWith(".csv") && (entryName.endsWith(preferredEntryName.toLowerCase(Locale.ROOT)) || csvBytes == null)) {
                    csvBytes = zipInputStream.readAllBytes();
                    if (entryName.endsWith(preferredEntryName.toLowerCase(Locale.ROOT))) {
                        break;
                    }
                }
            }
            if (csvBytes == null) {
                throw new BusinessException("ZIP file must contain a CSV file such as " + preferredEntryName);
            }
            return parseCsv(new String(csvBytes, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new BusinessException("Failed to read import archive: " + e.getMessage());
        }
    }

    private static List<Map<String, String>> parseCsv(String csvContent) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new BusinessException("CSV file is empty");
            }
            List<String> headers = parseCsvLine(headerLine).stream()
                    .map(header -> header.trim().toLowerCase(Locale.ROOT))
                    .toList();
            List<Map<String, String>> rows = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                List<String> values = parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    row.put(headers.get(i), i < values.size() ? values.get(i).trim() : "");
                }
                rows.add(row);
            }
            return rows;
        }
    }

    private static List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString());
        return values;
    }
}
