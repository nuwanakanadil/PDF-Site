package com.example.pdftools.controller;

import com.example.pdftools.service.PdfToDocService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class PdfToDocController {

    private final PdfToDocService service;

    public PdfToDocController(PdfToDocService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/pdf-to-doc",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> convert(
            @RequestParam("file") MultipartFile file
    ) throws Exception {

        byte[] docBytes = service.convert(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=result.docx")
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        )
                )
                .body(docBytes);
    }
}
