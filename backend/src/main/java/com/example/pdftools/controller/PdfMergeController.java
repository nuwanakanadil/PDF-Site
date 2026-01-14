package com.example.pdftools.controller;

import com.example.pdftools.service.PdfMergeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PdfMergeController {

    private final PdfMergeService service;

    public PdfMergeController(PdfMergeService service) {
        this.service = service;
    }

    @PostMapping(
            value = "/merge-pdf",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> merge(
            @RequestParam("files") MultipartFile[] files
    ) throws Exception {

        if (files.length < 2 || files.length > 15) {
            return ResponseEntity.badRequest().build();
        }

        byte[] mergedPdf = service.merge(files);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=merged.pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(mergedPdf);
    }
}
