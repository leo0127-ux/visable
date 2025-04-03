import React from "react";
import { Card } from "antd";
import "./JobCard.scss";

const JobCard = ({ job, onClick }) => {
  return (
    <Card
      title={job.title}
      extra={<a href={job.url} target="_blank" rel="noopener noreferrer">View</a>}
      style={{ marginBottom: "16px" }}
      onClick={onClick}
    >
      <p>Company: {job.company}</p>
      <p>Location: {job.location}</p>
      <p>Salary: ${job.salary_min} - ${job.salary_max}</p>
    </Card>
  );
};

export default JobCard;