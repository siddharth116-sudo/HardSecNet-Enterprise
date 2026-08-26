import { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, AlertOctagon } from 'lucide-react';
import { io } from 'socket.io-client';

// Services & Utils
import { authFetch } from './services/api';
import { calculateScore } from './utils/helpers';
import { API_BASE_URL, POLLING_INTERVAL, MAX_LOG_LINES } from './constants/config';

// Components
import Sidebar from './components/layout/Sidebar';
import LoginScreen from './pages/LoginScreen';
import Connectors from './components/integrations/Connectors';
import KpiRow from './components/dashboard/KpiRow';
import ControlFamilies from './components/dashboard/ControlFamilies';
import FleetTable from './components/dashboard/FleetTable';
import AIInsights from './components/dashboard/AIInsights';
import AuditTable from './components/dashboard/AuditTable';
import AttackSurfaceMap from './components/dashboard/AttackSurfaceMap';
import ComplianceHistory from './components/research/ComplianceHistory';
import Workspaces from './components/workspaces/Workspaces';

import AddNodeModal from './components/modals/AddNodeModal';
// import ChatWidget from './components/dashboard/ChatWidget';


function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  // Data State
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [network, setNetwork] = useState([]);
  const [telemetry, setTelemetry] = useState({ cpu: 0, ram: 0 });
  const [loading, setLoading] = useState(true);
  const [hardening, setHardening] = useState(false);
  const [hardeningStatus, setHardeningStatus] = useState(null);
  const [autoRemediate, setAutoRemediate] = useState(false);

  // UI State
  const [nodes, setNodes] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [fleetRefresh, setFleetRefresh] = useState(0);
  const [selectedNode, setSelectedNode] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [researchData, setResearchData] = useState([]);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [selectedFixes, setSelectedFixes] = useState([]); // Track selected vulnerabilities for granular fix

  // Multi-client (workspace) state
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(''); // '' = all clients
  const wsQuery = activeWorkspace ? `?workspace=${activeWorkspace}` : '';

  // --- Auth & Lifecycle ---
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUserRole(null);
    setUsername(null);
  };

  const fetchData = () => {
    if (!token) return;

    setLoading(true);

    const loadCommonData = () => {
      authFetch(`/api/audit-history${wsQuery}`, token)
        .then(r => setHistory(Array.isArray(r) ? r : (r?.data || [])))
        .catch(console.error);

      authFetch('/api/workspaces', token)
        .then(r => setWorkspaces(Array.isArray(r) ? r : (r?.data || [])))
        .catch(() => {});

      authFetch('/api/network-traffic', token)
        .then(r => setNetwork(Array.isArray(r) ? r : (r?.data || [])))
        .catch(console.error);

      authFetch('/api/research-data', token)
        .then(r => setResearchData(Array.isArray(r) ? r : (r?.data || [])))
        .catch(console.error);
    };

    authFetch(`/api/nodes${wsQuery}`, token)
      .then(serverNodes => {
        const list = Array.isArray(serverNodes)
          ? serverNodes
          : (Array.isArray(serverNodes?.nodes) ? serverNodes.nodes : []);

        setNodes(list);

        setSelectedNode(current => {
          if (current && list.includes(current)) {
            return current;
          }

          return list.length > 0 ? list[0] : '';
        });

        loadCommonData();

        if (list.length === 0) {
          setData(null);
          setFleet([]);
          setLoading(false);
          return;
        }

        const node = selectedNode && list.includes(selectedNode)
          ? selectedNode
          : list[0];

        return authFetch(`/api/node-data/${encodeURIComponent(node)}`, token);
      })
      .then(nodeData => {
        if (!nodeData) return;

        setData(nodeData);

        const controls = Array.isArray(nodeData?.controls)
          ? nodeData.controls
          : [];

        const total = controls.length;
        const failing = controls.filter(c =>
          c?.status === 'fail' ||
          c?.status === 'failed' ||
          c?.compliant === false
        ).length;

        const score = total > 0
          ? Math.round(((total - failing) / total) * 100)
          : 0;

        setFleet([{
          name: selectedNode || 'Unknown',
          os: nodeData?.os || 'unknown',
          score,
          total,
          failing,
          status: 'online',
          lastSeen: new Date().toISOString()
        }]);

        setLoading(false);
      })
      .catch(e => {
        console.error('Dashboard data fetch failed:', e);

        setData(null);
        setFleet([]);
        setLoading(false);

        if (e.message === 'Unauthorized') {
          logout();
        }
      });
  };
  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(() => {
        fetch(`${API_BASE_URL}/api/telemetry`).then(r => r.json()).then(setTelemetry).catch(console.error);
      }, POLLING_INTERVAL);

      const socket = io(API_BASE_URL);
      socket.on('connect', () => console.log("Connected to Live Log Stream"));
      socket.on('new_log', (data) => {
        setLogs(prev => [...prev.slice(-(MAX_LOG_LINES - 1)), data.log]);
      });

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [token, selectedNode, activeWorkspace]); // Re-run on node/workspace change to refresh data

  // Build the fleet summary (per-node score/findings) whenever the node list changes.
  useEffect(() => {
    if (!token || !nodes.length) return;
    let cancelled = false;
    Promise.all(nodes.map(n =>
      authFetch(`/api/node-data/${n}`, token).then(d => {
        const checks = d.Checks || [];
        const pass = checks.filter(c => c.Status === 'Compliant').length;
        const names = checks.map(c => c.Name || '').join(' ').toLowerCase();
        const os = /ssh |ufw|permitroot/.test(names) ? 'linux' : (n === 'LOCALHOST' ? 'server' : 'windows');
        return { hostname: n, os, total: checks.length, failing: checks.length - pass, score: checks.length ? Math.round(pass / checks.length * 100) : 0 };
      }).catch(() => ({ hostname: n, os: n === 'LOCALHOST' ? 'server' : 'windows', total: 0, failing: 0, score: 0 }))
    )).then(f => { if (!cancelled) setFleet(f); });
    return () => { cancelled = true; };
  }, [token, nodes, fleetRefresh]);

  // --- Handlers ---

  const handleRollback = () => {
    if (!confirm("EMERGENCY ROLLBACK: This will revert all system changes. Are you sure?")) return;
    authFetch('/api/rollback', token, { method: 'POST' })
      .then(data => { alert(data.message || data.error); fetchData(); });
  };

  const handleFixNow = () => {
    if (userRole !== 'super_admin' && userRole !== 'security_admin') return alert("Access Denied: Admin role required.");
    if (!confirm("Start automatic system hardening?")) return;
    setHardening(true);
    setHardeningStatus("Initiating...");
    authFetch('/api/execute-hardening', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node: selectedNode,
        targets: selectedFixes.length > 0 ? selectedFixes : undefined // Send specific targets if selected
      })
    })
      .then((res) => {
        setSelectedFixes([]);
        fetchData();                  // refresh the selected node's findings/score
        setFleetRefresh(x => x + 1);  // refresh the fleet table + KPI tiles
        setHardening(false);
        alert(res?.message || "Hardening applied.");
      })
      .catch(e => {
        setHardeningStatus("Error: " + e.message);
        setTimeout(() => setHardening(false), 3000);
      });
  };

  const handleKillProcess = (pid) => {
    if (userRole !== 'super_admin' && userRole !== 'security_admin') return alert("Access Denied: Admin role required.");
    if (!confirm(`Terminate process PID ${pid}? This action is irreversible.`)) return;
    authFetch('/api/kill-process', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid })
    }).then(data => { alert(data.message); fetchData(); });
  };

  const handleAddNodeSuccess = (newNodeIp) => {
    fetchData();
    if (newNodeIp) setSelectedNode(newNodeIp);
  };

  // --- Render ---

  if (!token) {
    return <LoginScreen setToken={setToken} setUserRole={setUserRole} setUsername={setUsername} />;
  }

  const score = data ? calculateScore(data.Checks) : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--hsn-bg)', color: 'var(--hsn-text)' }}>

      {/* LEFT: Sidebar Navigation & Controls */}
      <div className="flex-none">
        <Sidebar
          username={username}
          userRole={userRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          nodes={nodes}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          handleAddNode={() => setShowAddNodeModal(true)}
          logout={logout}
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
        />
      </div>

      {/* CENTER: Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-8">

          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header For Dashboard View */}
              <div className="flex justify-between items-end pb-5" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)' }}>
                    Fleet overview
                  </h2>
                  <div className="flex items-center mt-2.5 gap-3">
                    <div className="px-2.5 py-1 rounded-md hsn-mono text-xs" style={{ background: 'var(--hsn-surface)', border: '1px solid var(--hsn-border)', color: 'var(--hsn-text-muted)' }}>
                      target&nbsp;Â·&nbsp;<span style={{ color: 'var(--hsn-text)' }}>{selectedNode}</span>
                    </div>
                    {data?.CurrentStatus && data.CurrentStatus !== 'Idle' && (
                      <span className="hsn-chip hsn-chip-accent">
                        <span className="hsn-dot" style={{ background: 'var(--hsn-accent)' }}></span>
                        {data.CurrentStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5">
                  {(userRole === 'super_admin' || userRole === 'security_admin') && (
                    <button onClick={handleFixNow} className="hsn-btn-primary px-4 py-2 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {selectedFixes.length > 0 ? `Remediate selected (${selectedFixes.length})` : "Auto-harden system"}
                    </button>
                  )}
                  <button onClick={() => window.open(`${API_BASE_URL}/api/generate-pdf`, '_blank')} className="px-3.5 py-2 rounded-[10px] text-sm font-medium flex items-center gap-2 transition-colors" style={{ background: 'var(--hsn-surface)', border: '1px solid var(--hsn-border-strong)', color: 'var(--hsn-text-muted)' }}>
                    <FileText className="w-4 h-4" />
                    Export
                  </button>
                  {userRole === 'super_admin' && (
                    <button onClick={handleRollback} className="px-3.5 py-2 rounded-[10px] text-sm font-medium flex items-center gap-2 transition-colors" style={{ background: 'var(--hsn-danger-weak)', color: 'var(--hsn-danger)' }}>
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Rollback
                    </button>
                  )}
                </div>
              </div>

              {/* KPI stat row */}
              <KpiRow
                score={score}
                nodeCount={fleet.length || nodes.length}
                openFindings={fleet.reduce((a, n) => a + n.failing, 0)}
                windows={fleet.filter(n => n.os !== 'linux').length}
                linux={fleet.filter(n => n.os === 'linux').length}
              />

              {/* Control families + AI remediation */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ControlFamilies checks={data?.Checks} />
                <AIInsights summary={data?.AISummary} />
              </div>

              {/* Managed fleet */}
              <FleetTable fleet={fleet} selectedNode={selectedNode} onSelect={setSelectedNode} />

              {/* Detailed controls table */}
              <AuditTable
                checks={data?.Checks}
                selectedFixes={selectedFixes}
                setSelectedFixes={setSelectedFixes}
                userRole={userRole}
              />
            </div>
          )}

          {/* VIEW: ATTACK SURFACE */}
          {activeTab === 'network' && (
            <div className="h-full flex flex-col max-w-6xl mx-auto w-full">
              <h2 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: 'var(--hsn-text)' }}>Attack surface</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--hsn-text-muted)' }}>Live network exposure across your managed nodes.</p>
              <div className="flex-1 hsn-card overflow-hidden">
                <AttackSurfaceMap userRole={userRole} />
              </div>
            </div>
          )}

          {/* VIEW: COMPLIANCE & AUDIT */}
          {activeTab === 'research' && (
            <div className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)' }}>Compliance & audit</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--hsn-text-muted)' }}>Historical posture and audit trail over time.</p>
              </div>
              <ComplianceHistory history={history} />
            </div>
          )}

          {/* VIEW: INTEGRATIONS */}
          {activeTab === 'connectors' && (
            <Connectors token={token} userRole={userRole} />
          )}

          {/* VIEW: CLIENTS (workspaces) */}
          {activeTab === 'clients' && (
            <Workspaces token={token} userRole={userRole} onChange={fetchData} />
          )}

        </main>
      </div>

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <AddNodeModal
          onClose={() => setShowAddNodeModal(false)}
          onSuccess={handleAddNodeSuccess}
          token={token}
        />
      )}

      {/* Security Copilot Widget */}
      {/* <ChatWidget token={token} /> */}
    </div>
  );
}

export default App;


