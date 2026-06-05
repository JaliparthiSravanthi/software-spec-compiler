import React, { useState } from "react";
import { CompileResult, EvaluationItem, CompileStepLog } from "../types";
import { EVALUATION_SUITE } from "../evaluations";
import RuntimeSandbox from "./RuntimeSandbox";
import * as LucideIcons from "lucide-react";

export default function CompilerWorkspace() {
  const [prompt, setPrompt] = useState<string>(
    "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"sandbox" | "schema" | "metrics" | "logs">("sandbox");
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [serverLogs, setServerLogs] = useState<CompileStepLog[]>([]);
  const [compileErrors, setCompileErrors] = useState<string | null>(null);

  // Benchmarking Stats for dataset
  const [evaluations, setEvaluations] = useState<Record<string, Partial<CompileResult>>>({});
  const [runAllLoading, setRunAllLoading] = useState<boolean>(false);

  const runCompiler = async (targetPrompt: string) => {
    setLoading(true);
    setCompileErrors(null);
    setServerLogs([
      {
        stage: "intent",
        message: "Triggering compiler initialization...",
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: targetPrompt })
      });

      if (!response.ok) {
        throw new Error(`Compiler backend flagged HTTP error: ${response.status}`);
      }

      const result: CompileResult = await response.json();
      setCompileResult(result);
      setServerLogs(result.logs || []);
    } catch (err: any) {
      console.error(err);
      setCompileErrors(err.message || "An unknown transmission error disrupted compilation.");
    } finally {
      setLoading(false);
    }
  };

  // Run a single quick benchmark on a specific evaluation item
  const runSingleEvaluation = async (item: EvaluationItem) => {
    setPrompt(item.prompt);
    await runCompiler(item.prompt);
  };

  // Run automated suite simulation in the background
  const runMockSuiteEvaluation = () => {
    setRunAllLoading(true);
    // Simulate multi-tier testing metrics on the 20 preloaded items
    let delay = 0;
    const partials: Record<string, Partial<CompileResult>> = {};

    EVALUATION_SUITE.forEach((item, idx) => {
      setTimeout(() => {
        const mockSuccess = item.category === "standard" ? true : Math.random() > 0.3;
        const mockRetries = item.category === "edge-case" ? Math.floor(Math.random() * 3) : 0;
        const latency = item.complexity === "Complex" ? 2200 + Math.random() * 1100 : 1200 + Math.random() * 800;
        
        partials[item.id] = {
          success: mockSuccess,
          metrics: {
            totalLatencyMs: Math.round(latency),
            stageLatencies: {},
            retriesCount: mockRetries,
            inputTokens: 1100 + Math.floor(Math.random() * 400),
            outputTokens: 1800 + Math.floor(Math.random() * 900),
            estimatedCostUsd: 0.0006 + Math.random() * 0.001
          },
          validationReport: {
            score: mockSuccess ? 100 - (mockRetries * 15) : 45,
            passed: mockSuccess,
            errors: []
          }
        };

        setEvaluations(prev => ({
          ...prev,
          [item.id]: partials[item.id]
        }));

        if (idx === EVALUATION_SUITE.length - 1) {
          setRunAllLoading(false);
        }
      }, idx * 250); // fast visual feed cascade
    });
  };

  // Safe fetch dynamic icons helper
  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Compass;
    return <IconComponent className={className} />;
  };

  // Cumulative metrics from our evaluations run
  const values = Object.values(evaluations) as Partial<CompileResult>[];
  const runCount = values.length;
  const passedCount = values.filter(v => v.success).length;
  const successPercent = runCount > 0 ? Math.round((passedCount / runCount) * 100) : 0;
  const avgLatency = runCount > 0 ? Math.round(values.reduce((acc, v) => acc + (v.metrics?.totalLatencyMs || 0), 0) / runCount) : 0;
  const avgRetries = runCount > 0 ? (values.reduce((acc, v) => acc + (v.metrics?.retriesCount || 0), 0) / runCount).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-200 rounded-2xl gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display tracking-tight">
            Software Schema Compiler Engine
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-xl">
            A high-reliability code synthesiser compiling raw user intents into strict database, routing, schema validation and auth barriers with automated self-healing repair loops.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="bg-slate-55 border border-slate-200 px-3.5 py-1.5 rounded-lg text-center font-mono text-[10px]">
            <span className="text-indigo-600 block font-bold">UTC SYSTEM CLOCK</span>
            <span className="text-slate-600 font-medium">2026-06-04 05:27:00</span>
          </div>
          <div className="bg-slate-55 border border-slate-200 px-3.5 py-1.5 rounded-lg text-center font-mono text-[10px]">
            <span className="text-emerald-600 block font-bold">COMPILER TIER</span>
            <span className="text-slate-600 font-medium">Gemini 3.5 Flash</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Prompts (Left) vs Virtual Engine (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Workspace Controls & Selection - left 5 columns */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prompt Entry Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LucideIcons.Wand2 className="h-4 w-4 text-indigo-600" />
              1. Input Product Requirement
            </h3>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build an inventory management spreadsheet with roles..."
              className="w-full text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
            />

            <button
              onClick={() => runCompiler(prompt)}
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <LucideIcons.RotateCw className="h-3.5 w-3.5 animate-spin" />
                  Generating App Schemas...
                </>
              ) : (
                <>
                  <LucideIcons.Play className="h-3.5 w-3.5 fill-current" />
                  Compile Specifications
                </>
              )}
            </button>
          </div>

          {/* Real-time Stage Stepper logs dashboard */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5 animate-pulse">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LucideIcons.Cpu className="h-4 w-4 text-indigo-600" />
                PIPELINE TRANSLATOR CHANNELS
              </h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>- Stage 1: Parsing requirements...</span>
                  <span className="text-indigo-600 font-bold">RUNNING</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Stage 2: Drafting system domain logs...</span>
                  <span>PENDING</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Stage 3: Compiling layout APIs...</span>
                  <span>PENDING</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Stage 4: Logical self-healing verification...</span>
                  <span>PENDING</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed compilation alerts state */}
          {compileErrors && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <LucideIcons.ShieldAlert className="h-4 w-4 text-red-600" />
                Compilation Interrupted
              </div>
              <p className="text-xs text-red-700 font-mono">{compileErrors}</p>
            </div>
          )}

          {/* Evaluations and Benchmark Suite panel */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.FolderGit2 className="h-4 w-4 text-purple-600" />
                  2. Benchmark Evaluations Suite
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">20 Real World & Edge Cases</p>
              </div>
              <button
                onClick={runMockSuiteEvaluation}
                disabled={runAllLoading}
                className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors py-1 px-2.5 rounded cursor-pointer disabled:opacity-50"
              >
                {runAllLoading ? "Loading Sim..." : "Simulate All"}
              </button>
            </div>

            {/* Test Prompts scroll container */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {EVALUATION_SUITE.map((item) => {
                const results = evaluations[item.id];
                const hasRun = results !== undefined;
                return (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.category === 'edge-case' ? 'bg-amber-500' : 'bg-indigo-500'} block`}></span>
                        <h4 className="text-xs font-semibold text-slate-700">{item.title}</h4>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        item.complexity === 'Complex' ? 'bg-red-50 text-red-700 border border-red-100' :
                        item.complexity === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {item.complexity}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono line-clamp-2">"{item.prompt}"</p>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        onClick={() => runSingleEvaluation(item)}
                        disabled={loading}
                        className="text-[10px] font-sans font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                      >
                        <LucideIcons.CornerDownRight className="h-3 w-3" />
                        Compile this
                      </button>

                      {hasRun ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-[9.5px] font-mono leading-none flex items-center gap-0.5 font-bold ${results.success ? 'text-emerald-600' : 'text-red-500'}`}>
                            {results.success ? "🟢 OK" : "🔴 WARN"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{results.metrics?.retriesCount} retries</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono">Not compiled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Dynamic Sandbox, output code viewer & metrics - right 7 columns */}
        <div className="lg:col-span-7 space-y-6">
          
          {compileResult ? (
            <div className="space-y-4">
              
              {/* Tab options bar selection */}
              <div className="flex border-b border-slate-200 gap-1.5 pb-0.5">
                <button
                  onClick={() => setActiveTab("sandbox")}
                  className={`px-4 py-2 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === "sandbox" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LucideIcons.MonitorPlay className="h-3.5 w-3.5" />
                    Executable Sandbox Preview
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("schema")}
                  className={`px-4 py-2 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === "schema" 
                      ? "border-pink-600 text-pink-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LucideIcons.FileCode className="h-3.5 w-3.5" />
                    Compiled JSON Output
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("metrics")}
                  className={`px-4 py-2 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === "metrics" 
                      ? "border-emerald-600 text-emerald-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LucideIcons.BarChart4 className="h-3.5 w-3.5" />
                    Compiler Analytics
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-4 py-2 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === "logs" 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LucideIcons.Terminal className="h-3.5 w-3.5" />
                    Self-Healing Logs
                  </span>
                </button>
              </div>

              {/* Render Selected Dynamic view body */}
              {activeTab === "sandbox" && compileResult.schema && (
                <div className="animate-fade-in">
                  <RuntimeSandbox schema={compileResult.schema} />
                </div>
              )}

              {activeTab === "schema" && compileResult.schema && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md relative group flex flex-col text-slate-300">
                  <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Intermediate Config Schema</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(compileResult.schema, null, 2))}
                      className="text-[10.5px] font-mono px-2.5 py-1 rounded bg-slate-705 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                    >
                      Copy Schema
                    </button>
                  </div>
                  <pre className="p-4 text-emerald-400 font-mono text-[11px] h-[500px] overflow-auto select-all leading-relaxed whitespace-pre pr-4">
                    {JSON.stringify(compileResult.schema, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === "metrics" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-slate-700">
                  
                  {/* Basic analytical cards */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
                    <span className="text-[10px] font-mono text-indigo-650 font-semibold tracking-wider">COMPILATION TIMING (LATENCY)</span>
                    <h3 className="text-3xl font-bold text-slate-800 font-display">
                      {Math.round(compileResult.metrics?.totalLatencyMs || 0)} <span className="text-xs font-mono font-normal">ms</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
                    <span className="text-[10px] font-mono text-emerald-650 font-semibold tracking-wider">ESTIMATED MICRO-CORE RUN COSTS</span>
                    <h3 className="text-3xl font-bold text-slate-800 font-display">
                      ${compileResult.metrics?.estimatedCostUsd?.toFixed(5) || "0.00010"}
                    </h3>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
                    <span className="text-[10px] font-mono text-purple-650 font-semibold tracking-wider">REPAIR CYCLES RESCUED</span>
                    <h3 className="text-3xl font-bold text-slate-800 font-display">
                      {compileResult.metrics?.retriesCount || 0} <span className="text-xs font-mono font-normal">loops</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
                    <span className="text-[10px] font-mono text-cyan-750 font-semibold tracking-wider">VALIDATION SANITY ACCURACY</span>
                    <h3 className={`text-3xl font-bold font-display ${compileResult.success ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {compileResult.validationReport?.score || 100}/100
                    </h3>
                  </div>

                  {/* Latency by stage list */}
                  <div className="col-span-1 md:col-span-2 p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compiler Stage Latency Timings</h4>
                    <div className="space-y-2 font-mono text-xs">
                      {Object.entries(compileResult.metrics?.stageLatencies || {}).map(([stage, lat]) => (
                        <div key={stage} className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500 capitalize">{stage.replace(/_/g, " ")}</span>
                          <span className="text-indigo-600 font-semibold">{lat} ms</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Run breakdown of validation checks */}
                  <div className="col-span-1 md:col-span-2 p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Verification Diagnostics</h4>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${compileResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {compileResult.success ? "All Clear" : "Contains Issues"}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {compileResult.validationReport?.errors?.length === 0 ? (
                        <div className="text-center py-4 text-emerald-600/80 font-mono text-xs">
                          ✓ Programmatic analysis shows 0 logical, structural, schema, or referential mismatch warnings. Perfect compile.
                        </div>
                      ) : (
                        compileResult.validationReport?.errors?.map((err, errIdx) => (
                          <div key={errIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                            <span className={`text-[9px] font-semibold font-mono uppercase px-1.5 rounded ${err.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {err.severity}
                            </span>
                            <div className="text-xs font-mono space-y-0.5">
                              <p className="text-slate-700 font-semibold">[{err.code}] {err.message}</p>
                              <p className="text-slate-400 text-[10px]">Path: "{err.path}"</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "logs" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[450px] overflow-y-auto font-mono text-[11px] space-y-3.5 text-slate-300">
                  <div className="text-slate-400 text-[10px] border-b border-slate-800 pb-2 flex justify-between">
                    <span>REPAIR ENGINE EXECUTION LOG TRACE:</span>
                    <span className="text-emerald-400 font-bold animate-pulse">● LIVE CONNECTION</span>
                  </div>
                  {serverLogs.map((log, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-2">
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-indigo-400 font-bold uppercase">[{log.stage}]</span>
                        <span className="text-slate-200">{log.message}</span>
                      </div>
                      
                      {log.stage === "repair" && (
                        <div className="bg-slate-950 border border-slate-950 p-2.5 rounded-lg text-slate-400 text-[10px] space-y-1.5 ml-4">
                          <p className="text-indigo-400 font-semibold flex items-center gap-1">
                            <LucideIcons.Wrench className="h-3 w-3" />
                            Launching self-healing prompt override:
                          </p>
                          <p className="italic">"Isolate mismatch schemas references, resolve cross-page gates inconsistencies and patch the JSON parameters with 100% strict adherence to validation parameters."</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            /* Empty Landing visual encouragement */
            <div className="h-full border border-slate-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[400px]">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                <LucideIcons.Layers className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-1.5 font-sans">
                <h3 className="text-base font-bold text-slate-800">Compiler Awaiting Instructions</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Select one of the preloaded product benchmark tasks or submit a custom prompts specification to construct a validated fully executable software application schemas instantly.
                </p>
              </div>
            </div>
          )}

          {/* Cumulative suite run benchmark indicators */}
          {runCount > 0 && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <LucideIcons.AreaChart className="h-4 w-4 text-emerald-600" />
                Cumulative Suite Benchmark Metrics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px]">
                <div className="p-2 border border-slate-100 rounded bg-slate-50">
                  <span className="text-slate-400 block font-bold">RUN RANGE</span>
                  <span className="text-slate-800 font-bold text-base">{runCount} / 20</span>
                </div>
                <div className="p-2 border border-slate-100 rounded bg-slate-50">
                  <span className="text-slate-400 block font-bold">SUCCESS RATE</span>
                  <span className="text-emerald-600 font-bold text-base">{successPercent}%</span>
                </div>
                <div className="p-2 border border-slate-100 rounded bg-slate-50">
                  <span className="text-slate-400 block font-bold">AVG SPEED</span>
                  <span className="text-indigo-600 font-bold text-base">{avgLatency}ms</span>
                </div>
                <div className="p-2 border border-slate-100 rounded bg-slate-50">
                  <span className="text-slate-300 block font-bold">AVG RETRIES</span>
                  <span className="text-purple-600 font-bold text-base">{avgRetries}</span>
                </div>
              </div>

              {/* Graphical mini indicator comparison bar */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Batch compile state coverage:</span>
                  <span className="text-emerald-650 font-semibold">{successPercent}% compiled OK</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500" 
                    style={{ width: `${successPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
