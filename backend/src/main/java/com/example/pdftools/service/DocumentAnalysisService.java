package com.example.pdftools.service;

import com.example.pdftools.config.PaddleOcrProperties;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentAnalysisService {

    private final PaddleOcrClient paddleOcrClient;
    private final PaddleOcrProperties paddleOcrProperties;

    public DocumentAnalysisService(
            PaddleOcrClient paddleOcrClient,
            PaddleOcrProperties paddleOcrProperties) {
        this.paddleOcrClient = paddleOcrClient;
        this.paddleOcrProperties = paddleOcrProperties;
    }

    public DocumentAnalysis analyze(MultipartFile pdfFile) throws IOException {
        DirectExtraction directExtraction = extractDirectText(pdfFile);
        if (hasEnoughDirectText(directExtraction.text())) {
            return buildAnalysis(
                    "direct-pdfbox",
                    "pdfbox",
                    "plain",
                    directExtraction.pages());
        }

        String ocrFailureMessage = null;

        if (paddleOcrClient.isEnabled()) {
            try {
                PaddleOcrClient.OcrDocumentResponse ocrResponse = paddleOcrClient.extractPdf(pdfFile);
                DocumentAnalysis ocrAnalysis = buildOcrAnalysis(ocrResponse);
                if (ocrAnalysis != null && !ocrAnalysis.text().isBlank()) {
                    return ocrAnalysis;
                }
            } catch (RuntimeException ex) {
                ocrFailureMessage = rootMessage(ex);
            }
        }

        if (!directExtraction.text().isBlank()) {
            return buildAnalysis(
                    "direct-pdfbox-fallback",
                    "pdfbox",
                    "plain",
                    directExtraction.pages());
        }

        if (ocrFailureMessage != null) {
            throw new IllegalStateException(
                    "Could not extract text from this PDF. It appears to be a scanned or image-based document, and OCR failed: "
                            + ocrFailureMessage);
        }

        if (paddleOcrClient.isEnabled()) {
            throw new IllegalStateException(
                    "Could not extract text from this PDF. It appears to be a scanned or image-based document, but OCR returned no usable text.");
        }

        throw new IllegalStateException(
                "Could not extract text from this PDF. The document appears to be image-based and OCR is disabled.");
    }

    private DirectExtraction extractDirectText(MultipartFile pdfFile) throws IOException {
        List<PageSeed> pageSeeds = new ArrayList<>();

        try (RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(pdfFile.getInputStream());
                PDDocument pdfDocument = Loader.loadPDF(buffer)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            for (int pageNumber = 1; pageNumber <= pdfDocument.getNumberOfPages(); pageNumber++) {
                stripper.setStartPage(pageNumber);
                stripper.setEndPage(pageNumber);
                String pageText = normalizeWhitespace(stripper.getText(pdfDocument));
                pageSeeds.add(new PageSeed(pageNumber, pageText));
            }
        }

        String fullText = pageSeeds.stream()
                .map(PageSeed::text)
                .filter(text -> !text.isBlank())
                .reduce((left, right) -> left + "\n\n" + right)
                .orElse("");

        return new DirectExtraction(fullText, pageSeeds);
    }

    private DocumentAnalysis buildOcrAnalysis(PaddleOcrClient.OcrDocumentResponse response) {
        if (response == null) {
            return null;
        }

        List<PageSeed> pageSeeds = new ArrayList<>();
        if (response.pages() != null && !response.pages().isEmpty()) {
            for (PaddleOcrClient.OcrPage page : response.pages()) {
                pageSeeds.add(new PageSeed(
                        page.pageNumber() == null ? pageSeeds.size() + 1 : page.pageNumber(),
                        normalizeWhitespace(page.text())));
            }
        } else if (response.text() != null && !response.text().isBlank()) {
            String[] parts = normalizeWhitespace(response.text())
                    .split("\\n\\s*\\[\\[PAGE_BREAK\\]\\]\\s*\\n");
            for (int i = 0; i < parts.length; i++) {
                pageSeeds.add(new PageSeed(i + 1, normalizeWhitespace(parts[i])));
            }
        }

        return buildAnalysis(
                "ocr-model",
                trimToDefault(response.engine(), "ocr"),
                trimToDefault(response.format(), "plain"),
                pageSeeds);
    }

    private DocumentAnalysis buildAnalysis(
            String source,
            String engine,
            String format,
            List<PageSeed> pageSeeds) {
        List<AnalyzedPage> pages = new ArrayList<>();
        List<String> nonBlankPageTexts = new ArrayList<>();

        for (PageSeed pageSeed : pageSeeds) {
            String pageText = normalizeWhitespace(pageSeed.text());
            if (!pageText.isBlank()) {
                nonBlankPageTexts.add(pageText);
            }

            List<ContentBlock> blocks = extractBlocks(pageSeed.pageNumber(), pageText, format);
            pages.add(new AnalyzedPage(
                    pageSeed.pageNumber(),
                    detectPageTitle(pageText, blocks),
                    pageText,
                    blocks));
        }

        String separator = "layout".equalsIgnoreCase(format)
                ? "\n\n[[PAGE_BREAK]]\n\n"
                : "\n\n";
        String fullText = String.join(separator, nonBlankPageTexts);

        return new DocumentAnalysis(
                source,
                engine,
                format,
                fullText,
                pages);
    }

    private List<ContentBlock> extractBlocks(int pageNumber, String pageText, String format) {
        List<ContentBlock> blocks = new ArrayList<>();
        if (pageText.isBlank()) {
            return blocks;
        }

        String[] lines = pageText.split("\\r?\\n");
        int blockIndex = 0;
        StringBuilder paragraphBuffer = new StringBuilder();
        boolean previousWasBlank = true;

        for (int lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            String trimmed = trimToNull(lines[lineIndex]);

            if (trimmed == null) {
                blockIndex = flushParagraphBlock(blocks, pageNumber, blockIndex, paragraphBuffer);
                previousWasBlank = true;
                continue;
            }

            if ("layout".equalsIgnoreCase(format) && isLikelyHeading(trimmed, lineIndex, previousWasBlank)) {
                blockIndex = flushParagraphBlock(blocks, pageNumber, blockIndex, paragraphBuffer);
                blocks.add(new ContentBlock(
                        blockId(pageNumber, blockIndex++),
                        "heading",
                        trimmed,
                        blockIndex));
                previousWasBlank = false;
                continue;
            }

            if ("layout".equalsIgnoreCase(format) && trimmed.contains("\t")) {
                blockIndex = flushParagraphBlock(blocks, pageNumber, blockIndex, paragraphBuffer);
                blocks.add(new ContentBlock(
                        blockId(pageNumber, blockIndex++),
                        "row",
                        trimmed,
                        blockIndex));
                previousWasBlank = false;
                continue;
            }

            if (paragraphBuffer.length() > 0) {
                paragraphBuffer.append("\n");
            }
            paragraphBuffer.append(trimmed);
            previousWasBlank = false;
        }

        flushParagraphBlock(blocks, pageNumber, blockIndex, paragraphBuffer);
        return blocks;
    }

    private int flushParagraphBlock(
            List<ContentBlock> blocks,
            int pageNumber,
            int blockIndex,
            StringBuilder paragraphBuffer) {
        String paragraph = trimToNull(paragraphBuffer.toString());
        if (paragraph == null) {
            paragraphBuffer.setLength(0);
            return blockIndex;
        }

        blocks.add(new ContentBlock(
                blockId(pageNumber, blockIndex++),
                "paragraph",
                paragraph,
                blockIndex));
        paragraphBuffer.setLength(0);
        return blockIndex;
    }

    private String detectPageTitle(String pageText, List<ContentBlock> blocks) {
        for (ContentBlock block : blocks) {
            if ("heading".equals(block.type())) {
                return block.text();
            }
        }

        String[] lines = pageText.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = trimToNull(line);
            if (trimmed != null) {
                return trimmed.length() > 80 ? trimmed.substring(0, 80) : trimmed;
            }
        }

        return "Page";
    }

    private boolean isLikelyHeading(String line, int lineIndex, boolean previousWasBlank) {
        boolean earlyInBlock = lineIndex < 4 || previousWasBlank;
        boolean uppercase = line.equals(line.toUpperCase());
        boolean shortEnough = line.length() <= 80;
        boolean mostlyLetters = !line.matches(".*\\d{5,}.*");
        return earlyInBlock
                && shortEnough
                && mostlyLetters
                && (uppercase || line.startsWith("SCHEDULE") || line.startsWith("DECLARATION"));
    }

    private boolean hasEnoughDirectText(String text) {
        if (text == null) {
            return false;
        }
        return text.replaceAll("\\s+", "").length() >= paddleOcrProperties.getMinDirectTextChars();
    }

    private String normalizeWhitespace(String text) {
        return text == null ? "" : text.replace("\u0000", "").trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimToDefault(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }

    private String blockId(int pageNumber, int blockIndex) {
        return "p" + pageNumber + "-b" + blockIndex;
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }

        String message = current.getMessage();
        return message == null || message.isBlank()
                ? current.getClass().getSimpleName()
                : message.trim();
    }

    public record DocumentAnalysis(
            String source,
            String engine,
            String format,
            String text,
            List<AnalyzedPage> pages) {
    }

    public record AnalyzedPage(
            Integer pageNumber,
            String title,
            String text,
            List<ContentBlock> blocks) {
    }

    public record ContentBlock(
            String id,
            String type,
            String text,
            int order) {
    }

    private record PageSeed(
            int pageNumber,
            String text) {
    }

    private record DirectExtraction(
            String text,
            List<PageSeed> pages) {
    }
}
