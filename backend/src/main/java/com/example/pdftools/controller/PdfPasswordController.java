package com.example.pdftools.controller;

import com.example.pdftools.service.PdfPasswordService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PdfPasswordController {

    private final PdfPasswordService service;

    public PdfPasswordController(PdfPasswordService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/pdf-password",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> handle(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mode") String mode,
            @RequestParam(value = "password", required = false)
            String password
    ) {

        try {
            byte[] result;

            if ("protect".equalsIgnoreCase(mode)) {

                if (password == null || password.isBlank()) {
                    return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(null);
                }

                result = service.protect(file, password);

            } else if ("unlock".equalsIgnoreCase(mode)) {

                result = service.unlock(file, password);

            } else {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(null);
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=result.pdf"
                )
                .body(result);

        } catch (Exception e) {
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(e.getMessage().getBytes());
}

    }
}
