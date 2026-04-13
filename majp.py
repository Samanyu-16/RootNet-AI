import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import shap

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Load dataset
data = pd.read_csv("Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv")

data.columns = data.columns.str.strip()
data["Label"] = data["Label"].str.strip()

ddos_data = data[data["Label"] == "DDoS"]
print("\nDDoS Data Sample:")
print(ddos_data.head())
print("\nTotal DDoS Rows:", len(ddos_data))
print("Dataset Shape:", data.shape)

# -----------------------------
# DATA CLEANING
# -----------------------------

data.replace([np.inf, -np.inf], np.nan, inplace=True)
data.dropna(inplace=True)
print("\nDataset Shape After Cleaning:", data.shape)

# -----------------------------
# PREPARE FEATURES AND LABEL
# -----------------------------

X = data.drop("Label", axis=1)
y = data["Label"]

le = LabelEncoder()
y = le.fit_transform(y)

# -----------------------------
# TRAIN TEST SPLIT
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("\nTraining Samples:", X_train.shape)
print("Testing Samples:", X_test.shape)

# -----------------------------
# TRAIN RANDOM FOREST MODEL
# -----------------------------

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# -----------------------------
# MAKE PREDICTIONS
# -----------------------------

predictions = model.predict(X_test)

# -----------------------------
# SHAP ROOT CAUSE ANALYSIS
# -----------------------------

print("\nInitializing SHAP explainer...")

explainer = shap.TreeExplainer(model)

sample_size = 5
X_sample = X_test.iloc[:sample_size].reset_index(drop=True)

# Get SHAP explanation object (works with all modern SHAP versions)
explanation = explainer(X_sample)

print(f"\nSHAP values shape: {explanation.values.shape}")
# Expected: (5, 78, 2) → (samples, features, classes)

print("\nSample Root Cause Predictions:")

for i in range(sample_size):
    label = le.inverse_transform([predictions[i]])[0]
    predicted_class_index = int(predictions[i])

    # Extract SHAP values for this sample and predicted class
    # explanation.values shape: (n_samples, n_features, n_classes)
    shap_vals = explanation.values[i, :, predicted_class_index]

    feature_shap = pd.Series(shap_vals, index=X_sample.columns)
    top_features = feature_shap.abs().nlargest(3)

    print(f"\nFlow {i+1}: Predicted → {label}")
    print("  Root Cause (Top Contributing Features):")

    for feat, importance in top_features.items():
        actual_value = X_sample.iloc[i][feat]
        direction = "↑ High" if feature_shap[feat] > 0 else "↓ Low"
        print(f"    - {feat}: {actual_value:.4f}  [{direction} impact, SHAP={importance:.4f}]")

# -----------------------------
# SHAP SUMMARY PLOT
# -----------------------------

print("\nGenerating SHAP Summary Plot...")

ddos_class_index = list(le.classes_).index("DDoS")

shap.summary_plot(
    explanation.values[:, :, ddos_class_index],
    X_sample,
    plot_type="bar",
    max_display=10,
    show=False
)

plt.title("Top 10 Features Contributing to DDoS Detection")
plt.tight_layout()
plt.savefig("shap_summary.png", dpi=150)
plt.show()
print("Saved: shap_summary.png")

# -----------------------------
# SHAP FORCE PLOT FOR FLOW 1
# -----------------------------

print("\nGenerating SHAP Force Plot for Flow 1...")

shap.force_plot(
    explainer.expected_value[ddos_class_index],
    explanation.values[0, :, ddos_class_index],
    X_sample.iloc[0],
    matplotlib=True,
    show=False
)

plt.title("Flow 1 - Feature Contributions")
plt.tight_layout()
plt.savefig("shap_force_flow1.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: shap_force_flow1.png")

# -----------------------------
# MODEL EVALUATION
# -----------------------------

accuracy = accuracy_score(y_test, predictions)
print("\nModel Accuracy:", accuracy)
print("\nClassification Report:")
print(classification_report(y_test, predictions))

# -----------------------------
# CONFUSION MATRIX
# -----------------------------

cm = confusion_matrix(y_test, predictions)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=le.classes_,
            yticklabels=le.classes_)
plt.title("Confusion Matrix")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
plt.show()
print("Saved: confusion_matrix.png")