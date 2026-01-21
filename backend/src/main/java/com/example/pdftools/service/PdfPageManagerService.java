package com.example.pdftools.service;

import org.apache.pdfbox.pdmodel.*;
// import org.apache.pdfbox.pdmodel.common.PDPage;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@Service
public class PdfPageManagerService {

    public byte[] process(
            MultipartFile file,
            String mode,
            String pagesInput
    ) throws Exception {

        PDDocument src = PDDocument.load(file.getInputStream());
        PDDocument out = new PDDocument();

        Set<Integer> selected = parsePages(pagesInput, src.getNumberOfPages());

        for (int i = 0; i < src.getNumberOfPages(); i++) {
            boolean keep = selected.contains(i + 1);
            if ((mode.equals("keep") && keep) ||
                (mode.equals("remove") && !keep)) {

                out.addPage(src.getPage(i));
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        out.save(baos);

        src.close();
        out.close();

        return baos.toByteArray();
    }

    private Set<Integer> parsePages(String input, int max) {
        Set<Integer> pages = new HashSet<>();

        for (String part : input.split(",")) {
            if (part.contains("-")) {
                String[] r = part.split("-");
                int start = Integer.parseInt(r[0]);
                int end = Integer.parseInt(r[1]);
                for (int i = start; i <= end && i <= max; i++) {
                    pages.add(i);
                }
            } else {
                pages.add(Integer.parseInt(part));
            }
        }

        return pages;
    }
}
