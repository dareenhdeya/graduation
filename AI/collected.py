# ai_unified_api.py
# Run: uvicorn ai_unified_api:app --port 8000 --reload

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
import numpy as np
import joblib
import json
from fastapi.middleware.cors import CORSMiddleware
from collections import deque, Counter
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"],
    allow_headers=["*"], allow_credentials=True,
)

# ── Load all models ───────────────────────────────────────────
try:
    asl_model   = joblib.load("AI/asl_model.pkl")
    asl_encoder = joblib.load("AI/label_encoder.pkl")
    print(f"✅ ASL model loaded | Classes: {list(asl_encoder.classes_)}")
except Exception as e:
    print(f"❌ ASL model error: {e}")
    asl_model = asl_encoder = None

try:
    arabic_model   = joblib.load("AI/arabic_asl_model.pkl")
    arabic_encoder = joblib.load("AI/arabic_label_encoder.pkl")
    with open("AI/arabic_display_map.json", encoding="utf-8") as f:
        arabic_display = json.load(f)
    print(f"✅ Arabic model loaded | Classes: {list(arabic_encoder.classes_)}")
except Exception as e:
    print(f"❌ Arabic model error: {e}")
    arabic_model = arabic_encoder = arabic_display = None

# ── Word lists ────────────────────────────────────────────────
ENGLISH_WORDS = [
    "CAT", "DOG", "SUN", "HAT", "CUP", "BED", "BUS", "CAR",
    "EGG", "FAN", "GUM", "HEN", "INK", "JAM", "KEY", "LAP",
    "MAP", "NET", "OAK", "PIG", "RAT", "SAP", "TUB", "VAN",
    "WAX", "YAK", "ZAP", "BAG", "COW", "DEN",
    "CAKE", "BIRD", "FISH", "DUCK", "FROG", "JUMP", "LAMP",
    "MILK", "NOSE", "OPEN", "PLAY", "RAIN", "SING", "TREE",
]

ARABIC_WORDS = [
    {"display": "باب",  "letters": ["bb", "aleff", "bb"]},
    {"display": "كتاب", "letters": ["kaaf","taa","aleff","bb"]},
    {"display": "قلم",  "letters": ["gaaf","laam","meem"]},
    {"display": "نار",  "letters": ["nun","aleff","ra"]},
    {"display": "بيت",  "letters": ["bb","ya","taa"]},
    {"display": "كلب",  "letters": ["kaaf","laam","bb"]},
    {"display": "قط",   "letters": ["gaaf","ta"]},
    {"display": "شمس",  "letters": ["sheen","meem","seen"]},
    {"display": "نجم",  "letters": ["nun","jeem","meem"]},
    {"display": "سمك",  "letters": ["seen","meem","kaaf"]},
    {"display": "قطار", "letters": ["gaaf","ta","aleff","ra"]},
]

# ── Smoothing buffers ─────────────────────────────────────────
# Key = "en:{session_id}" or "ar:{session_id}"
_buffers: dict[str, deque] = {}

def get_buf(prefix: str, sid: str) -> deque:
    key = f"{prefix}:{sid}"
    if key not in _buffers:
        _buffers[key] = deque(maxlen=10)
    return _buffers[key]

# ── Helpers ───────────────────────────────────────────────────
def smooth(buf: deque, idx: int) -> int:
    buf.append(idx)
    return Counter(buf).most_common(1)[0][0] if len(buf) >= 5 else idx

def normalize_arabic(raw: List[float]) -> np.ndarray:
    pts = np.array(raw, dtype=np.float32).reshape(21, 3)
    pts -= pts[0]
    scale = np.linalg.norm(pts[9])
    if scale > 1e-6:
        pts /= scale
    return pts.flatten().reshape(1, -1)

def decode_arabic(idx: int) -> tuple[str, str]:
    val = arabic_display.get(str(idx))
    if val is None:
        name = arabic_encoder.inverse_transform([idx])[0]
        return name, name
    if isinstance(val, dict):
        return val.get("arabic", "?"), val.get("name", "?")
    return str(val), arabic_encoder.inverse_transform([idx])[0]

# ── Request model ─────────────────────────────────────────────
class LandmarkData(BaseModel):
    landmarks: List[float]
    session_id: str = "default"

    @field_validator("landmarks")
    @classmethod
    def check_len(cls, v):
        if len(v) != 63:
            raise ValueError(f"Expected 63, got {len(v)}")
        return v

# ══════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════
@app.get("/")
def health():
    return {
        "status": "running",
        "asl_loaded":    asl_model    is not None,
        "arabic_loaded": arabic_model is not None,
    }

# ══════════════════════════════════════════════════════════════
# ENGLISH — letter + word quiz
# ══════════════════════════════════════════════════════════════
@app.post("/predict")                    # ← original port-8000 route
@app.post("/words/english/predict")      # ← original port-8002 route
async def predict_english(data: LandmarkData):
    if not asl_model:
        raise HTTPException(503, "ASL model not loaded")

    features   = np.array(data.landmarks, dtype=np.float32).reshape(1, -1)
    proba      = asl_model.predict_proba(features)[0]
    confidence = float(np.max(proba))
    idx        = int(np.argmax(proba))

    smoothed = smooth(get_buf("en", data.session_id), idx)
    letter   = asl_encoder.inverse_transform([smoothed])[0] if confidence > 0.65 else "..."

    print(f"[EN] {letter} | conf {confidence:.2f}")
    return {"letter": letter, "confidence": round(confidence, 3), "status": "success"}


@app.get("/words/english")
def english_words():
    return {"words": ENGLISH_WORDS}

# ══════════════════════════════════════════════════════════════
# ARABIC — letter + word quiz
# ══════════════════════════════════════════════════════════════
@app.post("/predict/arabic")             # ← original port-8001 route
@app.post("/words/arabic/predict")       # ← original port-8002 route
async def predict_arabic(data: LandmarkData):
    if not arabic_model:
        raise HTTPException(503, "Arabic model not loaded")

    features   = normalize_arabic(data.landmarks)
    proba      = arabic_model.predict_proba(features)[0]
    confidence = float(np.max(proba))
    idx        = int(np.argmax(proba))

    smoothed               = smooth(get_buf("ar", data.session_id), idx)
    arabic_char, name      = decode_arabic(smoothed)
    letter = arabic_char if confidence > 0.25 else "..."

    print(f"[AR] {arabic_char} ({name}) | conf {confidence:.2f}")
    return {
        "letter":      letter,
        "letter_name": name,
        "confidence":  round(confidence, 3),
        "status":      "success",
    }


@app.get("/words/arabic")
def arabic_words():
    return {"words": ARABIC_WORDS}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)