FROM python:3.11-slim

WORKDIR /app

# System libs for OpenCV and PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libpoppler-cpp-dev poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download docTR models so container starts fast
RUN python -c "from doctr.models import ocr_predictor; ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True)"

COPY main.py .

EXPOSE 8100

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100"]
