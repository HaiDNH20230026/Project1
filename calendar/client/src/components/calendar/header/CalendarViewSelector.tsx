import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom'; // Get URL parameters
import 'styles/header/calendar-view-selector.css';

interface ViewSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  navigateToView: (view: 'day' | 'week' | 'month' | 'year', date?:Date) => void;
}

const CalendarViewSelector: React.FC<ViewSelectorProps> = ({ isOpen, onToggle, navigateToView }) => {
  const { viewType, year, month, day} = useParams(); // Get current URL view type
  const selectorRef = useRef<HTMLDivElement>(null);

  const date = new Date(
    year && month && day
      ? `${year}-${month}-${day}`
      : new Date
  );

  const viewMap: Record<string, 'day' | 'week' | 'month' | 'year'> = {
    'Day': 'day',
    'Week': 'week',
    'Month': 'month',
    'Year': 'year',
  };

  const reverseViewMap: Record<'day' | 'week' | 'month' | 'year', string> = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
  };

  const [selectedItem, setSelectedItem] = useState("Day");

  useEffect(() => {
    if (viewType && Object.values(viewMap).includes(viewType as any)) {
      setSelectedItem(reverseViewMap[viewType as 'day' | 'week' | 'month' | 'year']);
    }
  }, [viewType]); // Reflect when URL changes

  const handleItemClick = (item: string) => {
    setSelectedItem(item);
    navigateToView(viewMap[item], date); // Change selected view
    onToggle(); // Close dropdown
  };

  const getCorrespondingLetter = (item: string) => {
    switch (item) {
      case 'Day': return 'D';
      case 'Week': return 'W';
      case 'Month': return 'M';
      case 'Year': return 'Y';
      default: return '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onToggle(); // close on outside click
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="view-selector" ref={selectorRef}>
      <button className="view-selector-button" onClick={onToggle}>
        <span className="button-text">{selectedItem}</span>
        <span className="button-icon">▼</span>
      </button>

      {isOpen && (
        <ul className="view-selector-list open">
          {["Day", "Week", "Month", "Year"].map((item) => (
            <li key={item} onClick={() => handleItemClick(item)} className="list-item">
              <span>{item}</span>
              <span>{getCorrespondingLetter(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CalendarViewSelector;
