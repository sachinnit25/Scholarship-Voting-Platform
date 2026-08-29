import React, { useState } from "react";
import { pinMetadataToIPFS, formatIPFSUrl } from "../services/ipfsService";
import { submitMilestoneProof, approveAndDisburseMilestone } from "../services/stellarService";

export interface Milestone {
  id: number;
  candidateId: number;
  description: string;
  percentage: number;
  proofUri: string;
  completed: boolean;
  disbursed: boolean;
}

interface MilestoneTrackerProps {
  candidateId: number;
  candidateName: string;
  totalGrantAmount: number;
  contractId: string;
  userAddress: string;
  isAdmin: boolean;
  milestones: Milestone[];
  onMilestoneUpdated: () => void;
  onLogEvent?: (msg: string) => void;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  candidateId,
  candidateName,
  totalGrantAmount,
  contractId,
  userAddress,
  isAdmin,
  milestones,
  onMilestoneUpdated,
  onLogEvent,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [proofTitle, setProofTitle] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleOpenProofModal = (m: Milestone) => {
    setSelectedMilestone(m);
    setProofTitle(`${candidateName} - Milestone ${m.id + 1} Proof`);
    setProofDetails("");
    setStatusMsg("");
  };

  const handlePinAndSubmitProof = async () => {
    if (!selectedMilestone) return;
    setIsSubmitting(true);
    setStatusMsg("Pinning milestone evidence to IPFS...");
    try {
      // 1. IPFS Pinning
      const ipfsResult = await pinMetadataToIPFS(proofTitle, proofDetails);
      setStatusMsg(`IPFS Pinned: ${ipfsResult.cid}. Submitting to Soroban contract...`);
      onLogEvent?.(`IPFS Pinned CID: ${ipfsResult.cid} for Candidate #${candidateId}`);

      // 2. Submit on-chain proof
      const res = await submitMilestoneProof(
        contractId,
        userAddress || "GBXSIMULATEDUSERADDRESSFORTESTING123456",
        candidateId,
        selectedMilestone.id,
        `ipfs://${ipfsResult.cid}`
      );

      setStatusMsg(`Success! Proof recorded on-chain (Tx: ${res.hash.slice(0, 12)}...)`);
      onLogEvent?.(`Milestone #${selectedMilestone.id + 1} proof submitted on-chain.`);
      setTimeout(() => {
        setSelectedMilestone(null);
        setIsSubmitting(false);
        onMilestoneUpdated();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Error: ${err.message || "Failed to submit milestone proof"}`);
      setIsSubmitting(false);
    }
  };

  const handleDisburse = async (m: Milestone) => {
    try {
      onLogEvent?.(`Initiating Soroban Milestone Escrow Disbursement for Milestone #${m.id + 1}...`);
      const res = await approveAndDisburseMilestone(contractId, candidateId, m.id);
      onLogEvent?.(`Disbursed ${m.percentage}% grant funds on-chain (Tx: ${res.hash.slice(0, 10)})`);
      onMilestoneUpdated();
    } catch (err: any) {
      alert(`Disbursement Error: ${err.message}`);
    }
  };

  const calculateDisbursedAmount = () => {
    const totalDisbursedPct = milestones
      .filter((m) => m.disbursed)
      .reduce((sum, m) => sum + m.percentage, 0);
    return Math.round((totalGrantAmount * totalDisbursedPct) / 100);
  };

  return (
    <div className="milestone-tracker-card glassmorphic-panel p-4 my-4 rounded-xl border border-cyan-500/30">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
            🏆 Grant Escrow Milestones — {candidateName}
          </h4>
          <p className="text-xs text-gray-300">
            Staged payout contract balance: <strong className="text-emerald-400">{calculateDisbursedAmount()} XLM</strong> / {totalGrantAmount} XLM disbursed
          </p>
        </div>
        <span className="badge-glass text-xs px-2 py-1 bg-cyan-900/50 text-cyan-200 border border-cyan-400/40 rounded-md">
          Soroban Escrow Protocol
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
          style={{
            width: `${milestones.reduce((acc, m) => acc + (m.disbursed ? m.percentage : 0), 0)}%`,
          }}
        ></div>
      </div>

      {/* Milestone List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {milestones.map((m) => {
          const milestoneXLM = Math.round((totalGrantAmount * m.percentage) / 100);
          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg border flex flex-col justify-between ${
                m.disbursed
                  ? "bg-emerald-950/30 border-emerald-500/50"
                  : m.completed
                  ? "bg-amber-950/30 border-amber-500/50"
                  : "bg-slate-900/40 border-slate-700/60"
              }`}
            >
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-cyan-200">Milestone #{m.id + 1} ({m.percentage}%)</span>
                  <span className="text-emerald-300">{milestoneXLM} XLM</span>
                </div>
                <p className="text-xs text-gray-300 mb-2">{m.description}</p>

                {m.proofUri && (
                  <div className="text-[11px] bg-slate-950/70 p-1.5 rounded mb-2 font-mono text-cyan-400 truncate">
                    🔗 IPFS:{" "}
                    <a
                      href={formatIPFSUrl(m.proofUri)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-cyan-200"
                    >
                      {m.proofUri.slice(0, 18)}...
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {m.disbursed ? (
                  <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded font-semibold w-full text-center">
                    ✅ Funds Disbursed
                  </span>
                ) : m.completed ? (
                  isAdmin ? (
                    <button
                      onClick={() => handleDisburse(m)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1 px-2 rounded transition"
                    >
                      💸 Admin: Approve & Release {milestoneXLM} XLM
                    </button>
                  ) : (
                    <span className="text-xs bg-amber-900/60 text-amber-300 px-2 py-1 rounded font-semibold w-full text-center">
                      ⏳ Pending Admin Disbursement
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleOpenProofModal(m)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1 px-2 rounded transition"
                  >
                    📤 Submit Milestone Proof
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-cyan-300">
              Submit Proof for Milestone #{selectedMilestone.id + 1}
            </h3>
            <p className="text-xs text-gray-300">
              Upload milestone verification (code link, transcript, or demo video). It will be pinned to IPFS and linked on-chain to trigger Soroban fund release.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Proof Title</label>
              <input
                type="text"
                value={proofTitle}
                onChange={(e) => setProofTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Evidence / Proof Details (IPFS Metadata)</label>
              <textarea
                rows={3}
                value={proofDetails}
                onChange={(e) => setProofDetails(e.target.value)}
                placeholder="e.g. GitHub release URL, academic transcript IPFS hash, or lab completion certificate"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              />
            </div>

            {statusMsg && (
              <p className="text-xs text-cyan-300 bg-cyan-950/60 p-2 rounded border border-cyan-500/30">
                {statusMsg}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setSelectedMilestone(null)}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !proofDetails}
                onClick={handlePinAndSubmitProof}
                className="px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded"
              >
                {isSubmitting ? "Processing..." : "Pin to IPFS & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
