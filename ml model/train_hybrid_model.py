import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Load dataset for preprocessing reference
file_path = "dataset/processed/processed_traffic_data.csv"
if not os.path.exists(file_path):
    raise FileNotFoundError(f"Dataset file not found: {file_path}")

df = pd.read_csv(file_path)
if df.empty:
    raise ValueError("The dataset is empty. Please check the CSV file contents.")

# Drop unnecessary columns
df = df.drop(columns=['Timestamp'], errors='ignore')

# Remove NaN values
df = df.dropna()
if df.empty:
    raise ValueError("All rows were removed after dropna(). The dataset may contain too many missing values.")

# Encode categorical labels
label_encoder = LabelEncoder()
df['Traffic_Condition'] = label_encoder.fit_transform(df['Traffic_Condition'])

# Extract features and normalize
X = df.drop(columns=['Traffic_Condition'])
feature_names = X.columns.tolist()  # Store column names before applying scaler
scaler = MinMaxScaler()
X = scaler.fit_transform(X)  # Fit scaler on training data

# Load trained model
model_path = "models/hybrid_traffic_model.h5"
if not os.path.exists(model_path):
    raise FileNotFoundError("Trained model not found. Please train the model first.")

model = load_model(model_path)

# Define API input model
class TrafficInput(BaseModel):
    Latitude: float
    Longitude: float
    Vehicle_Count: int
    Traffic_Speed_kmh: float
    Road_Occupancy: float
    Traffic_Light_State: int
    Weather_Condition: int
    Accident_Report: int
    Sentiment_Score: float
    Ride_Sharing_Demand: int
    Parking_Availability: int
    Emission_Levels_g_km: float
    Energy_Consumption_L_h: float

# Function to optimize traffic flow and adjust traffic light
@app.post("/predict")
def optimize_traffic_flow(user_input: TrafficInput):
    input_data = user_input.dict()
    input_df = pd.DataFrame([input_data], columns=feature_names)  # Use stored column names
    input_scaled = scaler.transform(input_df)  # Scale input
    prediction = model.predict(input_scaled)
    predicted_class = np.argmax(prediction)
    traffic_condition = label_encoder.inverse_transform([predicted_class])[0]
    
    # Define traffic light adjustments
    traffic_light_states = {
        "Heavy Traffic": "Extend Green Light Duration",
        "Moderate Traffic": "Balance Green & Red Light Durations",
        "Light Traffic": "Normal Signal Cycle"
    }
    
    traffic_light_action = traffic_light_states.get(traffic_condition, "Monitor & Adjust")
    
    return {"Predicted Traffic Condition": traffic_condition, "Traffic Light Adjustment": traffic_light_action}

# Run FastAPI application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
