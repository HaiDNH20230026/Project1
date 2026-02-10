import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import 'styles/modal/event-modal-calendar.css'

interface EventModalCalendarProps {
    setDateSchedule: (isDateScheduleOpen: boolean) => void;
    setStartDate: (startDate: string) => void;
    setSelected: (selectedDate: string) => void;
}

function EventModalCalendar({ setDateSchedule, setStartDate, setSelected }: EventModalCalendarProps) {
    const navigate = useNavigate();
    const { viewType, year, month, day } = useParams();

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
              if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setDateSchedule(false);
              }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
          }, [setDateSchedule]);

    const date = new Date(
        year && month && day
            ? `${year}-${month}-${day}`
            : new Date().toLocaleDateString()
    );
    
    const [currentDate, setCurrentDate] = useState(date);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const newDate = new Date(
          year && month && day 
          ? `${year}-${month}-${day}` 
          : today.toLocaleDateString()
        );
        setSelectedDate(newDate);
        setCurrentDate(newDate);
    }, [year, month, day]); 

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDayOfMonth.getDay(); // day of week for the first day of the month (0: Sunday ~ 6: Saturday)
    const daysInMonth = lastDayOfMonth.getDate(); // total number of days in this month

    // get the last day of the previous month
    const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    const prevMonthDays = Array.from({ length: startDay }, (_, i) => ({
        day: prevLastDay - (startDay - 1) + i,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevLastDay - (startDay - 1) + i)
    }));

    // list of dates for this month
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)
    }));

    // fill next month dates (based on 6 lines total)
    const totalCells = 42; // 7 days * 6 weeks = 42 cells
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
        day: i + 1,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1)
    }));

    // all dates array
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    const today = new Date();

    const getDayOfTheWeek = (day:number) => {
        return [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
        ][day]
    }

    // date click handler
    const handleDateClick = (date: Date) => {
        setCurrentDate(date);
        setSelectedDate(date);
        setDateSchedule(false);
        if(date.getFullYear() !== currentDate.getFullYear()) {
          setStartDate(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} (${getDayOfTheWeek(date.getDay())})`)
        } else{
          setStartDate(`${date.getDate()}/${date.getMonth() + 1} (${getDayOfTheWeek(date.getDay())})`)
        }
        setSelected(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`)
        
        navigate(`/${viewType}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
    };

    // previous/next month navigation function
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    return (
      <div className="event-modal-calendar" ref={modalRef}>
        <div className="event-modal-calendar-header">
          <span className="event-modal-calendar-year-month">
            {currentDate.toLocaleString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </span>
          <div className="event-modal-calendar-month-shifter">
            <button className="event-modal-calendar-shift-button" onClick={goToPrevMonth}>
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
              </svg>
              <div className="tooltip">previous month</div>
            </button>
            <button className="event-modal-calendar-shift-button" onClick={goToNextMonth}>
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
              </svg>
              <div className="tooltip">next month</div>
            </button>
          </div>
        </div>

        <table className="event-modal-calendar-table">
          <thead className="event-modal-calendar-table-head">
            <tr>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="event-modal-calendar-table-body">
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <tr key={weekIndex}>
                {allDays
                  .slice(weekIndex * 7, (weekIndex + 1) * 7)
                  .map(({ day, isCurrentMonth, date }) => (
                    <td
                      key={date.toString()}
                      onClick={() => handleDateClick(date)}
                    >
                        <div className="event-modal-calendar-item">   
                            <div className={`event-modal-calendar-date
                                ${
                                    date.toDateString() ===
                                    today.toDateString()
                                        ? "today"
                                        : ""
                                }
                                ${
                                    selectedDate?.toDateString() ===
                                    date.toDateString()
                                    ? "selected"
                                    : ""
                                } 
                            `}>
                                {day}
                            </div>
                        </div>
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};
export default EventModalCalendar;