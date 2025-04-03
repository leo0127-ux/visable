import React from "react";
import "./Divider.scss";

function Divider({ className = "" }) {
  return (
    <div className={`divider ${className}`}>
      <hr className="divider__line" />
    </div>
  );
}

export default Divider;