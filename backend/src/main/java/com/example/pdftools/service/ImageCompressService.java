package com.example.pdftools.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.*;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.Iterator;

@Service
public class ImageCompressService {

    public byte[] compress(MultipartFile file, int quality) throws Exception {

        BufferedImage inputImage = ImageIO.read(file.getInputStream());

        if (inputImage == null) {
            throw new IllegalArgumentException("Unsupported image format");
        }

        // ✅ Convert to RGB (important for PNG & transparency)
        BufferedImage rgbImage = new BufferedImage(
                inputImage.getWidth(),
                inputImage.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D g = rgbImage.createGraphics();
        g.setColor(Color.WHITE); // background for transparent PNGs
        g.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
        g.drawImage(inputImage, 0, 0, null);
        g.dispose();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Iterator<ImageWriter> writers =
                ImageIO.getImageWritersByFormatName("jpeg");

        if (!writers.hasNext()) {
            throw new IllegalStateException("No JPEG writers available");
        }

        ImageWriter writer = writers.next();

        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(Math.max(0.1f, Math.min(quality / 100f, 1f)));

        ImageOutputStream ios =
                ImageIO.createImageOutputStream(outputStream);

        writer.setOutput(ios);
        writer.write(null, new IIOImage(rgbImage, null, null), param);

        ios.close();
        writer.dispose();

        return outputStream.toByteArray();
    }
}
