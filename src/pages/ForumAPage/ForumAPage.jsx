import React from "react";
import ForumBPage from "../ForumBPage/ForumBPage";

const ForumAPage = () => {
  return (
    <div>
      <h1>Forum A Page</h1>
      <p>這是論壇 A 的頁面。</p>
      <ForumBPage />
    </div>
  );
};

export default ForumAPage;