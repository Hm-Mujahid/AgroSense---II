"""Model training script for plant disease detection."""
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
import joblib
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class PlantDiseaseModel:
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.target_column = 'label_disease'
        
    def load_data(self, filepath):
        """Load dataset from CSV."""
        df = pd.read_csv(filepath)
        print(f"Loaded {len(df)} samples")
        print(f"\nDisease distribution:")
        print(df['label_disease'].value_counts())
        return df
    
    def preprocess(self, df, fit=True):
        """Preprocess the data."""
        df = df.copy()
        
        # Drop non-feature columns
        drop_cols = ['sample_id', 'timestamp', 'other_notes', 'severity']
        feature_df = df.drop(columns=[col for col in drop_cols if col in df.columns])
        
        # Separate features and target
        if self.target_column in feature_df.columns:
            X = feature_df.drop(columns=[self.target_column])
            y = feature_df[self.target_column]
        else:
            X = feature_df
            y = None
        
        # Store feature columns
        if fit:
            self.feature_columns = X.columns.tolist()
        
        # Encode categorical variables
        categorical_cols = X.select_dtypes(include=['object', 'bool']).columns
        
        for col in categorical_cols:
            if fit:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    # Handle unseen categories
                    X[col] = X[col].astype(str).apply(
                        lambda x: le.transform([x])[0] if x in le.classes_ else -1
                    )
        
        # Scale numerical features
        if fit:
            X_scaled = self.scaler.fit_transform(X)
        else:
            X_scaled = self.scaler.transform(X)
        
        X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        
        return X_scaled, y
    
    def train(self, X_train, y_train):
        """Train the model with hyperparameter tuning."""
        print("\nTraining Random Forest model...")
        
        # Define parameter grid
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        # Create base model
        rf = RandomForestClassifier(random_state=42, n_jobs=-1)
        
        # Grid search
        grid_search = GridSearchCV(
            rf, param_grid, cv=5, scoring='f1_macro',
            n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        self.model = grid_search.best_estimator_
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Best CV score: {grid_search.best_score_:.4f}")
        
        return self.model
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance."""
        y_pred = self.model.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision_macro': precision_score(y_test, y_pred, average='macro', zero_division=0),
            'recall_macro': recall_score(y_test, y_pred, average='macro', zero_division=0),
            'f1_macro': f1_score(y_test, y_pred, average='macro', zero_division=0)
        }
        
        print("\n" + "="*50)
        print("MODEL EVALUATION RESULTS")
        print("="*50)
        print(f"Accuracy:  {metrics['accuracy']:.4f}")
        print(f"Precision: {metrics['precision_macro']:.4f}")
        print(f"Recall:    {metrics['recall_macro']:.4f}")
        print(f"F1 Score:  {metrics['f1_macro']:.4f}")
        
        print("\n" + "="*50)
        print("CLASSIFICATION REPORT")
        print("="*50)
        print(classification_report(y_test, y_pred))
        
        print("\n" + "="*50)
        print("CONFUSION MATRIX")
        print("="*50)
        print(confusion_matrix(y_test, y_pred))
        
        return metrics
    
    def save_model(self, model_dir='/app/backend/models'):
        """Save trained model and preprocessing objects."""
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, 'plant_disease_model.joblib')
        joblib.dump({
            'model': self.model,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }, model_path)
        
        print(f"\nModel saved to {model_path}")
        
    def load_model(self, model_path='/app/backend/models/plant_disease_model.joblib'):
        """Load trained model and preprocessing objects."""
        data = joblib.load(model_path)
        self.model = data['model']
        self.label_encoders = data['label_encoders']
        self.scaler = data['scaler']
        self.feature_columns = data['feature_columns']
        print(f"Model loaded from {model_path}")

def main():
    """Main training pipeline."""
    # Initialize model
    model = PlantDiseaseModel()
    
    # Load data
    df = model.load_data('/app/backend/data/dataset.csv')
    
    # Preprocess
    X, y = model.preprocess(df, fit=True)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTrain set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train model
    model.train(X_train, y_train)
    
    # Evaluate
    metrics = model.evaluate(X_test, y_test)
    
    # Save model
    model.save_model()
    
    # Save metrics
    os.makedirs('/app/backend/models', exist_ok=True)
    with open('/app/backend/models/metrics.json', 'w') as f:
        json.dump({
            'metrics': metrics,
            'trained_at': datetime.now().isoformat(),
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        }, f, indent=2)
    
    print("\nTraining complete!")

if __name__ == '__main__':
    main()