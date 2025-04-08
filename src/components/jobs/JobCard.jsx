import React from "react";
import { BookmarkOutlined, CloseOutlined } from "@ant-design/icons";
import "./JobCard.scss";

const JobCard = ({ job, onClick, onSave, onHide }) => {
  return (
    <div className="job-card" onClick={onClick}>
      <img
        src={job.company_logo_url || "https://via.placeholder.com/48"}
        alt={`${job.company_name} logo`}
        className="job-card__logo"
      />
      <div className="job-card__content">
        <h3>
          {job.job_position}
          <span className="verified-icon">✔</span>
        </h3>
        <p>{job.company_name}</p>
        <p>{job.job_location}</p>
        <p className="job-salary">
          {job.salary_min && job.salary_max
            ? `$${job.salary_min} - $${job.salary_max}`
            : "Salary not specified"}
        </p>
        <span className="job-benefits">H1B, Green Card</span>
      </div>
      <div className="job-card__actions">
        <button
          className="icon-button"
          onClick={(e) => {
            e.stopPropagation();
            onSave(job);
          }}
        >
          <BookmarkOutlined className="icon" />
        </button>
        <button
          className="icon-button"
          onClick={(e) => {
            e.stopPropagation();
            onHide(job.job_id);
          }}
        >
          <CloseOutlined className="icon" />
        </button>
      </div>
    </div>
  );
};

export default JobCard;