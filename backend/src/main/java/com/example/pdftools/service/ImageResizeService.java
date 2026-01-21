package com.example.pdftools.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;

@Service
public class ImageResizeService {

    public byte[] resize(MultipartFile file, int width, int height) throws Exception {

        BufferedImage src = ImageIO.read(file.getInputStream());

        BufferedImage resized = new BufferedImage(
                width, height, BufferedImage.TYPE_INT_RGB
        );

        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, width, height, null);
        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(resized, "jpg", out);

        return out.toByteArray();
    }
}
