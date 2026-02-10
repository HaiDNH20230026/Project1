import React, { useCallback, useEffect, useRef, useState } from "react";
import 'styles/modal/event-modal.css';
import 'styles/modal/details-modal.css';
import { deleteEventApi, updateEventApi } from "api/eventApi";

interface DetailsData {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
    color: string;
    eventType?: string;
    // add properties as needed
}

interface Props {
    data: DetailsData;
    onClose: () => void;
    refreshEvents: () => void; // 💡 newly added
}

type ColorGroup = Array<Record<string, string>>;

function EventDetailsModal({ data, onClose, refreshEvents }: Props) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editedTitle, setEditedTitle] = useState(data.title);
    const [editedStartTime, setEditedStartTime] = useState(data.startTime);
    const [editedEndTime, setEditedEndTime] = useState(data.endTime);
    const [timeError, setTimeError] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    console.log(data.color)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    
    function formatEventTime(startTime: string, endTime: string): string {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
    
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1;
        const date = startDate.getDate();
        const day = days[startDate.getDay()];
    
        const pad = (n: number) => n.toString().padStart(2, '0');
        const startHour = pad(startDate.getHours());
        const startMinute = pad(startDate.getMinutes());
        const endHour = pad(endDate.getHours());
        const endMinute = pad(endDate.getMinutes());
    
        return `Year ${year} Month ${month} Day ${date} (${day}) ${startHour}:${startMinute}~${endHour}:${endMinute}`;
    }


    const modalRef = useRef<HTMLDivElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    function handleEventRemove(event_id : number) {

        deleteEventApi(event_id)
            .then((res) => {
                        console.log("event saved successfully", res.data);
                        refreshEvents();
                    })
                    .catch((err) => {
                        console.error("event save failed", err);
                    });
                    
        onClose()
    }

    function handleTitleSave() {
        if (editedTitle.trim() && editedTitle !== data.title) {
            updateEventApi(data.id, {
                title: editedTitle.trim(),
                startTime: data.startTime,
                endTime: data.endTime,
                color: data.color
            })
            .then(() => {
                refreshEvents();
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
    }

    function handleTitleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setEditedTitle(data.title);
            setIsEditingTitle(false);
        }
    }

    // Parse datetime-local format from ISO string
    function toDatetimeLocalFormat(isoStr: string): string {
        const date = new Date(isoStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Convert datetime-local format to API format (ISO format without seconds)
    function toApiFormat(datetimeLocal: string): string {
        // datetimeLocal is in format: "2026-01-10T14:30"
        // API expects: "2026-01-10T14:30" or "2026-01-10T14:30:00"
        // Add seconds if not present
        if (datetimeLocal.length === 16) {
            return datetimeLocal + ":00";
        }
        return datetimeLocal;
    }

    function handleTimeSave() {
        const start = new Date(editedStartTime);
        const end = new Date(editedEndTime);

        if (start >= end) {
            setTimeError("Thời gian kết thúc phải sau thời gian bắt đầu");
            setTimeout(() => setTimeError(null), 3000);
            return;
        }

        const apiStartTime = toApiFormat(editedStartTime);
        const apiEndTime = toApiFormat(editedEndTime);

        console.log("Updating event time:", { 
            id: data.id, 
            startTime: apiStartTime, 
            endTime: apiEndTime, 
            color: data.color 
        });

        updateEventApi(data.id, {
            title: data.title,
            startTime: apiStartTime,
            endTime: apiEndTime,
            color: data.color
        })
        .then(() => {
            refreshEvents();
            setIsEditingTime(false);
            setTimeError(null);
        })
        .catch((err) => {
            console.error("Failed to update time", err);
            console.error("Error response:", err.response?.data);
            setTimeError("Không thể cập nhật thời gian. Vui lòng thử lại.");
            setTimeout(() => setTimeError(null), 5000);
        });
    }

    function handleTimeCancel() {
        setEditedStartTime(data.startTime);
        setEditedEndTime(data.endTime);
        setIsEditingTime(false);
        setTimeError(null);
    }

    const colors: ColorGroup[] = [
        [{ "TOMATO": "rgb(213, 0, 0)" }, { "LIGHT_PINK": "rgb(230, 124, 115)" }],
        [{ "TANGERINE": "rgb(244, 81, 30)" }, { "BANANA": "rgb(246, 191, 38)" }],
        [{ "SAGE": "rgb(51, 182, 121)" }, { "BASIL": "rgb(11, 128, 67)" }],
        [{ "PEACOCK": "rgb(3, 155, 229)" }, { "BLUEBERRY": "rgb(63, 81, 181)" }],
        [{ "LAVENDER": "rgb(121, 134, 203)" }, { "GRAPE": "rgb(142, 36, 170)" }],
      ];

    // AI Generated event color
    const AI_EVENT_COLOR = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

    const getRgbByColorName = (name: string, eventType?: string): string => {
        // AI Generated events have special gradient color
        if (eventType === 'AI_GENERATED') {
            return AI_EVENT_COLOR;
        }
        
        // Handle hex codes directly
        if (name && name.startsWith('#')) {
            return name;
        }
        
        // Handle rgb() format
        if (name && name.startsWith('rgb')) {
            return name;
        }
        
        // Look up by color name
        for (const group of colors) {
            for (const colorObj of group) {
                if (colorObj[name]) {
                    return colorObj[name];
                }
            }
        }
        return "rgb(3, 155, 229)"; // default PEACOCK color
    };

    return (
        <div className="details-modal-overlay">
            <div className="details-modal" ref={modalRef}>
                <div className="details-modal-header">
                    <button className="details-modal-header-button" onClick={() => handleEventRemove(data.id)} >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z"></path>
                            <path d="M9 8h2v9H9zm4 0h2v9h-2z"></path>
                        </svg>
                    </button>
                    <button className="details-modal-header-button" onClick={onClose}>
                        <i className="material-icons">close</i>
                    </button>
                </div>

                <div className="details-modal-content" >
                    <div className="details-modal-container" style={{width:"100%", minHeight:"61px"}}>
                        <div className="details-modal-icon-container">
                            <div className="details-modal-color" style={{ background: getRgbByColorName(data.color, data.eventType) }} />
                        </div>
                        
                        <div className="details-modal-detail-container">
                            <div className="details-modal-title">
                                {isEditingTitle ? (
                                    <input
                                        ref={titleInputRef}
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyDown={handleTitleKeyDown}
                                        className="details-modal-title-input"
                                    />
                                ) : (
                                    <span 
                                        onClick={() => setIsEditingTitle(true)}
                                        className="details-modal-title-editable"
                                        title="Click để chỉnh sửa"
                                    >
                                        {data.title}
                                    </span>
                                )}
                            </div>
                            <div className="details-modal-schedule">
                                {isEditingTime ? (
                                    <div className="details-modal-time-edit">
                                        <div className="time-edit-row">
                                            <label>Bắt đầu:</label>
                                            <input
                                                type="datetime-local"
                                                value={toDatetimeLocalFormat(editedStartTime)}
                                                onChange={(e) => setEditedStartTime(e.target.value)}
                                                className="details-modal-time-input"
                                            />
                                        </div>
                                        <div className="time-edit-row">
                                            <label>Kết thúc:</label>
                                            <input
                                                type="datetime-local"
                                                value={toDatetimeLocalFormat(editedEndTime)}
                                                onChange={(e) => setEditedEndTime(e.target.value)}
                                                className="details-modal-time-input"
                                            />
                                        </div>
                                        {timeError && (
                                            <div className="time-edit-error">{timeError}</div>
                                        )}
                                        <div className="time-edit-actions">
                                            <button 
                                                className="time-edit-save-btn"
                                                onClick={handleTimeSave}
                                            >
                                                Lưu
                                            </button>
                                            <button 
                                                className="time-edit-cancel-btn"
                                                onClick={handleTimeCancel}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <span 
                                        onClick={() => setIsEditingTime(true)}
                                        className="details-modal-schedule-editable"
                                        title="Click để chỉnh sửa thời gian"
                                    >
                                        {formatEventTime(data.startTime, data.endTime)}
                                        <i className="material-icons" style={{ fontSize: '14px', marginLeft: '4px', verticalAlign: 'middle' }}>edit</i>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {
                        data.location &&
                        <div className="details-modal-container" style={{width:"100%", minHeight:"50px"}}>
                            <div className="details-modal-icon-container">
                                <svg focusable="false" width="24" height="24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
                                    <circle cx="12" cy="9" r="2.5" />
                                </svg>
                            </div>
                            <div className="details-modal-detail-container">
                                <div className="details-modal-location">
                                    <span>
                                        {data.location}
                                    </span>
                                </div>
                            </div>
                        </div>
                    }
                    {
                        data.description &&
                        <div className="details-modal-container" style={{width:"100%", minHeight:"50px"}}>
                            <div className="details-modal-icon-container">
                                <i className="material-icons">notes</i>
                            </div>
                            <div className="details-modal-detail-container">
                                <div className="details-modal-description">
                                    <span>
                                        {data.description}
                                    </span>
                                </div>
                            </div>
                        </div>
                    }
                </div>
                <div className="details-modal-footer"/>
            </div>
        </div>
    );
}

export default EventDetailsModal