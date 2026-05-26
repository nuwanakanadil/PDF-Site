package com.example.pdftools.service;

import com.example.pdftools.config.PaddleOcrProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

@Service
public class PaddleOcrClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(600);

    private final RestClient restClient;
    private final PaddleOcrProperties properties;

    public PaddleOcrClient(RestClient.Builder restClientBuilder, PaddleOcrProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);

        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public OcrDocumentResponse extractPdf(MultipartFile pdfFile) throws IOException {
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_PDF);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add(
                "file",
                new HttpEntity<>(
                        new NamedByteArrayResource(pdfFile.getBytes(), pdfFile.getOriginalFilename()),
                        fileHeaders));

        String path = UriComponentsBuilder.fromPath(properties.getPdfEndpoint()).build().toUriString();

        return restClient.post()
                .uri(path)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(OcrDocumentResponse.class);
    }

    public record OcrDocumentResponse(
            String engine,
            String format,
            String text,
            List<OcrPage> pages) {
    }

    public record OcrPage(
            Integer pageNumber,
            String text) {
    }

    private static final class NamedByteArrayResource extends ByteArrayResource {

        private final String filename;

        private NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename == null || filename.isBlank() ? "document.pdf" : filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
