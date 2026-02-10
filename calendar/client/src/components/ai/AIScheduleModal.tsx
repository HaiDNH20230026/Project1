import React, { useState, useEffect } from 'react';
import { 
    ScheduleResult, 
    ScheduleProposal, 
    proposeScheduleApi, 
    acceptAllProposalsApi,
    acceptProposalApi 
} from 'api/aiApi';
import ProposalCard from './ProposalCard';
import 'styles/ai/ai-modal.css';

interface AIScheduleModalProps {
    taskId: number;
    taskTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onScheduleComplete?: () => void;
}

const AIScheduleModal: React.FC<AIScheduleModalProps> = ({
    taskId,
    taskTitle,
    isOpen,
    onClose,
    onScheduleComplete
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ScheduleResult | null>(null);
    const [acceptedProposals, setAcceptedProposals] = useState<Set<number>>(new Set());
    const [acceptingAll, setAcceptingAll] = useState(false);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchProposals();
        }
    }, [isOpen, taskId]);

    const fetchProposals = async () => {
        setLoading(true);
        setError(null);
        setAcceptedProposals(new Set());
        
        try {
            const response = await proposeScheduleApi(taskId);
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể lấy đề xuất từ AI');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptSingle = async (proposal: ScheduleProposal) => {
        try {
            await acceptProposalApi(proposal);
            setAcceptedProposals(prev => new Set(prev).add(proposal.sessionNumber));
            // Refresh events sau khi thêm
            onScheduleComplete?.();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể thêm vào lịch');
        }
    };

    const handleRejectSingle = (proposal: ScheduleProposal) => {
        if (result) {
            setResult({
                ...result,
                proposals: result.proposals.filter(p => p.sessionNumber !== proposal.sessionNumber)
            });
        }
    };

    const handleAcceptAll = async () => {
        if (!result || result.proposals.length === 0) return;
        
        setAcceptingAll(true);
        try {
            await acceptAllProposalsApi(result.proposals);
            // Mark all as accepted
            const allSessionNumbers = new Set(result.proposals.map(p => p.sessionNumber));
            setAcceptedProposals(allSessionNumbers);
            
            // Gọi refresh ngay lập tức
            onScheduleComplete?.();
            
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể thêm tất cả vào lịch');
        } finally {
            setAcceptingAll(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ai-modal-overlay" onClick={onClose}>
            <div className="ai-modal" onClick={e => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <div className="ai-modal-title">
                        <i className="material-icons">smart_toy</i>
                        <span>AI Đề Xuất Lịch Học</span>
                    </div>
                    <button className="ai-modal-close" onClick={onClose}>
                        <i className="material-icons">close</i>
                    </button>
                </div>

                <div className="ai-modal-task-info">
                    <h3>{taskTitle}</h3>
                    {result && (
                        <p className="ai-message">{result.message}</p>
                    )}
                </div>

                <div className="ai-modal-content">
                    {loading && (
                        <div className="ai-loading">
                            <div className="ai-spinner"></div>
                            <p>🤖 AI đang phân tích lịch của bạn...</p>
                        </div>
                    )}

                    {error && (
                        <div className="ai-error">
                            <i className="material-icons">error</i>
                            <p>{error}</p>
                            <button onClick={fetchProposals}>Thử lại</button>
                        </div>
                    )}

                    {!loading && !error && result && (
                        <>
                            {result.proposals.length === 0 ? (
                                <div className="ai-no-proposals">
                                    <i className="material-icons">event_busy</i>
                                    <p>Không tìm thấy khung giờ phù hợp</p>
                                </div>
                            ) : (
                                <div className="ai-proposals-list">
                                    {result.proposals.map((proposal, index) => (
                                        <ProposalCard
                                            key={`${proposal.sessionNumber}-${index}`}
                                            proposal={proposal}
                                            onAccept={handleAcceptSingle}
                                            onReject={handleRejectSingle}
                                            isAccepted={acceptedProposals.has(proposal.sessionNumber)}
                                            isLoading={acceptingAll}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!loading && result && result.proposals.length > 0 && (
                    <div className="ai-modal-footer">
                        <button 
                            className="btn-accept-all"
                            onClick={handleAcceptAll}
                            disabled={acceptingAll || acceptedProposals.size === result.proposals.length}
                        >
                            {acceptingAll ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Đang thêm...
                                </>
                            ) : (
                                <>
                                    <i className="material-icons">done_all</i>
                                    Chấp nhận tất cả ({result.proposals.length - acceptedProposals.size})
                                </>
                            )}
                        </button>
                        <button className="btn-regenerate" onClick={fetchProposals}>
                            <i className="material-icons">refresh</i>
                            Tạo đề xuất mới
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIScheduleModal;
