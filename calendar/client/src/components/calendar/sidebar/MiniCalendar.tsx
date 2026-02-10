import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import 'styles/sidebar/mini-calendar.css'

const MiniCalendar: React.FC = () => {
    const navigate = useNavigate();

    const { viewType, year, month, day} = useParams();

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
    const startDay = firstDayOfMonth.getDay(); // First weekday of the month (0: Sun ~ 6: Sat)
    const daysInMonth = lastDayOfMonth.getDate(); // Total days in the month

    // Get the last day of the previous month
    const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    const prevMonthDays = Array.from({ length: startDay }, (_, i) => ({
        day: prevLastDay - (startDay - 1) + i,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevLastDay - (startDay - 1) + i)
    }));

    // Current month days list
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)
    }));

    // Fill next month's days (total 6 rows)
    const totalCells = 42; // 7 days * 6 weeks = 42
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
        day: i + 1,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1)
    }));

    // Combined days array
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    const today = new Date();

    // date click handler
    const handleDateClick = (date: Date) => {
        setCurrentDate(date);
        setSelectedDate(date);
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
      <div className="mini-calendar">
        <div className="calendar-header">
          <span className="calendar-year-month">
            {currentDate.toLocaleString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </span>
          <div className="month-shifter">
            <button className="calendar-shift-button" onClick={goToPrevMonth}>
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
              </svg>
              <div className="tooltip">Previous Month</div>
            </button>
            <button className="calendar-shift-button" onClick={goToNextMonth}>
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
              </svg>
              <div className="tooltip">Next Month</div>
            </button>
          </div>
        </div>

        <table className="mini-calendar-table">
          <thead className="mini-calendar-table-head">
            <tr>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="mini-calendar-table-body">
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <tr key={weekIndex}>
                {allDays
                  .slice(weekIndex * 7, (weekIndex + 1) * 7)
                  .map(({ day, isCurrentMonth, date }) => (
                    <td
                      key={date.toString()}
                      className={`mini-calendar-item 
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
                                        `}
                      onClick={() => handleDateClick(date)}
                    >
                      {day}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};
export default MiniCalendar;