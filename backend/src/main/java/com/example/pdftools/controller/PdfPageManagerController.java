package com.example.pdftools.controller;

import com.example.pdftools.service.PdfPageManagerService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PdfPageManagerController {

    private final PdfPageManagerService service;

    public PdfPageManagerController(PdfPageManagerService service) {
        this.service = service;
    }

    @PostMapping(value = "/pdf-pages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> process(
            @RequestParam MultipartFile file,
            @RequestParam String mode,
            @RequestParam String pages
    ) throws Exception {

        byte[] data = service.process(file, mode, pages);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
