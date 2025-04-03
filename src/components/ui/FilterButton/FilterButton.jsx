import React, { useEffect, useRef } from "react";
import "./FilterButton.scss";

const FilterButton = ({ label, options, onSelect, isOpen, onToggle }) => {
  const dropdownRef = useRef(null);

  const handleOptionClick = (value) => {
    onSelect(value);
    onToggle(false); // Close the dropdown after selection
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false); // Close the dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onToggle]);

  return (
    <div ref={dropdownRef}>
      <button
        className="filter-button__trigger"
        onClick={() => onToggle(!isOpen)} // Toggle the dropdown
      >
        {label}
        <span className="dropdown-icon"></span>
      </button>
      {isOpen && (
        <div className="filter-button__dropdown">
          {options.map((option) => (
            <div
              key={option.value}
              className="filter-button__dropdown-item"
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterButton;
