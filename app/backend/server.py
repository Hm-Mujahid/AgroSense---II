from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import joblib
import pandas as pd
import json
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load ML model and treatments
model_path = ROOT_DIR / 'models' / 'plant_disease_model.joblib'
treatments_path = ROOT_DIR / 'treatments.json'

model_data = None
treatments = {}

try:
    model_data = joblib.load(model_path)
    print("✓ Model loaded successfully")
except Exception as e:
    print(f"✗ Error loading model: {e}")

try:
    with open(treatments_path, 'r') as f:
        treatments = json.load(f)
    print("✓ Treatment data loaded successfully")
except Exception as e:
    print(f"✗ Error loading treatments: {e}")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class PredictionInput(BaseModel):
    crop_type: str
    plant_age_days: int
    location_region: str
    soil_ph: float
    soil_moisture_pct: float
    ambient_temperature_c: float
    ambient_humidity_pct: float
    leaf_color: str
    lesion_present: bool
    lesion_count: int
    spot_size_mm: float
    nutrient_deficiency_signs: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    all_probabilities: Dict[str, float]
    treatment: Optional[Dict[str, Any]] = None
    timestamp: str

class SubmissionRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_type: str
    plant_age_days: int
    location_region: str
    soil_ph: float
    soil_moisture_pct: float
    ambient_temperature_c: float
    ambient_humidity_pct: float
    leaf_color: str
    lesion_present: bool
    lesion_count: int
    spot_size_mm: float
    nutrient_deficiency_signs: str
    predicted_disease: str
    confidence: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubmissionCreate(BaseModel):
    crop_type: str
    plant_age_days: int
    location_region: str
    soil_ph: float
    soil_moisture_pct: float
    ambient_temperature_c: float
    ambient_humidity_pct: float
    leaf_color: str
    lesion_present: bool
    lesion_count: int
    spot_size_mm: float
    nutrient_deficiency_signs: str
    predicted_disease: str
    confidence: float

class StatsResponse(BaseModel):
    total_predictions: int
    disease_distribution: Dict[str, int]
    avg_confidence: float
    recent_predictions: int
    crops_analyzed: Dict[str, int]

# Helper functions
def preprocess_input(input_data: dict, model_data: dict):
    """Preprocess input data for prediction."""
    # Create DataFrame with single row
    df = pd.DataFrame([input_data])
    
    # Get feature columns and encoders from model
    feature_columns = model_data['feature_columns']
    label_encoders = model_data['label_encoders']
    scaler = model_data['scaler']
    
    # Ensure all feature columns are present
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    
    # Select only the feature columns in correct order
    df = df[feature_columns]
    
    # Encode categorical variables
    for col, encoder in label_encoders.items():
        if col in df.columns:
            try:
                df[col] = encoder.transform(df[col].astype(str))
            except ValueError:
                # Handle unseen categories
                df[col] = -1
    
    # Scale features
    X_scaled = scaler.transform(df)
    
    return X_scaled

# Endpoints
@api_router.get("/")
async def root():
    return {"message": "Plant Disease Detector API", "status": "running"}

@api_router.post("/predict", response_model=PredictionResponse)
async def predict_disease(input_data: PredictionInput):
    """Predict plant disease from input features."""
    if not model_data:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Preprocess input
        input_dict = input_data.model_dump()
        X = preprocess_input(input_dict, model_data)
        
        # Make prediction
        model = model_data['model']
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Get class names and probabilities
        classes = model.classes_
        prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
        confidence = float(max(probabilities))
        
        # Get treatment information
        treatment_info = treatments.get(prediction, {
            "treatment": "No treatment information available.",
            "prevention": "General preventive measures recommended.",
            "chemicals": []
        })
        
        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            all_probabilities=prob_dict,
            treatment=treatment_info,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@api_router.post("/records", response_model=SubmissionRecord)
async def create_record(input_data: SubmissionCreate):
    """Save a prediction record to database."""
    try:
        record_dict = input_data.model_dump()
        record_obj = SubmissionRecord(**record_dict)
        
        doc = record_obj.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        
        await db.predictions.insert_one(doc)
        return record_obj
    
    except Exception as e:
        logging.error(f"Record creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save record: {str(e)}")

@api_router.get("/records", response_model=List[SubmissionRecord])
async def get_records(limit: int = 100, skip: int = 0):
    """Get all prediction records."""
    try:
        records = await db.predictions.find(
            {}, {"_id": 0}
        ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
        
        for record in records:
            if isinstance(record['timestamp'], str):
                record['timestamp'] = datetime.fromisoformat(record['timestamp'])
        
        return records
    
    except Exception as e:
        logging.error(f"Error fetching records: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")

@api_router.get("/records/{record_id}")
async def get_record(record_id: str):
    """Get a single record by ID."""
    try:
        record = await db.predictions.find_one({"id": record_id}, {"_id": 0})
        
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        if isinstance(record['timestamp'], str):
            record['timestamp'] = datetime.fromisoformat(record['timestamp'])
        
        return record
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching record: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch record: {str(e)}")

@api_router.delete("/records/{record_id}")
async def delete_record(record_id: str):
    """Delete a record by ID."""
    try:
        result = await db.predictions.delete_one({"id": record_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"message": "Record deleted successfully", "id": record_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting record: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get dashboard statistics."""
    try:
        # Total predictions
        total = await db.predictions.count_documents({})
        
        # Disease distribution
        pipeline = [
            {"$group": {"_id": "$predicted_disease", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        disease_dist = await db.predictions.aggregate(pipeline).to_list(100)
        disease_distribution = {item["_id"]: item["count"] for item in disease_dist}
        
        # Crop distribution
        crop_pipeline = [
            {"$group": {"_id": "$crop_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        crop_dist = await db.predictions.aggregate(crop_pipeline).to_list(100)
        crops_analyzed = {item["_id"]: item["count"] for item in crop_dist}
        
        # Average confidence
        avg_pipeline = [{"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence"}}}]
        avg_result = await db.predictions.aggregate(avg_pipeline).to_list(1)
        avg_confidence = avg_result[0]["avg_confidence"] if avg_result else 0.0
        
        # Recent predictions (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent = await db.predictions.count_documents({"timestamp": {"$gte": week_ago}})
        
        return StatsResponse(
            total_predictions=total,
            disease_distribution=disease_distribution,
            avg_confidence=round(avg_confidence, 4),
            recent_predictions=recent,
            crops_analyzed=crops_analyzed
        )
    
    except Exception as e:
        logging.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@api_router.get("/diseases")
async def get_diseases():
    """Get list of all diseases."""
    if not model_data:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    model = model_data['model']
    diseases = model.classes_.tolist()
    
    return {"diseases": diseases, "count": len(diseases)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()