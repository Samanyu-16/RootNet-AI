# RootNet AI

> **AI-powered Network Threat Detection, Explainable Root Cause Analysis & Security Intelligence Platform**

RootNet AI is a machine-learning-based network security and root-cause analysis platform designed to detect malicious network traffic, classify attacks, assess severity, and explain **why** a network flow was classified as an attack.

The project uses network traffic datasets such as **CICIDS2017** and combines machine learning, SHAP explainability, automated severity scoring, and a web dashboard to turn raw network traffic into actionable security insights.

---

## 🚀 Key Features

### 🔍 Network Attack Detection
- Analyzes network traffic datasets in CSV format.
- Detects benign and malicious network flows.
- Supports multiple attack categories present in the training dataset.
- Uses machine-learning-based classification.

### 🧠 Explainable AI
RootNet AI does not stop at predicting an attack.

For every analyzed flow, the system can provide:
- Top contributing features
- Feature values
- SHAP values
- Direction and magnitude of feature impact
- Prediction correctness
- Model confidence
- Severity score

This makes the model more interpretable and helps analysts understand the reasoning behind a prediction.

### 🛡️ Root Cause Analysis
The platform connects:

```text
Network Traffic
      ↓
Attack Detection
      ↓
Severity Assessment
      ↓
SHAP Explainability
      ↓
Root Cause Identification
```

The RCA interface highlights the most influential network features associated with a detected threat.

### 📊 Security Dashboard
The React frontend provides:
- Prediction results
- Attack/benign flow overview
- Severity information
- Flagged-flow status
- Root cause analysis
- Model comparison visualizations
- Confusion matrix
- SHAP summaries
- SHAP waterfall/force plots
- Generated RCA reports

### 📈 Model Evaluation
The project generates evaluation artifacts such as:
- Confusion matrix
- Model comparison
- Severity distribution
- SHAP summary plots
- SHAP force plots
- SHAP waterfall plots

### 📄 Automated Reports
After analysis, RootNet AI generates an RCA report containing prediction and severity information that can be consumed by the Flask API and frontend.

---

## 🏗️ System Architecture

```text
                ┌──────────────────────┐
                │  Network Traffic     │
                │      CSV Dataset     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Data Preprocessing   │
                │ & Feature Processing │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   ML Classification  │
                │   Random Forest /    │
                │   Model Pipeline     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Attack Prediction    │
                │ & Severity Scoring   │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌────────────────────┐     ┌────────────────────┐
   │  SHAP Explainable  │     │   RCA Engine        │
   │        AI          │────►│ Root Cause Analysis │
   └────────────────────┘     └─────────┬──────────┘
                                        │
                                        ▼
                              ┌────────────────────┐
                              │ Flask REST API     │
                              └─────────┬──────────┘
                                        │
                                        ▼
                              ┌────────────────────┐
                              │ React Dashboard    │
                              └────────────────────┘
```

---

## 🧰 Tech Stack

### Backend
- Python
- Flask
- Flask-CORS
- Pandas
- NumPy
- Scikit-learn
- SHAP

### Machine Learning
- Random Forest
- Classification pipeline
- Feature preprocessing
- Model evaluation
- SHAP explainability

### Frontend
- React
- JavaScript
- HTML
- CSS
- Vite

### Visualization
- Matplotlib
- Seaborn
- SHAP visualizations

### Data
- CICIDS2017 network intrusion detection datasets

### Development
- Git
- GitHub
- VS Code
- Python virtual environment

---

## 📁 Project Structure

```text
RootNet-AI/
│
├── app.py
├── rca_network_traffic.py
├── .gitignore
│
├── Frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── data/
│   │   └── components/
│   └── ...
│
├── uploads/
│   └── *.csv                 # Local datasets; ignored by Git
│
└── rca_outputs/
    ├── rca_report.csv
    ├── confusion_matrix.png
    ├── model_comparison.png
    ├── severity_distribution.png
    ├── shap_summary*.png
    └── shap_waterfall*.png
```

> Large CICIDS CSV datasets are intentionally excluded from GitHub using `.gitignore`. Place the required datasets inside the `uploads/` directory when running the project locally.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Samanyu-16/RootNet-AI.git
cd RootNet-AI
```

### 2. Create a Python virtual environment

Windows:

```powershell
python -m venv venv
venv\Scripts\activate
```

Linux/macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies

If a `requirements.txt` file is available:

```bash
pip install -r requirements.txt
```

Otherwise, install the core dependencies:

```bash
pip install flask flask-cors pandas numpy scikit-learn shap matplotlib seaborn
```

### 4. Add the datasets

Place the required CICIDS2017 CSV files inside:

```text
uploads/
```

The analysis pipeline expects the configured dataset files to be available there.

---

## ▶️ Running the Backend

From the project root:

```bash
python app.py
```

The Flask backend will start locally.

The default development endpoint is:

```text
http://127.0.0.1:5000
```

You can verify the backend with:

```text
/api/status
```

---

## ▶️ Running the Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Vite will provide a local development URL, typically similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Backend health message |
| `/api/status` | GET | Backend/model status |
| `/api/upload` | POST | Upload network traffic CSV files and start analysis |
| `/api/flows` | GET | Return analyzed flow predictions |
| `/api/report-data` | GET | Return RCA report data |
| `/api/report` | GET | Download the generated RCA report |
| `/outputs/<filename>` | GET | Serve generated analysis output files |

---

## 📥 Dataset Workflow

RootNet AI follows this workflow:

```text
Upload CSV files
      ↓
Validate uploaded dataset
      ↓
Store files locally
      ↓
Run rca_network_traffic.py
      ↓
Generate predictions
      ↓
Calculate severity
      ↓
Generate SHAP explanations
      ↓
Generate RCA report
      ↓
Expose results through Flask API
      ↓
Display results in React dashboard
```

The backend currently validates that **8 CSV files** are uploaded for the configured CICIDS2017 workflow.

---

## 🧠 Explainability with SHAP

SHAP is used to understand which network traffic features contributed most strongly to a model prediction.

Example:

```text
Prediction: DoS Hulk

Top contributing features:

1. Bwd Packets/s
   SHAP Value: 2.0355
   Impact: Up (High)

2. Init_Win_bytes_forward
   SHAP Value: 1.7661
   Impact: Up (High)

3. Flow IAT Max
   SHAP Value: 0.9430
   Impact: Up (High)
```

This allows RootNet AI to provide an explanation rather than presenting the ML prediction as a black box.

---

## 📊 Severity Scoring

Each analyzed flow receives a severity score.

The dashboard uses severity information to classify and flag suspicious traffic.

Example:

```text
Severity Score: 65/100
Level: Medium
Status: Flagged
```

The system also calculates aggregate statistics such as:
- Total flows
- Attacks detected
- High-severity flows
- Average severity

---

## 🔬 Model Evaluation

RootNet AI generates evaluation visualizations including:

- Confusion Matrix
- Model Comparison
- Severity Distribution
- SHAP Summary
- SHAP Force Plot
- SHAP Waterfall Plots

These outputs can be used to evaluate model behavior and communicate results during analysis, demonstrations, and project reviews.

---

## 🔐 Security & Data Handling

The repository intentionally does **not** include large raw network datasets.

The `.gitignore` contains:

```gitignore
*.csv
```

This prevents large CSV datasets from being committed accidentally.

For local execution:

```text
RootNet-AI/
└── uploads/
    └── dataset CSV files
```

---

## 🛣️ Future Improvements

Planned/possible extensions include:

- Real-time network traffic monitoring
- Network topology visualization
- Attack correlation and attack-chain detection
- Anomaly detection using Isolation Forest/Autoencoders
- Risk scoring engine
- Incident timeline
- Historical incident database
- Automated security alerts
- AI-generated incident reports
- Recommended mitigation actions
- Role-based access control
- Counterfactual explanations
- Support for additional network datasets

---

## 🎯 Project Objective

RootNet AI aims to bridge the gap between **network intrusion detection** and **root-cause analysis**.

Traditional intrusion detection systems can answer:

> **"Was this traffic malicious?"**

RootNet AI aims to additionally answer:

> **"Why was it classified as malicious?"**

and ultimately:

> **"What network behavior contributed to the incident?"**

This makes the system useful not only for attack detection, but also for **interpretable security analysis and network troubleshooting**.

---

## 👨‍💻 Team Members

- **Samanyu Manohar**
- **Srushti Sunil R**
- **Anaghskanda Bharadwaj**

Computer Science & Engineering  
RV Institute of Technology and Management

GitHub: [Samanyu-16](https://github.com/Samanyu-16)

---

## 📜 Disclaimer

RootNet AI is an academic/research project intended for network security analysis and experimentation. Results generated by machine-learning models should be validated by qualified security professionals before being used for production security decisions.
