package com.example.pdftools.controller;

import com.example.pdftools.service.ImageCompressService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ImageCompressController {

    private final ImageCompressService service;

    public ImageCompressController(ImageCompressService service) {
        this.service = service;
    }

    @PostMapping(
        value = "/compress-image",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<byte[]> compressImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("quality") int quality
    ) throws Exception {

        byte[] compressed = service.compress(file, quality);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=compressed.jpg"
                )
                .body(compressed);
    }
}
