"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, CloudRain, Thermometer, Sprout, Loader2, GripVertical, Check, Calendar } from "lucide-react";

interface EvaluationResult {
  detected_season: string;
  weather_summary: {
    peak_temperature: number;
    avg_max_temperature: number;
    total_rainfall_7d_mm: number;
  };
  target_evaluation: {
    crop_name: string;
    risk_score: number;
    risk_level: string;
    identified_threats: string[];
    actionable_remedies: string[];
  };
  recommended_alternatives: {
    crop_name: string;
    match_score: number;
    risk_score: number;
    reason: string;
  }[];
}

const MONTHS = [
  { value: 1, name: "January", season: "Rabi (Winter)" },
  { value: 2, name: "February", season: "Rabi (Winter)" },
  { value: 3, name: "March", season: "Zaid (Summer)" },
  { value: 4, name: "April", season: "Zaid (Summer)" },
  { value: 5, name: "May", season: "Zaid (Pre-Monsoon)" },
  { value: 6, name: "June", season: "Kharif (Monsoon)" },
  { value: 7, name: "July", season: "Kharif (Monsoon)" },
  { value: 8, name: "August", season: "Kharif (Monsoon)" },
  { value: 9, name: "September", season: "Kharif (Monsoon)" },
  { value: 10, name: "October", season: "Rabi (Post-Monsoon)" },
  { value: 11, name: "November", season: "Rabi (Winter)" },
  { value: 12, name: "December", season: "Rabi (Winter)" }
];

const AVAILABLE_CROPS = [
  "Coconut",
  "Ragi",
  "Maize",
  "Paddy",
  "Bengal Gram",
  "Groundnut",
  "Cotton",
  "Tomato",
  "Jowar",
  "Bajra",
  "Sunflower"
];

export default function Home() {
  const [formData, setFormData] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    nitrogen: 75,
    phosphorus: 35,
    potassium: 110,
    ph_level: 6.2,
    target_crop: "Coconut",
    sowing_month: 11 // Safe default avoiding SSR hydration mismatch
  });

  // Sync to browser's actual active month safely upon client mount
  useEffect(() => {
    const activeMonth = new Date().getMonth() + 1;
    setFormData((prev) => ({ ...prev, sowing_month: activeMonth }));
  }, []);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectedMonthInfo = MONTHS.find((m) => m.value === formData.sowing_month);

  const handleDragStart = (e: React.DragEvent, cropName: string) => {
    e.dataTransfer.setData("text/plain", cropName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedCrop = e.dataTransfer.getData("text/plain");
    if (droppedCrop) {
      setFormData((prev) => ({ ...prev, target_crop: droppedCrop }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        throw new Error("Backend error");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Cannot connect to backend server. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold text-emerald-800 flex items-center gap-2">
            <Sprout className="w-8 h-8 text-emerald-600" /> AgriPulse Advisory
          </h1>
          <p className="text-slate-600 mt-1">
            Season-aware risk assessment and agro-climatic crop suitability engine.
          </p>
        </div>

        {/* Drag and Drop Crop Tray */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Crops (Drag into target box or click to select)
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
              Regional Library
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {AVAILABLE_CROPS.map((crop) => {
              const isSelected = formData.target_crop.toLowerCase() === crop.toLowerCase();
              return (
                <div
                  key={crop}
                  draggable
                  onDragStart={(e) => handleDragStart(e, crop)}
                  onClick={() => setFormData({ ...formData, target_crop: crop })}
                  className={`cursor-grab active:cursor-grabbing px-3.5 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition select-none ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                      : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200"
                  }`}
                >
                  <GripVertical className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-200" : "text-slate-400"}`} />
                  <span>{crop}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-1 text-emerald-200" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Form with Season Selector & Drop Target */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-5 rounded-xl border-2 border-dashed transition flex flex-col justify-center items-center ${
                isDragOver
                  ? "border-emerald-500 bg-emerald-50 scale-[1.01]"
                  : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Crop for Evaluation
              </p>
              <span className="text-2xl font-black text-emerald-800 mt-1">
                {formData.target_crop || "Drag or Select a Crop"}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Drag a crop from above or click any chip
              </p>
            </div>

            {/* Sowing Month & Season Selector */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Planned Sowing Month
                  </label>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    {selectedMonthInfo?.season}
                  </span>
                </div>
                <select
                  value={formData.sowing_month}
                  onChange={(e) => setFormData({ ...formData, sowing_month: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name} — {m.season}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Filters recommendations strictly by agro-climatic seasonality.
              </p>
            </div>

          </div>

          {/* Soil & Geo Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Soil pH (0-14)</label>
              <input 
                type="number" step="0.1" 
                value={formData.ph_level} 
                onChange={(e) => setFormData({...formData, ph_level: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Nitrogen (N)</label>
              <input 
                type="number" 
                value={formData.nitrogen} 
                onChange={(e) => setFormData({...formData, nitrogen: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Phosphorus (P)</label>
              <input 
                type="number" 
                value={formData.phosphorus} 
                onChange={(e) => setFormData({...formData, phosphorus: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Potassium (K)</label>
              <input 
                type="number" 
                value={formData.potassium} 
                onChange={(e) => setFormData({...formData, potassium: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Latitude</label>
              <input 
                type="number" step="0.0001" 
                value={formData.latitude} 
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Longitude</label>
              <input 
                type="number" step="0.0001" 
                value={formData.longitude} 
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Evaluating Season & Weather Window...
              </>
            ) : (
              "Evaluate Farm Plan"
            )}
          </button>
        </form>

        {/* Results Presentation */}
        {result && (
          <div className="space-y-6">
            
            {/* Live Weather Forecast Bar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-wrap gap-6 items-center text-sm shadow-sm">
              <span className="font-semibold text-emerald-950">
                Active Season: <span className="underline decoration-emerald-500 font-bold">{result.detected_season}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <Thermometer className="w-4 h-4 text-orange-500" /> Peak Temperature: <b>{result.weather_summary.peak_temperature}°C</b>
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <CloudRain className="w-4 h-4 text-blue-500" /> Expected 7-Day Rainfall: <b>{result.weather_summary.total_rainfall_7d_mm} mm</b>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Crop Risk Analysis Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block uppercase">Selected Target Crop</span>
                      <h3 className="text-xl font-bold text-slate-900">{result.target_evaluation.crop_name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      result.target_evaluation.risk_level === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' :
                      result.target_evaluation.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {result.target_evaluation.risk_score}% RISK ({result.target_evaluation.risk_level})
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Agronomic Threats</h4>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {result.target_evaluation.identified_threats.map((threat, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-amber-50/60 p-2 rounded border border-amber-100">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Corrective Actions</h4>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {result.target_evaluation.actionable_remedies.map((remedy, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{remedy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonally Verified Alternatives Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-4 pb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Comparative Recommendation</span>
                    <h3 className="text-xl font-bold text-slate-900">Optimal {result.detected_season} Crops</h3>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    Only crops biologically viable for {result.detected_season} are evaluated against your soil N-P-K and weather.
                  </p>

                  <div className="space-y-3">
                    {result.recommended_alternatives.map((alt, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition flex justify-between items-start">
                        <div className="pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{alt.crop_name}</span>
                            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {alt.match_score}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{alt.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Est. Risk</span>
                          <span className="text-sm font-bold text-emerald-600">{alt.risk_score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}