import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from 'components/layout/Header';
import Sidebar from 'components/layout/Sidebar';
import Content from 'components/layout/Content';
import Footer from 'components/layout/Footer';
import 'styles/styles.css'

function Main() {

  const navigate = useNavigate();
  const { viewType, year, month, day } = useParams();

  const [activeModal, setActiveModal] = useState<"event" | "task" | null>(null);

  const validViewTypes = ["day", "week", "month", "year"];

  if (!viewType || !validViewTypes.includes(viewType)) {
    navigate("/day");
    return null;
  }

  // View change function → change URL using navigate()
  const navigateToView = (newViewType: 'day' | 'week' | 'month' | 'year', date?: Date) => {
    if (!date) {
      navigate(`/${newViewType}`);
    } else {
      navigate(`/${newViewType}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
    }
  };

  // If date params are missing, use today's date
  const today = new Date();
  const selectedYear = year ? parseInt(year) : today.getFullYear();
  const selectedMonth = month ? parseInt(month) : today.getMonth() + 1;
  const selectedDay = day ? parseInt(day) : today.getDate();

  return (
    <div className='app'>
      <Header
        navigateToView={navigateToView} />
      <Sidebar setActiveModal={setActiveModal}/>
      <Content
        viewType={viewType as "day" | "week" | "month" | "year"}
        year={selectedYear}
        month={selectedMonth}
        day={selectedDay}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />
      <Footer />
    </div>
  );
}

export default Main;
