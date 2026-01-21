package com.example.pdftools.controller;

import com.example.pdftools.service.ImageConvertService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ImageConvertController {

    private final ImageConvertService service;

    public ImageConvertController(ImageConvertService service) {
        this.service = service;
    }

    @PostMapping(value = "/convert-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> convert(
            @RequestParam("file") MultipartFile file,
            @RequestParam("format") String format
    ) throws Exception {

        byte[] data = service.convert(file, format);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=converted." + format)
                .body(data);
    }
}
