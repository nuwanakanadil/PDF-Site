package com.example.pdftools.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PassportPhotoService {

    public byte[] process(
            MultipartFile file,
            String country,
            String bgColor
    ) throws IOException {

        BufferedImage original = ImageIO.read(file.getInputStream());
        PassportSize size = PassportSize.fromCountry(country);

        // Crop to correct aspect ratio
        double targetRatio = (double) size.width / size.height;
        int srcW = original.getWidth();
        int srcH = original.getHeight();

        int cropW = srcW;
        int cropH = (int) (srcW / targetRatio);

        if (cropH > srcH) {
            cropH = srcH;
            cropW = (int) (srcH * targetRatio);
        }

        int x = (srcW - cropW) / 2;
        int y = (srcH - cropH) / 4; // slightly higher for face

        BufferedImage cropped = original.getSubimage(x, y, cropW, cropH);

        // Create output image
        BufferedImage output = new BufferedImage(
                size.width,
                size.height,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D g = output.createGraphics();

        // Background color
        Color bg = "white".equals(bgColor)
                ? Color.WHITE
                : new Color(235, 248, 255);

        g.setColor(bg);
        g.fillRect(0, 0, size.width, size.height);

        // Draw resized photo
        g.drawImage(
                cropped,
                0,
                0,
                size.width,
                size.height,
                null
        );

        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(output, "jpg", out);

        return out.toByteArray();
    }
}
