import React from "react";
import { useParams } from "react-router-dom";

const DateDisplay: React.FC = () => {
  const { viewType, year, month, day } = useParams();

  const date = new Date(
    year && month && day
      ? `${year}-${month}-${day}`
      : new Date()
  );

  // weekly (week) processing: calculate the start and end of the week containing the current date
  const getWeekRange = () => {
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - date.getDay()); // 해당 주의 Sunday (0)
    
    const lastDayOfWeek = new Date(date);
    lastDayOfWeek.setDate(date.getDate() + (6 - date.getDay())); // 해당 주의 Satday (6)

    const startMonth = firstDayOfWeek.getMonth() + 1;
    const endMonth = lastDayOfWeek.getMonth() + 1;

    return startMonth === endMonth
      ? `${startMonth}/${date.getFullYear()}`
      : `${startMonth}/${date.getFullYear()}`;
  };

  let displayText = "";
  switch (viewType) {
    case "day":
      displayText = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
      break;
    case "week":
      displayText = getWeekRange();
      break;
    case "month":
      displayText = `${date.getMonth()+1}/${date.getFullYear()}`;
      break;
    case "year":
      displayText = `${date.getFullYear()}`;
      break;
    default:
      displayText = "";
  }

  return (
    <div style={{minWidth:"250px"}}>
      <span>{displayText}</span>
    </div>
  );
};

export default DateDisplay;
