"""Dataset generation module for plant disease detection."""
import random
import csv
from datetime import datetime, timedelta
import os

# Define crops and their common diseases
CROPS_DISEASES = {
    "Tomato": [
        "Healthy", "Early_Blight", "Late_Blight", "Leaf_Mold", 
        "Septoria_Leaf_Spot", "Bacterial_Spot", "Yellow_Leaf_Curl_Virus"
    ],
    "Potato": [
        "Healthy", "Early_Blight", "Late_Blight", "Bacterial_Wilt"
    ],
    "Wheat": [
        "Healthy", "Rust", "Powdery_Mildew", "Septoria_Tritici_Blotch"
    ],
    "Rice": [
        "Healthy", "Bacterial_Leaf_Blight", "Brown_Spot", "Leaf_Smut"
    ],
    "Corn": [
        "Healthy", "Northern_Leaf_Blight", "Gray_Leaf_Spot", "Common_Rust"
    ],
    "Cotton": [
        "Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Verticillium_Wilt"
    ],
    "Soybean": [
        "Healthy", "Frogeye_Leaf_Spot", "Downy_Mildew", "Bacterial_Blight"
    ],
    "Pepper": [
        "Healthy", "Bacterial_Spot", "Phytophthora_Blight"
    ]
}

REGIONS = ["North", "South", "East", "West", "Central", "Northeast", "Northwest", "Southeast", "Southwest"]

LEAF_COLORS = {
    "Healthy": ["Dark_Green", "Green"],
    "Diseased": ["Yellow", "Yellow_Green", "Brown", "Light_Green", "Pale_Green"]
}

NUTRIENT_DEFICIENCY = [
    "None", "Nitrogen", "Phosphorus", "Potassium", "Magnesium", "Iron", "Calcium"
]

SEVERITY = ["Mild", "Moderate", "Severe"]

def generate_sample(sample_id):
    """Generate a single plant observation sample."""
    crop_type = random.choice(list(CROPS_DISEASES.keys()))
    disease = random.choice(CROPS_DISEASES[crop_type])
    is_healthy = disease == "Healthy"
    
    # Generate timestamp within last year
    days_ago = random.randint(0, 365)
    timestamp = (datetime.now() - timedelta(days=days_ago)).isoformat()
    
    # Plant age varies by crop
    plant_age = random.randint(20, 150)
    
    # Environmental factors
    region = random.choice(REGIONS)
    soil_ph = round(random.uniform(5.5, 8.0), 2)
    soil_moisture = round(random.uniform(15, 85), 1)
    temperature = round(random.uniform(15, 38), 1)
    humidity = round(random.uniform(30, 95), 1)
    
    # Visual observations
    if is_healthy:
        leaf_color = random.choice(LEAF_COLORS["Healthy"])
        lesion_present = False
        lesion_count = 0
        spot_size = 0.0
        nutrient_def = random.choice(["None", "None", "None", random.choice(NUTRIENT_DEFICIENCY[1:])])
        severity = "None"
    else:
        leaf_color = random.choice(LEAF_COLORS["Diseased"] + LEAF_COLORS["Healthy"])
        lesion_present = random.choice([True, True, False])
        lesion_count = random.randint(0, 25) if lesion_present else 0
        spot_size = round(random.uniform(0, 15), 1) if lesion_present else 0.0
        nutrient_def = random.choice(NUTRIENT_DEFICIENCY)
        severity = random.choice(SEVERITY)
    
    return {
        "sample_id": f"SAMPLE_{sample_id:06d}",
        "timestamp": timestamp,
        "crop_type": crop_type,
        "plant_age_days": plant_age,
        "location_region": region,
        "soil_ph": soil_ph,
        "soil_moisture_pct": soil_moisture,
        "ambient_temperature_c": temperature,
        "ambient_humidity_pct": humidity,
        "leaf_color": leaf_color,
        "lesion_present": lesion_present,
        "lesion_count": lesion_count,
        "spot_size_mm": spot_size,
        "nutrient_deficiency_signs": nutrient_def,
        "other_notes": "",
        "label_disease": disease,
        "severity": severity
    }

def generate_dataset(num_samples=800, output_file="dataset.csv"):
    """Generate complete dataset."""
    # Create directory structure if it doesn't exist
    output_dir = os.path.dirname(output_file)
    if output_dir:  # Only create if there's a directory path
        os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating {num_samples} samples...")
    samples = [generate_sample(i + 1) for i in range(num_samples)]
    
    fieldnames = [
        "sample_id", "timestamp", "crop_type", "plant_age_days", "location_region",
        "soil_ph", "soil_moisture_pct", "ambient_temperature_c", "ambient_humidity_pct",
        "leaf_color", "lesion_present", "lesion_count", "spot_size_mm",
        "nutrient_deficiency_signs", "other_notes", "label_disease", "severity"
    ]
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(samples)
        
        print(f"✓ Successfully generated {num_samples} samples to {output_file}")
        print(f"✓ File location: {os.path.abspath(output_file)}")
    except Exception as e:
        print(f"✗ Error writing file: {e}")
        return None
    
    return samples

if __name__ == "__main__":
    # Generate dataset
    generate_dataset(50000, "data/dataset.csv")