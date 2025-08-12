// ✅ Feature: CSV Download Buttons
// 📁 File: src/pages/admin/ExportLogs.js

import React from "react";

const ExportLogs = () => {
  const downloadCSV = (type) => {
    window.open(`/api/admin/export-${type}`, "_blank");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Export Logs</h2>
      <button onClick={() => downloadCSV("login-logs")} className="btn">
        Download Login Logs
      </button>
      <button onClick={() => downloadCSV("audit-logs")} className="btn ml-4">
        Download Audit Logs
      </button>
    </div>
  );
};

export default ExportLogs;
