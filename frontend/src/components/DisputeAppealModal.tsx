import React, { useState } from "react";
import { submitDisputeAppeal, voteOnAppeal } from "../services/stellarService";
import { pinMetadataToIPFS, formatIPFSUrl } from "../services/ipfsService";

export interface DisputeAppealItem {
  id: number;
  candidateId: number;
  appellant: string;
  reason: string;
  appealUri: string;
  status: string; // "PENDING", "APPROVED", "REJECTED"
  votesFor: number;
  votesAgainst: number;
}

interface DisputeAppealModalProps {
  candidates: { id: number; name: string; approved: boolean }[];
  appeals: DisputeAppealItem[];
  contractId: string;
  userAddress: string;
  onAppealUpdated: () => void;
  onLogEvent?: (msg: string) => void;
}

export const DisputeAppealModal: React.FC<DisputeAppealModalProps> = ({
  candidates,
  appeals,
  contractId,
  userAddress,
  onAppealUpdated,
  onLogEvent,
}) => {
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(0);
  const [appealReason, setAppealReason] = useState("");
  const [evidenceDetails, setEvidenceDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleFileAppeal = async () => {
    setIsSubmitting(true);
    setStatusMsg("Pinning dispute metadata to IPFS...");
    try {
      // 1. IPFS Pinning
      const ipfsResult = await pinMetadataToIPFS(`Dispute Appeal - Candidate #${selectedCandidateId}`, evidenceDetails);
      setStatusMsg("IPFS metadata pinned. Submitting appeal to Soroban DAO contract...");

      // 2. Submit on-chain appeal
      const res = await submitDisputeAppeal(
        contractId,
        userAddress || "GBXSIMULATEDUSERADDRESSFORTESTING123456",
        selectedCandidateId,
        appealReason,
        `ipfs://${ipfsResult.cid}`
      );

      setStatusMsg(`Appeal filed on-chain! Tx: ${res.hash.slice(0, 10)}...`);
      onLogEvent?.(`Filed Dispute Appeal for Candidate #${selectedCandidateId} on Soroban DAO.`);
      setTimeout(() => {
        setShowFileModal(false);
        setIsSubmitting(false);
        setAppealReason("");
        setEvidenceDetails("");
        onAppealUpdated();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Error: ${err.message || "Failed to file dispute appeal"}`);
      setIsSubmitting(false);
    }
  };

  const handleVoteAppeal = async (appealId: number, approve: boolean) => {
    try {
      onLogEvent?.(`Casting DAO Vote on Appeal #${appealId} (${approve ? "APPROVE" : "REJECT"})...`);
      const res = await voteOnAppeal(
        contractId,
        userAddress || "GBXSIMULATEDUSERADDRESSFORTESTING123456",
        appealId,
        approve
      );
      onLogEvent?.(`Appeal #${appealId} vote recorded on-chain (Tx: ${res.hash.slice(0, 10)})`);
      onAppealUpdated();
    } catch (err: any) {
      alert(`Vote Error: ${err.message}`);
    }
  };

  return (
    <div className="dispute-dao-container glassmorphic-panel p-5 my-6 rounded-xl border border-purple-500/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
            ⚖️ Decentralized Governance & Dispute Appeal DAO
          </h3>
          <p className="text-xs text-gray-300">
            Community dispute resolution for rejected scholarship applicants. 3 approval votes automatically reinstate candidate eligibility.
          </p>
        </div>
        <button
          onClick={() => setShowFileModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg transition"
        >
          ➕ Submit On-Chain Dispute Appeal
        </button>
      </div>

      {/* Appeals Grid */}
      {appeals.length === 0 ? (
        <div className="bg-slate-900/40 p-4 rounded-lg text-center text-xs text-gray-400 border border-slate-800">
          No active dispute appeals filed. All candidate applications are currently processed normally.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appeals.map((app) => {
            const cand = candidates.find((c) => c.id === app.candidateId);
            return (
              <div
                key={app.id}
                className="bg-slate-900/70 border border-purple-500/30 p-4 rounded-xl space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-purple-200">
                    Appeal #{app.id + 1} — {cand ? cand.name : `Candidate #${app.candidateId}`}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      app.status === "APPROVED"
                        ? "bg-emerald-900/70 text-emerald-300 border border-emerald-500/40"
                        : app.status === "REJECTED"
                        ? "bg-red-900/70 text-red-300 border border-red-500/40"
                        : "bg-amber-900/70 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-xs text-gray-300">
                  <strong>Reason:</strong> {app.reason}
                </p>

                {app.appealUri && (
                  <p className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 p-1.5 rounded truncate">
                    🔗 Proof:{" "}
                    <a
                      href={formatIPFSUrl(app.appealUri)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-cyan-100"
                    >
                      {app.appealUri}
                    </a>
                  </p>
                )}

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                  <span className="text-gray-400">
                    DAO Votes: <strong className="text-emerald-400">👍 {app.votesFor}</strong> / <strong className="text-red-400">👎 {app.votesAgainst}</strong>
                  </span>

                  {app.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoteAppeal(app.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded font-bold"
                      >
                        👍 Vote Approve
                      </button>
                      <button
                        onClick={() => handleVoteAppeal(app.id, false)}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs px-2.5 py-1 rounded font-bold"
                      >
                        👎 Vote Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Appeal Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-purple-500/40 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-purple-300">
              Submit Dispute Appeal
            </h3>
            <p className="text-xs text-gray-300">
              File a formal governance appeal on Stellar Testnet for candidate reinstatement.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Select Candidate</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id}: {c.name} ({c.approved ? "Approved" : "Pending/Rejected"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Appeal Reason</label>
              <input
                type="text"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="e.g. Unfair rejection due to missing transcript verification"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Supporting IPFS Proof Evidence</label>
              <textarea
                rows={3}
                value={evidenceDetails}
                onChange={(e) => setEvidenceDetails(e.target.value)}
                placeholder="Paste transcript details, ID proof, or recommendation letter metadata"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              />
            </div>

            {statusMsg && (
              <p className="text-xs text-purple-300 bg-purple-950/60 p-2 rounded border border-purple-500/30">
                {statusMsg}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowFileModal(false)}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !appealReason || !evidenceDetails}
                onClick={handleFileAppeal}
                className="px-4 py-1.5 text-xs bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded"
              >
                {isSubmitting ? "Submitting..." : "Submit Appeal to DAO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
