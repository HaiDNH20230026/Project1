import React, { useCallback, useEffect, useRef, useState } from "react";
import 'styles/modal/event-modal.css';
import EventModalCalendar from "components/modal/event/EventModalCalendar";
import EventModalTimeDropDown from "components/modal/event/EventModalTimeDropDown";
import EventModalGuestInput from "components/modal/event/EventModalGuestInput";
import EventModalDescriptionInput from "components/modal/event/EventModalDescriptionInput";
import EventModalColorDropDown from "components/modal/event/EventModalColorDropDown";
import { createEventApi } from "api/eventApi";
import { useAuth } from "components/auth/AuthContext";

interface EventModalProps {
    modalYear: number;
    modalMonth: number;
    modalDay: number;
    activeModal: "event" | "task" | null;
    setActiveModal: (type: "event" | "task" | null) => void;
    refreshEvents: () => void;
}

interface EventRequestDto {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    color: string;
    recurrenceType?: string;
    recurrenceCount?: number | null;
    recurrenceEndDate?: string;
}

function EventModal({ modalYear, modalMonth, modalDay, activeModal, setActiveModal, refreshEvents }: EventModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [isScrolled, setIsScrolled] = useState(true);
    const [isScheduleOpen, setSchedule] = useState(false);
    const [isGuestOpen, setGuestState] = useState(false);
    const [isLocationOpen, setLocationState] = useState(false);
    const [isDescriptionOpen, setDescriptionState] = useState(false);
    const [isEventStatusOpen, setEventStatusState] = useState(false);
    const [isDateScheduleOpen, setDateSchedule] = useState(false);
    const [isStartTimeOpen, setStartTimeDropDown] = useState(false);
    const [isColorDropDownOpen, setColorDropDownState] = useState(false);
    const [isEndTimeOpen, setEndTimeDropDown] = useState(false);
    const [modalSize, setModalSize] = useState<'compact' | 'large'>('compact');

    const { authState } = useAuth();

    const toggleModalSize = () => {
        setModalSize(prev => prev === 'compact' ? 'large' : 'compact');
    };

    const handleDateScheduleClick = () => {
        setDateSchedule((prev) => !prev);
        setStartTimeDropDown(false)
        setEndTimeDropDown(false)
    };

    const handleStartTimeClick = () => {
        setStartTimeDropDown((prev) => !prev);
        setDateSchedule(false)
        setEndTimeDropDown(false)
    };

    const handleEndTimeClick = () => {
        setEndTimeDropDown((prev) => !prev);
        setDateSchedule(false)
        setStartTimeDropDown(false)
    };

    const handleColorClick = () => {
        setColorDropDownState((prev) => !prev)
        setDateSchedule(false)
        setStartTimeDropDown(false)
        setEndTimeDropDown(false)
    }

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setActiveModal(null);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, [setActiveModal]);

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            setIsScrolled(scrollTop + clientHeight < scrollHeight); // return true if scroll remains
        };

        contentRef.current?.addEventListener("scroll", handleScroll);
        return () => contentRef.current?.removeEventListener("scroll", handleScroll);
    }, []);

    const [startDate, setStartDate] = useState<string>(
        `${date.getDate()}/${date.getMonth() + 1} (${dayOfTheWeek})`
    );

    const [startTime, setStartTime] = useState(() => {
        const [hourStr, minuteStr] = currentTimeString.split(":");
        let hour = parseInt(hourStr, 10);
        if (hour === 24) hour = 0; // 24 hours corrected to 00
    
        const newTime = `${hour}:${minuteStr}`;
        const period = hour < 12 ? "AM" : "PM";
        
        return `${period} ${getHourIndex(newTime)}`;
    });

    const [endTime, setEndTime] = useState(() => {
        const [hourStr, minuteStr] = currentTimeString.split(":");
        let hour = parseInt(hourStr, 10) + 1;
        if (hour === 24) hour = 0; // 24 hours corrected to 00
    
        const newTime = `${hour}:${minuteStr}`;
        const period = hour < 12 ? "AM" : "PM";
        
        return `${period} ${getHourIndex(newTime)}`;
    });

    const [guests, setGuests] = useState<string[]>([]);
    const [color, setColor] = useState<string>("PEACOCK");
    const [palette, setPalette] = useState<string|null>(null);
    
    // Recurring event states
    const [recurrenceType, setRecurrenceType] = useState<string>("NONE");
    const [recurrenceCount, setRecurrenceCount] = useState<number | null>(null);
    const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);

    const handleRemoveGuest = (index: number) => {
        setGuests(guests.filter((_, i) => i !== index)); // delete at that index
    };

    const name = "leun"

    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("")
    const [description, setDescription] = useState("");
    const [selectedDate, setSelectedDate] = useState(
        `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    );
    // const selectedStartTime = ((t => `${(t[0] === 'PM && AM' && t[1].split(':')[0] === '12' ? '00' : t[1].split(':')[0]).toString().padStart(2, '0')}:${t[1].split(':')[1]}`)(startTime.split(' ')));
    // const selectedEndTime = ((t => `${(t[0] === 'PM && AM' && t[1].split(':')[0] === '12' ? '00' : t[1].split(':')[0]).toString().padStart(2, '0')}:${t[1].split(':')[1]}`)(endTime.split(' ')));
    const selectedStartTime = startTime.split(' ')[1]
    const selectedEndTime = endTime.split(' ')[1]

    const [timeError, setTimeError] = useState(false);
    
    // Recurrence options
    const recurrenceOptions = [
        { value: "NONE", label: "Không lặp lại" },
        { value: "DAILY", label: "Hàng ngày" },
        { value: "WEEKLY", label: "Hàng tuần" },
        { value: "BIWEEKLY", label: "2 tuần một lần" },
        { value: "MONTHLY", label: "Hàng tháng" },
        { value: "YEARLY", label: "Hàng năm" },
        { value: "WEEKDAYS", label: "Các ngày trong tuần (T2-T6)" }
    ];
    
    const getRecurrenceLabel = (value: string) => {
        return recurrenceOptions.find(opt => opt.value === value)?.label || "Không lặp lại";
    };

    function handleSaveEvent() {

        const start = new Date(`${selectedDate}T${selectedStartTime}`);
        const end = new Date(`${selectedDate}T${selectedEndTime}`);

        if (start >= end) {
            setTimeError(true);
    
            // remove error state after 1 second
            setTimeout(() => setTimeError(false), 1000);
            return;
        }else {
            const eventData: EventRequestDto = {
                title: title.trim() === "" ? "Add title" : title,
                description: description,
                location: location,
                startTime: selectedDate+"T"+selectedStartTime,
                endTime: selectedDate+ "T" +selectedEndTime,
                color: color,
                recurrenceType: recurrenceType,
                recurrenceCount: recurrenceCount,
            };
        
            createEventApi(eventData)
                .then((res) => {
                    console.log("event saved successfully", res.data);
                    refreshEvents();
                })
                .catch((err) => {
                    console.error("event save failed", err);
                });
            setActiveModal(null)
        }
    }

    return (
        <div className="modal-overlay">
            <div className={`event-modal
                    ${modalSize === 'compact' ? 'event-modal-compact' : 'event-modal-large'}
                    ${isScheduleOpen ? "event-modal-expanded" : ""}`} 
                    ref={modalRef}>
                <div className="event-modal-header">
                    <button className="event-modal-size-toggle" onClick={toggleModalSize} title={modalSize === 'compact' ? 'Expand' : 'Compact'}>
                        {modalSize === 'compact' ? '⛶' : '◱'}
                    </button>
                    <button className="event-modal-close" onClick={() => setActiveModal(null)}>
                        <i className="material-icons">close</i>
                    </button>
                </div>
                <div className="event-modal-content" 
                    style={{overflow: (isDateScheduleOpen || isStartTimeOpen || isEndTimeOpen ) ? 'hidden' : '',}}
                    ref={contentRef}
                    >
                    <div className="event-modal-container" style={{width:"100%", height:"20%"}}>
                        <div style={{width:"15%", height:"100%"}}/>
                        <div className="event-modal-title-container">
                            <div className="title-container">
                                <input 
                                    className="event-modal-form-title" 
                                    type="text" 
                                    name="title"
                                    placeholder="Add title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="event-modal-container" style={{width:"100%", height:"13%", marginBottom:"10px"}}>
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

                    <div className="event-modal-container" style={{width:"100%", height:"15%"}}>
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
                                        && ( <EventModalCalendar 
                                            setDateSchedule = {setDateSchedule}
                                            setStartDate = {setStartDate}
                                            setSelected = {setSelectedDate} />
                                )}
                                <div className="time-picker-wrapper" style={{ position: "relative" }}>
                                    <div onClick={handleStartTimeClick}>
                                        <input
                                            type="text"
                                            className="event-modal-form-start-time"
                                            value={startTime}
                                        />
                                    </div>

                                    <EventModalTimeDropDown
                                        setTimeDropDown={setStartTimeDropDown}
                                        setTime={setStartTime}
                                        isOpen={isStartTimeOpen}
                                        timeError = {timeError}
                                    />
                                </div>


                                <span  aria-label="-" style={{fontSize: "8px", paddingLeft:"7px", paddingRight:"7px"}}>—</span>
                                <div className={`time-picker-wrapper ${timeError ? "error" : ""}`} style={{ position: "relative" }}>
                                    <div onClick={handleEndTimeClick}>
                                        <input 
                                            type="text" 
                                            className="event-modal-form-end-time" 
                                            value={endTime} />
                                    </div>
                                    <EventModalTimeDropDown
                                        setTimeDropDown = {setEndTimeDropDown}
                                        setTime = {setEndTime}
                                        isOpen = {isEndTimeOpen}
                                        timeError = {timeError}
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
                                            <span  aria-label="-" style={{fontSize: "8px", paddingLeft:"7px", paddingRight:"7px"}}>—</span>
                                            <span>
                                                {endTime}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{width: "100%", height:"50%", display: "flex", alignItems: "center", fontSize: "12px"}}>
                                        <span>Time zone
                                        <span style={{paddingLeft:"5px", paddingRight:"5px", fontSize: "16px"}}>·</span>
                                            {getRecurrenceLabel(recurrenceType)}</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Recurrence Selection */}
                    <div className="event-modal-container" style={{width:"100%", minHeight:"52px", paddingBottom:"5px"}}>
                        <div className="event-modal-icon">
                            <i className="material-icons">repeat</i>
                        </div>
                        <div style={{ width: "80%", position: "relative" }}>
                            <button 
                                className="event-modal-form-recurrence-button"
                                onClick={() => setIsRecurrenceOpen(!isRecurrenceOpen)}
                                type="button"
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid #dadce0",
                                    borderRadius: "8px",
                                    background: "white",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    color: "#3c4043"
                                }}
                            >
                                <span>{getRecurrenceLabel(recurrenceType)}</span>
                                <i className="material-icons" style={{ fontSize: "20px", color: "#5f6368" }}>
                                    {isRecurrenceOpen ? "expand_less" : "expand_more"}
                                </i>
                            </button>
                            
                            {isRecurrenceOpen && (
                                <div className="recurrence-dropdown" style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "white",
                                    border: "1px solid #dadce0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    zIndex: 1000,
                                    marginTop: "4px",
                                    maxHeight: "250px",
                                    overflowY: "auto"
                                }}>
                                    {recurrenceOptions.map(option => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                setRecurrenceType(option.value);
                                                setIsRecurrenceOpen(false);
                                            }}
                                            style={{
                                                padding: "10px 16px",
                                                cursor: "pointer",
                                                background: recurrenceType === option.value ? "#e8f0fe" : "white",
                                                color: recurrenceType === option.value ? "#1a73e8" : "#3c4043",
                                                fontSize: "14px",
                                                borderBottom: "1px solid #f1f3f4"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = recurrenceType === option.value ? "#e8f0fe" : "#f1f3f4"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = recurrenceType === option.value ? "#e8f0fe" : "white"}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {recurrenceType !== "NONE" && (
                                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "13px", color: "#5f6368" }}>Lặp lại:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={recurrenceCount || ""}
                                        onChange={(e) => setRecurrenceCount(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="∞"
                                        style={{
                                            width: "60px",
                                            padding: "6px 8px",
                                            border: "1px solid #dadce0",
                                            borderRadius: "4px",
                                            fontSize: "13px"
                                        }}
                                    />
                                    <span style={{ fontSize: "13px", color: "#5f6368" }}>lần (để trống = vô hạn)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="event-modal-container" style={{width:"100%", height: isGuestOpen ? "" : "13%"}}>
                        
                        <div className="event-modal-icon">
                            <svg focusable="false" width="24" height="24">
                                <path d="M15 8c0-1.42-.5-2.73-1.33-3.76.42-.14.86-.24 1.33-.24 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.43 0-.84-.09-1.23-.21-.03-.01-.06-.02-.1-.03A5.98 5.98 0 0 0 15 8zm1.66 5.13C18.03 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.58-3.47-6.34-3.87zM9 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 9c-2.7 0-5.8 1.29-6 2.01V18h12v-1c-.2-.71-3.3-2-6-2M9 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 9c2.67 0 8 1.34 8 4v3H1v-3c0-2.66 5.33-4 8-4z" />
                            </svg>
                        </div>
                        {
                            
                            isGuestOpen 
                            ? (
                                <EventModalGuestInput 
                                    guests = {guests} 
                                    setGuests = {setGuests}
                                />
                            )
                            : (
                                <div className="event-modal-guest-container-close">
                                    <button className="event-modal-form-guest-button" onClick={() =>setGuestState(true)}>
                                        Add guests
                                    </button>
                                </div>
                            )
                        }
                    </div>
                    <div className="event-modal-container" style={{width:"100%", height: isGuestOpen ? "" : "0%"}}>
                    <div style={{ width:"15%" }} />
                        <div className="event-modal-guest-tags">
                            {guests.map((guest, index) => (
                                <span key={index} className="guest-tag" onClick={() => handleRemoveGuest(index)}>
                                    {guest}
                                    <button className="remove-btn">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="event-modal-container" style={{width:"100%", height:"13%"}}>
                        <div className="event-modal-icon">
                            <svg focusable="false" width="24" height="24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
                                <circle cx="12" cy="9" r="2.5" />
                            </svg>
                        </div>
                        {
                            isLocationOpen 
                            ? (
                                <div className="event-modal-location-container-open">
                                    <div>
                                        <input 
                                            type="text" 
                                            className="event-modal-form-location"
                                            name="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Add location" />
                                    </div>
                                </div>
                            )
                            : (
                                <div className="event-modal-location-container-close">
                                    <button className="event-modal-form-location-button" onClick={() => setLocationState(true)}>
                                        Add location
                                    </button>
                                </div>
                            )
                        
                        }
                    </div>
                    
                    <div className="event-modal-container" style={{width:"100%", height:"13%"}}>
                         <div className="event-modal-icon">
                            <i className="material-icons">notes</i>
                        </div>
                        {
                            isDescriptionOpen 
                            ? (
                                <div className="event-modal-description-container-open">
                                    <div className="event-modal-description-icon-container">

                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">format_bold</span>
                                        </div>

                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">format_italic</span>
                                        </div>

                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">format_underlined</span>
                                        </div>
                                        <div
                                            style={{
                                                width: "1px",
                                                height: "20px",
                                                backgroundColor: "#ccc",
                                                margin: "0 8px",
                                            }}
                                        />
                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">format_list_numbered</span>
                                        </div>

                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">format_list_bulleted</span>
                                        </div>
                                        
                                        <div
                                            style={{
                                                width: "1px",
                                                height: "20px",
                                                backgroundColor: "#ccc",
                                                margin: "0 8px",
                                            }}
                                        />

                                        <div className="event-modal-description-icon">
                                            <span className="material-icons">insert_link</span>
                                        </div>

                                        <div className="event-modal-description-icon"   >
                                            <span className="material-icons">format_clear</span>
                                        </div>
                                       
                                    </div>
                                </div>
                            )
                            : (
                                <div className="event-modal-description-container-close">
                                    <button className="event-modal-form-description-button" onClick={() => setDescriptionState(true)}>
                                        Add description
                                    </button>
                                </div>
                            )
                        
                        }
                    </div>
                    {isDescriptionOpen && (
                        <div className="event-modal-container" style={{ width: "100%", paddingBottom:"5px" }}>
                            <div style={{ width: "15%" }} />
                            <EventModalDescriptionInput setDescription={setDescription} />
                        </div>
                    )}

                    <div className="event-modal-container" style={{width:"100%", height:"18%"}}>
                        <div className="event-modal-icon">
                            <i className="material-icons">event</i>
                        </div>
                        {
                            isEventStatusOpen 
                            ? (
                                <div className="event-modal-event-status-container-open">
                                    
                                    <button className="event-modal-form-color-drop-down-button" onClick={handleColorClick}>
                                        <div className="event-modal-set-color" style={{ background: palette !== null ? palette : "rgb(3, 155, 229)" }}/>

                                        <svg height="22" viewBox="0 0 24 24" width="22" fill="#455A64" style={{ transform: isColorDropDownOpen ? "rotate(180deg)" : ""}} >
                                            <path d="M0 0h24v24H0V0z" fill="none" />
                                            <path d="M7 10l5 5 5-5H7z"/>
                                        </svg>
                                    </button>
                                    {
                                        isColorDropDownOpen 
                                            && <EventModalColorDropDown 
                                                    setDropDown = {setColorDropDownState}
                                                    isOpen = {isColorDropDownOpen}
                                                    setColor = {setColor}
                                                    setPalette = {setPalette} />
                                    }
                                </div>
                            )
                            : (
                                <div className="event-modal-event-status-container-close">
                                    <button className="event-modal-form-event-status-button" onClick={() => setEventStatusState(true)}>
                                        <div style={{ width:"100%", height:"100%"}}>
                                            <div style={{ width:"100%", height:"45%", display:"flex", alignContent:"center"}}>
                                                <span style={{fontSize:"15px"}}>{authState.name}</span>
                                                <div style={{ 
                                                    width:"14px", 
                                                    height:"14px", 
                                                    background:"#039BE5", 
                                                    borderRadius:"50%",
                                                    marginTop: "2px",
                                                    marginLeft:"4px" }} />
                                            </div>
                                            <div style={{ width:"100%", height:"55%", display:"flex", alignContent:"center"}}>
                                                <span>Busy</span>
                                                <span>·</span>
                                                <span>Default visibility</span>
                                                <span>·</span>
                                                <span>30 minutes before</span>
                                            </div>
                                        </div> 
                                    </button>
                                </div>
                            )
                        
                        }
                    </div>
                </div>



                <div className={`event-modal-footer ${isScrolled ? "footer-shadow" : ""}`}>
                    <button className="event-modal-save" onClick={() =>handleSaveEvent()}>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventModal;
