"""Data augmentation script to expand dataset to 10k samples."""
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def augment_dataset(input_file, output_file, target_size=10000):
    """Augment dataset by adding synthetic variations."""
    # Load original dataset
    df = pd.read_csv(input_file)
    original_size = len(df)
    print(f"Original dataset: {original_size} samples")
    
    if original_size >= target_size:
        print(f"Dataset already has {original_size} samples.")
        return
    
    augmented_samples = []
    samples_needed = target_size - original_size
    
    print(f"Generating {samples_needed} augmented samples...")
    
    for i in range(samples_needed):
        # Randomly select a base sample
        base_sample = df.sample(n=1).iloc[0].to_dict()
        
        # Create variations
        augmented = base_sample.copy()
        
        # Update sample_id and timestamp
        augmented['sample_id'] = f"SAMPLE_{original_size + i + 1:06d}"
        days_ago = random.randint(0, 365)
        augmented['timestamp'] = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        # Add random variations to numerical features
        augmented['plant_age_days'] = max(20, int(base_sample['plant_age_days'] + random.randint(-10, 10)))
        augmented['soil_ph'] = round(max(5.5, min(8.0, base_sample['soil_ph'] + random.uniform(-0.3, 0.3))), 2)
        augmented['soil_moisture_pct'] = round(max(15, min(85, base_sample['soil_moisture_pct'] + random.uniform(-5, 5))), 1)
        augmented['ambient_temperature_c'] = round(max(15, min(38, base_sample['ambient_temperature_c'] + random.uniform(-2, 2))), 1)
        augmented['ambient_humidity_pct'] = round(max(30, min(95, base_sample['ambient_humidity_pct'] + random.uniform(-5, 5))), 1)
        
        # Add variations to spot counts if disease present
        if base_sample['lesion_present']:
            augmented['lesion_count'] = max(0, int(base_sample['lesion_count'] + random.randint(-3, 3)))
            augmented['spot_size_mm'] = round(max(0, base_sample['spot_size_mm'] + random.uniform(-1, 1)), 1)
        
        augmented_samples.append(augmented)
    
    # Combine original and augmented data
    augmented_df = pd.DataFrame(augmented_samples)
    final_df = pd.concat([df, augmented_df], ignore_index=True)
    
    # Save augmented dataset
    final_df.to_csv(output_file, index=False)
    print(f"\nAugmented dataset saved to {output_file}")
    print(f"Total samples: {len(final_df)}")
    print(f"\nDisease distribution:")
    print(final_df['label_disease'].value_counts())

if __name__ == '__main__':
    augment_dataset(
        '/app/backend/data/dataset.csv',
        '/app/backend/data/dataset_10k.csv',
        target_size=10000
    )