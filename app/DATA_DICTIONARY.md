# Plant Disease Detection - Data Dictionary

This document describes all fields in the plant disease detection dataset.

## Dataset Overview

- **Format**: CSV (Comma-Separated Values)
- **Initial Size**: 800 samples
- **Expandable To**: 10,000 samples via augmentation
- **Target Variable**: `label_disease`
- **Feature Count**: 17 fields

## Field Descriptions

### Identification

#### sample_id
- **Type**: String
- **Format**: `SAMPLE_XXXXXX` (6-digit number)
- **Example**: `SAMPLE_000001`
- **Description**: Unique identifier for each plant observation
- **Constraints**: Unique, not null
- **Usage**: Primary key for tracking samples

#### timestamp
- **Type**: ISO 8601 datetime string
- **Example**: `2025-12-07T10:30:45.123456`
- **Description**: Date and time when the observation was recorded
- **Range**: Past 365 days from generation
- **Usage**: Temporal analysis, trend tracking

### Plant Information

#### crop_type
- **Type**: Categorical (String)
- **Allowed Values**: 
  - Tomato
  - Potato
  - Wheat
  - Rice
  - Corn
  - Cotton
  - Soybean
  - Pepper
- **Example**: `Tomato`
- **Description**: Type of crop being observed
- **Constraints**: Must be one of the allowed values
- **ML Encoding**: Label encoded (0-7)

#### plant_age_days
- **Type**: Integer
- **Range**: 20 - 150 days
- **Unit**: Days
- **Example**: `75`
- **Description**: Age of the plant in days from germination
- **Mean**: ~85 days
- **Usage**: Age-related disease susceptibility analysis

#### location_region
- **Type**: Categorical (String)
- **Allowed Values**:
  - North
  - South
  - East
  - West
  - Central
  - Northeast
  - Northwest
  - Southeast
  - Southwest
- **Example**: `Central`
- **Description**: Geographic region where plant is growing
- **ML Encoding**: Label encoded (0-8)
- **Usage**: Regional disease pattern analysis

### Environmental Factors

#### soil_ph
- **Type**: Float
- **Range**: 5.5 - 8.0
- **Unit**: pH scale
- **Precision**: 2 decimal places
- **Example**: `6.8`
- **Description**: Acidity/alkalinity of soil
- **Optimal Range**: 6.0 - 7.5 (varies by crop)
- **Impact**: Affects nutrient availability and disease susceptibility

#### soil_moisture_pct
- **Type**: Float
- **Range**: 15.0 - 85.0
- **Unit**: Percentage (%)
- **Precision**: 1 decimal place
- **Example**: `55.0`
- **Description**: Moisture content in soil
- **Optimal Range**: 40-60% (varies by crop)
- **Impact**: High moisture promotes fungal diseases

#### ambient_temperature_c
- **Type**: Float
- **Range**: 15.0 - 38.0
- **Unit**: Degrees Celsius (°C)
- **Precision**: 1 decimal place
- **Example**: `28.0`
- **Description**: Air temperature around the plant
- **Impact**: Temperature affects disease development rate
- **Note**: Convert to Fahrenheit: F = (C × 9/5) + 32

#### ambient_humidity_pct
- **Type**: Float
- **Range**: 30.0 - 95.0
- **Unit**: Percentage (%)
- **Precision**: 1 decimal place
- **Example**: `80.0`
- **Description**: Relative humidity in the air
- **Impact**: High humidity favors many plant diseases
- **Critical**: >70% increases fungal disease risk

### Visual Observations

#### leaf_color
- **Type**: Categorical (String)
- **Allowed Values**:
  - Dark_Green (healthy)
  - Green (healthy)
  - Light_Green (possible deficiency)
  - Yellow_Green (stress indicator)
  - Yellow (stress/disease)
  - Pale_Green (nutrient deficiency)
  - Brown (severe stress/disease)
- **Example**: `Yellow`
- **Description**: Observed color of plant leaves
- **ML Encoding**: Label encoded
- **Usage**: Primary visual indicator of plant health

#### lesion_present
- **Type**: Boolean
- **Allowed Values**: `True`, `False`
- **Example**: `True`
- **Description**: Whether lesions (abnormal spots) are visible on leaves
- **ML Encoding**: 0 (False) or 1 (True)
- **Correlation**: Strong indicator of disease presence

#### lesion_count
- **Type**: Integer
- **Range**: 0 - 25
- **Unit**: Count
- **Example**: `15`
- **Description**: Number of visible lesions on observed leaves
- **Constraints**: 0 if lesion_present is False
- **Severity Indicator**: >10 suggests moderate to severe infection

#### spot_size_mm
- **Type**: Float
- **Range**: 0.0 - 15.0
- **Unit**: Millimeters (mm)
- **Precision**: 1 decimal place
- **Example**: `8.5`
- **Description**: Average diameter of disease spots/lesions
- **Constraints**: 0.0 if lesion_present is False
- **Severity**: >5mm indicates advanced disease stage

#### nutrient_deficiency_signs
- **Type**: Categorical (String)
- **Allowed Values**:
  - None (no deficiency)
  - Nitrogen (yellowing, stunted growth)
  - Phosphorus (purple/red tints)
  - Potassium (leaf margins burn)
  - Magnesium (interveinal chlorosis)
  - Iron (young leaf yellowing)
  - Calcium (tip burn, blossom end rot)
- **Example**: `Nitrogen`
- **Description**: Signs of nutrient deficiency observed
- **ML Encoding**: Label encoded (0-6)
- **Note**: Can occur with or without disease

#### other_notes
- **Type**: String (Text)
- **Max Length**: 500 characters
- **Example**: `"Some wilting observed in afternoon"`
- **Description**: Additional observations or notes
- **Usage**: Not used in ML model (free text)
- **Optional**: Can be empty

### Target Variable

#### label_disease
- **Type**: Categorical (String)
- **Allowed Values** (23 diseases + Healthy):
  - Healthy
  - Bacterial_Blight
  - Bacterial_Leaf_Blight
  - Bacterial_Spot
  - Bacterial_Wilt
  - Brown_Spot
  - Common_Rust
  - Downy_Mildew
  - Early_Blight
  - Frogeye_Leaf_Spot
  - Fusarium_Wilt
  - Gray_Leaf_Spot
  - Late_Blight
  - Leaf_Mold
  - Leaf_Smut
  - Northern_Leaf_Blight
  - Phytophthora_Blight
  - Powdery_Mildew
  - Rust
  - Septoria_Leaf_Spot
  - Septoria_Tritici_Blotch
  - Verticillium_Wilt
  - Yellow_Leaf_Curl_Virus
- **Example**: `Bacterial_Spot`
- **Description**: Diagnosed disease or healthy status
- **ML Usage**: Target variable for classification
- **Distribution**: Imbalanced (Healthy class is largest)

#### severity
- **Type**: Categorical (String)
- **Allowed Values**:
  - None (for Healthy)
  - Mild (early stage, <30% affected)
  - Moderate (30-60% affected)
  - Severe (>60% affected)
- **Example**: `Moderate`
- **Description**: Severity level of the disease
- **Optional**: Not used in current ML model
- **Usage**: Additional context for treatment planning

## Data Quality Notes

### Missing Values
- **Policy**: No missing values in training dataset
- **Handling**: All fields are required during data collection
- **Inference**: Missing values are imputed based on crop type and region

### Data Generation
- **Method**: Realistic synthetic data with domain knowledge
- **Validation**: Follows real-world plant pathology patterns
- **Augmentation**: Adds realistic variations without changing disease labels

### Class Balance
- **Healthy**: ~20-25% of samples
- **Diseases**: Remaining 75-80% across 23 classes
- **Imbalance**: Some rare diseases have fewer samples
- **Mitigation**: Stratified sampling during train/test split

## Feature Engineering Suggestions

### Derived Features
1. **Temperature-Humidity Index**: `temperature_c * humidity_pct / 100`
2. **Lesion Density**: `lesion_count / plant_age_days`
3. **Moisture Stress**: Binary flag for soil_moisture < 30%
4. **pH Deviation**: Distance from optimal pH for crop
5. **Season**: Extract from timestamp (not in current version)

### Interaction Terms
- Humidity × Temperature (disease risk)
- Soil pH × Crop Type (nutrient availability)
- Age × Disease Severity (progression rate)

## Usage Examples

### Python (Pandas)
```python
import pandas as pd

# Load dataset
df = pd.read_csv('dataset.csv')

# View summary
print(df.describe())

# Check for missing values
print(df.isnull().sum())

# Disease distribution
print(df['label_disease'].value_counts())

# Filter healthy plants
healthy = df[df['label_disease'] == 'Healthy']

# High-risk conditions (high humidity + lesions)
risk = df[(df['ambient_humidity_pct'] > 80) & (df['lesion_present'] == True)]
```

### MongoDB Query
```javascript
// Find all Tomato diseases
db.predictions.find({ crop_type: "Tomato", predicted_disease: { $ne: "Healthy" } })

// High confidence predictions
db.predictions.find({ confidence: { $gt: 0.8 } })

// Recent week's data
db.predictions.find({ 
  timestamp: { $gte: new Date(Date.now() - 7*24*60*60*1000) } 
})
```

## Data Validation Rules

1. **Sample ID**: Must be unique
2. **Numeric Ranges**: Must fall within specified ranges
3. **Categorical Values**: Must match allowed list
4. **Logic Checks**:
   - If lesion_present = False, then lesion_count = 0 and spot_size_mm = 0
   - If label_disease = "Healthy", then severity = "None"
5. **Timestamp**: Must be valid ISO format

## Export Formats

### CSV
- Comma-delimited
- UTF-8 encoding
- Header row included
- Boolean as "True"/"False"

### MongoDB
```json
{
  "sample_id": "SAMPLE_000001",
  "timestamp": ISODate("2025-12-07T10:30:45.123Z"),
  "crop_type": "Tomato",
  "plant_age_days": 75,
  ...
}
```

### JSON
```json
[
  {
    "sample_id": "SAMPLE_000001",
    "timestamp": "2025-12-07T10:30:45.123456",
    "crop_type": "Tomato",
    ...
  }
]
```

## Version History

- **v1.0**: Initial 800-sample dataset
- **v1.1**: Augmentation support for 10k samples
- **Future**: Plan to add weather data, GPS coordinates

---

**Last Updated**: December 2025