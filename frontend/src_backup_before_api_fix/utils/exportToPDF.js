import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportAuditLogsToPDF = (logs) => {
  const doc = new jsPDF();
  const tableData = logs.map((log, index) => [
    index + 1,
    log.action,
    log.actorEmail,
    new Date(log.timestamp).toLocaleString(),
  ]);

  doc.text('Audit Logs', 14, 15);
  doc.autoTable({
    head: [['#', 'Action', 'By', 'Timestamp']],
    body: tableData,
    startY: 20,
  });

  doc.save('audit_logs.pdf');
};