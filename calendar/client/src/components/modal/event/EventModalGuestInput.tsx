import React, { useState } from "react";
import "styles/modal/event-modal-guest-input.css";

interface EventModalGuestInputProps {
    guests: string[];
    setGuests: (guests: string[]) => void;
}

function EventModalGuestInput({guests, setGuests}: EventModalGuestInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && inputValue.trim() !== "") {

            setGuests([...guests, inputValue.trim()]); // add input value
            setInputValue(""); // clear input field
            event.preventDefault(); // prevent default event (prevent form submission)
        }
    };

    const handleRemoveGuest = (index: number) => {
        setGuests(guests.filter((_, i) => i !== index)); // delete at that index
    };

    return (
        <div className="event-modal-guest-container-open">
            <div className="event-modal-guest-input">
            <input
                type="text"
                className="event-modal-form-guest"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add attendee"
                defaultValue={''}
            />
            </div>
        </div>
    );
};

export default EventModalGuestInput;
