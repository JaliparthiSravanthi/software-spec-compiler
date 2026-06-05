import React, { useState, useEffect, useRef } from "react";
import { CompleteOutputSchema, UIComponent } from "../types";
import * as LucideIcons from "lucide-react";

interface RuntimeSandboxProps {
  schema: CompleteOutputSchema;
}

interface SandboxLog {
  timestamp: string;
  type: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SQL";
  message: string;
}

export default function RuntimeSandbox({ schema }: RuntimeSandboxProps) {
  const [activeRoute, setActiveRoute] = useState<string>("");
  const [activeRole, setActiveRole] = useState<string>("");
  const [inMemoryDb, setInMemoryDb] = useState<Record<string, any[]>>({});
  const [logs, setLogs] = useState<SandboxLog[]>([]);
  const [formStates, setFormStates] = useState<Record<string, Record<string, any>>>({});
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Initialize DB and routes on schema change
  useEffect(() => {
    if (!schema) return;

    // Set first available page route
    if (schema.ui?.pages?.length > 0) {
      setActiveRoute(schema.ui.pages[0].route);
    }

    // Set first available role
    const roles = schema.intent?.userRoles || ["Admin"];
    if (roles.length > 0) {
      setActiveRole(roles[0]);
    }

    // Populate mock DB tables
    const db: Record<string, any[]> = {};
    schema.db?.tables?.forEach(table => {
      // Create some initial mock records for high fidelity presentation
      const initialRow: Record<string, any> = {};
      table.columns.forEach(col => {
        if (col.isPrimary) {
          initialRow[col.name] = 1;
        } else if (col.type === "VARCHAR" || col.type === "TEXT") {
          if (col.name.includes("email")) initialRow[col.name] = "demo@example.com";
          else if (col.name.includes("name")) initialRow[col.name] = "Jane Doe";
          else initialRow[col.name] = "Sample Text";
        } else if (col.type === "INTEGER" || col.type === "DECIMAL") {
          initialRow[col.name] = 42;
        } else if (col.type === "BOOLEAN") {
          initialRow[col.name] = true;
        } else if (col.type === "TIMESTAMP") {
          initialRow[col.name] = new Date().toISOString().split('T')[0];
        }
      });
      db[table.tableName] = [initialRow];
    });
    setInMemoryDb(db);

    setLogs([
      {
        timestamp: new Date().toLocaleTimeString(),
        type: "INFO",
        message: `🔄 Sandbox Runtime initialized for project "${schema.projectName}"`
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        type: "SUCCESS",
        message: `✅ In-memory mock database populated with ${schema.db?.tables?.length || 0} tables.`
      }
    ]);
  }, [schema]);

  // Autoscroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (type: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SQL", message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  // Safe fetch dynamic Lucide icons
  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText;
    return <IconComponent className={className} />;
  };

  const activePage = schema?.ui?.pages?.find(p => p.route === activeRoute);

  // Authenticate & Auth Gate checks
  const isGated = () => {
    if (!activePage) return false;
    if (activePage.gatedRoles && activePage.gatedRoles.length > 0) {
      return !activePage.gatedRoles.includes(activeRole);
    }
    return false;
  };

  // Run dynamic input forms action handler
  const handleFormSubmit = (comp: UIComponent, e: React.FormEvent) => {
    e.preventDefault();
    if (!schema) return;

    // Check Gating
    if (comp.targetRole && activeRole !== comp.targetRole) {
      addLog("ERROR", `🛡️ Auth Exception: Component "${comp.title}" requires role "${comp.targetRole}". Current role: "${activeRole}"`);
      return;
    }

    addLog("INFO", `🌐 Fetch request triggering to: "${comp.associatedApiEndpoint || "/api"}"`);

    // Verify endpoint definition
    const apiEndpoint = schema.api?.endpoints?.find(ep => ep.path === comp.associatedApiEndpoint);
    if (!apiEndpoint) {
      addLog("ERROR", `❌ Client Error: Attempted to fetch to unmapped endpoint path "${comp.associatedApiEndpoint}"`);
      return;
    }

    // Perform security rule check
    if (apiEndpoint.permittedRoles && !apiEndpoint.permittedRoles.includes(activeRole)) {
      addLog("ERROR", `🛡️ Security Intercept: Role "${activeRole}" unauthorized for endpoint ${apiEndpoint.method} ${apiEndpoint.path}`);
      return;
    }

    // Verify billing tier
    if (apiEndpoint.requiresPremium) {
      addLog("WARN", `💸 SECURE AUDIT: Path "${apiEndpoint.path}" resides under Premium Billing. Prompting subscription authorization.`);
      setShowBillingModal(true);
      return;
    }

    // Map form inputs
    const formVals = formStates[comp.id] || {};
    
    // Check validation schema rules
    let validationFailed = false;
    apiEndpoint.requiredFields?.forEach(reqField => {
      const val = formVals[reqField.name];
      if (reqField.required && (val === undefined || val === "")) {
        addLog("ERROR", `⚠️ Validation Failure: Field "${reqField.name}" is marked as REQUIRED but empty.`);
        validationFailed = true;
      }
    });

    if (validationFailed) return;

    // Database simulation write
    // Try to guess match tables
    const matchedTable = schema.db?.tables?.find(t => 
      apiEndpoint.path.toLowerCase().includes(t.tableName.toLowerCase())
    );

    if (matchedTable) {
      const newRow: Record<string, any> = { id: (inMemoryDb[matchedTable.tableName]?.length || 0) + 1 };
      matchedTable.columns.forEach(col => {
        if (!col.isPrimary) {
          newRow[col.name] = formVals[col.name] !== undefined ? formVals[col.name] : (col.type === "BOOLEAN" ? false : "");
        }
      });

      // Update mock DB
      setInMemoryDb(prev => ({
        ...prev,
        [matchedTable.tableName]: [...(prev[matchedTable.tableName] || []), newRow]
      }));

      addLog("SQL", `⚙️ SQL INSERT: [${matchedTable.tableName.toUpperCase()}] VALUES (${Object.values(newRow).map(v => typeof v === 'string' ? `'${v}'` : v).join(", ")})`);
      addLog("SUCCESS", `💾 Database row committed. Table: "${matchedTable.tableName}". Response status: 201 Created.`);
    } else {
      addLog("SUCCESS", `📡 Mock Endpoint Response: ${JSON.stringify(apiEndpoint.mockResponseJSON || { status: "success" })}`);
    }

    // Clear form inputs
    setFormStates(prev => ({
      ...prev,
      [comp.id]: {}
    }));
  };

  const handleInputChange = (compId: string, fieldName: string, value: any) => {
    setFormStates(prev => ({
      ...prev,
      [compId]: {
        ...(prev[compId] || {}),
        [fieldName]: value
      }
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] rounded-xl border border-slate-800 overflow-hidden text-slate-200">
      
      {/* Top Banner Control Panel */}
      <div className="bg-[#0f172a] border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
          </div>
          <span className="ml-2 font-mono text-xs text-slate-400 bg-slate-900 border border-slate-700/50 px-2 py-0.5 rounded">
            sandbox://localhost:8080{activeRoute}
          </span>
        </div>

        {/* Dynamic active role picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <LucideIcons.ShieldAlert className="h-3 w-3 text-emerald-400" />
            Switch Active Role:
          </span>
          <select
            value={activeRole}
            onChange={(e) => {
              setActiveRole(e.target.value);
              addLog("INFO", `🔑 Switched environment scope to: "${e.target.value}"`);
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            {(schema?.intent?.userRoles || ["Admin"]).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Core Viewport area */}
      <div className="flex-1 flex overflow-hidden min-h-[350px]">
        
        {/* Rendered Mock Sidebar Navigation Page selection */}
        <div className="w-48 bg-[#0b0f19] border-r border-slate-800 flex flex-col justify-between py-3">
          <div className="space-y-1 px-2">
            <div className="px-3 mb-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Navigation</h4>
            </div>

            {schema?.ui?.pages?.map((p) => {
              const active = p.route === activeRoute;
              return (
                <button
                  key={p.route}
                  onClick={() => {
                    setActiveRoute(p.route);
                    addLog("INFO", `🗺️ Route transition -> ${p.route}`);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700/50" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {renderIcon(p.icon, "h-3.5 w-3.5")}
                  {p.title}
                  {p.gatedRoles?.length > 0 && (
                    <span className="ml-auto text-[8px] bg-red-950/40 text-red-400 border border-red-900/55 px-1 py-0.2 rounded font-mono">Gated</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 mt-4 self-center w-full">
            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] text-slate-500 font-mono text-center">
              Project: {schema?.projectName || "Compiler Sandbox"}
            </div>
          </div>
        </div>

        {/* Runtime client workspace contents */}
        <div className="flex-1 bg-[#090d16] p-4 overflow-y-auto relative">
          
          {isGated() ? (
            /* Secure Auth Exception Block Overlay */
            <div className="absolute inset-0 bg-[#090d16]/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-full mb-3">
                <LucideIcons.ShieldAlert className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 font-display">Auth Exception: Route Gated</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                The route <span className="font-mono text-indigo-400 font-bold">{activeRoute}</span> is fully restricted for your active role (<span className="text-red-400 font-bold">{activeRole}</span>).
              </p>
              <div className="text-[10px] text-slate-500 font-mono bg-slate-950 px-3 py-1.5 border border-slate-900 rounded">
                PERMITTED ACCESS TIERS: {activePage?.gatedRoles?.join(" | ") || "None"}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header description */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-indigo-950/50 text-indigo-400 border border-indigo-900/50">
                    {activePage?.layout?.toUpperCase() || "PAGE"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 font-display mt-1">{activePage?.title || "Page Workspace"}</h2>
              </div>

              {/* Dynamic Components rendering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePage?.components?.map((component) => {
                  
                  // KPI dynamic card
                  if (component.type === "kpi-card") {
                    return (
                      <div key={component.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium">{component.title}</p>
                          <h3 className="text-2xl font-bold text-white font-display mt-1">
                            {/* Heuristically query count properties from the endpoint schema responses */}
                            {component.associatedApiEndpoint?.includes("stats") 
                              ? "28" 
                              : "142"}
                          </h3>
                        </div>
                        <div className="p-2.5 bg-indigo-950/30 border border-indigo-900 text-indigo-400 rounded-lg">
                          <LucideIcons.TrendingUp className="h-4 w-4" />
                        </div>
                      </div>
                    );
                  }

                  // Table component
                  if (component.type === "table") {
                    // Try to map to associated table in custom logic
                    const mappedTableName = schema.db?.tables?.find(t => 
                      component.associatedApiEndpoint?.toLowerCase().includes(t.tableName.toLowerCase())
                    )?.tableName;

                    const dataRows = (mappedTableName && inMemoryDb[mappedTableName]) || [];
                    const tableObj = schema.db?.tables?.find(t => t.tableName === mappedTableName);

                    return (
                      <div key={component.id} className="col-span-1 md:col-span-2 p-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{component.title}</h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Table: {mappedTableName || "virtual_rows"} ({dataRows.length} items)
                          </span>
                        </div>

                        {dataRows.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs">No active database entries detected. Submit a post form to insert database records.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                  {tableObj?.columns?.map(col => (
                                    <th key={col.name} className="pb-2 font-medium capitalize">{col.name.replace(/_/g, " ")}</th>
                                  )) || (
                                    <>
                                      <th className="pb-2 font-medium">Record ID</th>
                                      <th className="pb-2 font-medium">Content Payload</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {dataRows.map((row, rIdx) => (
                                  <tr key={rIdx} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                                    {tableObj?.columns?.map(col => (
                                      <td key={col.name} className="py-2.5 font-mono text-xs">
                                        {typeof row[col.name] === "boolean" 
                                          ? (row[col.name] ? "🟢 true" : "🔴 false")
                                          : String(row[col.name] ?? "-")}
                                      </td>
                                    )) || (
                                      <>
                                        <td className="py-2.5 font-mono text-xs">{row.id || rIdx}</td>
                                        <td className="py-2.5 font-mono text-xs">{JSON.stringify(row)}</td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Interactive user application input form
                  if (component.type === "form") {
                    return (
                      <div key={component.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{component.title}</h4>
                          {component.targetRole && (
                            <span className="text-[9px] font-mono text-orange-400 bg-orange-950/20 border border-orange-900 px-2.5 py-0.5 rounded">
                              Required: {component.targetRole}
                            </span>
                          )}
                        </div>

                        <form onSubmit={(e) => handleFormSubmit(component, e)} className="space-y-3">
                          {component.fields?.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-medium">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                              
                              {field.type === "select" ? (
                                <select
                                  required={field.required}
                                  value={formStates[component.id]?.[field.id] || ""}
                                  onChange={(e) => handleInputChange(component.id, field.id, e.target.value)}
                                  className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="">Select option...</option>
                                  {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : field.type === "boolean" ? (
                                <div className="flex items-center gap-2 py-1">
                                  <input
                                    type="checkbox"
                                    id={`${component.id}_${field.id}`}
                                    checked={formStates[component.id]?.[field.id] || false}
                                    onChange={(e) => handleInputChange(component.id, field.id, e.target.checked)}
                                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                  />
                                  <label htmlFor={`${component.id}_${field.id}`} className="text-xs text-slate-400 font-medium">True / Active Flag</label>
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  placeholder={field.placeholder || ""}
                                  required={field.required}
                                  value={formStates[component.id]?.[field.id] || ""}
                                  onChange={(e) => handleInputChange(component.id, field.id, e.target.value)}
                                  className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-indigo-500"
                                />
                              )}
                            </div>
                          ))}

                          <button
                            type="submit"
                            className="w-full py-2 px-3 bg-indigo-600 font-medium text-xs text-white rounded hover:bg-indigo-500 transition-colors"
                          >
                            {component.submitButtonText || "Apply Transaction"}
                          </button>
                        </form>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* high fidelity terminal debugger logger output */}
      <div className="h-44 bg-[#070b13] border-t border-slate-800 flex flex-col overflow-hidden">
        <div className="bg-[#0b0f19] px-3.5 py-1.5 border-b border-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            LIVE EXECUTABLE SANDBOX INTERACTIVE TERMINAL
          </span>
          <button 
            onClick={() => setLogs([])}
            className="text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded cursor-pointer"
          >
            Clear Console
          </button>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-[#010409]">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-2.5 text-[11px] font-mono leading-relaxed items-start">
              <span className="text-slate-600 select-none">[{log.timestamp}]</span>
              
              {log.type === "INFO" && (
                <span className="text-cyan-400 font-semibold">[INFO]</span>
              )}
              {log.type === "SUCCESS" && (
                <span className="text-emerald-400 font-semibold">[OK]</span>
              )}
              {log.type === "WARN" && (
                <span className="text-amber-400 font-semibold">[WARN]</span>
              )}
              {log.type === "ERROR" && (
                <span className="text-rose-400 font-semibold">[ERR]</span>
              )}
              {log.type === "SQL" && (
                <span className="text-fuchsia-400 font-semibold">[SQL]</span>
              )}

              <span className={`flex-1 ${
                log.type === "ERROR" ? "text-rose-300" :
                log.type === "WARN" ? "text-amber-200" :
                log.type === "SQL" ? "text-fuchsia-300 font-medium" :
                log.type === "SUCCESS" ? "text-emerald-200" : "text-slate-300"
              }`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Premium Tier popup checkout loader indicator simulator */}
      {showBillingModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-indigo-900/60 p-6 rounded-xl text-center space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-900 text-indigo-400 rounded-full w-fit mx-auto">
              <LucideIcons.CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Stripe Gateway Authorization</h3>
              <p className="text-xs text-slate-400 mt-1">This compiled page uses gated logic that requires a valid active organization membership tier subscription.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  addLog("SUCCESS", "💸 Stripe subscription active: Authorization validated successfully.");
                }}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded text-white cursor-pointer"
              >
                Approve Payment
              </button>
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  addLog("WARN", "🚫 Stripe subscription cancelled: Payment authorization rejected by client.");
                }}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-slate-300 cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
