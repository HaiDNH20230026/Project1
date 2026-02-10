import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'styles/content/calendar-by-year.css'

interface CalendarProps {
  year: number;
  month: number;
  day: number;
}

const CalendarByYear: React.FC<CalendarProps> = ({ year, month, day }) => {
  const navigate = useNavigate();

  const date = new Date(
    year && month && day ? `${year}-${month}-${day}` : new Date().toLocaleDateString()
  );

  const [currentDate, setCurrentDate] = useState(date);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const newDate = new Date(
      year && month && day ? `${year}-${month}-${day}` : new Date().toLocaleDateString()
    );
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  }, [year, month, day]);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = firstDayOfMonth.getDay(); // First day of this month (0: Sunday ~ 6: Saturday)
  const daysInMonth = lastDayOfMonth.getDate(); // Total number of days in this month

  // Get the last day of previous month
  const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  const prevMonthDays = Array.from({ length: startDay }, (_, i) => ({
    day: prevLastDay - (startDay - 1) + i,
    isCurrentMonth: false,
    date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevLastDay - (startDay - 1) + i),
  }));

  // This month's date list
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: true,
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1),
  }));

  // fill next month dates (based on 6 lines total)
  const totalCells = 42; // 7 days * 6 weeks = 42 cells
  const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: false,
    date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1),
  }));

  // all dates array
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const today = new Date();

  // Date click handler
  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    // navigate(`/${viewType}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
    navigate(`/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
  };

  // Generate calendar by month function
  const generateMonthCalendar = (month: number) => {
    const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), month, 1);
    const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), month + 1, 0);
    const daysInCurrentMonth = lastDayOfCurrentMonth.getDate();
    const startDay = firstDayOfCurrentMonth.getDay();

    const prevLastDay = new Date(currentDate.getFullYear(), month, 0).getDate();
    const prevMonthDays = Array.from({ length: startDay }, (_, i) => ({
      day: prevLastDay - (startDay - 1) + i,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), month - 1, prevLastDay - (startDay - 1) + i),
    }));

    const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: true,
      date: new Date(currentDate.getFullYear(), month, i + 1),
    }));

    const totalCells = 42;
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), month + 1, i + 1),
    }));

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  return (
    <div className="year-calendar">
        {Array.from({ length: 3 }, (_, rowIndex) => {
          return(
          <div className='year-calendar-column'>
          {Array.from({ length: 4 }, (_, columnIndex) => {
            const month = generateMonthCalendar((rowIndex * 4) + columnIndex);

            return(
            <div className='year-calendar-container'>
                <div className='year-calendar-header'>{rowIndex * 4 + columnIndex + 1} Month</div>
                <div className='year-calendar-content'>
                    <table className='year-calendar-table'>
                        <thead className='year-calendar-table-head'>
                        <tr>
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <th key={day}>{day}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className='year-calendar-table-body'>
                        {Array.from({ length: 6 }, (_, weekIndex) => (
                    <tr key={weekIndex}>
                            {month
                                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                                .map(({ day, isCurrentMonth, date }) => (
                                <td
                                    key={date.toString()}
                                    className={`year-calendar-item ${
                                    date.toDateString() === new Date().toDateString() 
                                    && isCurrentMonth === true
                                        ? "today"
                                        : ""
                                    }
                                    ${
                                        selectedDate?.toDateString() === date.toDateString() 
                                        && isCurrentMonth === true
                                          ? "selected"
                                          : ""
                                    }`}
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
            </div>
            )
            })}
          </div>
          )
        })}
        <div className="space"style={{width: "100%", height: "5%"}}/>
    </div>
  );
};

export default CalendarByYear;
