package com.example.pdftools.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "paddleocr")
public class PaddleOcrProperties {

    private boolean enabled = false;
    private String baseUrl = "http://localhost:8001";
    private String pdfEndpoint = "/ocr/pdf";
    private int minDirectTextChars = 40;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getPdfEndpoint() {
        return pdfEndpoint;
    }

    public void setPdfEndpoint(String pdfEndpoint) {
        this.pdfEndpoint = pdfEndpoint;
    }

    public int getMinDirectTextChars() {
        return minDirectTextChars;
    }

    public void setMinDirectTextChars(int minDirectTextChars) {
        this.minDirectTextChars = minDirectTextChars;
    }
}
