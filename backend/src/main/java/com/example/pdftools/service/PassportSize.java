package com.example.pdftools.service;

public enum PassportSize {

    US(600, 600),
    IN(413, 531),
    UK(413, 531),
    EU(413, 531);

    public final int width;
    public final int height;

    PassportSize(int width, int height) {
        this.width = width;
        this.height = height;
    }

    public static PassportSize fromCountry(String country) {
        return switch (country.toLowerCase()) {
            case "us" -> US;
            case "in" -> IN;
            case "uk" -> UK;
            case "eu" -> EU;
            default -> US;
        };
    }
}
