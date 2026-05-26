package com.example.pdftools.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.cos.COSName;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;

@Service
public class PdfCompressService {

    public byte[] compress(MultipartFile file, String level) throws IOException {

        RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
        PDDocument document = Loader.loadPDF(buffer);

        float scale;
        if ("low".equals(level))
            scale = 0.9f;
        else if ("high".equals(level))
            scale = 0.4f;
        else
            scale = 0.7f; // medium

        for (PDPage page : document.getPages()) {
            var resources = page.getResources();
            for (COSName name : resources.getXObjectNames()) {
                if (resources.isImageXObject(name)) {
                    PDImageXObject image = (PDImageXObject) resources.getXObject(name);

                    BufferedImage buffered = image.getImage();

                    int newW = Math.max(1, (int) (buffered.getWidth() * scale));
                    int newH = Math.max(1, (int) (buffered.getHeight() * scale));

                    BufferedImage resized = new BufferedImage(
                            newW,
                            newH,
                            BufferedImage.TYPE_INT_RGB);

                    resized.getGraphics().drawImage(
                            buffered, 0, 0, newW, newH, null);

                    ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
                    ImageIO.write(resized, "jpg", imgOut);

                    PDImageXObject compressed = PDImageXObject.createFromByteArray(
                            document,
                            imgOut.toByteArray(),
                            null);

                    resources.put(name, compressed);
                }
            }
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.save(out);
        document.close();

        return out.toByteArray();
    }
}
