// jsPDF report generator

import { jsPDF } from 'jspdf';
import { HearingReport, ExposureSession } from '@/lib/types';

export function generatePDFReport(
  report: HearingReport,
  session: ExposureSession
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DECIBEL', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Hearing Health Report', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.text(
    `Generated ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 15;

  // Hearing Score
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Hearing Score: ${report.hearing_score}/100`, 20, y);
  y += 8;

  // Risk Level
  doc.setFontSize(12);
  const riskColor = getRiskColor(report.risk_level);
  doc.setTextColor(riskColor.r, riskColor.g, riskColor.b);
  doc.text(`Risk Level: ${report.risk_level.toUpperCase()}`, 20, y);
  y += 12;

  // Session Summary
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Summary', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 40);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 5 + 8;

  // Session Stats
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Session Statistics', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const duration = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : 0;
  const stats = [
    `Duration: ${duration} minutes`,
    `Average: ${session.avgDb.toFixed(1)} dB`,
    `Peak: ${session.maxDb.toFixed(1)} dB`,
    `Time above 85 dB: ${Math.round(session.timeAbove85 / 60)} minutes`,
    `Daily budget used: ${report.daily_budget_used}`,
    `Safe time remaining: ${report.safe_time_remaining}`,
  ];
  stats.forEach(stat => {
    doc.text(stat, 20, y);
    y += 5;
  });
  y += 8;

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Recommendations', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  report.top_3_recommendations.forEach((rec, i) => {
    const recLines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 40);
    doc.text(recLines, 20, y);
    y += recLines.length * 5 + 2;
  });
  y += 6;

  // Long-term Projection
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Long-term Projection', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const projLines = doc.splitTextToSize(report.long_term_projection, pageWidth - 40);
  doc.text(projLines, 20, y);
  y += projLines.length * 5 + 8;

  // Comparison
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Comparison', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const compLines = doc.splitTextToSize(report.comparison, pageWidth - 40);
  doc.text(compLines, 20, y);
  y += compLines.length * 5 + 12;

  // Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    'Disclaimer: This is an awareness tool, not a medical device. Phone microphones are not calibrated instruments.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: 'center' }
  );
  doc.text(
    'Consult an audiologist for professional hearing assessment.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

function getRiskColor(level: string): { r: number; g: number; b: number } {
  switch (level) {
    case 'low': return { r: 34, g: 197, b: 94 };
    case 'moderate': return { r: 245, g: 158, b: 11 };
    case 'high': return { r: 239, g: 68, b: 68 };
    case 'critical': return { r: 220, g: 38, b: 38 };
    default: return { r: 0, g: 0, b: 0 };
  }
}
