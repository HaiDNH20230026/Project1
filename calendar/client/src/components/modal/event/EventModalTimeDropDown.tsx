import React, { useEffect, useRef } from "react";
import 'styles/modal/event-modal-time-drop-down.css'

interface EventModalTimeDropDownProps {
    setTimeDropDown: (isTimeDropDownOpen: boolean) => void;
    setTime: (time: string) => void;
    isOpen: boolean;
    timeError?: boolean;
}

function EventModalTimeDropDown({isOpen, setTime, setTimeDropDown, timeError}: EventModalTimeDropDownProps) {

    const modalRef = useRef<HTMLDivElement>(null);

    const hours = [
        "AM 00", "AM 01", "AM 02", "AM 03", "AM 04", "AM 05",
        "AM 06", "AM 07", "AM 08", "AM 09", "AM 10", "AM 11",
        "PM 12", "PM 13", "PM 14", "PM 15", "PM 16", "PM 17",
        "PM 18", "PM 19", "PM 20", "PM 21", "PM 22", "PM 23",
    ];

    const quarters = ["00", "15", "30", "45"];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setTimeDropDown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setTimeDropDown]);

    function handleListItemClick(hour:string, quarter:string) {
        setTime(`${hour}:${quarter}`);
        setTimeDropDown(false);
    }

    return(
        <div ref={modalRef}>
            <ul className={`modal-time-list ${isOpen ? "open" : ""}`}>
                {hours.map((hour) => (
                    quarters.map((quarter) => (
                        <li className="modal-time-list-item" key={`${hour}-${quarter}`} onClick={() => handleListItemClick(hour, quarter)}>
                            {hour}:{quarter}
                        </li>
                    ))
                ))}
            </ul>
        </div>
    )
}

export default EventModalTimeDropDown;