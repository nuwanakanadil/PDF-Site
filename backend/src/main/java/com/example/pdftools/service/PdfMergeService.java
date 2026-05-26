package com.example.pdftools.service;

import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PdfMergeService {

    public byte[] merge(MultipartFile[] files) throws IOException {

        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        merger.setDestinationStream(outputStream);

        for (MultipartFile file : files) {
            RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
            merger.addSource(buffer);
        }

        merger.mergeDocuments(null);

        return outputStream.toByteArray();
    }
}
