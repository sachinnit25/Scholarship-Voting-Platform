import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Wallet, 
  LogOut, 
  Award, 
  ShieldCheck, 
  UserCheck, 
  Activity, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  Settings,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  connectWallet, 
  getXLMBalance, 
  initializeContract,
  applyScholarship, 
  approveCandidate, 
  voteForCandidate, 
  endVoting 
} from './services/stellarService';
import './App.css';

interface Candidate {
  id: number;
  owner: string;
  name: string;
  major: string;
  description: string;
  requestedAmount: number;
  voteCount: number;
  approved: boolean;
}

interface BlockchainEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
  message: string;
}

function App() {
  // Config States
  const [contractId, setContractId] = useState<string>("CBL6SY43NK7VWYJ6J3RWTSMKRHZK3RYTSJ5GPLYARPRDAGAOEYTKV5P3");
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminSimulated, setIsAdminSimulated] = useState(false);

  // Wallet States
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasVotedLocally, setHasVotedLocally] = useState(false);

  // App States
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 0,
      owner: "GBL43...XLM77",
      name: "Sophia Chen",
      major: "Computer Science & AI",
      description: "Building open-source computer vision models to assist rural clinics in diagnosing skin pathologies locally without active internet connections.",
      requestedAmount: 5000,
      voteCount: 24,
      approved: true,
    },
    {
      id: 1,
      owner: "GDJ99...MED33",
      name: "Liam Dubois",
      major: "Mechanical Engineering",
      description: "Developing low-cost solar-powered water desalination units for small agricultural farms in arid regions.",
      requestedAmount: 7500,
      voteCount: 18,
      approved: true,
    },
    {
      id: 2,
      owner: "GCQ66...BIO44",
      name: "Elena Rostova",
      major: "Biomedical Science",
      description: "Designing paper-based colorimetric assay test strips for rapid detection of malaria at less than $0.10 per unit.",
      requestedAmount: 6000,
      voteCount: 8,
      approved: true,
    },
    {
      id: 3,
      owner: "GAT22...ENV88",
      name: "Marcus Vance",
      major: "Environmental Science",
      description: "Mapping urban heat islands in underserved neighborhoods using crowdsourced mobile sensory data to plan green roof placements.",
      requestedAmount: 4000,
      voteCount: 0,
      approved: false, // Needs Admin approval
    }
  ]);

  // Form States
  const [formName, setFormName] = useState('');
  const [formMajor, setFormMajor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('5000');

  // Transaction Status
  const [txStatus, setTxStatus] = useState<{
    type: 'idle' | 'pending' | 'success' | 'error';
    message: string;
    hash?: string;
  }>({ type: 'idle', message: '' });

  // Event Logs
  const [events, setEvents] = useState<BlockchainEvent[]>([
    { id: '1', timestamp: '18:15', type: 'info', message: 'Contract instance deployed & initialized.' },
    { id: '2', timestamp: '18:20', type: 'success', message: 'Sophia Chen submitted application ID #0.' },
    { id: '3', timestamp: '18:21', type: 'success', message: 'Admin approved Sophia Chen for general voting.' },
    { id: '4', timestamp: '18:32', type: 'info', message: 'Anonymous Voter (GA2B...) cast vote for Liam Dubois.' }
  ]);

  const isSimulation = !contractId || contractId.includes("PLACEHOLDER") || contractId === "";

  // Fetch balance periodically
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, contractId]);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    try {
      const bal = await getXLMBalance(walletAddress);
      setWalletBalance(bal);
    } catch (e) {
      console.error("Error updating balance:", e);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setTxStatus({ type: 'idle', message: '' });
      const address = await connectWallet();
      setWalletAddress(address);
      const bal = await getXLMBalance(address);
      setWalletBalance(bal);
      addEvent('info', `Freighter Wallet connected: ${address.slice(0, 6)}...${address.slice(-6)}`);
    } catch (error: any) {
      setTxStatus({
        type: 'error',
        message: error.message || 'Failed to connect Freighter wallet.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setWalletBalance("0");
    setHasVotedLocally(false);
    addEvent('info', 'Freighter Wallet disconnected.');
  };

  const addEvent = (type: 'info' | 'success' | 'warning', message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEvents(prev => [
      { id: Date.now().toString(), timestamp: time, type, message },
      ...prev
    ]);
  };

  // 1. Initialize Contract On-Chain
  const handleInitialize = async () => {
    if (!walletAddress) return;
    try {
      setTxStatus({ type: 'pending', message: 'Initializing smart contract on-chain...' });
      const res = await initializeContract(contractId, walletAddress);
      setTxStatus({
        type: 'success',
        message: 'Contract successfully initialized with connected wallet as Admin.',
        hash: res.hash
      });
      addEvent('success', `Admin initialized contract: ${contractId.slice(0, 8)}...`);
    } catch (e: any) {
      setTxStatus({ type: 'error', message: e.message || 'Initialization failed.' });
    }
  };

  // 2. Submit Scholarship Application
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setTxStatus({ type: 'error', message: 'Please connect your wallet first.' });
      return;
    }
    if (!formName || !formMajor || !formDescription || !formAmount) {
      setTxStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    const amountNum = parseInt(formAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus({ type: 'error', message: 'Requested amount must be a positive number.' });
      return;
    }

    try {
      setTxStatus({ type: 'pending', message: 'Submitting application to Stellar blockchain...' });
      const res = await applyScholarship(
        contractId,
        walletAddress,
        formName,
        formMajor,
        formDescription,
        amountNum
      );

      // Success
      setTxStatus({
        type: 'success',
        message: isSimulation 
          ? 'Application simulated successfully. Note: Real transactions require setting a contract ID.' 
          : 'Application recorded on-chain! Awaiting admin verification.',
        hash: res.hash
      });

      // Update local candidates state
      const newCandidateId = candidates.length;
      const newCandidate: Candidate = {
        id: newCandidateId,
        owner: walletAddress,
        name: formName,
        major: formMajor,
        description: formDescription,
        requestedAmount: amountNum,
        voteCount: 0,
        approved: false
      };

      setCandidates([...candidates, newCandidate]);
      addEvent('success', `New application submitted by ${formName} (${formMajor}).`);

      // Reset Form
      setFormName('');
      setFormMajor('');
      setFormDescription('');
      setFormAmount('5000');
      fetchBalance();
    } catch (e: any) {
      setTxStatus({ type: 'error', message: e.message || 'Application submission failed.' });
    }
  };

  // 3. Admin Approval Action
  const handleApprove = async (id: number) => {
    try {
      setTxStatus({ type: 'pending', message: `Approving candidate ID #${id} on-chain...` });
      const res = await approveCandidate(contractId, id);

      setTxStatus({
        type: 'success',
        message: 'Applicant approved! They are now eligible to receive votes.',
        hash: res.hash
      });

      setCandidates(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c));
      const approvedCandidate = candidates.find(c => c.id === id);
      addEvent('success', `Admin approved applicant: ${approvedCandidate?.name}.`);
      fetchBalance();
    } catch (e: any) {
      setTxStatus({ type: 'error', message: e.message || 'Approval transaction failed.' });
    }
  };

  // 4. Cast Vote Action
  const handleVote = async (id: number) => {
    if (!walletAddress) {
      setTxStatus({ type: 'error', message: 'Please connect your wallet to vote.' });
      return;
    }
    if (hasVotedLocally) {
      setTxStatus({ type: 'error', message: 'You have already cast your vote.' });
      return;
    }
    if (!isVotingOpen) {
      setTxStatus({ type: 'error', message: 'Voting has closed.' });
      return;
    }

    try {
      setTxStatus({ type: 'pending', message: 'Casting your vote on the blockchain...' });
      const res = await voteForCandidate(contractId, walletAddress, id);

      setTxStatus({
        type: 'success',
        message: 'Vote casted successfully! Your wallet has been marked as voted.',
        hash: res.hash
      });

      setCandidates(prev => prev.map(c => c.id === id ? { ...c, voteCount: c.voteCount + 1 } : c));
      setHasVotedLocally(true);
      const votedCandidate = candidates.find(c => c.id === id);
      addEvent('success', `Voter (${walletAddress.slice(0, 6)}...) cast vote for ${votedCandidate?.name}.`);
      fetchBalance();
    } catch (e: any) {
      setTxStatus({ type: 'error', message: e.message || 'Voting transaction failed.' });
    }
  };

  // 5. End Voting Period
  const handleEndVoting = async () => {
    try {
      setTxStatus({ type: 'pending', message: 'Closing voting period on-chain...' });
      const res = await endVoting(contractId);

      setTxStatus({
        type: 'success',
        message: 'Voting period closed successfully. Winners can now be computed.',
        hash: res.hash
      });

      setIsVotingOpen(false);
      addEvent('warning', 'Voting period has been officially closed by admin.');
      fetchBalance();
    } catch (e: any) {
      setTxStatus({ type: 'error', message: e.message || 'Closing voting period failed.' });
    }
  };

  // Calculate stats
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const approvedCount = candidates.filter(c => c.approved).length;
  const pendingCount = candidates.filter(c => !c.approved).length;
  
  // Find leader
  const leadingCandidate = [...candidates]
    .filter(c => c.approved)
    .sort((a, b) => b.voteCount - a.voteCount)[0];

  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      
      {/* HEADER SECTION */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 0', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', 
            padding: '0.6rem', 
            borderRadius: '0.75rem',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
          }}>
            <GraduationCap size={28} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Aether<span style={{ color: '#8b5cf6' }}>Scholar</span>
            </h1>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Decentralized Voting Protocol
            </span>
          </div>
        </div>

        {/* Global Nav Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Simulation vs Real Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: isSimulation ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            border: `1px solid ${isSimulation ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
            padding: '0.4rem 0.8rem',
            borderRadius: '2rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: isSimulation ? '#f59e0b' : '#10b981'
            }}></div>
            <span style={{ color: isSimulation ? '#f59e0b' : '#10b981' }}>
              {isSimulation ? "Simulation Mode" : "Stellar Testnet"}
            </span>
          </div>

          {/* Settings button */}
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}
            title="Configure Contract Address"
          >
            <Settings size={18} />
          </button>

          {/* Freighter Connection */}
          {walletAddress ? (
            <div className="glass-panel" style={{ padding: '0.35rem 0.35rem 0.35rem 0.85rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c084fc' }}>{formatAddress(walletAddress)}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{parseFloat(walletBalance).toFixed(2)} XLM</span>
              </div>
              <button 
                onClick={handleDisconnect} 
                className="btn btn-danger" 
                style={{ padding: '0.5rem', borderRadius: '0.5rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect} 
              className="btn btn-primary" 
              disabled={isConnecting}
            >
              <Wallet size={16} />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* SETTINGS PANEL (IF TOGGLED) */}
      {showSettings && (
        <div className="glass-panel animate-slide-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} color="#8b5cf6" />
            Soroban Integration Settings
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Configure your custom deployed Soroban contract ID below to switch from Mock Simulation to live Stellar Testnet execution.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }} className="form-group">
              <label className="form-label">Smart Contract ID</label>
              <input 
                type="text" 
                value={contractId} 
                onChange={(e) => { setWalletAddress(null); setContractId(e.target.value); }} 
                className="form-input" 
                placeholder="e.g. CD5DYYJ7... (Leave blank for Simulation)" 
              />
            </div>
            
            <button 
              onClick={handleInitialize} 
              className={`btn btn-secondary ${(!walletAddress || isSimulation) ? 'btn-disabled' : ''}`}
              disabled={!walletAddress || isSimulation}
              title={!walletAddress ? "Connect wallet to initialize" : isSimulation ? "Enter contract ID first" : "Initialize Admin Role"}
            >
              Initialize On-Chain
            </button>

            <button 
              onClick={() => { setContractId("PLACEHOLDER_CONTRACT_ID"); setWalletAddress(null); }} 
              className="btn btn-danger"
              style={{ background: 'rgba(239, 68, 68, 0.05)' }}
            >
              Reset to Simulation
            </button>
          </div>
          {isSimulation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.75rem', marginTop: '1rem' }}>
              <Info size={14} />
              <span>Simulation mode is active. All transactions will bypass Freighter and execute locally with mock transaction hashes.</span>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD METRICS */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Candidates</span>
            <GraduationCap size={18} />
          </div>
          <div className="stat-val">{candidates.length}</div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            <span>Approved: <strong style={{ color: '#10b981' }}>{approvedCount}</strong></span>
            <span>Pending: <strong style={{ color: '#f59e0b' }}>{pendingCount}</strong></span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Votes Cast</span>
            <Activity size={18} />
          </div>
          <div className="stat-val">{totalVotes}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {isVotingOpen ? "Voting is actively running" : "Voting period closed"}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `3px solid ${isVotingOpen ? '#10b981' : '#ef4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voting Status</span>
            <Clock size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div className={`pulse-indicator ${isVotingOpen ? 'pulse-active' : 'pulse-closed'}`}></div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: isVotingOpen ? '#10b981' : '#ef4444' }}>
              {isVotingOpen ? "ACTIVE" : "CLOSED"}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {isVotingOpen ? "Secure decentralized voting" : "On-chain results finalized"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid #10b981', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Leader</span>
            <Award size={18} color="#10b981" />
          </div>
          {leadingCandidate ? (
            <>
              <div className="stat-val" style={{ fontSize: '1.25rem', color: 'white', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {leadingCandidate.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Leading with <strong style={{ color: '#10b981' }}>{leadingCandidate.voteCount} votes</strong>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1rem' }}>No approved applicants yet</div>
          )}
        </div>
      </section>

      {/* MAIN LAYOUT GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 360px', 
        gap: '2rem', 
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: applicants & form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* APPLICANT LIST */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} color="#8b5cf6" />
              Scholarship Applicants
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {candidates.map((c) => {
                const percentage = totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0;
                return (
                  <div 
                    key={c.id} 
                    className="glass-panel glass-panel-hover" 
                    style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                  >
                    
                    {/* Header of Candidate Card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>{c.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '600' }}>{c.major}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          color: '#10b981', 
                          background: 'rgba(16, 185, 129, 0.05)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(16, 185, 129, 0.12)'
                        }}>
                          {c.requestedAmount} XLM
                        </span>

                        <span className={`badge ${c.approved ? 'badge-approved' : 'badge-pending'}`}>
                          {c.approved ? "Approved" : "Pending Verification"}
                        </span>
                      </div>
                    </div>

                    {/* Bio/Description */}
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
                      {c.description}
                    </p>

                    {/* Footer / Vote progress */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                      paddingTop: '1rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      
                      {/* Vote Count indicator */}
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#94a3b8' }}>VOTES RECEIVED</span>
                          <span style={{ color: '#8b5cf6' }}>{c.voteCount} ({percentage}%)</span>
                        </div>
                        {c.approved && (
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                          </div>
                        )}
                      </div>

                      {/* Vote Button */}
                      <div>
                        {c.approved ? (
                          <button 
                            onClick={() => handleVote(c.id)}
                            className={`btn ${(!walletAddress || hasVotedLocally || !isVotingOpen) ? 'btn-secondary btn-disabled' : 'btn-accent'}`}
                            disabled={!walletAddress || hasVotedLocally || !isVotingOpen}
                            title={
                              !walletAddress 
                                ? "Connect wallet to vote" 
                                : !isVotingOpen 
                                  ? "Voting has closed" 
                                  : hasVotedLocally 
                                    ? "You have already voted" 
                                    : "Cast 1 vote"
                            }
                          >
                            <CheckCircle size={16} />
                            {hasVotedLocally ? "Voted" : "Vote Candidate"}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600' }}>
                            <Clock size={14} />
                            Awaiting Admin Approval
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* APPLICATION FORM */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={22} color="#8b5cf6" />
              Apply for Scholarship
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.75rem' }}>
              Submit your academic proposal directly to the blockchain. All submissions require administrator approval before voting starts.
            </p>

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. Marcus Vance" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Major & Field of Study</label>
                <input 
                  type="text" 
                  value={formMajor} 
                  onChange={(e) => setFormMajor(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. Environmental Science & Forestry" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Proposal Essay</label>
                <textarea 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  className="form-input" 
                  placeholder="Summarize your scholarship research goals and why funding is needed (Max 250 words)..." 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scholarship Amount Requested (XLM)</label>
                <input 
                  type="number" 
                  value={formAmount} 
                  onChange={(e) => setFormAmount(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. 5000" 
                  min="1"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary ${!walletAddress ? 'btn-disabled' : ''}`}
                disabled={!walletAddress}
                style={{ marginTop: '0.5rem' }}
              >
                <FileText size={18} />
                Submit Application
              </button>
              
              {!walletAddress && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                  <AlertTriangle size={12} />
                  You must connect your Freighter wallet to submit an application.
                </div>
              )}
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Wallet, Admin, Events) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* USER WALLET SIDEBAR CARD */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={18} color="#8b5cf6" />
              Wallet Information
            </h3>
            
            {walletAddress ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>ADDRESS</div>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'white', wordBreak: 'break-all', marginTop: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {walletAddress}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>XLM BALANCE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '0.15rem' }}>
                      {parseFloat(walletBalance).toFixed(2)} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>XLM</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={fetchBalance} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}
                  >
                    Refresh
                  </button>
                </div>

                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.04)', 
                  border: '1px solid rgba(139, 92, 246, 0.15)', 
                  padding: '0.85rem', 
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Info size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.75rem', color: '#c084fc', lineHeight: '1.4' }}>
                    {hasVotedLocally ? "You have voted in this round." : "You are eligible to vote on 1 candidate."}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Wallet size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Connect your Freighter wallet to view balance, apply, or vote.
                </p>
                <button onClick={handleConnect} className="btn btn-primary" style={{ width: '100%' }}>
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* SIMULATED ROLE SWITCHER FOR DEMO */}
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#3b82f6" />
              Demo Role Controller
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Easily toggle between Voter and Admin perspectives to test the full smart contract flow.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setIsAdminSimulated(false)} 
                className={`btn ${!isAdminSimulated ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: '1', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Voter View
              </button>
              <button 
                onClick={() => setIsAdminSimulated(true)} 
                className={`btn ${isAdminSimulated ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: '1', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Admin View
              </button>
            </div>
          </div>

          {/* ADMIN ACTION PANEL (VISIBLE IF SIMULATED ADMIN) */}
          {isAdminSimulated && (
            <div className="glass-panel animate-slide-in" style={{ padding: '1.5rem', background: 'rgba(139, 92, 246, 0.02)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#8b5cf6" />
                Admin Operations
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Execute administrator-only smart contract operations.
              </p>

              {/* Pending Approvals Sub-section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Pending Applications ({pendingCount})
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {candidates.filter(c => !c.approved).map(c => (
                      <div 
                        key={c.id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          padding: '0.75rem', 
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ minWidth: '0', flex: '1', marginRight: '0.5rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.major}</div>
                        </div>
                        <button 
                          onClick={() => handleApprove(c.id)} 
                          className="btn btn-accent" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.4rem' }}
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                    {pendingCount === 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        No pending applications.
                      </p>
                    )}
                  </div>
                </div>

                {/* Open/Close Voting toggle */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Voting Control
                  </span>
                  <div style={{ marginTop: '0.5rem' }}>
                    {isVotingOpen ? (
                      <button 
                        onClick={handleEndVoting} 
                        className="btn btn-danger" 
                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
                      >
                        End Voting Period
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsVotingOpen(true);
                          addEvent('info', 'Voting reopened by admin.');
                        }} 
                        className="btn btn-primary" 
                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
                      >
                        Reopen Voting Period
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECENT BLOCKCHAIN EVENTS PANEL */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#8b5cf6" />
              Recent Ledger Events
            </h3>
            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Polled every 10s
            </span>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.85rem', 
              marginTop: '1.25rem',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}>
              {events.map((e) => (
                <div 
                  key={e.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    paddingBottom: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ 
                      color: e.type === 'success' ? '#34d399' : e.type === 'warning' ? '#f87171' : '#60a5fa', 
                      fontWeight: '700' 
                    }}>
                      {e.type.toUpperCase()}
                    </span>
                    <span style={{ color: '#475569' }}>{e.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4', margin: 0 }}>
                    {e.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* FLOAT TRANSACTION OVERLAY CARD (BOTTOM RIGHT) */}
      {txStatus.type !== 'idle' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          right: '2rem', 
          background: '#0d0d16', 
          border: `1px solid ${
            txStatus.type === 'error' 
              ? 'rgba(239, 68, 68, 0.4)' 
              : txStatus.type === 'success' 
                ? 'rgba(16, 185, 129, 0.4)' 
                : 'rgba(139, 92, 246, 0.4)'
          }`,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 20px rgba(139, 92, 246, 0.15)',
          padding: '1.5rem', 
          borderRadius: '1rem', 
          color: 'white', 
          width: '380px', 
          zIndex: 1000,
          animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: txStatus.type === 'error' ? '#ef4444' : txStatus.type === 'success' ? '#10b981' : '#8b5cf6', 
              fontSize: '1.05rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              {txStatus.type === 'pending' && <Clock size={16} className="pulse" />}
              {txStatus.type === 'success' && <CheckCircle size={16} />}
              {txStatus.type === 'error' && <AlertTriangle size={16} />}
              {txStatus.type === 'pending' ? 'Transaction Pending' : txStatus.type === 'error' ? 'Transaction Failed' : 'Transaction Success'}
            </h4>
            <button 
              onClick={() => setTxStatus({ type: 'idle', message: '' })} 
              style={{ background: 'none', color: '#475569', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
            {txStatus.message}
          </p>
          
          {txStatus.hash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {txStatus.hash.startsWith("sim_") ? (
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)', padding: '0.35rem 0.6rem', borderRadius: '0.5rem' }}>
                  Sim Hash: {txStatus.hash.slice(0, 14)}...
                </span>
              ) : (
                <a 
                  href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.5rem', width: '100%', textDecoration: 'none' }}
                >
                  View on Stellar Expert Explorer →
                </a>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
