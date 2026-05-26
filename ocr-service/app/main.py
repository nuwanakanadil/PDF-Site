from __future__ import annotations

import multiprocessing as mp
import os
from functools import lru_cache
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

try:
    from paddleocr import PPStructureV3
except ImportError:  # pragma: no cover - only hit when PaddleOCR is not installed
    PPStructureV3 = None


app = FastAPI(title="PaddleOCR Sidecar", version="0.1.0")


class OcrPage(BaseModel):
    pageNumber: int
    text: str


class OcrDocumentResponse(BaseModel):
    engine: str
    format: str
    text: str
    pages: list[OcrPage]


class HealthResponse(BaseModel):
    status: str
    engine: str


@lru_cache(maxsize=1)
def get_pipeline():
    if PPStructureV3 is None:
        raise RuntimeError(
            "PaddleOCR is not installed. Install paddlepaddle and paddleocr first."
        )

    return PPStructureV3(
        lang=os.getenv("PADDLEOCR_LANG", "en"),
        device=os.getenv("PADDLEOCR_DEVICE", "cpu"),
        use_doc_orientation_classify=_env_flag("PADDLEOCR_USE_DOC_ORIENTATION", False),
        use_textline_orientation=_env_flag("PADDLEOCR_USE_TEXTLINE_ORIENTATION", False),
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", engine=_health_engine_name())


@app.post("/ocr/pdf", response_model=OcrDocumentResponse)
async def ocr_pdf(file: UploadFile = File(...)) -> OcrDocumentResponse:
    filename = file.filename or "document.pdf"
    suffix = Path(filename).suffix or ".pdf"

    if suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    temp_path: Path | None = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await file.read())
            temp_path = Path(temp_file.name)

        response = _ocr_pdf_with_ppstructure_timeout(temp_path)
        if response.text.strip():
            return response

        raise HTTPException(
            status_code=500,
            detail="PPStructureV3 returned no usable text.",
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - depends on runtime model setup
        raise HTTPException(status_code=500, detail=f"PaddleOCR failed: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def _ocr_pdf_with_ppstructure(pdf_path: Path) -> OcrDocumentResponse:
    pipeline = get_pipeline()
    results = list(pipeline.predict(input=str(pdf_path)))

    markdown_pages: list[dict[str, Any]] = []
    pages: list[OcrPage] = []

    for page_number, result in enumerate(results, start=1):
        markdown_payload = _coerce_markdown_payload(result)
        markdown_pages.append(markdown_payload)
        pages.append(
            OcrPage(
                pageNumber=page_number,
                text=(markdown_payload.get("markdown", "") or "").strip(),
            )
        )

    full_text = _concatenate_markdown_pages(pipeline, markdown_pages, pages)

    return OcrDocumentResponse(
        engine="paddleocr-ppstructurev3",
        format="markdown",
        text=full_text.strip(),
        pages=pages,
    )


def _ocr_pdf_with_ppstructure_timeout(pdf_path: Path) -> OcrDocumentResponse:
    timeout_seconds = float(os.getenv("PADDLEOCR_PPSTRUCTURE_TIMEOUT_SECONDS", "300"))
    if timeout_seconds <= 0:
        return _ocr_pdf_with_ppstructure(pdf_path)

    context = mp.get_context("spawn")
    queue: mp.Queue = context.Queue()
    process = context.Process(
        target=_ppstructure_worker,
        args=(str(pdf_path), queue),
    )
    process.start()
    process.join(timeout_seconds)

    if process.is_alive():
        process.terminate()
        process.join(5)
        raise TimeoutError(
            f"PPStructureV3 timed out after {int(timeout_seconds)} seconds"
        )

    if queue.empty():
        raise RuntimeError("PPStructureV3 exited without returning a result.")

    result = queue.get()
    if result.get("ok"):
        return OcrDocumentResponse(**result["payload"])

    raise RuntimeError(result.get("error", "PPStructureV3 failed."))


def _ppstructure_worker(pdf_path: str, queue: mp.Queue) -> None:
    try:
        response = _ocr_pdf_with_ppstructure(Path(pdf_path))
        queue.put({"ok": True, "payload": response.model_dump()})
    except Exception as exc:  # pragma: no cover - depends on model/runtime behavior
        queue.put({"ok": False, "error": str(exc)})


def _health_engine_name() -> str:
    return "paddleocr-ppstructurev3"


def _concatenate_markdown_pages(
    pipeline: Any,
    markdown_pages: list[dict[str, Any]],
    pages: list[OcrPage],
) -> str:
    if not markdown_pages:
        return ""

    try:
        return pipeline.concatenate_markdown_pages(markdown_pages)
    except Exception:
        return "\n\n".join(page.text for page in pages if page.text)


def _coerce_markdown_payload(result: Any) -> dict[str, Any]:
    markdown = getattr(result, "markdown", None)

    if isinstance(markdown, dict):
        payload = dict(markdown)
        payload.setdefault("markdown", _extract_markdown_text(payload))
        payload.setdefault("markdown_images", {})
        return payload

    if isinstance(markdown, str):
        return {"markdown": markdown, "markdown_images": {}}

    if hasattr(result, "json") and isinstance(result.json, dict):
        fallback_text = _extract_markdown_text(result.json)
        return {"markdown": fallback_text, "markdown_images": {}}

    return {"markdown": "", "markdown_images": {}}


def _extract_markdown_text(payload: dict[str, Any]) -> str:
    for key in ("markdown", "text", "content"):
        value = payload.get(key)
        if isinstance(value, str):
            return value
    return ""


def _env_flag(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}
