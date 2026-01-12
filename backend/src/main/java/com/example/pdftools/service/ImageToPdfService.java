package com.example.pdftools.service;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ImageToPdfService {

    public byte[] convert(MultipartFile file) throws IOException {

        try (PDDocument document = new PDDocument()) {

            PDImageXObject image = PDImageXObject.createFromByteArray(
                    document,
                    file.getBytes(),
                    file.getOriginalFilename()
            );

            PDPage page = new PDPage(
                    new PDRectangle(image.getWidth(), image.getHeight())
            );
            document.addPage(page);

            try (PDPageContentStream contentStream =
                         new PDPageContentStream(document, page)) {
                contentStream.drawImage(image, 0, 0);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }
}
