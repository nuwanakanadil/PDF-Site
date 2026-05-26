package com.example.pdftools.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PdfPasswordService {

    /*
     * ========================
     * PROTECT PDF
     * ========================
     */
    public byte[] protect(
            MultipartFile file,
            String password) throws Exception {

        if (password == null || password.isBlank()) {
            throw new RuntimeException("Password required");
        }

        RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
        PDDocument document = Loader.loadPDF(buffer);

        AccessPermission permissions = new AccessPermission();

        StandardProtectionPolicy policy = new StandardProtectionPolicy(
                password,
                password,
                permissions);

        policy.setEncryptionKeyLength(128);
        document.protect(policy);

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        document.save(out);
        document.close();

        return out.toByteArray();
    }

    /*
     * ========================
     * UNLOCK PDF
     * ========================
     */

    public byte[] unlock(
            MultipartFile file,
            String password) throws Exception {

        PDDocument document;

        // Try opening WITHOUT password
        try {
            RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
            document = Loader.loadPDF(
                    buffer,
                    (String) null);

            // If opened, check if only owner restrictions exist
            if (document.isEncrypted()) {
                document.setAllSecurityToBeRemoved(true);
            }

        } catch (IOException e) {

            // Fully encrypted PDF → requires password
            if (password == null || password.isBlank()) {
                throw new RuntimeException(
                        "This PDF requires the correct password");
            }

            // Try with password
            RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
            document = Loader.loadPDF(
                    buffer,
                    password);

            document.setAllSecurityToBeRemoved(true);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        document.save(out);
        document.close();

        return out.toByteArray();
    }

}
