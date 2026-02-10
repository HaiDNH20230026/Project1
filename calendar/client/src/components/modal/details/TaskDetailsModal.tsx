import React, { useEffect, useRef, useState } from "react";
import { AIScheduleButton } from "components/ai";
import { updateTaskApi, deleteTaskApi, toggleTaskCompletionApi } from "api/taskApi";
import { syncCompletedSessionsApi } from "api/aiApi";
import 'styles/modal/details-modal.css';

interface DetailsData {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    isCompleted?: boolean;
    taskType?: string;
    priority?: string;
    scale?: string;
    scheduledSessions?: number;
    completedSessions?: number;
    requiredSessions?: number;
    maxSessions?: number;
}

interface Props {
    data: DetailsData;
    onClose: () => void;
    onRefresh?: () => void;
}

function TaskDetailsModal({ data, onClose, onRefresh }: Props) {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(data.title);
    const [isCompleted, setIsCompleted] = useState(data.isCompleted || false);
    const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(data.completedSessions || 0);
    const [hasSyncedSessions, setHasSyncedSessions] = useState(false);
    const [isEditingSessions, setIsEditingSessions] = useState(false);
    const [editedMaxSessions, setEditedMaxSessions] = useState(data.requiredSessions || 1);
    const sessionsInputRef = useRef<HTMLInputElement>(null);

    // Sync completed sessions khi mở modal (chỉ một lần)
    useEffect(() => {
        if (!hasSyncedSessions && data.taskType === 'DEADLINE' && data.scheduledSessions && data.scheduledSessions > 0) {
            setHasSyncedSessions(true);
            syncCompletedSessionsApi(data.id)
                .then(() => {
                    onRefresh?.();
                })
                .catch(err => {
                    console.error("Failed to sync completed sessions", err);
                });
        }
    }, [data.id, hasSyncedSessions]);

    // Cập nhật state khi data thay đổi
    useEffect(() => {
        setIsCompleted(data.isCompleted || false);
        setCompletedSessions(data.completedSessions || 0);
        setEditedMaxSessions(data.requiredSessions || 1);
    }, [data.isCompleted, data.completedSessions, data.requiredSessions]);

    // Focus sessions input khi edit
    useEffect(() => {
        if (isEditingSessions && sessionsInputRef.current) {
            sessionsInputRef.current.focus();
            sessionsInputRef.current.select();
        }
    }, [isEditingSessions]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle !== data.title) {
            updateTaskApi(data.id, { title: editedTitle.trim() })
                .then(() => {
                    onRefresh?.();
                    setIsEditingTitle(false);
                })
                .catch((err) => {
                    console.error("Failed to update title", err);
                    setEditedTitle(data.title);
                    setIsEditingTitle(false);
                });
        } else {
            setEditedTitle(data.title);
            setIsEditingTitle(false);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setEditedTitle(data.title);
            setIsEditingTitle(false);
        }
    };

    // ========== SỬa số sessions ==========
    const handleSessionsSave = () => {
        const newMax = Math.max(1, Math.floor(editedMaxSessions));
        const minAllowed = Math.max(data.scheduledSessions || 0, data.completedSessions || 0, 1);
        const finalMax = Math.max(newMax, minAllowed);
        
        if (finalMax !== data.requiredSessions) {
            updateTaskApi(data.id, { maxSessions: finalMax } as any)
                .then(() => {
                    onRefresh?.();
                    setIsEditingSessions(false);
                })
                .catch((err) => {
                    console.error("Failed to update maxSessions", err);
                    setEditedMaxSessions(data.requiredSessions || 1);
                    setIsEditingSessions(false);
                });
        } else {
            setIsEditingSessions(false);
        }
    };

    const handleSessionsKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSessionsSave();
        } else if (e.key === 'Escape') {
            setEditedMaxSessions(data.requiredSessions || 1);
            setIsEditingSessions(false);
        }
    };

    const handleTaskDelete = (taskId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa task này? Tất cả các events được tạo bởi task này cũng sẽ bị xóa.')) {
            deleteTaskApi(taskId)
                .then(() => {
                    onRefresh?.();
                    onClose();
                })
                .catch((err) => {
                    console.error("Failed to delete task", err);
                    alert("Không thể xóa task. Vui lòng thử lại.");
                });
        }
    };

    // Toggle task completion (tick/untick checkbox)
    const handleToggleCompletion = () => {
        setIsTogglingCompletion(true);
        const newValue = !isCompleted;
        
        toggleTaskCompletionApi(data.id, newValue)
            .then(() => {
                setIsCompleted(newValue);
                onRefresh?.();
            })
            .catch((err) => {
                console.error("Failed to toggle completion", err);
                alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
            })
            .finally(() => {
                setIsTogglingCompletion(false);
            });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Không có deadline';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'HIGH': return '#ea4335';
            case 'MEDIUM': return '#fbbc04';
            case 'LOW': return '#34a853';
            default: return '#5f6368';
        }
    };

    const getProgressPercent = () => {
        if (!data.requiredSessions || data.requiredSessions === 0) return 0;
        return Math.round(((completedSessions || 0) / data.requiredSessions) * 100);
    };

    // Check if task is DEADLINE type and not completed (can use AI scheduling)
    const canUseAI = data.taskType === 'DEADLINE' && !isCompleted;

    return (
        <div className="task-details-modal-overlay">
            <div className="task-details-modal" ref={modalRef}>
                <div className="task-details-header">
                    <div className="task-details-title">
                        <button 
                            className={`task-checkbox-btn ${isCompleted ? 'completed' : ''}`}
                            onClick={handleToggleCompletion}
                            disabled={isTogglingCompletion}
                            title={isCompleted ? 'Click để bỏ đánh dấu hoàn thành' : 'Click để đánh dấu hoàn thành'}
                        >
                            <i className="material-icons">
                                {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                            </i>
                        </button>
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={handleTitleKeyDown}
                                className="task-details-title-input"
                            />
                        ) : (
                            <h2 
                                onClick={() => setIsEditingTitle(true)}
                                className={`task-details-title-editable ${isCompleted ? 'completed' : ''}`}
                                title="Click để chỉnh sửa"
                            >
                                {data.title}
                            </h2>
                        )}
                    </div>
                    <button className="task-details-close" onClick={onClose}>
                        <i className="material-icons">close</i>
                    </button>
                    <button 
                        className="task-details-delete" 
                        onClick={() => handleTaskDelete(data.id)}
                        title="Xóa task và tất cả events liên quan"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z"></path>
                            <path d="M9 8h2v9H9zm4 0h2v9h-2z"></path>
                        </svg>
                    </button>
                </div>

                <div className="task-details-content">
                    {data.description && (
                        <div className="task-details-row">
                            <i className="material-icons">notes</i>
                            <p>{data.description}</p>
                        </div>
                    )}

                    <div className="task-details-row">
                        <i className="material-icons">event</i>
                        <span>Deadline: {formatDate(data.dueDate)}</span>
                    </div>

                    {data.priority && (
                        <div className="task-details-row">
                            <i className="material-icons" style={{ color: getPriorityColor(data.priority) }}>
                                flag
                            </i>
                            <span>Ưu tiên: {data.priority}</span>
                        </div>
                    )}

                    {data.taskType && (
                        <div className="task-details-row">
                            <i className="material-icons">label</i>
                            <span>Loại: {data.taskType}</span>
                        </div>
                    )}

                    {data.requiredSessions && data.requiredSessions > 0 && (
                        <div className="task-details-progress">
                            <div className="progress-label">
                                <span>Tiến độ học tập</span>
                                <span 
                                    className="sessions-edit-trigger"
                                    onClick={() => setIsEditingSessions(true)}
                                    title="Click để chỉnh sửa số sessions"
                                >
                                    {isEditingSessions ? (
                                        <input
                                            ref={sessionsInputRef}
                                            type="number"
                                            min={Math.max(data.scheduledSessions || 0, 1)}
                                            value={editedMaxSessions}
                                            onChange={(e) => setEditedMaxSessions(Number(e.target.value))}
                                            onBlur={handleSessionsSave}
                                            onKeyDown={handleSessionsKeyDown}
                                            className="sessions-edit-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="sessions-total-editable">
                                            {data.requiredSessions} sessions
                                            <i className="material-icons" style={{ fontSize: '14px', marginLeft: '4px' }}>edit</i>
                                        </span>
                                    )}
                                </span>
                            </div>
                            
                            {/* Scheduled Sessions */}
                            <div className="session-info">
                                <i className="material-icons" style={{ color: '#4285f4', fontSize: '18px' }}>schedule</i>
                                <span>Đã lên lịch: {data.scheduledSessions || 0}/{data.requiredSessions} sessions</span>
                            </div>
                            
                            {/* Completed Sessions */}
                            <div className="session-info">
                                <i className="material-icons" style={{ color: '#34a853', fontSize: '18px' }}>check_circle</i>
                                <span>Đã hoàn thành: {completedSessions}/{data.requiredSessions} sessions</span>
                            </div>

                            <div className="progress-bar" style={{ marginTop: '8px' }}>
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${getProgressPercent()}%` }}
                                />
                            </div>
                            
                            {/* Note về việc task chỉ hoàn thành khi tick checkbox */}
                            <div className="session-note">
                                <i className="material-icons" style={{ fontSize: '14px' }}>info</i>
                                <span>Tick checkbox để đánh dấu hoàn thành task. Bạn có thể tạo thêm sessions nếu cần.</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Hiển thị trạng thái hoàn thành */}
                    {isCompleted && (
                        <div className="task-completed-banner">
                            <i className="material-icons">celebration</i>
                            <span>Task đã hoàn thành!</span>
                        </div>
                    )}
                </div>

                {canUseAI && (
                    <div className="task-details-actions">
                        <AIScheduleButton
                            taskId={data.id}
                            taskTitle={data.title}
                            taskType={data.taskType}
                            onScheduleComplete={() => {
                                onRefresh?.();
                                onClose();
                            }}
                            variant="full"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskDetailsModal;