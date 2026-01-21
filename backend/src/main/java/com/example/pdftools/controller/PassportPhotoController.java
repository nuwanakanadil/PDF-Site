package com.example.pdftools.controller;

import com.example.pdftools.service.PassportPhotoService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PassportPhotoController {

    private final PassportPhotoService service;

    public PassportPhotoController(PassportPhotoService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/passport-photo",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> create(
            @RequestParam("file") MultipartFile file,
            @RequestParam("country") String country,
            @RequestParam("bgColor") String bgColor
    ) throws Exception {

        byte[] image = service.process(file, country, bgColor);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=passport.jpg"
                )
                .body(image);
    }
}
