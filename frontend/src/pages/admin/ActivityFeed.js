import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";

const ActivityFeed = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios
      .get("/api/admin/activity-feed")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error fetching activity feed:", err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Admin Activity Feed</h2>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <Card key={i} className="p-3">
            <div className="text-sm text-gray-500">{log.timestamp}</div>
            <div>
              <strong>{log.actor}</strong> performed <code>{log.action}</code>
            </div>
            {log.target && <div>Target: {log.target}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
