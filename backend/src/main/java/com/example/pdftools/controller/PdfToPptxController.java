package com.example.pdftools.controller;

import com.example.pdftools.service.PdfToPptxService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class PdfToPptxController {

    private final PdfToPptxService service;

    public PdfToPptxController(PdfToPptxService service) {
        this.service = service;
    }

    @PostMapping(
            value = "/pdf-to-pptx",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> convertPdfToPptx(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "one-page") String slideLayout,
            @RequestParam(defaultValue = "true") boolean preserveFormatting,
            @RequestParam(defaultValue = "false") boolean includeNotes) throws Exception {
        try {
            byte[] pptxBytes = service.convert(file, slideLayout, preserveFormatting, includeNotes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=result.pptx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation"))
                    .body(pptxBytes);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(ex.getMessage().getBytes(StandardCharsets.UTF_8));
        }
    }
}
