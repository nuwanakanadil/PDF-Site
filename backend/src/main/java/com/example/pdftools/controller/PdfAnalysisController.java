package com.example.pdftools.controller;

import com.example.pdftools.service.DocumentAnalysisService;
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
public class PdfAnalysisController {

    private final DocumentAnalysisService documentAnalysisService;

    public PdfAnalysisController(DocumentAnalysisService documentAnalysisService) {
        this.documentAnalysisService = documentAnalysisService;
    }

    @PostMapping(
            value = "/pdf-analysis",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> analyzePdf(@RequestParam("file") MultipartFile file) throws Exception {
        try {
            return ResponseEntity.ok(documentAnalysisService.analyze(file));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(ex.getMessage().getBytes(StandardCharsets.UTF_8));
        }
    }
}
