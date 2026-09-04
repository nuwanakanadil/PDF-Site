# PDF Tools (PDF-Site)

A small suite of PDF and image utilities including PDF compression, merging, conversion, image resizing/conversion, passport-photo formatting and OCR support. This repository contains a Java Spring Boot backend that exposes APIs, a Vite + React frontend, and a lightweight Python OCR helper service.

## What is this project?

- A web application for manipulating PDFs and images with several ready-made tools useful for end users and automation.
- Provides both backend APIs and a user-friendly frontend UI to perform tasks like compressing PDFs, merging files, converting images to PDF, resizing images, and analyzing PDF content.

## Main components

- `backend/` — Java Spring Boot application exposing REST endpoints (controllers under `src/main/java/com/example/pdftools/controller`).
- `frontend/` — Vite + React app (TypeScript) that provides the web UI located in `src/`.
- `ocr-service/` — Small Python service and scripts for OCR-related tasks (uses `requirements.txt`).
- `scripts/` — Helpful scripts to run or manage services (e.g. `run-backend.ps1`).

## Key features

- PDF compression and optimization
- Merge multiple PDFs into one
- Convert PDF → DOCX / PPTX (via backend controllers)
- Page management (reorder, rotate, extract)
- Image conversion and resizing
- Passport photo formatting
- Basic PDF analysis and OCR integration

## Prerequisites

- Java 11+ (or the version used by the project)
- Maven (project includes the wrapper `mvnw`/`mvnw.cmd`)
- Node.js 16+ and npm (or pnpm/yarn)
- Python 3.8+ for the OCR service

## Quick start

Open three terminals (or use the provided scripts) to run frontend, backend and OCR service.

Backend (from repository root):

Windows (using the wrapper):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Unix/macOS:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

OCR service:

```powershell
cd ocr-service
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
python app/main.py
```

Or run helper scripts in `scripts/` or the root PowerShell helper `start-dev.ps1` if present.

## Configuration

- Backend configuration lives in `backend/src/main/resources/application.yml` (database, ports, OCR integration, etc.).
- OCR service settings are in `ocr-service/requirements.txt` and any local environment variables used by `app/main.py`.
- Frontend API base URL is configured in `frontend/src/config/api.ts`.

## API overview

The backend exposes multiple controllers (examples shown below). See the Java sources for exact routes and payloads.

- `PdfController` — general PDF operations
- `PdfCompressController` — compress PDF files
- `PdfMergeController` — merge PDFs
- `PdfToDocxController` / `PdfToPptxController` — conversions
- `PdfAnalysisController` — analyze PDF content
- `ImageCompressController` / `ImageConvertController` / `ImageResizeController` — image tools

## Development notes

- The backend uses Maven; the project includes `mvnw` and `mvnw.cmd` for reproducible builds.
- The frontend is a Vite project in TypeScript. Use `npm run dev` for local development.
- The OCR service is intentionally small and can be replaced or extended depending on accuracy and performance needs.

## Contributing

Contributions, bug reports and feature requests are welcome — please open an issue or submit a pull request. Keep changes focused and include tests or manual steps to verify behavior when applicable.

## License

This repository does not include an explicit license file. Add a `LICENSE` if you want to open-source this project, or include licensing details here.

---

If you want, I can expand this README with detailed API examples, environment variable references, or exact Java/Node/Python versions used by the project.
