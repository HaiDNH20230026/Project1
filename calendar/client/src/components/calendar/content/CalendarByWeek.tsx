import React from "react";
import "styles/content/calendar-by-week.css";

interface CalendarProps {
  events: EventDetails[];
  tasks: TaskDetails[];
  year: number;
  month: number;
  day: number;
  setModalDetails: any;
  setActiveModal: (type: "event" | "task" | null) => void;
  setModalDate: (date: { modalYear: number; modalMonth: number; modalDay: number }) => void;
}

interface EventDetails {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  color: string;
  eventType?: string;
}

interface TaskDetails {
  id: string;
  title: string;
  dueDate: string;  // Backend returns dueDate
  description?: string;
  isCompleted: boolean;
  taskType?: string;
  priority?: string;
  scale?: string;
  status?: string;
  scheduledSessions?: number;
  completedSessions?: number;
  requiredSessions?: number;
}

type ColorGroup = Array<Record<string, string>>;

const CalendarByWeek: React.FC <CalendarProps> = ({ events, tasks, year, month, day, setModalDetails, setActiveModal, setModalDate }) => {
    const timezone = "GMT+09";

    const baseDate = new Date(
      year && month && day
        ? `${year}-${month}-${day}`
        : new Date().toLocaleDateString()
    );

    const dayOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dateIndex = baseDate.getDay();
    const currentDate = new Date();

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const dateObj = new Date(baseDate);
        dateObj.setDate(baseDate.getDate() - dateIndex + i);
        return {
          dayLabel: dayOfTheWeek[i],
          fullDate: dateObj,
          isToday:
            dateObj.getFullYear() === currentDate.getFullYear() &&
            dateObj.getMonth() === currentDate.getMonth() &&
            dateObj.getDate() === currentDate.getDate(),
        };
    });

    const quarter = ["15", "30", "45", "00"];


    // Calculate time zone index function
    const getHourIndex = (time: string) => {
        const [hour, minute] = time.split(":");
        const minuteValue = parseInt(minute);

        // Calculate in 15-minute increments
        const quarter = Math.floor(minuteValue / 15) * 0.25;

        return parseInt(hour) + quarter; // 9:15 -> 9.25, 9:30 -> 9.5, 9:45 -> 9.75
    };

    const calculateEventPosition = (events: any[]) => {
        const positions: any[] = [];
    
        events.forEach((event, index) => {
          const eventDate = new Date(event.startTime);
          const dayIndex = eventDate.getDay(); // 0(Sun) ~ 6(Sat)
          // Handle overlapping events (simply position to the left)
          let leftPosition = 14 * dayIndex;
    
          positions.push({ leftPosition });
        });
    
        return positions;
      };

      

const eventPositions = calculateEventPosition(events);

  const hours = [
    "1 AM",
    "2 AM",
    "3 AM",
    "4 AM",
    "5 AM",
    "6 AM",
    "7 AM",
    "8 AM",
    "9 AM",
    "10 AM",
    "11 AM",
    "12 PM",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
    "5 PM",
    "6 PM",
    "7 PM",
    "8 PM",
    "9 PM",
    "10 PM",
    "11 PM",
    "12 AM",
  ];

  function handleEventClick(event: any) {
    setModalDetails({
      isOpen: true,
      type: "event",
      data: event
    });
  }

  function handleTaskClick(task: any) {
    setModalDetails({
      isOpen: true,
      type: "task",
      data: task
    });
  }

  // Calculate task positions similar to events
  const calculateTaskPosition = (tasks: TaskDetails[]) => {
    const positions: any[] = [];
    tasks.forEach((task) => {
      // Use dueDate for tasks
      const taskDate = new Date(task.dueDate);
      const dayIndex = taskDate.getDay();
      let leftPosition = 14 * dayIndex;
      positions.push({ leftPosition });
    });
    return positions;
  };

  const taskPositions = calculateTaskPosition(tasks);

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

	const formatTimeRange = (start?: string, end?: string) => {
		const t1 = start?.split("T")[1];
		const t2 = end?.split("T")[1];
		if (!t1 || !t2) return '';
		const d1 = new Date(`2000-01-01T${t1}`);
		const d2 = new Date(`2000-01-01T${t2}`);
		const h1 = d1.getHours().toString().padStart(2, '0');
		const m1 = d1.getMinutes().toString().padStart(2, '0');
		const h2 = d2.getHours().toString().padStart(2, '0');
		const m2 = d2.getMinutes().toString().padStart(2, '0');
		return `${h1}:${m1} ~ ${h2}:${m2}`;
	};

    function handleContentClick(fullDate: Date) {
        setModalDate({
            modalYear: fullDate.getFullYear(),
            modalMonth: fullDate.getMonth() + 1, // JS is 0-based
            modalDay: fullDate.getDate(),
          });
        setActiveModal("event");
    }

  return (
    <div className="week-calendar">
      <div className="week-calendar-header">
        {/* Display timezone */}
        <div style={{ width: "8%", height: "100%" }}>
          <div style={{ width: "100%", height: "70%" }} />
          <div
            style={{
              textAlign: "center",
              width: "100%",
              height: "30%",
              borderRight: "1px solid #ccc",
            }}
          >
            <span className="week-calendar-timezone">{timezone}</span>
          </div>
        </div>

        {/* Display this week's dates */}
        <div style={{ width: "92%", height: "100%", display: "flex" }}>
          {weekDays.map(({ dayLabel, fullDate, isToday  }, index) => (
            <div style={{display:"flex", width:"14%" }}>
              <div style={{width:"30%", height:"100%"}}/>
              <div key={index} className="week-calendar-day-container">
                <div className={`week-calendar-day-of-the-week ${isToday ? "week-calendar-day-of-the-week-today" : ""}`}>
                  {dayLabel}
                </div>
                <div className={`week-calendar-day ${isToday ? "week-calendar-day-today" : ""}`}>
                  {fullDate.getDate()}
                </div>
              </div>
              <div style={{width:"30%", height:"100%"}}/>
            </div>
          ))}
        </div>
      </div>


      <div className="week-calendar-content">
        <div className="week-calendar-timeline">
          {hours.map((hour, index) => (
            <div
              key={index}
              className="timeline-hour"
              style={{
                display: "flex", // Set as flexbox
                alignItems: "center", // Vertical center alignment
                justifyContent: "center", // Horizontal center alignment
              }}
            >
              {hour !== "12 AM" && (
                <span style={{ paddingTop: "40px" }}>{hour}</span>
              )}
            </div>
          ))}
        </div>

        <div className="week-calendar-space">
          {hours.map((index) => (
            <div key={index} className="space-border" />
          ))}
        </div>

            <div className="week-calendar-schedule">

                {events.map((event, index) => {
                  
                    const startIdx = getHourIndex(event.startTime.split("T")[1]);
                    const endIdx = getHourIndex(event.endTime.split("T")[1]);
                    const topPosition = startIdx * 40;
                    const height = (endIdx - startIdx) * 40.7;
                    const { leftPosition } = eventPositions[index];
                    // Determine if event is short (e.g., less than 1 hour)
                    const isShortEvent = height < 60; // Event less than 1 hour

                    return (
                    <div
                        key={event.id}
                        className={`week-calendar-event-box ${event.eventType === 'AI_GENERATED' ? 'ai-generated-event' : ''}`}
                        style={{
                            top: topPosition,
                            left: `${leftPosition}%`, // Position overlapping events to the left
                            height: height > 40 ? height : 20,
                            cursor: "pointer",
                            background: getRgbByColorName(event.color, event.eventType),
                            paddingLeft: "5px",
                            paddingTop: !isShortEvent ? "5px" : "",
                        }}
                        onClick={() => handleEventClick(event)} // Event on click
                    >
                        {isShortEvent ? (
                        <span>
                            {event.title}
                        </span>
                        ) : (
                        <>
                            <span>{event.title}</span>
                            <span>
								{formatTimeRange(event.startTime, event.endTime)}
                            </span>
                        </>
                        )}
                    </div>
                    );
                })}

                {/* Render Tasks */}
                {tasks.map((task, index) => {
                    // Use dueDate for tasks
                    const taskTime = task.dueDate?.split("T")[1];
                    if (!taskTime) return null;
                    
                    const startIdx = getHourIndex(taskTime);
                    const topPosition = startIdx * 40;
                    const { leftPosition } = taskPositions[index] || { leftPosition: 0 };
                    
                    // Get priority color
                    const getPriorityColor = (priority?: string) => {
                        switch(priority) {
                            case 'HIGH': return '#ea4335';
                            case 'MEDIUM': return '#fbbc04';
                            case 'LOW': return '#34a853';
                            default: return '#7c4dff';
                        }
                    };

                    return (
                        <div
                            key={`task-${task.id}`}
                            className="week-calendar-task-box"
                            style={{
                                top: topPosition,
                                left: `${leftPosition}%`,
                                cursor: "pointer",
                                background: `${getPriorityColor(task.priority)}20`,
                                borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                            }}
                            onClick={() => handleTaskClick(task)}
                        >
                            <i className="material-icons" style={{ fontSize: '14px', marginRight: '4px', color: getPriorityColor(task.priority) }}>
                                {task.isCompleted ? 'check_circle' : 'check_circle_outline'}
                            </i>
                            <span>{task.title}</span>
                        </div>
                    );
                })}

                {weekDays.map(({ dayLabel, fullDate, isToday }, dayIndex) => (
                    <div key={dayIndex} className="week-calendar-schedule-container">
                         {hours.map((hour, hourIndex) => (
                            <div key={`${dayIndex}-${hourIndex}`} className="week-calendar-schedule-column">
                                {quarter.map((qtr, qtrIndex) => {
                                    const timeString = `${hourIndex}:${qtrIndex * 15}`;
                                    const startIdx = getHourIndex(timeString);
                                    const topPosition = startIdx * 40;
                                    const isCurrentTime =
                                        new Date().getDay() === dayIndex && // Check if day matches
                                        `${new Date().getHours()}:${Math.floor(new Date().getMinutes() / 15) * 15}` === timeString &&
                                        isToday;
                                    const leftPos = dayIndex * 14;
                                    return (
                                        <div key={`${dayIndex}-${hourIndex}-${qtrIndex}`}>
                                        {isCurrentTime ? (
                                            <div className="current-time-container">
                                                
                                                <div className="week-calendar-current-time-ball" style={{ top: `${getHourIndex(timeString) * 40 + 5}px`, left: `calc(${dayIndex * 14}% - 5px)` }} />
                                                <div className="quarter" onClick={() =>handleContentClick(fullDate)} />
                                                <div className="current-time" />
                                            </div>
                                        ) : (
                                            <div className="quarter" onClick={() => handleContentClick(fullDate)} />
                                        )}
                                        </div>
                                    );
                                })}
                            </div>
                         ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CalendarByWeek;
