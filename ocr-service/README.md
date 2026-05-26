# PaddleOCR Sidecar

This sidecar runs PaddleOCR separately from the Spring Boot API and is intended to handle scanned or image-based PDFs when native PDF text extraction is weak.

## Why a sidecar

PaddleOCR is primarily a Python-first stack. Keeping it in a small HTTP service lets the Java backend stay simple while still using OCR and document parsing without embedding Python inside the Spring app.

## Official references

- PaddleOCR installation: https://www.paddleocr.ai/v3.1.0/en/version3.x/installation.html
- PaddlePaddle CPU/GPU installation: https://www.paddleocr.ai/latest/en/version3.x/paddlepaddle_installation.html
- PP-StructureV3 Python usage: https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PP-StructureV3.html

## Setup

1. Create a Python 3.10+ virtual environment.
2. Install PaddlePaddle for your machine first.

CPU example from the official docs:

```bash
python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
```

3. Install the sidecar requirements:

```bash
pip install -r requirements.txt
```

`PPStructureV3` also depends on the PaddleX OCR extras. They are now included in `requirements.txt`, so the command above should install them automatically.

This sidecar now uses `PPStructureV3` as the only OCR/document model path. The alternate OCR fallback has been removed so conversions run against the Paddle model itself.

4. Start the service:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## Environment variables

- `PADDLEOCR_LANG`
  - Default: `en`
- `PADDLEOCR_DEVICE`
  - Default: `cpu`
- `PADDLEOCR_USE_DOC_ORIENTATION`
  - Default: `false`
- `PADDLEOCR_USE_TEXTLINE_ORIENTATION`
  - Default: `false`
- `PADDLEOCR_ENABLE_PPSTRUCTURE`
  - Default: `true`
- `PADDLEOCR_PREFER_PPSTRUCTURE`
  - Default: `true`
- `PADDLEOCR_PPSTRUCTURE_TIMEOUT_SECONDS`
  - Default: `300`

## Endpoints

- `GET /health`
- Note: this is a liveness check and does not force model initialization.
- `POST /ocr/pdf`
  - Multipart field: `file`

## OCR strategy

1. Run `PPStructureV3` on the PDF.
2. Return the model's markdown-style structured output.
3. Fail the request if the Paddle model cannot produce usable text within the configured timeout.

## Current backend integration

The Spring Boot backend uses this service as an OCR fallback for `POST /api/pdf-to-docx` when direct extraction from PDFBox returns too little usable text.
