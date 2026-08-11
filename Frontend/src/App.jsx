import React, { useState, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutDashboard, Activity, Search, Brain, FileText, Info,
  Upload, Download, X, ChevronRight, CheckCircle2, AlertTriangle,
  ShieldAlert, ShieldCheck, FileDown, FileSpreadsheet, Loader2,
} from "lucide-react";
import { C } from "./data/theme";
import Button from "./components/Button";


function useFonts() {
  useEffect(() => {
    if (document.getElementById("proj-fonts")) return;
    const link = document.createElement("link");
    link.id = "proj-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ---------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------




function severityLevel(s) {
  if (s >= 70) return { label: "High", color: C.danger, bg: C.dangerSoft };
  if (s >= 40) return { label: "Medium", color: C.warning, bg: C.warningSoft };
  return { label: "Low", color: C.success, bg: C.successSoft };
}
function statusFor(type) {
  return type === "BENIGN"
    ? { label: "Normal", color: C.success, bg: C.successSoft }
    : { label: "Flagged", color: C.danger, bg: C.dangerSoft };
}

// ---------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------
function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: C.text }}>{title}</h1>
        {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.textMuted }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 10 }}>{children}</div>}
    </div>
  );
}



function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "18px 20px", ...style,
    }}>{children}</div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, color, background: bg, borderRadius: 6,
      padding: "3px 9px", display: "inline-block",
    }}>{label}</span>
  );
}

// ---------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "traffic", label: "Traffic Analysis", icon: Activity },
  { id: "rca", label: "Root Cause Analysis", icon: Search },
  { id: "explainability", label: "Explainability", icon: Brain },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "about", label: "About", icon: Info },
];

function Sidebar({ page, setPage }) {
  return (
    <div style={{
      width: 216, flexShrink: 0, background: C.surfaceAlt, borderRight: `1px solid ${C.border}`,
      padding: "22px 14px", display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ padding: "0 10px 22px", fontSize: 11, fontWeight: 500, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Navigation
      </div>
      {NAV_ITEMS.map((item) => {
        const active = page === item.id;
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7,
            background: active ? C.accentSoft : "transparent", border: "none", cursor: "pointer",
            color: active ? C.accent : C.textMuted, fontSize: 13.5, fontWeight: active ? 500 : 400,
            fontFamily: "Inter, sans-serif", textAlign: "left", width: "100%",
          }}>
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------
function Dashboard({
    onSelectFlow,
    reportData,
    setReportData,
    flows,
    setFlows,
    setReportRows,
}) {
    const [filter, setFilter] = useState("All");
 const handleUpload = async (event) => {

    const files = Array.from(event.target.files);

    if (files.length === 0) {
        alert("Please select a folder.");
        return;
    }

    const formData = new FormData();

    files.forEach(file => {

        if (file.name.endsWith(".csv")) {
            formData.append("files", file);
        }

    });

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {

            const err = await response.text();
            alert(err);
            return;

        }

        const data = await response.json();
        console.log("UPLOAD RESPONSE", data);

        setReportData(data);

        const flowResponse = await fetch(
            "http://127.0.0.1:5000/api/flows"
        );

        const flowData = await flowResponse.json();
        console.log("FLOW DATA", flowData);

        setFlows(flowData);

        const reportResponse = await fetch(
            "http://127.0.0.1:5000/api/report-data"
        );

        const reportJson = await reportResponse.json();
        console.log("REPORT DATA", reportJson);

        setReportRows(reportJson);
        console.log(reportData);
        console.log(flows);
        console.log(reportRows);

        alert("Analysis Completed!");

    }

    catch (err) {

        console.error(err);
        alert(err.message);

    }

};
const rows =
    filter === "All"
        ? flows
        : flows.filter((f) => f.type === filter);
        
const attackCounts = {};

flows.forEach(flow => {

    attackCounts[flow.type] =
        (attackCounts[flow.type] || 0) + 1;

});

const trafficData = Object.entries(attackCounts).map(

([type,count])=>({

type,

count

})

);
const COLORS = [

"#22c55e",

"#ef4444",

"#3b82f6",

"#eab308",

"#8b5cf6",

"#06b6d4",

"#ec4899",

"#14b8a6",

"#f97316",

"#84cc16"

];

const attackDistribution = trafficData.map(

(item,index)=>({

name:item.type,

value:item.count,

color:COLORS[index%COLORS.length]

})

);
          return (
    <div>
      <PageHeader title="Dashboard" subtitle="Workflow: Upload dataset → Detect attack → Show root cause → Generate report">
        <>
<input
    id="csvUpload"
    type="file"
    multiple
    webkitdirectory=""
    directory=""
    style={{ display: "none" }}
    onChange={handleUpload}
/>

 <Button
    variant="secondary"
    icon={Upload}
    onClick={() => document.getElementById("csvUpload").click()}
>
    Upload CICIDS2017 Folder
</Button>
</>
        
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
        <SummaryCard
        label="Total Network Flows"
        value={reportData?.total_flows ?? "--"}
/>
        <SummaryCard
    label="Attacks Detected"
    value={reportData?.attacks_detected ?? "--"}
    tint={C.danger}
/>

<SummaryCard
    label="Model Accuracy"
    value={
        reportData
            ? `${reportData.model_accuracy}%`
            : "--"
    }
    tint={C.success}
/>

<SummaryCard
    label="High Severity Alerts"
    value={reportData?.high_severity ?? "--"}
    tint={C.warning}
/>

<SummaryCard
    label="Avg. Severity Score"
    value={reportData?.average_severity ?? "--"}
/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 22 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 14 }}>Attack Distribution Overview</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trafficData} margin={{ left: -14, right: 8 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="type" tick={{ fill: C.textFaint, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} />
              <Bar dataKey="count" fill={C.accent} radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 14 }}>Attack distribution</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={attackDistribution} dataKey="value" nameKey="name" innerRadius={34} outerRadius={58} paddingAngle={2} stroke="none">
                  {attackDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {attackDistribution.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ color: C.textMuted }}>{d.name}</span>
                  <span style={{ color: C.text, fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Detected flows</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "BENIGN", "DDoS", "PortScan"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: 11.5, padding: "5px 11px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${filter === f ? C.accent : C.border}`,
                background: filter === f ? C.accentSoft : "transparent",
                color: filter === f ? C.accent : C.textMuted, fontFamily: "Inter, sans-serif",
              }}>{f}</button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
    <div
        style={{
            textAlign: "center",
            padding: 40,
            color: C.textMuted,
        }}
    >
        Upload a dataset to begin network traffic analysis.
    </div>
) : (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `1px solid ${C.border}`, textAlign: "left" }}>
              {["Flow ID", "Attack Type", "Confidence", "Severity", "Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 20px", color: C.textFaint, fontWeight: 500, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const sev = severityLevel(r.severity);
              const st = statusFor(r.type);
              return (
                <tr key={r.id} onClick={() => onSelectFlow(r)} style={{ borderTop: `1px solid ${C.borderSoft}`, cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceAlt}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 20px", color: C.textMuted, fontFamily: "monospace", fontSize: 12.5 }}>{r.id}</td>
                  <td style={{ padding: "11px 20px", color: C.text }}>{r.type}</td>
                  <td style={{ padding: "11px 20px", color: C.textMuted }}>{r.confidence}%</td>
                  <td style={{ padding: "11px 20px" }}><Badge label={`${sev.label} · ${r.severity}`} color={sev.color} bg={sev.bg} /></td>
                  <td style={{ padding: "11px 20px" }}><Badge label={st.label} color={st.color} bg={st.bg} /></td>
                  <td style={{ padding: "11px 20px", color: C.textFaint }}><ChevronRight size={15} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
)}
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, tint }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 600, color: tint || C.text }}>{value}</div>
    </Card>
  );
}

// ---------------------------------------------------------------
// Flow detail side panel
// ---------------------------------------------------------------
function FlowPanel({ flow, reportRows, onClose }) {
  if (!flow) return null;

  const sev = severityLevel(flow.severity);

  const row = reportRows.find(
    (r) => Number(r.Flow) === Number(flow.id.replace("FL-", ""))
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        background: C.surface,
        borderLeft: `1px solid ${C.border}`,
        padding: "22px",
        overflowY: "auto",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: C.textMuted,
            }}
          >
            {flow.id}
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.text,
            }}
          >
            {flow.type}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>

      <Badge
        label={`Severity : ${sev.label} (${flow.severity})`}
        color={sev.color}
        bg={sev.bg}
      />

      <Section title="Prediction">
        <p style={{ color: C.textMuted }}>
          {row?.Predicted_Label || flow.type}
        </p>
      </Section>

      <Section title="Actual Label">
        <p style={{ color: C.textMuted }}>
          {row?.Actual_Label || "-"}
        </p>
      </Section>

      <Section title="Top Features">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[row?.Top_Feature_1, row?.Top_Feature_2, row?.Top_Feature_3]
            .filter(Boolean)
            .map((feature) => (
              <div
                key={feature}
                style={{
                  padding: "8px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  background: C.surfaceAlt,
                }}
              >
                {feature}
              </div>
            ))}
        </div>
      </Section>

      <Section title="Prediction Correct">
        <Badge
          label={row?.Correct ? "YES" : "NO"}
          color={row?.Correct ? C.success : C.danger}
          bg={row?.Correct ? C.successSoft : C.dangerSoft}
        />
      </Section>
    </div>
  );
}
// ---------------------------------------------------------------
// Traffic Analysis page
// ---------------------------------------------------------------
function TrafficAnalysis({ flows }) {
  return (
    <div>
      <PageHeader
        title="Traffic Analysis"
        subtitle="Prediction results from the uploaded network traffic dataset."
      />

      {flows.length === 0 ? (
        <Card>
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: C.textMuted,
            }}
          >
            Upload a dataset from the Dashboard to view traffic analysis.
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <div
            style={{
              padding: "16px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: C.text,
            }}
          >
            Prediction Results
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  borderTop: `1px solid ${C.border}`,
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "10px 20px" }}>Flow ID</th>
                <th style={{ padding: "10px 20px" }}>Prediction</th>
                <th style={{ padding: "10px 20px" }}>Confidence</th>
                <th style={{ padding: "10px 20px" }}>Severity</th>
                <th style={{ padding: "10px 20px" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {flows.map((flow) => {
                const sev = severityLevel(flow.severity);
                const st = statusFor(flow.type);

                return (
                  <tr
                    key={flow.id}
                    style={{
                      borderTop: `1px solid ${C.borderSoft}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 20px",
                        fontFamily: "monospace",
                      }}
                    >
                      {flow.id}
                    </td>

                    <td style={{ padding: "11px 20px" }}>
                      {flow.type}
                    </td>

                    <td style={{ padding: "11px 20px" }}>
                      {flow.confidence}%
                    </td>

                    <td style={{ padding: "11px 20px" }}>
                      <Badge
                        label={`${sev.label} (${flow.severity})`}
                        color={sev.color}
                        bg={sev.bg}
                      />
                    </td>

                    <td style={{ padding: "11px 20px" }}>
                      <Badge
                        label={st.label}
                        color={st.color}
                        bg={st.bg}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
// ---------------------------------------------------------------
// Root Cause Analysis page (list view, reuses side panel)
// ---------------------------------------------------------------
function RootCauseAnalysis({ onSelectFlow, flows, reportRows }) {
  const attacks = flows.filter((flow) => flow.type !== "BENIGN");

  return (
    <div>
      <PageHeader
        title="Root Cause Analysis"
        subtitle="Flows detected as attacks with the important features responsible for the prediction."
      />

      {attacks.length === 0 ? (
        <Card>
          <div
            style={{
              textAlign: "center",
              color: C.textMuted,
              padding: 40,
            }}
          >
            Upload and analyze a dataset to view detected attacks.
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {attacks.map((flow) => {
            const sev = severityLevel(flow.severity);

            const row = reportRows.find(
              (r) =>
                Number(r.Flow) ===
                Number(flow.id.replace("FL-", ""))
            );

            return (
              <Card
                key={flow.id}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectFlow(flow)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      <ShieldAlert
                        size={18}
                        color={sev.color}
                      />

                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 18,
                          color: C.text,
                        }}
                      >
                        {flow.type}
                      </span>

                      <span
                        style={{
                          fontFamily: "monospace",
                          color: C.textMuted,
                          fontSize: 12,
                        }}
                      >
                        {flow.id}
                      </span>

                      <Badge
                        label={`${sev.label} (${flow.severity})`}
                        color={sev.color}
                        bg={sev.bg}
                      />
                    </div>

                    {/* Details */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "180px 1fr",
                        rowGap: 8,
                        columnGap: 20,
                        marginBottom: 18,
                        color: C.textMuted,
                        fontSize: 13,
                      }}
                    >
                      <strong>Actual Label</strong>
                      <span>{row?.Actual_Label}</span>

                      <strong>Predicted Label</strong>
                      <span>{row?.Predicted_Label}</span>

                      <strong>Confidence</strong>
                      <span>{flow.confidence}%</span>

                      <strong>Severity Score</strong>
                      <span>{flow.severity}/100</span>

                      <strong>Prediction Correct</strong>
                      <span
                        style={{
                          color: row?.Correct ? "#4ade80" : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {row?.Correct ? "✔ YES" : "✖ NO"}
                      </span>
                    </div>

                    {/* Root Cause Features */}
                    <div
                      style={{
                        background: C.surfaceAlt,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 14,
                        }}
                      >
                        Top Root Causes
                      </div>

                      {[1, 2, 3].map((i) => {
                        const feature =
                          row?.[`Top_Feature_${i}`];

                        if (!feature) return null;

                        return (
                          <div
                            key={i}
                            style={{
                              marginBottom: 16,
                              paddingBottom: 14,
                              borderBottom:
                                i !== 3
                                  ? `1px solid ${C.border}`
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                color: C.accent,
                                marginBottom: 8,
                              }}
                            >
                              {i}. {feature}
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "150px 1fr",
                                rowGap: 5,
                                color: C.textMuted,
                                fontSize: 13,
                              }}
                            >
                              <strong>Feature Value</strong>
                              <span>
                                {row?.[`Top_Feature_${i}_Value`]}
                              </span>

                              <strong>SHAP Value</strong>
                              <span>
                                {Number(
                                  row?.[`Top_Feature_${i}_SHAP`]
                                ).toFixed(4)}
                              </span>

                              <strong>Impact</strong>
                              <span>
                                {row?.[`Top_Feature_${i}_Dir`]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <div
                      style={{
                        background: C.surfaceAlt,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: C.text,
                        }}
                      >
                        Root Cause Summary
                      </div>

                      <div
                        style={{
                          color: C.textMuted,
                          fontSize: 13,
                          lineHeight: 1.8,
                        }}
                      >
                        The model classified this network flow
                        as <strong>{row?.Predicted_Label}</strong>
                        {" "}because the most influential
                        features were{" "}
                        <strong>{row?.Top_Feature_1}</strong>,
                        {" "}
                        <strong>{row?.Top_Feature_2}</strong>
                        {" "}and{" "}
                        <strong>{row?.Top_Feature_3}</strong>.
                        These features had the highest SHAP
                        contribution towards the final
                        prediction.
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    color={C.textMuted}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
function Explainability() {
  return (
    <div>
      <PageHeader
        title="Explainability"
        subtitle="Visual explanation generated by the trained machine learning model."
      />

      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: C.text,
          }}
        >
          SHAP Summary Plot
        </div>

        <img
          src="http://127.0.0.1:5000/outputs/shap_summary.png"
          alt="SHAP Summary"
          style={{
            width: "100%",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}
        />
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: C.text,
          }}
        >
          SHAP Force Plot
        </div>

        <img
          src="http://127.0.0.1:5000/outputs/shap_force_flow1.png"
          alt="SHAP Force Plot"
          style={{
            width: "100%",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}
        />
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: C.text,
          }}
        >
          SHAP Waterfall Plot
        </div>

        <img
          src="http://127.0.0.1:5000/outputs/shap_waterfall_ddos.png"
          alt="Waterfall Plot"
          style={{
            width: "100%",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}
        />
      </Card>

      <Card>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 10,
            color: C.text,
          }}
        >
          Explanation
        </div>

        <p
          style={{
            color: C.textMuted,
            lineHeight: 1.8,
            margin: 0,
            fontSize: 13,
          }}
        >
          SHAP (SHapley Additive exPlanations) explains why the machine
          learning model predicted a particular attack. The SHAP Summary Plot
          highlights the most influential features across the entire dataset,
          while the Force Plot and Waterfall Plot explain the prediction for an
          individual network flow by showing how each feature contributed
          towards the final classification.
        </p>
      </Card>
    </div>
  );
}
// ---------------------------------------------------------------
// Reports page
// ---------------------------------------------------------------
function Reports() {
  const [generated, setGenerated] = useState(false);
  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate a summary of this run and export it." />
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>RCA summary report</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Includes flow counts, attack breakdown, and root causes for flagged flows.</div>
          </div>
<Button
    variant="primary"
    icon={FileText}
    onClick={() => {
        setGenerated(true);
        window.open("http://127.0.0.1:5000/api/report", "_blank");
    }}
>
    Generate Report
</Button>      </div>
      </Card>
      {generated && (
        <Card>
          <div style={{ marginBottom: 20 }}>
    <h4>Model Comparison</h4>
    <img
        src="http://127.0.0.1:5000/outputs/model_comparison.png"
        style={{ width: "100%", borderRadius: 10 }}
    />
</div>

<div style={{ marginBottom: 20 }}>
    <h4>Confusion Matrix</h4>
    <img
        src="http://127.0.0.1:5000/outputs/confusion_matrix.png"
        style={{ width: "100%", borderRadius: 10 }}
    />
</div>

<div style={{ marginBottom: 20 }}>
    <h4>Severity Distribution</h4>
    <img
        src="http://127.0.0.1:5000/outputs/severity_distribution.png"
        style={{ width: "100%", borderRadius: 10 }}
    />
</div>

<div style={{ marginBottom: 20 }}>
    <h4>SHAP Summary</h4>
    <img
        src="http://127.0.0.1:5000/outputs/shap_summary.png"
        style={{ width: "100%", borderRadius: 10 }}
    />
</div>

<div style={{ marginBottom: 20 }}>
    <h4>SHAP Force Plot</h4>
    <img
        src="http://127.0.0.1:5000/outputs/shap_force_flow1.png"
        style={{ width: "100%", borderRadius: 10 }}
    />
</div>
          <div style={{ display: "flex", gap: 10 }}>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// About page
// ---------------------------------------------------------------
function About() {
  return (
    <div>
      <PageHeader title="About" subtitle="Project overview and dataset information." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text, marginBottom: 8 }}>Project description</div>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 700 }}>
            This project detects and explains network service failures caused by attacks using
            machine learning. It classifies network flows, estimates a severity score, and uses
            SHAP to explain which features drove each prediction — helping identify the likely
            root cause of a failure rather than just flagging that one occurred.
          </p>
        </Card>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text, marginBottom: 10 }}>Technologies used</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Python", "scikit-learn", "XGBoost", "SHAP", "SMOTE", "Pandas", "React"].map((t) => (
              <span key={t} style={{ fontSize: 12.5, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.borderSoft}`, borderRadius: 6, padding: "5px 10px" }}>{t}</span>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text, marginBottom: 8 }}>Dataset</div>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>
            CICIDS2017 — a labeled network intrusion dataset from the Canadian Institute for
            Cybersecurity, containing benign traffic alongside DDoS, PortScan, and other attack
            types with over 80 extracted flow-level features per record.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Top bar
// Shows project branding on the left and a live clock + status
// pill on the right. Keeps the header for every page consistent
// without needing to repeat this code on each page component.
// ---------------------------------------------------------------
function TopBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer); // stop the timer when unmounted
  }, []);

  const timeLabel = now.toLocaleTimeString("en-US", { hour12: false });
  const dateLabel = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 32px", borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>RCA Network Analyzer</div>
        <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 1 }}>AI-based root cause analysis for network service failures</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.success,
          background: C.successSoft, borderRadius: 20, padding: "5px 12px",
        }}>
          <ShieldCheck size={14} />
          Model ready
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{dateLabel} · {timeLabel}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// App
// ---------------------------------------------------------------

export default function App() {
  useFonts();
  const [backendStatus, setBackendStatus] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [flows, setFlows] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:5000/api/status")
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      setBackendStatus(data);
    })
    .catch((err) => console.error(err));
}, []);

  const pages = {
dashboard: (
    <Dashboard
    onSelectFlow={setSelectedFlow}
    reportData={reportData}
    setReportData={setReportData}
    flows={flows}
    setFlows={setFlows}
    setReportRows={setReportRows}
/>
),
    traffic: <TrafficAnalysis flows={flows} />,
    rca: (
    <RootCauseAnalysis
        onSelectFlow={setSelectedFlow}
        flows={flows}
        reportRows={reportRows}
    />
),
    explainability: <Explainability />,
    reports: <Reports />,
    about: <About />,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Inter, sans-serif" }}>
      <TopBar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <Sidebar page={page} setPage={(p) => { setPage(p); setSelectedFlow(null); }} />
        <div style={{ flex: 1, padding: "26px 32px", maxWidth: 1100 }}>
        {backendStatus && (
  <div
    style={{
      background: "#1f2937",
      color: "white",
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    }}
  >
    Backend : {backendStatus.backend}
    <br />
    Model : {backendStatus.model}
  </div>
)}
          {pages[page]}
        </div>
      </div>
      {selectedFlow && (
        <>
          <div onClick={() => setSelectedFlow(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 10 }} />
        <FlowPanel
    flow={selectedFlow}
    reportRows={reportRows}
    onClose={() => setSelectedFlow(null)}
/>
</>
      )}
    </div>
  );
}
