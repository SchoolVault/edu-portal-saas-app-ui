package com.school.erp.common.importer;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.export.CsvExportSupport;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
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

/**
 * Reads tabular bulk-import payloads from {@code .zip}, {@code .csv}, or {@code .xlsx}.
 * Header row keys are normalized to lowercase for stable column access.
 */
public final class TabularImportFileReader {

    private static final int MAX_XLSX_ROWS_DEFAULT = 100_000;
    private static final DataFormatter XLSX_FORMATTER = new DataFormatter();

    private TabularImportFileReader() {
    }

    public static List<Map<String, String>> readRows(MultipartFile file, String preferredEntryInZip, int maxRows) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        try (InputStream inputStream = file.getInputStream()) {
            if (filename.endsWith(".zip")) {
                return readFromZip(inputStream, preferredEntryInZip, maxRows);
            }
            if (filename.endsWith(".csv")) {
                return parseCsv(new String(inputStream.readAllBytes(), StandardCharsets.UTF_8), maxRows);
            }
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                return readExcel(inputStream, maxRows);
            }
        } catch (IOException e) {
            throw new BusinessException("Failed to read import file: " + e.getMessage());
        }
        throw new BusinessException("Unsupported file type. Use .zip (CSV inside), .csv, or .xlsx");
    }

    private static List<Map<String, String>> readFromZip(InputStream inputStream, String preferredEntryName, int maxRows) throws IOException {
        try (ZipInputStream zipInputStream = new ZipInputStream(inputStream, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            byte[] csvBytes = null;
            String matchedName = null;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String entryName = entry.getName().toLowerCase(Locale.ROOT);
                if (entryName.endsWith(".csv") && (entryName.endsWith(preferredEntryName.toLowerCase(Locale.ROOT)) || csvBytes == null)) {
                    csvBytes = zipInputStream.readAllBytes();
                    matchedName = entryName;
                    if (entryName.endsWith(preferredEntryName.toLowerCase(Locale.ROOT))) {
                        break;
                    }
                }
            }
            if (csvBytes == null) {
                throw new BusinessException("ZIP must contain a CSV such as " + preferredEntryName + " (found: " + matchedName + ")");
            }
            return parseCsv(new String(csvBytes, StandardCharsets.UTF_8), maxRows);
        }
    }

    private static List<Map<String, String>> readExcel(InputStream inputStream, int maxRows) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new BusinessException("Excel workbook has no sheets");
            }
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BusinessException("Excel sheet is empty");
            }
            List<String> headers = new ArrayList<>();
            short lastCell = headerRow.getLastCellNum();
            for (int c = 0; c < lastCell; c++) {
                Cell cell = headerRow.getCell(c);
                String raw = cell != null ? XLSX_FORMATTER.formatCellValue(cell).trim() : "";
                headers.add(raw.toLowerCase(Locale.ROOT));
            }
            List<Map<String, String>> rows = new ArrayList<>();
            int lastRowNum = sheet.getLastRowNum();
            for (int r = 1; r <= lastRowNum; r++) {
                if (rows.size() >= maxRows) {
                    throw new BusinessException("Excel exceeds configured max rows (" + maxRows + ")");
                }
                Row row = sheet.getRow(r);
                if (row == null || rowIsEmpty(row, lastCell)) {
                    continue;
                }
                Map<String, String> map = new LinkedHashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    String key = headers.get(c);
                    if (key.isBlank()) {
                        continue;
                    }
                    Cell cell = row.getCell(c);
                    String val = cell != null ? XLSX_FORMATTER.formatCellValue(cell).trim() : "";
                    map.put(key, val);
                }
                if (!map.isEmpty()) {
                    rows.add(map);
                }
            }
            return rows;
        }
    }

    private static boolean rowIsEmpty(Row row, int maxCol) {
        for (int c = 0; c < maxCol; c++) {
            Cell cell = row.getCell(c);
            if (cell != null && !XLSX_FORMATTER.formatCellValue(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static List<Map<String, String>> parseCsv(String csvContent, int maxRows) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new java.io.ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new BusinessException("CSV file is empty");
            }
            headerLine = CsvExportSupport.stripLeadingBom(headerLine);
            List<String> headers = parseCsvLine(headerLine).stream()
                    .map(header -> header.trim().toLowerCase(Locale.ROOT))
                    .toList();
            List<Map<String, String>> rows = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (rows.size() >= maxRows) {
                    throw new BusinessException("CSV exceeds configured max rows (" + maxRows + ")");
                }
                if (line.isBlank()) {
                    continue;
                }
                List<String> values = parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    String h = headers.get(i);
                    if (h.isBlank()) {
                        continue;
                    }
                    row.put(h, i < values.size() ? values.get(i).trim() : "");
                }
                rows.add(row);
            }
            return rows;
        }
    }

    /** Exposed for {@link TabularImportStreamReader} streaming (same quoting rules). */
    public static List<String> parseCsvLine(String line) {
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

    public static int defaultMaxXlsxRows() {
        return MAX_XLSX_ROWS_DEFAULT;
    }
}
