package com.example.pdftools.service;

import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextBox;
import org.apache.poi.xslf.usermodel.XSLFTextParagraph;
import org.apache.poi.xslf.usermodel.XSLFTextRun;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfToPptxService {

    private static final int SLIDE_WIDTH = 1280;
    private static final int SLIDE_HEIGHT = 720;

    private final DocumentAnalysisService documentAnalysisService;

    public PdfToPptxService(DocumentAnalysisService documentAnalysisService) {
        this.documentAnalysisService = documentAnalysisService;
    }

    public byte[] convert(
            MultipartFile pdfFile,
            String slideLayout,
            boolean preserveFormatting,
            boolean includeNotes) throws IOException {
        DocumentAnalysisService.DocumentAnalysis analysis = documentAnalysisService.analyze(pdfFile);
        List<DocumentAnalysisService.AnalyzedPage> pages = nonEmptyPages(analysis.pages());

        if (pages.isEmpty()) {
            throw new IllegalStateException("No usable content was extracted from this PDF.");
        }

        try (XMLSlideShow slideShow = new XMLSlideShow()) {
            slideShow.setPageSize(new Dimension(SLIDE_WIDTH, SLIDE_HEIGHT));

            int pagesPerSlide = pagesPerSlide(slideLayout);
            for (int index = 0; index < pages.size(); index += pagesPerSlide) {
                XSLFSlide slide = slideShow.createSlide();
                List<DocumentAnalysisService.AnalyzedPage> group = pages.subList(
                        index,
                        Math.min(index + pagesPerSlide, pages.size()));
                renderSlide(slide, group, preserveFormatting, includeNotes);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            slideShow.write(out);
            return out.toByteArray();
        }
    }

    private void renderSlide(
            XSLFSlide slide,
            List<DocumentAnalysisService.AnalyzedPage> pages,
            boolean preserveFormatting,
            boolean includeNotes) {
        addSlideTitle(slide, pages);

        List<Rectangle> slots = layoutSlots(pages.size(), includeNotes);
        for (int i = 0; i < pages.size(); i++) {
            renderPageRegion(slide, pages.get(i), slots.get(i), preserveFormatting);
        }

        if (includeNotes) {
            addNotesBox(slide, pages);
        }
    }

    private void addSlideTitle(XSLFSlide slide, List<DocumentAnalysisService.AnalyzedPage> pages) {
        String title = pages.size() == 1
                ? "Page " + pages.get(0).pageNumber() + " - " + safeTitle(pages.get(0))
                : "Pages " + pages.get(0).pageNumber() + " to " + pages.get(pages.size() - 1).pageNumber();

        XSLFTextBox titleBox = slide.createTextBox();
        titleBox.setAnchor(new Rectangle(40, 24, SLIDE_WIDTH - 80, 48));
        titleBox.setFillColor(new Color(245, 247, 250));
        titleBox.setLineColor(new Color(220, 225, 232));

        XSLFTextParagraph paragraph = titleBox.addNewTextParagraph();
        XSLFTextRun run = paragraph.addNewTextRun();
        run.setText(title);
        run.setFontSize(24.0);
        run.setBold(true);
        run.setFontColor(new Color(33, 37, 41));
    }

    private void renderPageRegion(
            XSLFSlide slide,
            DocumentAnalysisService.AnalyzedPage page,
            Rectangle bounds,
            boolean preserveFormatting) {
        XSLFTextBox frame = slide.createTextBox();
        frame.setAnchor(bounds);
        frame.setFillColor(Color.WHITE);
        frame.setLineColor(new Color(214, 220, 226));

        XSLFTextParagraph labelParagraph = frame.addNewTextParagraph();
        labelParagraph.setSpaceAfter(6.0);
        XSLFTextRun labelRun = labelParagraph.addNewTextRun();
        labelRun.setText("Page " + page.pageNumber());
        labelRun.setBold(true);
        labelRun.setFontSize(15.0);
        labelRun.setFontColor(new Color(26, 69, 124));

        List<DocumentAnalysisService.ContentBlock> blocks = page.blocks();
        if (blocks == null || blocks.isEmpty()) {
            addBodyParagraph(frame, page.text(), 14.0, false);
            return;
        }

        for (DocumentAnalysisService.ContentBlock block : blocks) {
            String text = normalizeSlideText(block.text());
            if (text.isBlank()) {
                continue;
            }

            boolean heading = preserveFormatting && "heading".equals(block.type());
            double fontSize = heading ? 16.0 : 12.0;
            addBodyParagraph(frame, text, fontSize, heading);
        }
    }

    private void addBodyParagraph(XSLFTextBox frame, String text, double fontSize, boolean bold) {
        XSLFTextParagraph paragraph = frame.addNewTextParagraph();
        paragraph.setSpaceAfter(2.0);
        XSLFTextRun run = paragraph.addNewTextRun();
        run.setText(limitLength(text, 900));
        run.setFontSize(fontSize);
        run.setBold(bold);
        run.setFontColor(new Color(55, 65, 81));
    }

    private void addNotesBox(XSLFSlide slide, List<DocumentAnalysisService.AnalyzedPage> pages) {
        XSLFTextBox notes = slide.createTextBox();
        notes.setAnchor(new Rectangle(40, SLIDE_HEIGHT - 118, SLIDE_WIDTH - 80, 78));
        notes.setFillColor(new Color(251, 252, 254));
        notes.setLineColor(new Color(224, 229, 236));

        XSLFTextParagraph heading = notes.addNewTextParagraph();
        XSLFTextRun headingRun = heading.addNewTextRun();
        headingRun.setText("Source Notes");
        headingRun.setBold(true);
        headingRun.setFontSize(13.0);

        StringBuilder text = new StringBuilder();
        for (DocumentAnalysisService.AnalyzedPage page : pages) {
            if (text.length() > 0) {
                text.append(" | ");
            }
            text.append("P").append(page.pageNumber()).append(": ")
                    .append(limitLength(page.text().replace('\n', ' '), 120));
        }

        XSLFTextParagraph body = notes.addNewTextParagraph();
        XSLFTextRun bodyRun = body.addNewTextRun();
        bodyRun.setText(limitLength(text.toString(), 400));
        bodyRun.setFontSize(10.0);
        bodyRun.setFontColor(new Color(90, 99, 110));
    }

    private List<DocumentAnalysisService.AnalyzedPage> nonEmptyPages(
            List<DocumentAnalysisService.AnalyzedPage> pages) {
        List<DocumentAnalysisService.AnalyzedPage> results = new ArrayList<>();
        if (pages == null) {
            return results;
        }
        for (DocumentAnalysisService.AnalyzedPage page : pages) {
            if (page != null && page.text() != null && !page.text().isBlank()) {
                results.add(page);
            }
        }
        return results;
    }

    private int pagesPerSlide(String slideLayout) {
        if ("two-pages".equalsIgnoreCase(slideLayout)) {
            return 2;
        }
        if ("four-pages".equalsIgnoreCase(slideLayout)) {
            return 4;
        }
        return 1;
    }

    private List<Rectangle> layoutSlots(int pageCount, boolean includeNotes) {
        int top = 86;
        int bottomPadding = includeNotes ? 128 : 44;
        int availableHeight = SLIDE_HEIGHT - top - bottomPadding;
        int availableWidth = SLIDE_WIDTH - 80;

        List<Rectangle> slots = new ArrayList<>();
        if (pageCount <= 1) {
            slots.add(new Rectangle(40, top, availableWidth, availableHeight));
            return slots;
        }

        if (pageCount == 2) {
            int width = (availableWidth - 20) / 2;
            slots.add(new Rectangle(40, top, width, availableHeight));
            slots.add(new Rectangle(60 + width, top, width, availableHeight));
            return slots;
        }

        int width = (availableWidth - 20) / 2;
        int height = (availableHeight - 20) / 2;
        slots.add(new Rectangle(40, top, width, height));
        slots.add(new Rectangle(60 + width, top, width, height));
        slots.add(new Rectangle(40, top + 20 + height, width, height));
        slots.add(new Rectangle(60 + width, top + 20 + height, width, height));
        return slots;
    }

    private String safeTitle(DocumentAnalysisService.AnalyzedPage page) {
        String title = page.title();
        if (title == null || title.isBlank()) {
            return "Document";
        }
        return limitLength(title.replace('\n', ' '), 80);
    }

    private String normalizeSlideText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace('\t', ' ')
                .replaceAll("\\s*\\n\\s*", "\n")
                .replaceAll("[ ]{2,}", " ")
                .trim();
    }

    private String limitLength(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }
}
