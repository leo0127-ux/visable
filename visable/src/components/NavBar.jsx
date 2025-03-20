import React from "react";
import "/styles/global.scss";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <div className="visable-logo"></div>
      </div>
      <div className="nav-search">
        <img src="/asset/image/Icon/Type=Search.svg" className="search-icon" alt="search" />
        <input type="text" className="nav-search-input" placeholder="Search Something" />
        <button className="btn-icon-full-r-28 clear-icon">
          <img src="/asset/image/Icon/Type=cancel-R.svg" alt="" />
        </button>
      </div>
      <div className="nav-actions" id="navActions"></div>
    </nav>
  );
};

export default Navbar;
