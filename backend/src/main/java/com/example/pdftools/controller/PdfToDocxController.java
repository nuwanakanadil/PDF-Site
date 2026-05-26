package com.example.pdftools.controller;

import com.example.pdftools.service.PdfToDocxService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class PdfToDocxController {

    private final PdfToDocxService service;

    public PdfToDocxController(PdfToDocxService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/pdf-to-docx",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> convertPdfToDocx(
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        try {
            byte[] docxBytes = service.convert(file);

            return ResponseEntity.ok()
                    .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=result.docx"
                    )
                    .contentType(
                        MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        )
                    )
                    .body(docxBytes);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(ex.getMessage().getBytes(StandardCharsets.UTF_8));
        }
    }
}
