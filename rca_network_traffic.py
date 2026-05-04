"""
========================================================
  AI-Based Root Cause Analysis for Network Traffic Failures
  Dataset  : CICIDS 2017
  Attacks  : DDoS + PortScan (extensible to all attacks)
  Model    : Random Forest + XGBoost
  XAI      : SHAP (summary, waterfall, force plots)
  Extras   : SMOTE balancing, severity scoring, CSV report
========================================================
"""

import os
import glob
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import shap

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, f1_score
)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

# ============================================================
# CONFIGURATION — Edit file names / paths here
# ============================================================

CSV_FILES = [
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",

    # Uncomment below to add more attack types from CICIDS 2017:
    # "Wednesday-workingHours.pcap_ISCX.csv",          # Hulk, GoldenEye, Slowloris, Heartbleed
    # "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",  # SQL Injection, XSS, Brute Force
    # "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    # "Monday-WorkingHours.pcap_ISCX.csv",             # Benign only (optional baseline)
]

OUTPUT_DIR   = "rca_outputs"          # All plots + reports saved here
SAMPLE_SIZE  = 10                     # Flows to explain via SHAP (keep ≤ 50 for speed)
TEST_SIZE    = 0.2
RANDOM_STATE = 42
TOP_FEATURES = 10                     # Features shown in SHAP plots
TOP_RCA      = 3                      # Top features per flow in RCA report

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# STEP 1 — LOAD & MERGE MULTIPLE CSV FILES
# ============================================================

print("=" * 60)
print("STEP 1: Loading datasets...")
print("=" * 60)

dfs = []
for filepath in CSV_FILES:
    if not os.path.exists(filepath):
        print(f"  [WARNING] File not found, skipping: {filepath}")
        continue
    df = pd.read_csv(filepath, low_memory=False)
    df.columns = df.columns.str.strip()
    df["Label"] = df["Label"].str.strip()
    print(f"  Loaded: {filepath}  →  {df.shape[0]:,} rows")
    print(f"    Labels: {df['Label'].value_counts().to_dict()}")
    dfs.append(df)

if not dfs:
    raise FileNotFoundError("No CSV files found. Check CSV_FILES paths above.")

data = pd.concat(dfs, ignore_index=True)
print(f"\nCombined dataset shape : {data.shape}")
print(f"Label distribution:\n{data['Label'].value_counts()}\n")

# ============================================================
# STEP 2 — DATA CLEANING
# ============================================================

print("=" * 60)
print("STEP 2: Cleaning data...")
print("=" * 60)

data.replace([np.inf, -np.inf], np.nan, inplace=True)
data.dropna(inplace=True)

# Drop columns that are entirely zero or constant (no information value)
nunique = data.nunique()
constant_cols = nunique[nunique <= 1].index.tolist()
if constant_cols:
    print(f"  Dropping {len(constant_cols)} constant columns: {constant_cols}")
    data.drop(columns=constant_cols, inplace=True)

print(f"  Shape after cleaning : {data.shape}")

# ============================================================
# STEP 3 — FEATURES & LABEL ENCODING
# ============================================================

print("\n" + "=" * 60)
print("STEP 3: Preparing features and labels...")
print("=" * 60)

X = data.drop("Label", axis=1)
y_raw = data["Label"]

le = LabelEncoder()
y = le.fit_transform(y_raw)

print(f"  Classes detected : {list(le.classes_)}")
print(f"  Feature count    : {X.shape[1]}")

# ============================================================
# STEP 4 — TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
print(f"\n  Train samples : {X_train.shape[0]:,}")
print(f"  Test samples  : {X_test.shape[0]:,}")

# ============================================================
# STEP 5 — CLASS IMBALANCE HANDLING WITH SMOTE
# ============================================================

print("\n" + "=" * 60)
print("STEP 5: Applying SMOTE to balance classes...")
print("=" * 60)

print("  Before SMOTE:")
for cls, cnt in zip(*np.unique(y_train, return_counts=True)):
    print(f"    {le.inverse_transform([cls])[0]:<20} : {cnt:,}")

# k_neighbors=3 is safer when minority class is small
smote = SMOTE(random_state=RANDOM_STATE, k_neighbors=3)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

print("\n  After SMOTE:")
for cls, cnt in zip(*np.unique(y_train_bal, return_counts=True)):
    print(f"    {le.inverse_transform([cls])[0]:<20} : {cnt:,}")

# ============================================================
# STEP 6 — FEATURE SELECTION
# ============================================================

print("\n" + "=" * 60)
print("STEP 6: Selecting important features...")
print("=" * 60)

pre_model = RandomForestClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1)
pre_model.fit(X_train_bal, y_train_bal)

selector = SelectFromModel(pre_model, threshold="mean", prefit=True)
X_train_sel = selector.transform(X_train_bal)
X_test_sel  = selector.transform(X_test)

selected_features = X.columns[selector.get_support()].tolist()
print(f"  Features reduced : {X.shape[1]} → {len(selected_features)}")
print(f"  Selected         : {selected_features[:10]}{'...' if len(selected_features) > 10 else ''}")

# Rebuild DataFrames with selected feature names (needed for SHAP labels)
X_train_sel = pd.DataFrame(X_train_sel, columns=selected_features)
X_test_sel  = pd.DataFrame(X_test_sel,  columns=selected_features)

# ============================================================
# STEP 7 — TRAIN MODELS (Random Forest + XGBoost)
# ============================================================

print("\n" + "=" * 60)
print("STEP 7: Training models...")
print("=" * 60)

models = {
    "RandomForest": RandomForestClassifier(
        n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1
    ),
    "XGBoost": XGBClassifier(
        n_estimators=100, random_state=RANDOM_STATE,
        eval_metric="mlogloss", verbosity=0
    ),
}

results = {}
for name, m in models.items():
    print(f"\n  Training {name}...")
    m.fit(X_train_sel, y_train_bal)
    preds = m.predict(X_test_sel)
    acc   = accuracy_score(y_test, preds)
    f1    = f1_score(y_test, preds, average="weighted")
    results[name] = {"model": m, "preds": preds, "accuracy": acc, "f1": f1}
    print(f"    Accuracy : {acc:.4f}")
    print(f"    F1 Score : {f1:.4f}")

# Pick the best model by F1 for SHAP analysis
best_name  = max(results, key=lambda k: results[k]["f1"])
best_model = results[best_name]["model"]
predictions = results[best_name]["preds"]
print(f"\n  Best model for SHAP : {best_name}")

# ============================================================
# STEP 8 — MODEL COMPARISON BAR CHART
# ============================================================

print("\n" + "=" * 60)
print("STEP 8: Saving model comparison chart...")
print("=" * 60)

fig, ax = plt.subplots(figsize=(7, 4))
metrics_df = pd.DataFrame({
    "Model"    : list(results.keys()),
    "Accuracy" : [r["accuracy"] for r in results.values()],
    "F1 Score" : [r["f1"]       for r in results.values()],
})
metrics_df.set_index("Model").plot(kind="bar", ax=ax, colormap="Set2", edgecolor="black")
ax.set_title("Model Comparison — Accuracy vs F1 Score")
ax.set_ylabel("Score")
ax.set_ylim(0, 1.05)
ax.legend(loc="lower right")
plt.xticks(rotation=0)
plt.tight_layout()
out = os.path.join(OUTPUT_DIR, "model_comparison.png")
plt.savefig(out, dpi=150)
plt.close()
print(f"  Saved: {out}")

# ============================================================
# STEP 9 — CONFUSION MATRIX
# ============================================================

print("\n" + "=" * 60)
print("STEP 9: Generating confusion matrix...")
print("=" * 60)

cm = confusion_matrix(y_test, predictions)
fig, ax = plt.subplots(figsize=(max(5, len(le.classes_)), max(4, len(le.classes_) - 1)))
sns.heatmap(
    cm, annot=True, fmt="d", cmap="Blues",
    xticklabels=le.classes_, yticklabels=le.classes_, ax=ax
)
ax.set_title(f"Confusion Matrix — {best_name}")
ax.set_ylabel("Actual")
ax.set_xlabel("Predicted")
plt.tight_layout()
out = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
plt.savefig(out, dpi=150)
plt.close()
print(f"  Saved: {out}")

# Full classification report
print(f"\n  Classification Report ({best_name}):")
print(classification_report(y_test, predictions, target_names=le.classes_))

# ============================================================
# STEP 10 — SHAP ANALYSIS
# ============================================================

print("\n" + "=" * 60)
print("STEP 10: Running SHAP explanations...")
print("=" * 60)

explainer = shap.TreeExplainer(best_model)

# Use a stratified sample so all classes are represented
sample_indices = []
for cls in np.unique(y_test):
    cls_indices = np.where(y_test == cls)[0]
    n = max(1, SAMPLE_SIZE // len(np.unique(y_test)))
    chosen = cls_indices[:n]
    sample_indices.extend(chosen.tolist())
sample_indices = sample_indices[:SAMPLE_SIZE]

X_sample  = X_test_sel.iloc[sample_indices].reset_index(drop=True)
y_sample  = y_test[sample_indices]
p_sample  = predictions[sample_indices]

explanation = explainer(X_sample)
print(f"  SHAP values shape: {explanation.values.shape}")
# Shape: (n_samples, n_features, n_classes)  for multi-class

# ---- 10a. Per-class SHAP Summary Plots ----
print("\n  Generating per-class SHAP summary plots...")
for attack in le.classes_:
    cls_idx = list(le.classes_).index(attack)
    shap.summary_plot(
        explanation.values[:, :, cls_idx],
        X_sample,
        plot_type="bar",
        max_display=TOP_FEATURES,
        show=False
    )
    plt.title(f"Top {TOP_FEATURES} Features — {attack} Detection")
    plt.tight_layout()
    safe_name = attack.replace(" ", "_").lower()
    out = os.path.join(OUTPUT_DIR, f"shap_summary_{safe_name}.png")
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"    Saved: {out}")

# ---- 10b. SHAP Waterfall Plots (one per class) ----
print("\n  Generating SHAP waterfall plots...")
for attack in le.classes_:
    cls_idx   = list(le.classes_).index(attack)
    # Find first sample predicted as this class
    match_idx = next((i for i, p in enumerate(p_sample) if p == cls_idx), None)
    if match_idx is None:
        print(f"    [SKIP] No predicted sample for class: {attack}")
        continue
    shap.plots.waterfall(
        explanation[match_idx, :, cls_idx],
        max_display=TOP_FEATURES,
        show=False
    )
    safe_name = attack.replace(" ", "_").lower()
    out = os.path.join(OUTPUT_DIR, f"shap_waterfall_{safe_name}.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"    Saved: {out}")

# ---- 10c. SHAP Force Plot (Flow 1) ----
print("\n  Generating SHAP force plot for Flow 1...")
pred_cls_flow1 = int(p_sample[0])
shap.force_plot(
    explainer.expected_value[pred_cls_flow1],
    explanation.values[0, :, pred_cls_flow1],
    X_sample.iloc[0],
    matplotlib=True,
    show=False
)
plt.title("Flow 1 — Feature Contributions (Force Plot)")
plt.tight_layout()
out = os.path.join(OUTPUT_DIR, "shap_force_flow1.png")
plt.savefig(out, dpi=150, bbox_inches="tight")
plt.close()
print(f"    Saved: {out}")

# ============================================================
# STEP 11 — SEVERITY SCORING FUNCTION
# ============================================================

def compute_severity(shap_vals: np.ndarray, top_n: int = 5) -> int:
    """
    Returns a 0–100 severity score based on how concentrated
    the SHAP impact is in the top contributing features.
    Higher = more confident / severe prediction.
    """
    total = np.abs(shap_vals).sum()
    if total == 0:
        return 0
    top_sum = np.abs(shap_vals)[np.argsort(np.abs(shap_vals))[::-1]][:top_n].sum()
    return min(100, int((top_sum / total) * 100))

# ============================================================
# STEP 12 — PER-FLOW ROOT CAUSE ANALYSIS (Console + CSV)
# ============================================================

print("\n" + "=" * 60)
print("STEP 12: Per-flow Root Cause Analysis...")
print("=" * 60)

rca_rows = []

for i in range(len(X_sample)):
    predicted_class_index = int(p_sample[i])
    actual_class_index    = int(y_sample[i])
    label_pred  = le.inverse_transform([predicted_class_index])[0]
    label_actual = le.inverse_transform([actual_class_index])[0]

    shap_vals    = explanation.values[i, :, predicted_class_index]
    feature_shap = pd.Series(shap_vals, index=X_sample.columns)
    top_features = feature_shap.abs().nlargest(TOP_RCA)
    severity     = compute_severity(shap_vals)

    print(f"\n  Flow {i+1:02d} | Predicted: {label_pred:<12} | Actual: {label_actual:<12} | Severity: {severity}/100")
    print("    Root Cause (Top Contributing Features):")

    row = {
        "Flow"           : i + 1,
        "Predicted_Label": label_pred,
        "Actual_Label"   : label_actual,
        "Correct"        : label_pred == label_actual,
        "Severity_Score" : severity,
    }

    for rank, (feat, importance) in enumerate(top_features.items(), start=1):
        actual_val = X_sample.iloc[i][feat]
        direction  = "↑ High" if feature_shap[feat] > 0 else "↓ Low"
        print(f"      {rank}. {feat:<35} val={actual_val:.4f}  [{direction} impact, SHAP={importance:.4f}]")
        row[f"Top_Feature_{rank}"]       = feat
        row[f"Top_Feature_{rank}_Value"] = round(actual_val, 4)
        row[f"Top_Feature_{rank}_SHAP"]  = round(float(importance), 4)
        row[f"Top_Feature_{rank}_Dir"]   = direction

    rca_rows.append(row)

rca_df = pd.DataFrame(rca_rows)
rca_path = os.path.join(OUTPUT_DIR, "rca_report.csv")
rca_df.to_csv(rca_path, index=False)
print(f"\n  RCA report saved: {rca_path}")

# ============================================================
# STEP 13 — SEVERITY DISTRIBUTION PLOT
# ============================================================

print("\n" + "=" * 60)
print("STEP 13: Saving severity distribution plot...")
print("=" * 60)

fig, ax = plt.subplots(figsize=(8, 4))
colors = {"DDoS": "#e74c3c", "PortScan": "#e67e22", "BENIGN": "#2ecc71"}
for label in rca_df["Predicted_Label"].unique():
    subset = rca_df[rca_df["Predicted_Label"] == label]["Severity_Score"]
    color  = colors.get(label, "#3498db")
    ax.scatter(subset.index, subset.values, label=label, color=color, s=80, zorder=3)

ax.axhline(75, color="red",    linestyle="--", linewidth=1, label="High threshold (75)")
ax.axhline(40, color="orange", linestyle="--", linewidth=1, label="Medium threshold (40)")
ax.set_title("Severity Score per Flow")
ax.set_xlabel("Flow Index")
ax.set_ylabel("Severity Score (0–100)")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
out = os.path.join(OUTPUT_DIR, "severity_distribution.png")
plt.savefig(out, dpi=150)
plt.close()
print(f"  Saved: {out}")

# ============================================================
# STEP 14 — LIVE BATCH SIMULATION
# ============================================================

print("\n" + "=" * 60)
print("STEP 14: Live batch simulation (last 20 test flows)...")
print("=" * 60)

def analyze_batch(batch_df, model, explainer, le, top_n=TOP_RCA):
    """
    Simulates real-time RCA on a batch of flows.
    Returns a list of alert dicts for non-BENIGN predictions.
    """
    preds       = model.predict(batch_df)
    explanation = explainer(batch_df)
    alerts      = []

    for i, pred in enumerate(preds):
        label = le.inverse_transform([pred])[0]
        if label == "BENIGN":
            continue
        shap_vals    = explanation.values[i, :, int(pred)]
        feature_shap = pd.Series(np.abs(shap_vals), index=batch_df.columns)
        top          = feature_shap.nlargest(top_n)
        severity     = compute_severity(shap_vals)

        alerts.append({
            "flow"        : i,
            "attack"      : label,
            "severity"    : severity,
            "top_features": top.index.tolist(),
        })
    return alerts

live_batch = X_test_sel.iloc[-20:].reset_index(drop=True)
alerts     = analyze_batch(live_batch, best_model, explainer, le)

if alerts:
    print(f"  {len(alerts)} alert(s) detected in batch:")
    for a in alerts:
        print(f"    Flow {a['flow']:02d} | {a['attack']:<12} | Severity {a['severity']:3d}/100 | "
              f"Top features: {a['top_features']}")
else:
    print("  No attacks detected in this batch (all BENIGN).")

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("COMPLETE — All outputs saved to:", os.path.abspath(OUTPUT_DIR))
print("=" * 60)
print("\nFiles generated:")
for f in sorted(os.listdir(OUTPUT_DIR)):
    print(f"  {f}")

print("\nModel Performance Summary:")
for name, r in results.items():
    marker = " ← best" if name == best_name else ""
    print(f"  {name:<15} Accuracy={r['accuracy']:.4f}  F1={r['f1']:.4f}{marker}")