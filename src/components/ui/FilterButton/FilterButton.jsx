import React, { useEffect, useRef } from "react";
import "./FilterButton.scss";

const FilterButton = ({ label, options, onSelect, isOpen, onToggle }) => {
  const filterButtonRef = useRef(null);
  const triggerRef = useRef(null);

  const handleOptionClick = (value) => {
    onSelect(value);
    onToggle(false); // Close the dropdown after selection
  };

  // 停止所有事件冒泡
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    onToggle(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 只有當點擊區域不在 filterButtonRef 內時才關閉下拉選單
      if (
        filterButtonRef.current && 
        !filterButtonRef.current.contains(event.target)
      ) {
        onToggle(false);
      }
    };

    // 只有在下拉選單打開時才添加全局點擊監聽器
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div 
      ref={filterButtonRef} 
      className="filter-button" 
      onClick={stopPropagation}
    >
      <button
        ref={triggerRef}
        className="filter-button__trigger"
        onClick={handleTriggerClick}
      >
        {label}
        <span className="dropdown-icon"></span>
      </button>
      {isOpen && (
        <div 
          className="filter-button__dropdown" 
          onClick={stopPropagation}
        >
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
