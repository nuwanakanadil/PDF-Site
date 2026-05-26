package com.example.pdftools.service;

import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfToDocxService {

    private final DocumentAnalysisService documentAnalysisService;

    public PdfToDocxService(DocumentAnalysisService documentAnalysisService) {
        this.documentAnalysisService = documentAnalysisService;
    }

    public byte[] convert(MultipartFile pdfFile) throws IOException {
        DocumentAnalysisService.DocumentAnalysis analysis = documentAnalysisService.analyze(pdfFile);
        return buildDocxFromStructuredText(analysis);
    }

    private byte[] buildDocxFromStructuredText(DocumentAnalysisService.DocumentAnalysis analysis) throws IOException {
        String format = analysis.format();
        if ("markdown".equalsIgnoreCase(format)) {
            return buildDocxFromMarkdown(analysis.text());
        }
        if ("layout".equalsIgnoreCase(format)) {
            return buildDocxFromLayoutPages(analysis.pages(), analysis.text());
        }
        return buildDocxFromPlainText(analysis.text());
    }

    private byte[] buildDocxFromLayoutPages(
            List<DocumentAnalysisService.AnalyzedPage> analysisPages,
            String text) throws IOException {
        XWPFDocument docx = new XWPFDocument();
        List<String> pages = new ArrayList<>();
        if (analysisPages != null && !analysisPages.isEmpty()) {
            for (DocumentAnalysisService.AnalyzedPage page : analysisPages) {
                String pageText = normalizeWhitespace(page.text());
                if (!pageText.isBlank()) {
                    pages.add(pageText);
                }
            }
        }
        if (pages.isEmpty()) {
            pages = splitLayoutPages(text);
        }

        for (int pageIndex = 0; pageIndex < pages.size(); pageIndex++) {
            String pageText = pages.get(pageIndex);
            String[] lines = normalizeWhitespace(pageText).split("\\r?\\n");

            if (looksLikeCustomsDeclaration(pageText)) {
                renderCustomsDeclarationSummary(docx, pageIndex + 1, lines);
            }

            int lineIndex = 0;
            boolean previousWasBlank = true;

            for (String rawLine : lines) {
                String line = rawLine.replace("\u0000", "");
                String trimmed = line.trim();

                if (trimmed.isEmpty()) {
                    previousWasBlank = true;
                    lineIndex++;
                    continue;
                }

                if (trimmed.startsWith("#")) {
                    createHeading(docx, trimmed);
                    previousWasBlank = false;
                    lineIndex++;
                    continue;
                }

                if (isLayoutTitle(trimmed, lineIndex, previousWasBlank)) {
                    createLayoutTitle(docx, trimmed);
                    previousWasBlank = false;
                    lineIndex++;
                    continue;
                }

                if (line.contains("\t")) {
                    createTabbedParagraph(docx, line);
                } else {
                    createLayoutParagraph(docx, trimmed);
                }

                previousWasBlank = false;
                lineIndex++;
            }

            if (pageIndex < pages.size() - 1) {
                createPageBreak(docx);
            }
        }

        return writeDocument(docx);
    }

    private byte[] buildDocxFromPlainText(String text) throws IOException {
        XWPFDocument docx = new XWPFDocument();
        String[] lines = normalizeWhitespace(text).split("\\r?\\n");

        List<TableColumn> tableHeader = null;
        List<List<String>> tableRows = new ArrayList<>();
        List<String> paragraphBuffer = new ArrayList<>();

        String pendingTitle = null;
        int lineIndex = 0;

        for (String line : lines) {
            String trimmed = line.trim();

            if (trimmed.isEmpty()) {
                flushTableIfAny(docx, tableHeader, tableRows);
                flushParagraphIfAny(docx, paragraphBuffer);
                tableHeader = null;
            } else if (isTitle(trimmed, lineIndex)) {
                pendingTitle = trimmed;
            } else if (looksLikeTableHeader(trimmed)) {
                if (pendingTitle != null) {
                    createTitle(docx, pendingTitle);
                    pendingTitle = null;
                }

                flushTableIfAny(docx, tableHeader, tableRows);
                tableHeader = parseHeader(trimmed);
            } else if (tableHeader != null && looksLikeDataRow(trimmed)) {
                tableRows.add(parseDataRow(trimmed, tableHeader));
            } else {
                flushTableIfAny(docx, tableHeader, tableRows);
                tableHeader = null;
                paragraphBuffer.add(trimmed);
            }

            lineIndex++;
        }

        flushTableIfAny(docx, tableHeader, tableRows);
        flushParagraphIfAny(docx, paragraphBuffer);
        return writeDocument(docx);
    }

    private byte[] buildDocxFromMarkdown(String markdown) throws IOException {
        XWPFDocument docx = new XWPFDocument();
        String[] lines = normalizeWhitespace(markdown).split("\\r?\\n");
        List<String> paragraphBuffer = new ArrayList<>();

        int index = 0;
        while (index < lines.length) {
            String line = lines[index].trim();

            if (line.isEmpty()) {
                flushParagraphIfAny(docx, paragraphBuffer);
                index++;
                continue;
            }

            if (isMarkdownHeading(line)) {
                flushParagraphIfAny(docx, paragraphBuffer);
                createHeading(docx, line);
                index++;
                continue;
            }

            if (looksLikeMarkdownTableRow(line)) {
                flushParagraphIfAny(docx, paragraphBuffer);
                int nextIndex = createMarkdownTable(docx, lines, index);
                if (nextIndex > index) {
                    index = nextIndex;
                    continue;
                }
            }

            paragraphBuffer.add(stripMarkdownDecorators(line));
            index++;
        }

        flushParagraphIfAny(docx, paragraphBuffer);
        return writeDocument(docx);
    }

    private byte[] writeDocument(XWPFDocument docx) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        docx.write(out);
        docx.close();
        return out.toByteArray();
    }

    private static final class TableColumn {
        private final String name;
        private final ColumnType type;

        private TableColumn(String name, ColumnType type) {
            this.name = name;
            this.type = type;
        }
    }

    private enum ColumnType {
        TEXT,
        NUMBER
    }

    private List<TableColumn> parseHeader(String line) {
        List<TableColumn> columns = new ArrayList<>();
        String[] headerCells = line.trim().split("\\s{2,}");

        if (headerCells.length == 1) {
            headerCells = new String[] {
                    "Item Code",
                    "Description",
                    "Quantity",
                    "Price"
            };
        }

        for (String cell : headerCells) {
            String lower = cell.toLowerCase();
            ColumnType type = lower.contains("qty")
                    || lower.contains("quantity")
                    || lower.contains("price")
                    || lower.contains("amount")
                    ? ColumnType.NUMBER
                    : ColumnType.TEXT;

            columns.add(new TableColumn(cell.trim(), type));
        }

        return columns;
    }

    private List<String> parseDataRow(String line, List<TableColumn> header) {
        List<String> result = new ArrayList<>(Collections.nCopies(header.size(), ""));
        String[] tokens = line.split("\\s+");

        int colIndex = header.size() - 1;
        int tokenIndex = tokens.length - 1;

        while (colIndex >= 0 && tokenIndex >= 0) {
            TableColumn col = header.get(colIndex);
            if (col.type == ColumnType.NUMBER && tokens[tokenIndex].matches("\\d+(\\.\\d+)?")) {
                result.set(colIndex, tokens[tokenIndex]);
                tokenIndex--;
            }
            colIndex--;
        }

        List<String> remaining = new ArrayList<>();
        for (int i = 0; i <= tokenIndex; i++) {
            remaining.add(tokens[i]);
        }

        List<Integer> textCols = new ArrayList<>();
        for (int i = 0; i < header.size(); i++) {
            if (header.get(i).type == ColumnType.TEXT) {
                textCols.add(i);
            }
        }

        if (!textCols.isEmpty()) {
            if (!remaining.isEmpty()) {
                result.set(textCols.get(0), remaining.get(0));
                remaining.remove(0);
            }

            if (textCols.size() > 1) {
                result.set(textCols.get(textCols.size() - 1), String.join(" ", remaining));
            }
        }

        return result;
    }

    private void flushTableIfAny(
            XWPFDocument docx,
            List<TableColumn> header,
            List<List<String>> rows) {
        if (header == null || rows.isEmpty()) {
            return;
        }

        XWPFTable table = docx.createTable(rows.size() + 1, header.size());
        for (int col = 0; col < header.size(); col++) {
            table.getRow(0).getCell(col).setText(header.get(col).name);
        }

        for (int row = 0; row < rows.size(); row++) {
            for (int col = 0; col < header.size(); col++) {
                table.getRow(row + 1).getCell(col).setText(rows.get(row).get(col));
            }
        }

        rows.clear();
    }

    private void flushParagraphIfAny(XWPFDocument docx, List<String> buffer) {
        if (buffer.isEmpty()) {
            return;
        }

        String text = String.join(" ", buffer);
        buffer.clear();

        XWPFParagraph paragraph = docx.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.setText(text);
    }

    private void createTitle(XWPFDocument docx, String text) {
        XWPFParagraph paragraph = docx.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(16);
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        paragraph.setSpacingAfter(300);
    }

    private void createLayoutTitle(XWPFDocument docx, String text) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setSpacingAfter(180);

        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(text.length() <= 40 ? 15 : 13);
    }

    private void createSectionTitle(XWPFDocument docx, String text) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setSpacingAfter(120);

        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(13);
    }

    private void createHeading(XWPFDocument docx, String line) {
        int headingLevel = 0;
        while (headingLevel < line.length() && line.charAt(headingLevel) == '#') {
            headingLevel++;
        }

        String text = stripMarkdownDecorators(line.substring(headingLevel).trim());
        if (text.isEmpty()) {
            return;
        }

        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setSpacingAfter(240);

        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(Math.max(12, 20 - headingLevel * 2));
    }

    private void createPageBreak(XWPFDocument docx) {
        XWPFParagraph paragraph = docx.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.addBreak(BreakType.PAGE);
    }

    private void createLayoutParagraph(XWPFDocument docx, String text) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setSpacingAfter(80);

        int colonIndex = text.indexOf(':');
        boolean isLabelValue = colonIndex > 1
                && colonIndex < 32
                && !text.substring(0, colonIndex).contains("  ")
                && text.substring(0, colonIndex).split("\\s+").length <= 4;

        if (isLabelValue) {
            XWPFRun labelRun = paragraph.createRun();
            labelRun.setBold(true);
            labelRun.setText(text.substring(0, colonIndex + 1));

            String remainder = text.substring(colonIndex + 1).trim();
            if (!remainder.isEmpty()) {
                XWPFRun valueRun = paragraph.createRun();
                valueRun.setText(" " + remainder);
            }
            return;
        }

        XWPFRun run = paragraph.createRun();
        run.setText(text);
    }

    private void createTabbedParagraph(XWPFDocument docx, String text) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setSpacingAfter(80);

        String[] segments = text.split("\\t", -1);
        for (int i = 0; i < segments.length; i++) {
            String segment = segments[i].trim();
            if (!segment.isEmpty()) {
                appendStyledSegment(paragraph, segment);
            }

            if (i < segments.length - 1) {
                XWPFRun tabRun = paragraph.createRun();
                tabRun.addTab();
            }
        }
    }

    private void createKeyValueTable(XWPFDocument docx, Map<String, String> fields) {
        if (fields.isEmpty()) {
            return;
        }

        XWPFTable table = docx.createTable(fields.size(), 2);
        int rowIndex = 0;
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            table.getRow(rowIndex).getCell(0).setText(entry.getKey());
            table.getRow(rowIndex).getCell(1).setText(entry.getValue());
            rowIndex++;
        }
    }

    private void appendStyledSegment(XWPFParagraph paragraph, String segment) {
        int colonIndex = segment.indexOf(':');
        boolean isLabelValue = colonIndex > 1
                && colonIndex < 24
                && segment.substring(0, colonIndex).split("\\s+").length <= 3;

        if (isLabelValue) {
            XWPFRun labelRun = paragraph.createRun();
            labelRun.setBold(true);
            labelRun.setText(segment.substring(0, colonIndex + 1));

            String remainder = segment.substring(colonIndex + 1).trim();
            if (!remainder.isEmpty()) {
                XWPFRun valueRun = paragraph.createRun();
                valueRun.setText(" " + remainder);
            }
            return;
        }

        XWPFRun run = paragraph.createRun();
        run.setText(segment);
    }

    private int createMarkdownTable(XWPFDocument docx, String[] lines, int startIndex) {
        List<List<String>> rows = new ArrayList<>();
        int index = startIndex;

        while (index < lines.length && looksLikeMarkdownTableRow(lines[index].trim())) {
            rows.add(splitMarkdownTableRow(lines[index].trim()));
            index++;
        }

        if (rows.size() < 2 || !isMarkdownSeparatorRow(rows.get(1))) {
            return startIndex;
        }

        List<String> header = rows.get(0);
        List<List<String>> dataRows = new ArrayList<>();
        for (int i = 2; i < rows.size(); i++) {
            dataRows.add(rows.get(i));
        }

        XWPFTable table = docx.createTable(Math.max(1, dataRows.size()) + 1, header.size());
        for (int col = 0; col < header.size(); col++) {
            table.getRow(0).getCell(col).setText(stripMarkdownDecorators(header.get(col)));
        }

        for (int row = 0; row < dataRows.size(); row++) {
            List<String> cells = dataRows.get(row);
            for (int col = 0; col < header.size() && col < cells.size(); col++) {
                table.getRow(row + 1).getCell(col).setText(stripMarkdownDecorators(cells.get(col)));
            }
        }

        return index;
    }

    private boolean looksLikeTableHeader(String line) {
        String lower = line.toLowerCase();
        return lower.contains("description")
                || lower.contains("quantity")
                || lower.contains("price")
                || lower.contains("amount")
                || lower.contains("code");
    }

    private boolean looksLikeDataRow(String line) {
        return line.matches(".*\\d+.*");
    }

    private boolean isTitle(String line, int lineIndex) {
        return lineIndex < 3
                && line.equals(line.toUpperCase())
                && line.length() < 50
                && !line.matches(".*\\d.*");
    }

    private boolean isLayoutTitle(String line, int lineIndex, boolean previousWasBlank) {
        boolean earlyInBlock = lineIndex < 4 || previousWasBlank;
        boolean uppercase = line.equals(line.toUpperCase());
        boolean shortEnough = line.length() <= 70;
        boolean mostlyLetters = !line.matches(".*\\d{4,}.*");

        return earlyInBlock
                && shortEnough
                && mostlyLetters
                && (uppercase || line.startsWith("SCHEDULE") || line.startsWith("DECLARATION"));
    }

    private boolean looksLikeCustomsDeclaration(String pageText) {
        String normalized = pageText.toUpperCase();
        return normalized.contains("CUSDECI")
                || normalized.contains("GOODSDECLARATION")
                || normalized.contains("CUSTOMS-GOODSDECLARATION");
    }

    private List<String> splitLayoutPages(String text) {
        String normalized = normalizeWhitespace(text);
        String[] parts = normalized.split("\\n\\s*\\[\\[PAGE_BREAK\\]\\]\\s*\\n");
        List<String> pages = new ArrayList<>();
        for (String part : parts) {
            String page = part.trim();
            if (!page.isEmpty()) {
                pages.add(page);
            }
        }
        return pages;
    }

    private void renderCustomsDeclarationSummary(XWPFDocument docx, int pageNumber, String[] lines) {
        Map<String, String> fields = extractCustomsFields(lines);
        if (fields.isEmpty()) {
            return;
        }

        createSectionTitle(docx, "Declaration Summary - Page " + pageNumber);
        createKeyValueTable(docx, fields);
        XWPFParagraph spacer = docx.createParagraph();
        spacer.setSpacingAfter(180);
    }

    private Map<String, String> extractCustomsFields(String[] lines) {
        Map<String, String> fields = new LinkedHashMap<>();
        String pageText = String.join("\n", lines);

        String declarationType = firstNonEmpty(lines);
        if (declarationType != null) {
            fields.put("Document", declarationType);
        }

        String declarationRef = matchGroup(pageText, "\\bE\\s*(\\d{4,})\\b");
        String declarationDate = matchGroup(pageText, "\\b(\\d{2}/\\d{2}/\\d{4})\\b");
        String sequence = matchGroup(pageText, "(#\\d+)");
        String exporterTin = findTinNearMarker(lines, "Exporter", 1);

        putIfPresent(fields, "Declaration Ref", declarationRef);
        putIfPresent(fields, "Declaration Date", declarationDate);
        putIfPresent(fields, "Sequence No", sequence);
        putIfPresent(fields, "Exporter TIN", exporterTin);

        String exporter = collectFirstColumnBlock(lines, "Exporter", 5,
                "Release", "8Consignee", "5Items", "Manifest");
        String consignee = collectFirstColumnBlock(lines, "Consignee", 6,
                "Cons/First", "14Declarant/Representative", "14 Declarant/Representative",
                "18Vessel/Flight", "18 Vessel/Flight");
        String declarant = collectFirstColumnBlock(lines, "Declarant/Representative", 5,
                "18Vessel/Flight", "18 Vessel/Flight", "21Voyage", "21 Voyage");
        String financialSettlement = collectLastColumnBlock(lines, "Financial Settlement", 4,
                "Cons/First", "15Countryof Export", "15 Countryof Export",
                "17 Country of destination", "18Vessel/Flight", "18 Vessel/Flight");

        putIfPresent(fields, "Exporter", exporter);
        putIfPresent(fields, "Consignee", consignee);
        putIfPresent(fields, "Declarant", declarant);
        putIfPresent(fields, "Financial Settlement", financialSettlement);

        putIfPresent(fields, "Country of Export",
                findColumnValueBelowMarker(lines, "Countryof Export", 1, 4));
        putIfPresent(fields, "Country of Destination",
                findColumnValueBelowMarker(lines, "Country of destination", 2, 3));
        putIfPresent(fields, "Vessel / Flight",
                findFirstColumnBelowMarker(lines, "Vessel/Flight", 2));
        putIfPresent(fields, "Voyage / Date",
                findFirstColumnBelowMarker(lines, "Voyage", 2));

        addAmountFields(fields, lines);

        putIfPresent(fields, "Bank Name", normalizeLabelValue(matchLineValue(lines, "Bank Name:")));
        putIfPresent(fields, "Bank Ref", normalizeLabelValue(matchLineValue(lines, "Ref.No:")));
        putIfPresent(fields, "Goods Description", extractGoodsDescription(lines));
        putIfPresent(fields, "HS Code", matchGroup(pageText, "\\b(\\d{8}\\s\\d{2})\\b"));
        putIfPresent(fields, "Gross Mass (Kg)", matchGroup(pageText, "\\b(\\d{1,3},\\d{3}\\.\\d{2})PSFTA\\b"));
        putIfPresent(fields, "Net Mass (Kg)", matchGroup(pageText, "\\b1000\\s+000\\s+(\\d{1,3},\\d{3}\\.\\d{2})\\b"));
        putIfPresent(fields, "Mode of Payment", extractTabbedValue(lines, "Mode of Payment"));
        putIfPresent(fields, "Assessment Number",
                matchGroup(pageText, "Assessment\\s*Number\\s*[：:]?\\s*([A-Z.]?\\d{4,})"));
        putIfPresent(fields, "Receipt Number",
                matchGroup(pageText, "Receipt\\s*Number\\s*[：:]?\\s*([A-Z.]?\\d{4,})"));
        putIfPresent(fields, "Invoice Value", extractInvoiceValue(lines));

        return fields;
    }

    private String firstNonEmpty(String[] lines) {
        for (String line : lines) {
            String trimmed = trimToNull(line);
            if (trimmed != null) {
                return trimmed;
            }
        }
        return null;
    }

    private String collectFirstColumnBlock(
            String[] lines,
            String marker,
            int maxLines,
            String... stopMarkers) {
        int start = indexOfContains(lines, marker);
        if (start < 0) {
            return null;
        }

        List<String> block = new ArrayList<>();
        for (int i = start + 1; i < Math.min(lines.length, start + maxLines + 1); i++) {
            String column = firstColumn(lines[i]);
            if (column == null) {
                continue;
            }
            if (containsAny(column, stopMarkers)) {
                break;
            }
            String normalized = cleanFieldFragment(column);
            if (normalized != null && !looksLikeBoilerplateValue(normalized)) {
                block.add(normalized);
            }
        }

        return joinDistinctFragments(block);
    }

    private String collectLastColumnBlock(
            String[] lines,
            String marker,
            int maxLines,
            String... stopMarkers) {
        int index = indexOfContains(lines, marker);
        if (index < 0) {
            return null;
        }

        List<String> block = new ArrayList<>();
        for (int i = index; i < Math.min(lines.length, index + maxLines + 1); i++) {
            String column = lastColumn(lines[i]);
            if (column == null) {
                continue;
            }
            if (i > index && containsAny(column, stopMarkers)) {
                break;
            }
            String normalized = cleanFieldFragment(removeKnownPrefix(column, marker));
            normalized = stripLeadingTinValue(normalized);
            if (normalized != null && !looksLikeBoilerplateValue(normalized)) {
                block.add(normalized);
            }
        }

        return joinDistinctFragments(block);
    }

    private void addAmountFields(Map<String, String> fields, String[] lines) {
        String amountLine = lineContaining(lines, "Currency&Total Amount Invoiced");
        int amountLineIndex = indexOfLine(lines, amountLine);
        if (amountLineIndex < 0 || amountLineIndex + 1 >= lines.length) {
            return;
        }

        List<String> segments = splitColumns(lines[amountLineIndex + 1]);
        if (segments.size() < 4) {
            return;
        }

        putIfPresent(fields, "Currency", trimToNull(segments.get(Math.max(0, segments.size() - 4))));
        putIfPresent(fields, "Invoice Amount", trimToNull(segments.get(Math.max(0, segments.size() - 3))));
        putIfPresent(fields, "Exchange Rate", trimToNull(segments.get(Math.max(0, segments.size() - 2))));
        putIfPresent(fields, "Nature", trimToNull(segments.get(Math.max(0, segments.size() - 1))));
    }

    private String findTinNearMarker(String[] lines, String marker, int searchDepth) {
        int index = indexOfContains(lines, marker);
        if (index < 0) {
            return null;
        }

        for (int i = index; i < Math.min(lines.length, index + searchDepth + 1); i++) {
            String tin = matchGroup(lines[i], "(?:TIN|:NI|\\bNI)\\s*[：:]?\\s*([0-9][0-9\\-]{7,})");
            if (tin != null) {
                return tin;
            }
        }

        return null;
    }

    private String findColumnValueBelowMarker(
            String[] lines,
            String marker,
            int columnIndex,
            int searchDepth) {
        int index = indexOfContains(lines, marker);
        if (index < 0) {
            return null;
        }

        for (int i = index + 1; i < Math.min(lines.length, index + searchDepth + 1); i++) {
            List<String> columns = splitColumns(lines[i]);
            if (columns.size() <= columnIndex) {
                continue;
            }

            String candidate = cleanFieldFragment(columns.get(columnIndex));
            if (candidate != null && isLikelyFieldValue(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    private String findFirstColumnBelowMarker(String[] lines, String marker, int searchDepth) {
        int index = indexOfContains(lines, marker);
        if (index < 0) {
            return null;
        }

        for (int i = index + 1; i < Math.min(lines.length, index + searchDepth + 1); i++) {
            String candidate = cleanFieldFragment(firstColumn(lines[i]));
            if (candidate != null && isLikelyFieldValue(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    private String extractTabbedValue(String[] lines, String marker) {
        int index = indexOfContains(lines, marker);
        if (index < 0) {
            return null;
        }

        List<String> columns = splitColumns(lines[index]);
        if (columns.size() >= 2) {
            return cleanFieldFragment(columns.get(columns.size() - 1));
        }

        return findFirstColumnBelowMarker(lines, marker, 1);
    }

    private String extractInvoiceValue(String[] lines) {
        int index = indexOfContains(lines, "Invoice Value");
        if (index < 0) {
            index = indexOfContains(lines, "InvoiceValue");
        }
        if (index < 0) {
            return null;
        }

        List<String> columns = splitColumns(lines[index]);
        if (columns.size() >= 2) {
            return cleanFieldFragment(columns.get(columns.size() - 1));
        }

        String line = lines[index];
        String direct = matchGroup(line, "Invoice\\s*Value\\s*[：:]?\\s*(?:[A-Z]{3}\\s*)?([0-9,]+\\.\\d{2})");
        if (direct != null) {
            return direct;
        }

        if (index + 1 < lines.length) {
            return cleanFieldFragment(firstColumn(lines[index + 1]));
        }

        return null;
    }

    private String extractGoodsDescription(String[] lines) {
        String line = lineContaining(lines, "Description:");
        if (line == null) {
            return null;
        }

        List<String> columns = splitColumns(line);
        String firstColumn = columns.isEmpty() ? line : columns.get(0);
        String afterLabel = matchGroup(firstColumn, "Description\\s*[：:]\\s*(.+)");
        if (afterLabel != null) {
            return cleanFieldFragment(afterLabel);
        }

        Matcher beforeLabel = Pattern.compile("(.+?)\\s+Description\\s*[：:]?$").matcher(firstColumn);
        if (beforeLabel.find()) {
            return cleanFieldFragment(beforeLabel.group(1));
        }

        return cleanFieldFragment(normalizeLabelValue(firstColumn));
    }

    private String matchLineValue(String[] lines, String marker) {
        String line = lineContaining(lines, marker);
        if (line == null) {
            return null;
        }
        return line;
    }

    private String lineContaining(String[] lines, String marker) {
        for (String line : lines) {
            if (containsLoose(line, marker)) {
                return line;
            }
        }
        return null;
    }

    private int indexOfLine(String[] lines, String target) {
        if (target == null) {
            return -1;
        }
        for (int i = 0; i < lines.length; i++) {
            if (target.equals(lines[i])) {
                return i;
            }
        }
        return -1;
    }

    private int indexOfContains(String[] lines, String marker) {
        for (int i = 0; i < lines.length; i++) {
            if (containsLoose(lines[i], marker)) {
                return i;
            }
        }
        return -1;
    }

    private boolean containsAny(String value, String... markers) {
        for (String marker : markers) {
            if (containsLoose(value, marker)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsLoose(String value, String marker) {
        if (value == null || marker == null) {
            return false;
        }
        String rawValue = value.toLowerCase();
        String rawMarker = marker.toLowerCase();
        if (rawValue.contains(rawMarker)) {
            return true;
        }
        return normalizeLooseKey(rawValue).contains(normalizeLooseKey(rawMarker));
    }

    private String removeKnownPrefix(String value, String marker) {
        if (value == null) {
            return null;
        }
        int index = value.toLowerCase().indexOf(marker.toLowerCase());
        if (index >= 0) {
            return value.substring(index + marker.length()).trim();
        }
        return value;
    }

    private String normalizeLooseKey(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]+", "");
    }

    private String firstColumn(String line) {
        List<String> columns = splitColumns(line);
        return columns.isEmpty() ? trimToNull(line) : trimToNull(columns.get(0));
    }

    private String lastColumn(String line) {
        List<String> columns = splitColumns(line);
        if (columns.size() < 2) {
            return null;
        }
        return trimToNull(columns.get(columns.size() - 1));
    }

    private List<String> splitColumns(String line) {
        if (line == null) {
            return Collections.emptyList();
        }

        String[] rawColumns = line.split("\\t+");
        List<String> columns = new ArrayList<>();
        for (String rawColumn : rawColumns) {
            String column = trimToNull(rawColumn);
            if (column != null) {
                columns.add(column);
            }
        }
        return columns;
    }

    private String cleanFieldFragment(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        normalized = normalized
                .replace('，', ',')
                .replace('：', ':')
                .replaceAll("\\s+", " ")
                .trim();
        normalized = normalized.replaceFirst("^(Information|Release|Header)\\s+", "");
        normalized = normalized.replaceFirst("^granted\\s+", "");
        normalized = normalized.replaceFirst("^Order\\s+", "");
        normalized = normalized.replaceFirst("^Mode of Payment\\s+", "");
        normalized = trimToNull(normalized);
        return normalized;
    }

    private String stripLeadingTinValue(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        normalized = normalized.replaceFirst("^(?:\\d+\\s*)?Person\\s*Responsible\\s*for\\s*Financial\\s*Settlement\\s*", "");
        normalized = normalized.replaceFirst("^[:：]?\\s*(?:TIN\\s*[:：]?\\s*)?(?:NI\\s+)?[0-9\\-]{8,}\\s*", "");
        normalized = trimToNull(normalized);
        return normalized;
    }

    private boolean looksLikeBoilerplateValue(String value) {
        if (value == null) {
            return true;
        }
        String normalized = value.replace(" ", "");
        return normalized.isEmpty()
                || normalized.equalsIgnoreCase("Manifest")
                || normalized.startsWith("Cons/First")
                || normalized.startsWith("Ctyof")
                || normalized.startsWith("Countryof")
                || normalized.startsWith("Countryoforigin")
                || normalized.startsWith("CountryofExport")
                || normalized.startsWith("Countryofdestination");
    }

    private boolean isLikelyFieldValue(String value) {
        if (value == null || looksLikeBoilerplateValue(value)) {
            return false;
        }

        String lower = value.toLowerCase();
        return !lower.contains("countryof")
                && !lower.contains("cty.")
                && !lower.contains("declarant")
                && !lower.contains("vessel/flight")
                && !lower.contains("voyage")
                && !lower.contains("date:")
                && !lower.contains("code");
    }

    private String joinDistinctFragments(List<String> fragments) {
        List<String> deduped = new ArrayList<>();
        for (String fragment : fragments) {
            String normalized = trimToNull(fragment);
            if (normalized == null) {
                continue;
            }
            if (deduped.isEmpty() || !deduped.get(deduped.size() - 1).equalsIgnoreCase(normalized)) {
                deduped.add(normalized);
            }
        }
        return deduped.isEmpty() ? null : String.join(", ", deduped);
    }

    private void putIfPresent(Map<String, String> fields, String key, String value) {
        String normalized = trimToNull(value);
        if (normalized != null) {
            fields.put(key, normalized);
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeLabelValue(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        int colonIndex = trimmed.indexOf(':');
        if (colonIndex >= 0 && colonIndex < trimmed.length() - 1) {
            return trimToNull(trimmed.substring(colonIndex + 1));
        }
        return trimmed;
    }

    private String matchGroup(String text, String pattern) {
        if (text == null) {
            return null;
        }
        Matcher matcher = Pattern.compile(pattern).matcher(text);
        if (matcher.find()) {
            return trimToNull(matcher.group(1));
        }
        return null;
    }

    private String normalizeWhitespace(String text) {
        return text == null ? "" : text.replace("\u0000", "").trim();
    }

    private boolean isMarkdownHeading(String line) {
        return line.startsWith("#");
    }

    private boolean looksLikeMarkdownTableRow(String line) {
        return line.startsWith("|") && line.endsWith("|") && line.length() > 2;
    }

    private List<String> splitMarkdownTableRow(String line) {
        String normalized = line;
        if (normalized.startsWith("|")) {
            normalized = normalized.substring(1);
        }
        if (normalized.endsWith("|")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        String[] cells = normalized.split("\\|", -1);
        List<String> results = new ArrayList<>(cells.length);
        for (String cell : cells) {
            results.add(cell.trim());
        }
        return results;
    }

    private boolean isMarkdownSeparatorRow(List<String> row) {
        if (row.isEmpty()) {
            return false;
        }

        for (String cell : row) {
            String normalized = cell.replace(":", "").replace("-", "").trim();
            if (!normalized.isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String stripMarkdownDecorators(String text) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.startsWith("- ") || normalized.startsWith("* ")) {
            normalized = normalized.substring(2).trim();
        }
        return normalized.replace("**", "").replace("__", "");
    }

}
