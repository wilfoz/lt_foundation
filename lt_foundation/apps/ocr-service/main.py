"""
OCR microservice using docTR.
Exposes POST /ocr — accepts an image or PDF page (bytes), returns words with confidence.
Called by the NestJS DocumentAiPort adapter.
"""
from __future__ import annotations

import io
import logging
from typing import Any

import numpy as np
from doctr.io import DocumentFile
from doctr.models import ocr_predictor
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LT Foundation OCR Service", version="1.0.0")

# Load model once at startup (downloads ~300 MB on first run)
logger.info("Loading docTR model...")
_model = ocr_predictor(det_arch="db_resnet50", reco_arch="crnn_vgg16_bn", pretrained=True)
logger.info("docTR model ready.")


def _region_to_crop(page_img: np.ndarray, bbox: dict[str, float]) -> np.ndarray:
    """Crop a region from a page image given relative bbox {x, y, w, h} in [0,1]."""
    h, w = page_img.shape[:2]
    x1 = int(bbox["x"] * w)
    y1 = int(bbox["y"] * h)
    x2 = int((bbox["x"] + bbox["w"]) * w)
    y2 = int((bbox["y"] + bbox["h"]) * h)
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    return page_img[y1:y2, x1:x2]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr")
async def run_ocr(
    file: UploadFile = File(...),
    page: int = Form(0, description="Page index (0-based) for PDF files"),
) -> JSONResponse:
    """
    Run OCR on the uploaded file (PDF or image).

    Returns:
        { words: [{ value, confidence, geometry: { x, y, w, h } }] }
    """
    content = await file.read()
    mime = file.content_type or ""

    try:
        if "pdf" in mime or file.filename.lower().endswith(".pdf"):
            doc = DocumentFile.from_pdf(content)
        else:
            doc = DocumentFile.from_images([content])
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Cannot read file: {exc}") from exc

    result = _model(doc)
    words: list[dict[str, Any]] = []

    target_page = min(page, len(result.pages) - 1)
    for block in result.pages[target_page].blocks:
        for line in block.lines:
            for word in line.words:
                geo = word.geometry  # ((x1,y1),(x2,y2)) relative coords
                x1, y1 = geo[0]
                x2, y2 = geo[1]
                words.append({
                    "value": word.value,
                    "confidence": round(float(word.confidence), 4),
                    "geometry": {
                        "x": round(x1, 4),
                        "y": round(y1, 4),
                        "w": round(x2 - x1, 4),
                        "h": round(y2 - y1, 4),
                    },
                })

    return JSONResponse({"words": words, "page": target_page, "total_pages": len(result.pages)})


@app.post("/ocr/region")
async def run_ocr_region(
    file: UploadFile = File(...),
    x: float = Form(..., description="Bbox left edge [0,1]"),
    y: float = Form(..., description="Bbox top edge [0,1]"),
    w: float = Form(..., description="Bbox width [0,1]"),
    h: float = Form(..., description="Bbox height [0,1]"),
    page: int = Form(0),
) -> JSONResponse:
    """
    Run OCR only on a specific bounding-box region (from Roboflow output).
    Crops the region before running OCR — faster than full-page processing.
    """
    import cv2

    content = await file.read()
    mime = file.content_type or ""

    try:
        if "pdf" in mime or file.filename.lower().endswith(".pdf"):
            doc = DocumentFile.from_pdf(content)
            # Convert PDF page to numpy array via docTR internals
            page_img = np.array(doc[min(page, len(doc) - 1)])
        else:
            nparr = np.frombuffer(content, np.uint8)
            page_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            page_img = cv2.cvtColor(page_img, cv2.COLOR_BGR2RGB)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Cannot decode file: {exc}") from exc

    crop = _region_to_crop(page_img, {"x": x, "y": y, "w": w, "h": h})
    if crop.size == 0:
        raise HTTPException(status_code=422, detail="Resulting crop is empty — check bbox values.")

    crop_doc = DocumentFile.from_images([crop])
    result = _model(crop_doc)

    words: list[dict[str, Any]] = []
    for block in result.pages[0].blocks:
        for line in block.lines:
            for word in line.words:
                geo = word.geometry
                x1, y1 = geo[0]
                x2, y2 = geo[1]
                words.append({
                    "value": word.value,
                    "confidence": round(float(word.confidence), 4),
                    "geometry": {"x": round(x1, 4), "y": round(y1, 4), "w": round(x2 - x1, 4), "h": round(y2 - y1, 4)},
                })

    return JSONResponse({"words": words, "region": {"x": x, "y": y, "w": w, "h": h}})
