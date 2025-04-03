import React from "react";
import "./SideBarItem.scss";

function SideBarItem({
  title,
  icon,
  iconPosition = "left",
  active = false,
  className = "",
}) {
  const baseClass = "sidebar-item";
  const activeClass = active ? "sidebar-item--active" : "";
  const noWrapClass =
    typeof title === "string" && !title.includes("\n")
      ? "sidebar-item--nowrap"
      : "";

  return (
    <button
      className={`${baseClass} ${activeClass} ${noWrapClass} ${className}`}
    >
      {iconPosition === "left" && icon && (
        <span className="material-icons">{icon}</span>
      )}

      {iconPosition === "left" && !icon && (
        <span className="sidebar-item__icon-placeholder" />
      )}

      <span className="sidebar-item__title">{title}</span>

      {iconPosition === "right" && icon && (
        <span className="material-icons">{icon}</span>
      )}
    </button>
  );
}

export default SideBarItem;