import React from 'react';
import { ScheduleProposal } from 'api/aiApi';
import 'styles/ai/ai-proposal.css';

interface ProposalCardProps {
    proposal: ScheduleProposal;
    onAccept?: (proposal: ScheduleProposal) => void;
    onReject?: (proposal: ScheduleProposal) => void;
    isAccepted?: boolean;
    isLoading?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
    proposal,
    onAccept,
    onReject,
    isAccepted = false,
    isLoading = false
}) => {
    const formatDateTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const day = dayNames[date.getDay()];
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        return { day, dateStr, timeStr };
    };

    const start = formatDateTime(proposal.proposedStartTime);
    const end = formatDateTime(proposal.proposedEndTime);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#34a853';
        if (score >= 60) return '#fbbc04';
        return '#ea4335';
    };

    return (
        <div className={`ai-proposal-card ${isAccepted ? 'accepted' : ''}`}>
            <div className="proposal-header">
                <div className="proposal-session">
                    <span className="session-badge">
                        Session {proposal.sessionNumber}/{proposal.totalSessions}
                    </span>
                    <span className="score-badge" style={{ backgroundColor: getScoreColor(proposal.score) }}>
                        {proposal.score}%
                    </span>
                </div>
            </div>

            {proposal.taskTitle && (
                <div className="proposal-title">
                    <span>📝 Task: {proposal.taskTitle}</span>
                </div>
            )}

            <div className="proposal-time">
                <div className="time-block">
                    <i className="material-icons">event</i>
                    <span className="day">{start.day}, {start.dateStr}</span>
                </div>
                <div className="time-block">
                    <i className="material-icons">schedule</i>
                    <span className="time">{start.timeStr} - {end.timeStr}</span>
                </div>
            </div>

            <div className="proposal-explanation">
                <p>{proposal.explanation}</p>
            </div>

            {!isAccepted && (
                <div className="proposal-actions">
                    <button 
                        className="btn-accept"
                        onClick={() => onAccept?.(proposal)}
                        disabled={isLoading}
                    >
                        <i className="material-icons">check</i>
                        Chấp nhận
                    </button>
                    <button 
                        className="btn-reject"
                        onClick={() => onReject?.(proposal)}
                        disabled={isLoading}
                    >
                        <i className="material-icons">close</i>
                        Bỏ qua
                    </button>
                </div>
            )}

            {isAccepted && (
                <div className="proposal-accepted">
                    <i className="material-icons">check_circle</i>
                    <span>Đã thêm vào lịch</span>
                </div>
            )}
        </div>
    );
};

export default ProposalCard;
