import React from "react";
import { Routes, Route } from "react-router-dom";
import SEOList from "./SEOList";
import SEOForm from "./SEOForm";
import SEOView from "./SEOView";
import SEOClientUserReport from "./SEOClientUserReport";

const SEOPanel = () => {
  return (
    <Routes>
      <Route path="/" element={<SEOList />} />
      <Route path="/new" element={<SEOForm />} />
      <Route path="/edit/:id" element={<SEOForm />} />
      <Route path="/view/:id" element={<SEOView />} />
      <Route path="/reports/client-user" element={<SEOClientUserReport />} />
    </Routes>
  );
};

export default SEOPanel;
