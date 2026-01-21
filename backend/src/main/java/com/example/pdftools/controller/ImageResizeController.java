package com.example.pdftools.controller;

import com.example.pdftools.service.ImageResizeService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ImageResizeController {

    private final ImageResizeService service;

    public ImageResizeController(ImageResizeService service) {
        this.service = service;
    }

    @PostMapping(value = "/resize-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> resize(
            @RequestParam MultipartFile file,
            @RequestParam int width,
            @RequestParam int height
    ) throws Exception {

        byte[] data = service.resize(file, width, height);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(data);
    }
}
