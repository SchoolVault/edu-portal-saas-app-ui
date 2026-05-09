package com.school.erp.common.importer;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.export.CsvExportSupport;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.BufferedReader;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * Streams tabular rows in batches without building a full in-memory list (50k+ rows).
 */
public final class TabularImportStreamReader {

    private static final DataFormatter XLSX_FORMATTER = new DataFormatter();

    /**
     * Onboarding/templates often append {@code " (R)"} / {@code " (O)"} to headers. Row maps must use plain keys so
     * identity column mapping and validators resolve {@code subject_code}, etc.
     */
    static String normalizeImportedHeaderLabel(String raw) {
        if (raw == null) {
            return "";
        }
        String h = raw.trim().toLowerCase(Locale.ROOT);
        return h.replaceFirst("\\s*\\([ro]\\)\\s*$", "").trim();
    }

    @FunctionalInterface
    public interface RowBatchSink {
        /**
         * @param batch        maps for one batch of data rows
         * @param firstRowIndex 0-based index of the first row in this batch (data rows only, after header)
         */
        void accept(List<Map<String, String>> batch, int firstRowIndex) throws Exception;
    }

    private TabularImportStreamReader() {
    }

    /**
     * Reads from a temp file that mirrors the uploaded multipart (same bytes as hashing).
     */
    public static int streamDataRows(Path path, String originalFilename, String preferredEntryInZip, int maxRows,
                                    int batchSize, RowBatchSink sink) throws Exception {
        if (path == null || !Files.exists(path)) {
            throw new BusinessException("Import file is required");
        }
        String filename = originalFilename != null ? originalFilename.toLowerCase(Locale.ROOT) : "";
        if (filename.endsWith(".zip")) {
            return streamFromZip(path, preferredEntryInZip, maxRows, batchSize, sink);
        }
        if (filename.endsWith(".csv")) {
            return streamCsv(path, maxRows, batchSize, sink);
        }
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return streamExcel(path, maxRows, batchSize, sink);
        }
        throw new BusinessException("Unsupported file type. Use .zip (CSV inside), .csv, or .xlsx");
    }

    private static int streamCsv(Path path, int maxRows, int batchSize, RowBatchSink sink) throws Exception {
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new BusinessException("CSV file is empty");
            }
            headerLine = CsvExportSupport.stripLeadingBom(headerLine);
            List<String> headers = TabularImportFileReader.parseCsvLine(headerLine).stream()
                    .map(TabularImportStreamReader::normalizeImportedHeaderLabel)
                    .filter(h -> !h.isBlank())
                    .toList();
            List<Map<String, String>> batch = new ArrayList<>(batchSize);
            int dataRowCount = 0;
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                if (dataRowCount >= maxRows) {
                    throw new BusinessException("CSV exceeds configured max rows (" + maxRows + ")");
                }
                List<String> values = TabularImportFileReader.parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    String h = headers.get(i);
                    if (h.isBlank()) {
                        continue;
                    }
                    row.put(h, i < values.size() ? values.get(i).trim() : "");
                }
                batch.add(row);
                dataRowCount++;
                if (batch.size() >= batchSize) {
                    int firstIndex = dataRowCount - batch.size();
                    sink.accept(batch, firstIndex);
                    batch = new ArrayList<>(batchSize);
                }
            }
            if (!batch.isEmpty()) {
                int firstIndex = dataRowCount - batch.size();
                sink.accept(batch, firstIndex);
            }
            return dataRowCount;
        }
    }

    private static int streamFromZip(Path path, String preferredEntryName, int maxRows, int batchSize, RowBatchSink sink)
            throws Exception {
        Path tmp = Files.createTempFile("import-zip-csv-", ".csv");
        String want = preferredEntryName.toLowerCase(Locale.ROOT);
        try (ZipFile zf = new ZipFile(path.toFile())) {
            ZipEntry preferred = null;
            ZipEntry firstCsv = null;
            java.util.Enumeration<? extends ZipEntry> entries = zf.entries();
            while (entries.hasMoreElements()) {
                ZipEntry e = entries.nextElement();
                if (e.isDirectory()) {
                    continue;
                }
                String name = e.getName().toLowerCase(Locale.ROOT);
                if (!name.endsWith(".csv")) {
                    continue;
                }
                if (name.endsWith(want)) {
                    preferred = e;
                    break;
                }
                if (firstCsv == null) {
                    firstCsv = e;
                }
            }
            ZipEntry chosen = preferred != null ? preferred : firstCsv;
            if (chosen == null) {
                throw new BusinessException("ZIP must contain a CSV such as " + preferredEntryName);
            }
            try (InputStream in = zf.getInputStream(chosen);
                 java.io.OutputStream out = Files.newOutputStream(tmp)) {
                in.transferTo(out);
            }
            return streamCsv(tmp, maxRows, batchSize, sink);
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    private static int streamExcel(Path path, int maxRows, int batchSize, RowBatchSink sink) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(path.toFile())) {
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
                headers.add(normalizeImportedHeaderLabel(raw));
            }
            int lastRowNum = sheet.getLastRowNum();
            List<Map<String, String>> batch = new ArrayList<>(batchSize);
            int dataRowCount = 0;
            for (int r = 1; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (row == null || rowIsEmpty(row, lastCell)) {
                    continue;
                }
                if (dataRowCount >= maxRows) {
                    throw new BusinessException("Excel exceeds configured max rows (" + maxRows + ")");
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
                    batch.add(map);
                    dataRowCount++;
                    if (batch.size() >= batchSize) {
                        int firstIndex = dataRowCount - batch.size();
                        sink.accept(batch, firstIndex);
                        batch = new ArrayList<>(batchSize);
                    }
                }
            }
            if (!batch.isEmpty()) {
                int firstIndex = dataRowCount - batch.size();
                sink.accept(batch, firstIndex);
            }
            return dataRowCount;
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

    /**
     * Reads header cells only (first row) for column-mapping UI. Headers are lowercased like data rows.
     */
    public static List<String> readHeaders(Path path, String originalFilename, String preferredEntryInZip) throws Exception {
        if (path == null || !Files.exists(path)) {
            throw new BusinessException("Import file is required");
        }
        String filename = originalFilename != null ? originalFilename.toLowerCase(Locale.ROOT) : "";
        if (filename.endsWith(".zip")) {
            Path tmp = Files.createTempFile("import-zip-csv-", ".csv");
            try {
                try (ZipFile zf = new ZipFile(path.toFile())) {
                    String want = preferredEntryInZip.toLowerCase(Locale.ROOT);
                    ZipEntry preferred = null;
                    ZipEntry firstCsv = null;
                    java.util.Enumeration<? extends ZipEntry> entries = zf.entries();
                    while (entries.hasMoreElements()) {
                        ZipEntry e = entries.nextElement();
                        if (e.isDirectory()) {
                            continue;
                        }
                        String name = e.getName().toLowerCase(Locale.ROOT);
                        if (!name.endsWith(".csv")) {
                            continue;
                        }
                        if (name.endsWith(want)) {
                            preferred = e;
                            break;
                        }
                        if (firstCsv == null) {
                            firstCsv = e;
                        }
                    }
                    ZipEntry chosen = preferred != null ? preferred : firstCsv;
                    if (chosen == null) {
                        throw new BusinessException("ZIP must contain a CSV such as " + preferredEntryInZip);
                    }
                    try (InputStream in = zf.getInputStream(chosen);
                         java.io.OutputStream out = Files.newOutputStream(tmp)) {
                        in.transferTo(out);
                    }
                }
                return readCsvHeaders(tmp);
            } finally {
                Files.deleteIfExists(tmp);
            }
        }
        if (filename.endsWith(".csv")) {
            return readCsvHeaders(path);
        }
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return readExcelHeaders(path);
        }
        throw new BusinessException("Unsupported file type. Use .zip (CSV inside), .csv, or .xlsx");
    }

    private static List<String> readCsvHeaders(Path path) throws Exception {
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new BusinessException("CSV file is empty");
            }
            String bomStripped = headerLine.charAt(0) == '\uFEFF' ? headerLine.substring(1) : headerLine;
            return TabularImportFileReader.parseCsvLine(bomStripped).stream()
                    .map(TabularImportStreamReader::normalizeImportedHeaderLabel)
                    .filter(h -> !h.isBlank())
                    .toList();
        }
    }

    private static List<String> readExcelHeaders(Path path) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(path.toFile())) {
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
                String norm = normalizeImportedHeaderLabel(raw);
                if (!norm.isBlank()) {
                    headers.add(norm);
                }
            }
            return headers;
        }
    }
}
