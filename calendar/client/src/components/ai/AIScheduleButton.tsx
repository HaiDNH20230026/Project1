import React, { useState } from 'react';
import AIScheduleModal from './AIScheduleModal';
import 'styles/ai/ai-button.css';

interface AIScheduleButtonProps {
    taskId: number;
    taskTitle: string;
    taskType?: string;
    onScheduleComplete?: () => void;
    variant?: 'icon' | 'text' | 'full';
    disabled?: boolean;
}

const AIScheduleButton: React.FC<AIScheduleButtonProps> = ({
    taskId,
    taskTitle,
    taskType = 'DEADLINE',
    onScheduleComplete,
    variant = 'full',
    disabled = false
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Only show for DEADLINE tasks
    if (taskType !== 'DEADLINE') {
        return null;
    }

    const handleClick = () => {
        if (!disabled) {
            setIsModalOpen(true);
        }
    };

    const renderButton = () => {
        switch (variant) {
            case 'icon':
                return (
                    <button 
                        className="ai-schedule-btn ai-schedule-btn-icon"
                        onClick={handleClick}
                        disabled={disabled}
                        title="AI Đề xuất lịch"
                    >
                        <i className="material-icons">smart_toy</i>
                    </button>
                );
            case 'text':
                return (
                    <button 
                        className="ai-schedule-btn ai-schedule-btn-text"
                        onClick={handleClick}
                        disabled={disabled}
                    >
                        AI Đề xuất
                    </button>
                );
            case 'full':
            default:
                return (
                    <button 
                        className="ai-schedule-btn ai-schedule-btn-full"
                        onClick={handleClick}
                        disabled={disabled}
                    >
                        <i className="material-icons">smart_toy</i>
                        <span>AI Đề xuất lịch học</span>
                    </button>
                );
        }
    };

    return (
        <>
            {renderButton()}
            <AIScheduleModal
                taskId={taskId}
                taskTitle={taskTitle}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onScheduleComplete={onScheduleComplete}
            />
        </>
    );
};

export default AIScheduleButton;
