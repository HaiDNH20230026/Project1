import React, { useEffect, useRef, useState } from "react";
import 'styles/modal/event-modal.css';
import 'styles/modal/task-modal.css';
import EventModalCalendar from "components/modal/event/EventModalCalendar";
import EventModalTimeDropDown from "components/modal/event/EventModalTimeDropDown";
import EventModalDescriptionInput from "components/modal/event/EventModalDescriptionInput";
import { createTaskApi } from "api/taskApi";

interface TaskModalProps {
    modalYear: number;
    modalMonth: number;
    modalDay: number;
    activeModal: "event" | "task" | null;
    setActiveModal: (type: "event" | "task" | null) => void;
    refreshTasks?: () => void;
}

function TaskModal({modalYear, modalMonth, modalDay, activeModal, setActiveModal, refreshTasks }: TaskModalProps) {

        const [isScheduleOpen, setSchedule] = useState(false);
        const [isDescriptionOpen, setDescriptionState] = useState(false);
        const [isDateScheduleOpen, setDateSchedule] = useState(false);
        const [isStartTimeOpen, setStartTimeDropDown] = useState(false);
        const [title, setTitle] = useState("");
        const [isSaving, setIsSaving] = useState(false);
        const [modalSize, setModalSize] = useState<'compact' | 'large'>('compact');

        const toggleModalSize = () => {
            setModalSize(prev => prev === 'compact' ? 'large' : 'compact');
        };
    
        const handleDateScheduleClick = () => {
            setDateSchedule((prev) => !prev);
            setStartTimeDropDown(false)
        };
    
        const handleStartTimeClick = () => {
            setStartTimeDropDown((prev) => !prev);
            setDateSchedule(false)
        };
    
    
        const date = new Date(`${modalYear}-${modalMonth}-${modalDay}`);
    
        const dayOfTheWeek = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
        ][date.getDay()];
    
        const [currentTimeString, setCurrentTimeString] = useState<string>(() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            return `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
        });
        
        useEffect(() => {
            const interval = setInterval(() => {
              const now = new Date();
              const hours = now.getHours();
              const minutes = now.getMinutes();
              setCurrentTimeString(
                `${hours}:${minutes < 10 ? "0" + minutes : minutes}`
              );
            }, 60000); // update current time every 1 minute
        
            return () => clearInterval(interval);
        }, []);
    
        const getHourIndex = (time: string) => {
            let [hour, minute] = time.split(":").map(Number);
            
            // round to nearest 15-minute interval
            minute = Math.ceil(minute / 15) * 15;
            
            // if minutes become 60, increase hours
            if (minute === 60) {
                hour += 1;
                minute = 0;
            }
        
            // add leading 0 for single digit numbers (e.g. 9:5 -> 09:05)
            const formattedHour = hour.toString().padStart(2, "0");
            const formattedMinute = minute.toString().padStart(2, "0");
        
            return `${formattedHour}:${formattedMinute}`;
        };
    
        const [startDate, setStartDate] = useState<string>(
            `Month ${date.getMonth() + 1}, Day ${date.getDate()} (${dayOfTheWeek})`
        );
    
        const [startTime, setStartTime] = useState(
            parseInt(currentTimeString.split(":")[0], 10) < 12 
                ? `AM ${getHourIndex(currentTimeString)}` 
                : `PM ${getHourIndex(currentTimeString)}`
        );

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setActiveModal(null);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, [setActiveModal]);

    const [description, setDescription] = useState("");
    const [selectedDate, setSelectedDate] = 
        useState(date.getFullYear()+"-"+(date.getMonth() + 1)+"-"+date.getDate());
    
    // Task properties
    const [taskType, setTaskType] = useState<"SIMPLE" | "DEADLINE">("DEADLINE");
    const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
    const [scale, setScale] = useState<"QUICK" | "REGULAR" | "PROJECT">("REGULAR");

    // Convert time string like "PM 23:45" to 24h format
    const parseTime = (timeStr: string): string => {
        const parts = timeStr.split(" ");
        if (parts.length === 2) {
            return parts[1]; // Already in HH:mm format
        }
        return timeStr;
    };

    // Build ISO datetime string
    const buildDateTime = (): string => {
        const time = parseTime(startTime);
        // selectedDate is like "2026-1-10"
        const [year, month, day] = selectedDate.split("-");
        const formattedMonth = month.padStart(2, "0");
        const formattedDay = day.padStart(2, "0");
        return `${year}-${formattedMonth}-${formattedDay}T${time}:00`;
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Vui lòng nhập tiêu đề task");
            return;
        }

        setIsSaving(true);
        try {
            const dueDate = buildDateTime();
            const taskData = {
                title: title.trim(),
                description: description || undefined,
                dueDate: dueDate,
                isCompleted: false,
                taskType: taskType,
                priority: priority,
                scale: scale
            };

            console.log("Creating task with data:", JSON.stringify(taskData, null, 2));
            const response = await createTaskApi(taskData);
            console.log("Task created successfully:", response);
            
            refreshTasks?.();
            setActiveModal(null);
        } catch (error: any) {
            console.error("Failed to create task:", error);
            console.error("Error response:", error?.response?.data);
            console.error("Error status:", error?.response?.status);
            alert("Không thể tạo task. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className={`task-modal
                    ${modalSize === 'compact' ? 'task-modal-compact' : 'task-modal-large'}
                    ${isScheduleOpen ? "task-modal-expanded" : ""}`} 
                    ref={modalRef}>
                <div className="event-modal-header">
                    <button className="event-modal-size-toggle" onClick={toggleModalSize} title={modalSize === 'compact' ? 'Expand' : 'Compact'}>
                        {modalSize === 'compact' ? '⛶' : '◱'}
                    </button>
                    <button className="event-modal-close" onClick={() => setActiveModal(null)}>
                        <i className="material-icons">close</i>
                    </button>
                </div>
                <div className="event-modal-content" >
                    <div className="event-modal-container" style={{width:"100%", height:"69px"}}>
                        <div style={{width:"15%", height:"100%"}}/>
                        <div className="event-modal-title-container">
                        <div className="title-container">
                            <input 
                                className="event-modal-form-title" 
                                type="text" 
                                placeholder="Add title" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        </div>
                    </div>

                    <div className="event-modal-container" style={{width:"100%", height:"36px", marginBottom:"10px"}}>
                        <div style={{width:"15%", height:"100%"}}/>
                        <div className="event-modal-type-container">
                            <button className={`event-modal-form-type-button 
                                ${activeModal === "event" ? "active-modal" : ''} `}
                                onClick={() => setActiveModal("event")}>Event</button>
                            <button className={`event-modal-form-type-button 
                                ${activeModal === "task" ? "active-modal" : ''} `}
                                onClick={() => setActiveModal("task")}>Task</button>
                        </div>
                    </div>

                    <div className="event-modal-container" style={{width:"100%", height:"52px"}}>
                        <div className="event-modal-icon">
                            <i className="material-icons">access_time</i>
                        </div>
                        {isScheduleOpen ? (
                            <div className="event-modal-schedule-container-open">
                                <div onClick={handleDateScheduleClick}>
                                    <input 
                                        type="text" 
                                        className="event-modal-form-start-date"
                                        value={startDate} />
                                </div>
                                {
                                    isDateScheduleOpen 
                                        ? <EventModalCalendar 
                                            setDateSchedule = {setDateSchedule}
                                            setStartDate = {setStartDate}
                                            setSelected={setSelectedDate}/>
                                        : ""
                                }
                                <div className="time-dropdown-wrapper">
                                    <div onClick={handleStartTimeClick}>
                                        <input 
                                            type="text" 
                                            className="event-modal-form-start-time"
                                            value={startTime} />
                                    </div>
                                    <EventModalTimeDropDown
                                        setTimeDropDown = {setStartTimeDropDown}
                                        setTime = {setStartTime}
                                        isOpen = {isStartTimeOpen}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="event-modal-schedule-container-close">
                                <button className="event-modal-form-schedule-button" onClick={() => setSchedule(true)}>
                                    <div style={{width: "100%", height:"50%", display: "flex", alignItems: "center"}}>
                                        <span style={{fontSize: "14px"}}>{startDate}</span>
                                        <div style={{paddingLeft:"10px", height:"100%", display: "flex", alignItems: "center", fontSize: "14px"}}>
                                            <span>
                                                {startTime}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{width: "100%", height:"50%", display: "flex", alignItems: "center", fontSize: "12px"}}>
                                        <span>
                                            No repeat
                                        </span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    {/* { isScheduleOpen && (
                        <div className="event-modal-container" style={{width:"100%", height:"15%"}}>
                            <div>
                                
                            </div>
                            <div>

                            </div>
                        </div>
                    )} */}
                    <div className="event-modal-container" style={{ width: "100%", paddingBottom:"5px", minHeight:"80px", paddingTop:"10px" }}>
                        <div className="event-modal-icon" style={{  maxHeight:"60px" }}>
                            <i className="material-icons">notes</i>
                        </div>
                        <EventModalDescriptionInput setDescription={setDescription}/>
                    </div>

                    {/* Task Type Selection */}
                    <div className="event-modal-container" style={{ width: "100%", paddingBottom:"10px", paddingTop:"10px" }}>
                        <div className="event-modal-icon">
                            <i className="material-icons">category</i>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button 
                                className={`task-type-btn ${taskType === "SIMPLE" ? "active" : ""}`}
                                onClick={() => setTaskType("SIMPLE")}
                                type="button"
                            >
                                Simple
                            </button>
                            <button 
                                className={`task-type-btn ${taskType === "DEADLINE" ? "active" : ""}`}
                                onClick={() => setTaskType("DEADLINE")}
                                type="button"
                            >
                                Deadline
                            </button>
                        </div>
                    </div>

                    {/* Priority Selection */}
                    <div className="event-modal-container" style={{ width: "100%", paddingBottom:"10px" }}>
                        <div className="event-modal-icon">
                            <i className="material-icons">flag</i>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button 
                                className={`task-priority-btn priority-low ${priority === "LOW" ? "active" : ""}`}
                                onClick={() => setPriority("LOW")}
                                type="button"
                            >
                                Low
                            </button>
                            <button 
                                className={`task-priority-btn priority-medium ${priority === "MEDIUM" ? "active" : ""}`}
                                onClick={() => setPriority("MEDIUM")}
                                type="button"
                            >
                                Medium
                            </button>
                            <button 
                                className={`task-priority-btn priority-high ${priority === "HIGH" ? "active" : ""}`}
                                onClick={() => setPriority("HIGH")}
                                type="button"
                            >
                                High
                            </button>
                        </div>
                    </div>

                    {/* Scale Selection */}
                    <div className="event-modal-container" style={{ width: "100%", paddingBottom:"10px" }}>
                        <div className="event-modal-icon">
                            <i className="material-icons">timelapse</i>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button 
                                className={`task-scale-btn ${scale === "QUICK" ? "active" : ""}`}
                                onClick={() => setScale("QUICK")}
                                type="button"
                            >
                                Quick (~30m)
                            </button>
                            <button 
                                className={`task-scale-btn ${scale === "REGULAR" ? "active" : ""}`}
                                onClick={() => setScale("REGULAR")}
                                type="button"
                            >
                                Regular (~2h)
                            </button>
                            <button 
                                className={`task-scale-btn ${scale === "PROJECT" ? "active" : ""}`}
                                onClick={() => setScale("PROJECT")}
                                type="button"
                            >
                                Project (~8h+)
                            </button>
                        </div>
                    </div>
                </div>
                <div className={`event-modal-footer`}>
                    <button 
                        className="event-modal-save" 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <span>{isSaving ? "Đang lưu..." : "Save"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}


export default TaskModal;