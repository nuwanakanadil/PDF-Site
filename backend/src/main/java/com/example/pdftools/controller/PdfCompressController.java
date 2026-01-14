package com.example.pdftools.controller;

import com.example.pdftools.service.PdfCompressService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PdfCompressController {

    private static final long MAX_SIZE = 30L * 1024 * 1024; // 30 MB

    private final PdfCompressService service;

    public PdfCompressController(PdfCompressService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/compress-pdf",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> compress(
            @RequestParam("file") MultipartFile file,
            @RequestParam("level") String level
    ) throws Exception {

        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity
                    .status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .build();
        }

        byte[] compressed = service.compress(file, level);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=compressed.pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(compressed);
    }
}
