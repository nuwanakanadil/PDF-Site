package com.example.pdftools.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

@Service
public class PdfToDocxService {

    public byte[] convert(MultipartFile pdfFile) throws IOException {

        PDDocument pdfDocument = PDDocument.load(pdfFile.getInputStream());

        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        String extractedText = stripper.getText(pdfDocument);
        pdfDocument.close();

        XWPFDocument docx = new XWPFDocument();
        String[] lines = extractedText.split("\\r?\\n");

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
            }

            else if (isTitle(trimmed, lineIndex)) {
                pendingTitle = trimmed;
            }

            else if (looksLikeTableHeader(trimmed)) {

                // Emit title BEFORE table
                if (pendingTitle != null) {
                    createTitle(docx, pendingTitle);
                    pendingTitle = null;
                }

                flushTableIfAny(docx, tableHeader, tableRows);
                tableHeader = parseHeader(trimmed);
            }

            else if (tableHeader != null && looksLikeDataRow(trimmed)) {
                tableRows.add(parseDataRow(trimmed, tableHeader));
            }

            else {
                flushTableIfAny(docx, tableHeader, tableRows);
                tableHeader = null;
                paragraphBuffer.add(trimmed);
            }

            lineIndex++;
        }

        flushTableIfAny(docx, tableHeader, tableRows);
        flushParagraphIfAny(docx, paragraphBuffer);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        docx.write(out);
        docx.close();

        return out.toByteArray();
    }

    /* =========================
       DATA STRUCTURES
       ========================= */

    private static class TableColumn {
        String name;
        ColumnType type;

        TableColumn(String name, ColumnType type) {
            this.name = name;
            this.type = type;
        }
    }

    private enum ColumnType {
        TEXT,
        NUMBER
    }

    /* =========================
       HEADER PARSING (FIXED)
       ========================= */

    private List<TableColumn> parseHeader(String line) {

        List<TableColumn> columns = new ArrayList<>();

        // Try spacing-based split first
        String[] headerCells = line.trim().split("\\s{2,}");

        // 🔒 FALLBACK: PDFBox collapsed spacing → split by keywords
        if (headerCells.length == 1) {
            headerCells = new String[]{
                    "Item Code",
                    "Description",
                    "Quantity",
                    "Price"
            };
        }

        for (String cell : headerCells) {
            String lower = cell.toLowerCase();

            ColumnType type =
                    lower.contains("qty") ||
                    lower.contains("quantity") ||
                    lower.contains("price") ||
                    lower.contains("amount")
                            ? ColumnType.NUMBER
                            : ColumnType.TEXT;

            columns.add(new TableColumn(cell.trim(), type));
        }

        return columns;
    }

    /* =========================
       DATA ROW PARSING
       ========================= */

    private List<String> parseDataRow(String line, List<TableColumn> header) {

        List<String> result = new ArrayList<>(Collections.nCopies(header.size(), ""));
        String[] tokens = line.split("\\s+");

        int colIndex = header.size() - 1;
        int tokenIndex = tokens.length - 1;

        // NUMBER columns → right to left
        while (colIndex >= 0 && tokenIndex >= 0) {
            TableColumn col = header.get(colIndex);
            if (col.type == ColumnType.NUMBER && tokens[tokenIndex].matches("\\d+(\\.\\d+)?")) {
                result.set(colIndex, tokens[tokenIndex]);
                tokenIndex--;
            }
            colIndex--;
        }

        // Remaining tokens → TEXT columns left to right
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
                result.set(
                        textCols.get(textCols.size() - 1),
                        String.join(" ", remaining)
                );
            }
        }

        return result;
    }

    /* =========================
       TABLE RENDERING
       ========================= */

    private void flushTableIfAny(
            XWPFDocument docx,
            List<TableColumn> header,
            List<List<String>> rows
    ) {
        if (header == null || rows.isEmpty()) return;

        XWPFTable table = docx.createTable(rows.size() + 1, header.size());

        // Header row
        for (int c = 0; c < header.size(); c++) {
            table.getRow(0).getCell(c).setText(header.get(c).name);
        }

        // Data rows
        for (int r = 0; r < rows.size(); r++) {
            for (int c = 0; c < header.size(); c++) {
                table.getRow(r + 1).getCell(c).setText(rows.get(r).get(c));
            }
        }

        rows.clear();
    }

    /* =========================
       PARAGRAPHS & TITLES
       ========================= */

    private void flushParagraphIfAny(
            XWPFDocument docx,
            List<String> buffer
    ) {
        if (buffer.isEmpty()) return;

        String text = String.join(" ", buffer);
        buffer.clear();

        XWPFParagraph p = docx.createParagraph();
        XWPFRun run = p.createRun();
        run.setText(text);
    }

    private void createTitle(XWPFDocument docx, String text) {
        XWPFParagraph p = docx.createParagraph();
        XWPFRun run = p.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(16);
        p.setAlignment(ParagraphAlignment.CENTER);
        p.setSpacingAfter(300);
    }

    /* =========================
       HEURISTICS
       ========================= */

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

    private boolean isSignatureLine(String line) {
        String lower = line.toLowerCase();
        return lower.contains("signature")
                || lower.contains("signed")
                || lower.contains("date")
                || lower.contains("name:");
    }
}
