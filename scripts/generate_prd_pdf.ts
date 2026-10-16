import * as jspdfModule from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Instantiate jsPDF
const jsPDFClass = (jspdfModule as any).jsPDF || (jspdfModule as any).default?.jsPDF || (jspdfModule as any).default;
const doc = new jsPDFClass({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// A4 dimensions: 210mm x 297mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 180mm

// Color Palette Constants
const COLOR_PRIMARY = [30, 58, 138];       // Deep Navy #1e3a8a
const COLOR_SECONDARY = [37, 99, 235];     // Royal Blue #2563eb
const COLOR_ACCENT = [2, 132, 199];        // Sky #0284c7
const COLOR_DARK = [15, 23, 42];           // Slate 900 #0f172a
const COLOR_MUTED = [100, 116, 139];       // Slate 500 #64748b
const COLOR_LIGHT_BG = [248, 250, 252];    // Slate 50 #f8fafc
const COLOR_BORDER = [226, 232, 240];      // Slate 200 #e2e8f0
const COLOR_SUCCESS = [16, 185, 129];      // Green #10b981
const COLOR_WARNING = [245, 158, 11];      // Amber #f59e0b
const COLOR_CARD_BG = [241, 245, 249];     // Slate 100 #f1f5f9
const COLOR_WHITE = [255, 255, 255];

// Helper: Add running header and footer
function addDecorations(pageDoc: any, pageNum: number, totalPages: number, skipCover: boolean = true) {
  if (skipCover && pageNum === 1) return;

  // Header line
  pageDoc.setDrawColor(226, 232, 240);
  pageDoc.setLineWidth(0.4);
  pageDoc.line(MARGIN, 12, PAGE_WIDTH - MARGIN, 12);

  pageDoc.setFont('helvetica', 'bold');
  pageDoc.setFontSize(7.5);
  pageDoc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pageDoc.text('TRACKMYHOURS', MARGIN, 9.5);

  pageDoc.setFont('helvetica', 'normal');
  pageDoc.setFontSize(7);
  pageDoc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  pageDoc.text('PRODUCT REQUIREMENTS DOCUMENT (PRD) — WITH ARCHITECTURAL DIAGRAMS', MARGIN + 28, 9.5);

  pageDoc.setFont('helvetica', 'bold');
  pageDoc.setFontSize(7);
  pageDoc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  pageDoc.text('PORTFOLIO EDITION v3.2', PAGE_WIDTH - MARGIN, 9.5, { align: 'right' });

  // Footer line
  pageDoc.setDrawColor(226, 232, 240);
  pageDoc.setLineWidth(0.4);
  pageDoc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);

  pageDoc.setFont('helvetica', 'normal');
  pageDoc.setFontSize(7);
  pageDoc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  pageDoc.text('CONFIDENTIAL & PROPRIETARY — CIVIL SERVICE COMPLIANT TIME TRACKING ENGINE', MARGIN, PAGE_HEIGHT - 8);

  pageDoc.setFont('helvetica', 'bold');
  pageDoc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: 'right' });
}

// Helper: Draw Section Title with stylish accent bar
function drawSectionHeader(pageDoc: any, y: number, sectionNumber: string, title: string) {
  pageDoc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pageDoc.rect(MARGIN, y, 4, 11, 'F');

  pageDoc.setFont('helvetica', 'bold');
  pageDoc.setFontSize(13);
  pageDoc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  pageDoc.text(`${sectionNumber}. ${title}`, MARGIN + 7, y + 8);

  pageDoc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pageDoc.setLineWidth(0.3);
  pageDoc.line(MARGIN + 7, y + 12, PAGE_WIDTH - MARGIN, y + 12);

  return y + 18;
}

// Helper: Draw Subsection Header
function drawSubSectionHeader(pageDoc: any, y: number, subtitle: string) {
  pageDoc.setFont('helvetica', 'bold');
  pageDoc.setFontSize(10.5);
  pageDoc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  pageDoc.text(subtitle, MARGIN, y);
  return y + 6;
}

// Helper: Draw Paragraph with automatic word wrap
function drawParagraph(pageDoc: any, text: string, y: number, fontSize: number = 8.5, color: number[] = COLOR_DARK, lineHeight: number = 4.2): number {
  pageDoc.setFont('helvetica', 'normal');
  pageDoc.setFontSize(fontSize);
  pageDoc.setTextColor(color[0], color[1], color[2]);
  const splitText = pageDoc.splitTextToSize(text, CONTENT_WIDTH);
  pageDoc.text(splitText, MARGIN, y);
  return y + (splitText.length * lineHeight);
}

// Helper: Draw Callout Box with left accent
function drawCallout(pageDoc: any, title: string, body: string, y: number, accentColor: number[] = COLOR_SECONDARY): number {
  pageDoc.setFont('helvetica', 'normal');
  pageDoc.setFontSize(8);
  const splitBody = pageDoc.splitTextToSize(body, CONTENT_WIDTH - 12);
  const boxHeight = 10 + (splitBody.length * 3.8);

  // Background
  pageDoc.setFillColor(248, 250, 252);
  pageDoc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, 'F');

  // Left accent bar
  pageDoc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  pageDoc.roundedRect(MARGIN, y, 3, boxHeight, 1, 1, 'F');

  // Border
  pageDoc.setDrawColor(226, 232, 240);
  pageDoc.setLineWidth(0.3);
  pageDoc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, 'S');

  // Title
  pageDoc.setFont('helvetica', 'bold');
  pageDoc.setFontSize(8.5);
  pageDoc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  pageDoc.text(title, MARGIN + 7, y + 6);

  // Text
  pageDoc.setFont('helvetica', 'normal');
  pageDoc.setFontSize(8);
  pageDoc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  pageDoc.text(splitBody, MARGIN + 7, y + 11);

  return y + boxHeight + 4;
}

// ============================================================================
// PAGE 1: COVER PAGE
// ============================================================================
console.log('Generating Page 1: Cover Page...');

// Top Hero Banner
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.rect(0, 0, PAGE_WIDTH, 105, 'F');

// Top Accent Gradient Band
doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
doc.rect(0, 101, PAGE_WIDTH, 4, 'F');

// Light accent shape
doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
doc.circle(PAGE_WIDTH - 20, 25, 45, 'F');
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.circle(PAGE_WIDTH - 20, 25, 42, 'F');

// Title Badge
doc.setFillColor(37, 99, 235);
doc.roundedRect(MARGIN, 22, 54, 7, 2, 2, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(255, 255, 255);
doc.text('OFFICIAL SPECIFICATION', MARGIN + 4, 26.5);

// Main Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(23);
doc.setTextColor(255, 255, 255);
doc.text('PRODUCT REQUIREMENTS', MARGIN, 40);
doc.text('DOCUMENT (PRD)', MARGIN, 50);

// Subtitle
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(191, 219, 254); // Light blue #bfdbfe
doc.text('TrackMyHours — Intelligent Daily Time Record & Biometric Attendance System', MARGIN, 61);

// Description
doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(226, 232, 240);
const coverDesc = 'A tamper-resistant, full-stack biometric attendance and Civil Service Form 48 compliant platform featuring edge neural liveness detection, automated undertime computations, multi-tier role hierarchies, and dual-mode AI assistance.';
doc.text(doc.splitTextToSize(coverDesc, CONTENT_WIDTH - 30), MARGIN, 70);

// Document Attributes Matrix Box
const attrY = 118;
doc.setFillColor(COLOR_CARD_BG[0], COLOR_CARD_BG[1], COLOR_CARD_BG[2]);
doc.roundedRect(MARGIN, attrY, CONTENT_WIDTH, 42, 3, 3, 'F');
doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
doc.setLineWidth(0.4);
doc.roundedRect(MARGIN, attrY, CONTENT_WIDTH, 42, 3, 3, 'S');

// Matrix Columns
const col1 = MARGIN + 8;
const col2 = MARGIN + 68;
const col3 = MARGIN + 128;

const printMetaItem = (label: string, val: string, x: number, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(val, x, y + 5);
};

printMetaItem('Document Version', 'v3.2 Portfolio Release', col1, attrY + 9);
printMetaItem('Author / Lead Engineer', 'Clare Angelie T. Dolino', col2, attrY + 9);
printMetaItem('Target Framework', 'React 19 / Vite / Node Express', col3, attrY + 9);

printMetaItem('Compliance Standard', 'Civil Service Form 48 (PH)', col1, attrY + 23);
printMetaItem('Security Classification', 'Sanitized / Open-Source Demo', col2, attrY + 23);
printMetaItem('Date of Publication', 'October 2026', col3, attrY + 23);

printMetaItem('Biometric Engine', 'Face-API 68-pt Landmark Mesh', col1, attrY + 36);
printMetaItem('Database / Persistence', 'PostgreSQL / Supabase / IDB', col2, attrY + 36);
printMetaItem('AI Grounding', 'Gemini 2.5 Flash / Tool Calling', col3, attrY + 36);

// Executive Abstract on Cover
let curY = 168;
curY = drawCallout(doc, 'EXECUTIVE SUMMARY & SYSTEM CONTEXT', 
  'TrackMyHours resolves systemic attendance inaccuracies, manual spreadsheet compilation burdens, and proxy "buddy punching" across public agencies and university internship programs (OJT & Immersion). It bridges modern browser-based machine learning with rigorous civil service statutory time accounting.', 
  curY, COLOR_PRIMARY);

curY += 2;
// Highlights grid (3 cards)
const cardW = (CONTENT_WIDTH - 8) / 3;
const renderCard = (x: number, y: number, title: string, subtitle: string, desc: string, badgeColor: number[]) => {
  doc.setFillColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.roundedRect(x, y, cardW, 46, 2, 2, 'F');
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, cardW, 46, 2, 2, 'S');

  // Top color bar
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.rect(x, y, cardW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(title, x + 4, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(subtitle, x + 4, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(doc.splitTextToSize(desc, cardW - 8), x + 4, y + 21);
};

renderCard(MARGIN, curY, '100% Anti-Spoofing', 'Neural Edge Biometrics', 'Client-side webcam landmark detection evaluates natural blink and head motion, rejecting static screens and paper printouts in <1.5s.', COLOR_PRIMARY);
renderCard(MARGIN + cardW + 4, curY, 'Instant CS Form 48', 'Precision PDF Reports', 'Generates official, audit-ready Daily Time Record PDFs formatted to exact civil service margins with automatic split-shift undertime accounting.', COLOR_SUCCESS);
renderCard(MARGIN + (cardW * 2) + 8, curY, 'Multi-Role Portals', 'Super Admin to Intern', 'Segregated workflows for Super Admin, HR Coordinators, Regional/Provincial Staff, and OJT/Immersion interns with hour caps and certificates.', COLOR_ACCENT);

// Footer notes on cover
doc.setFont('helvetica', 'italic');
doc.setFontSize(7);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('This document contains comprehensive functional specifications, architectural block diagrams, state transition models, and relational ERDs.', MARGIN, PAGE_HEIGHT - 18);
doc.text('Developed & Architected by Clare Angelie T. Dolino — 2026', MARGIN, PAGE_HEIGHT - 14);

// ============================================================================
// PAGE 2: TABLE OF CONTENTS & PROBLEM STATEMENT
// ============================================================================
doc.addPage();
console.log('Generating Page 2: Problem Statement & Objectives...');

curY = 20;
curY = drawSectionHeader(doc, curY, '1', 'EXECUTIVE OVERVIEW & PROBLEM STATEMENT');

curY = drawSubSectionHeader(doc, curY, '1.1 Problem Statement & Industry Pain Points');
curY = drawParagraph(doc, 
  'Enterprise and governmental institutions in Southeast Asia heavily rely on Civil Service Form 48 for payroll computation, leave administration, and statutory audit compliance. Traditional systems fail across several mission-critical vectors:',
  curY, 8.5, COLOR_DARK, 4.3);

// Problem items bullet cards
const problems = [
  {
    title: '1. Proxy Attendance ("Buddy Punching")',
    desc: 'Paper logbooks and RFID card readers are trivial to spoof. Colleagues punch badges for absent personnel, resulting in unearned payroll outlays and legal non-compliance.'
  },
  {
    title: '2. Complex Split-Session Undertime Math',
    desc: 'Standard civil service schedules mandate four daily punches (AM Arrival, AM Departure, PM Arrival, PM Departure). Calculating daily undertime against 8-hour thresholds with grace minutes and non-working holiday exemptions consumes hundreds of manual HR hours per pay cycle.'
  },
  {
    title: '3. Student Internship (OJT/Immersion) Accountability Gaps',
    desc: 'Academic institutions partner with public agencies to place student interns requiring fixed completion caps (e.g., 300 to 600 hours). Coordinators lack real-time visibility into rendered hours, resulting in fraudulent time records and delayed certificate issuance.'
  },
  {
    title: '4. Rigid Deployment & Infrastructure Vulnerability',
    desc: 'Typical enterprise HR software relies on continuous cloud connectivity. When network lines drop at regional field offices, systems lock up entirely, halting clock-in queues.'
  }
];

problems.forEach(p => {
  doc.setFillColor(254, 242, 242); // Red tint #fef2f2
  doc.roundedRect(MARGIN, curY, CONTENT_WIDTH, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202); // Red border #fecaca
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, curY, CONTENT_WIDTH, 14, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28); // Red text #b91c1c
  doc.text(p.title, MARGIN + 4, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(doc.splitTextToSize(p.desc, CONTENT_WIDTH - 8), MARGIN + 4, curY + 9.5);

  curY += 17;
});

curY += 4;
curY = drawSubSectionHeader(doc, curY, '1.2 Core Business Objectives & Quantifiable Targets');

autoTable(doc, {
  startY: curY,
  head: [['Objective ID', 'Target Metric', 'Baseline (Manual)', 'TrackMyHours Target', 'Validation Methodology']],
  body: [
    ['OBJ-01', 'Biometric Anti-Spoofing', '0% (Honor system / cards)', '99.4% Liveness Accuracy', 'Neural blink & motion test vectors'],
    ['OBJ-02', 'DTR Generation Speed', '25-40 mins per employee', '< 2.0 seconds instant PDF', 'Client-side vector jsPDF pipeline'],
    ['OBJ-03', 'Split-Shift Math Accuracy', '~88% (Arithmetic errors)', '100.0% Exact Compliance', 'Automated civil service undertime formula'],
    ['OBJ-04', 'Zero-Config Recruiter Trial', '>30 mins setup & seeding', '0 mins (1-Click Demo Login)', 'Pre-seeded offline IndexedDB & LocalStorage'],
    ['OBJ-05', 'Offline Resilience', 'System halts on outage', '100% Offline Functional', 'Dual storage: Supabase + Local Fallback']
  ],
  theme: 'striped',
  headStyles: {
    fillColor: [30, 58, 138],
    textColor: [255, 255, 255],
    fontSize: 7.5,
    fontStyle: 'bold',
    halign: 'center'
  },
  bodyStyles: {
    fontSize: 7,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 38 },
    2: { cellWidth: 38 },
    3: { cellWidth: 38, fontStyle: 'bold', textColor: [16, 185, 129] },
    4: { cellWidth: 46 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

curY = (doc as any).lastAutoTable.finalY + 8;

curY = drawSubSectionHeader(doc, curY, '1.3 Target User Personas & Hierarchy');

autoTable(doc, {
  startY: curY,
  head: [['Role / Persona', 'System Scope', 'Key Capabilities & Tasks', 'Primary Security Constraints']],
  body: [
    ['Super Admin', 'Enterprise Root', 'Role management, user archival, global audit logs, emergency punch corrections, system configurations.', 'Immutable audit trail logging; multi-factor verification.'],
    ['Admin (HR / OIC)', 'Operational Head', 'Student & employee time approval, PM departure overrides, document repository curation, certificate issuance.', 'Cannot modify historical records without automatic audit log trigger.'],
    ['Employee', 'Field / Staff', 'Daily split-shift punching (AM/PM In/Out), viewing personal monthly DTRs, accessing regional directives.', 'Device biometric check required; locked once PM departure punched.'],
    ['Student (Intern)', 'OJT / Immersion', 'Punching hours against required total cap (300h/600h), downloading certified DTR, viewing completion bar.', 'Hard stop at maximum curriculum hours; requires Admin approval.']
  ],
  theme: 'grid',
  headStyles: {
    fillColor: [37, 99, 235],
    textColor: [255, 255, 255],
    fontSize: 7.5,
    fontStyle: 'bold'
  },
  bodyStyles: {
    fontSize: 7,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 26, fontStyle: 'bold' },
    1: { cellWidth: 26 },
    2: { cellWidth: 78 },
    3: { cellWidth: 50 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

// ============================================================================
// PAGE 3: DIAGRAM 1 — END-TO-END SYSTEM ARCHITECTURE & VALUE STREAM
// ============================================================================
doc.addPage();
console.log('Generating Page 3: Diagram 1 (System Architecture)...');

curY = 20;
curY = drawSectionHeader(doc, curY, '2', 'VISUAL SYSTEM ARCHITECTURE & VALUE STREAM');

curY = drawParagraph(doc, 
  'The TrackMyHours platform follows a multi-tier decoupled architecture designed for zero latency, edge machine learning execution, and uninterrupted offline resilience. All client biometrics run on the user device via WASM/WebGL before transmission.',
  curY, 8.5, COLOR_DARK, 4.3);

curY += 2;

// Draw Architectural Diagram Box
const diag1Y = curY;
const diag1H = 175;

// Main Diagram Container
doc.setFillColor(250, 250, 250);
doc.roundedRect(MARGIN, diag1Y, CONTENT_WIDTH, diag1H, 3, 3, 'F');
doc.setDrawColor(203, 213, 225);
doc.setLineWidth(0.5);
doc.roundedRect(MARGIN, diag1Y, CONTENT_WIDTH, diag1H, 3, 3, 'S');

// Diagram Title Banner
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.roundedRect(MARGIN, diag1Y, CONTENT_WIDTH, 8, 3, 3, 'F');
doc.rect(MARGIN, diag1Y + 5, CONTENT_WIDTH, 3, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
doc.text('DIAGRAM 1: FIVE-TIER VALUE STREAM & ENTERPRISE ARCHITECTURE', MARGIN + 4, diag1Y + 5.5);

// Tier Function Helper
const drawTierBlock = (y: number, height: number, tierLabel: string, bgColor: number[], borderColor: number[]) => {
  // Tier Background
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(MARGIN + 4, y, CONTENT_WIDTH - 8, height, 2, 2, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN + 4, y, CONTENT_WIDTH - 8, height, 2, 2, 'S');

  // Tier Left Tag
  doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(MARGIN + 4, y, 24, height, 2, 2, 'F');
  doc.rect(MARGIN + 20, y, 8, height, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  // Vertical center tier text
  doc.text(doc.splitTextToSize(tierLabel, 20), MARGIN + 6, y + (height / 2) - 1);
};

// Component Box Helper
const drawComponentBox = (x: number, y: number, w: number, h: number, title: string, subtitle: string, fill: number[] = [255, 255, 255], border: number[] = [203, 213, 225]) => {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(title, x + (w / 2), y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(subtitle, x + (w / 2), y + 8.5, { align: 'center' });
};

// Vertical Connector Arrow Helper
const drawVerticalConnector = (x: number, y1: number, y2: number, label?: string) => {
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(x, y1, x, y2);
  
  // Arrowhead pointing down
  doc.setFillColor(37, 99, 235);
  doc.triangle(x, y2, x - 1.2, y2 - 2, x + 1.2, y2 - 2, 'FD');

  if (label) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(37, 99, 235);
    doc.text(label, x + 2, (y1 + y2) / 2);
  }
};

let tierY = diag1Y + 12;

// TIER 1: CLIENT ACCESS & USER PERSONAS
drawTierBlock(tierY, 24, 'TIER 1:\nPERSONAS', [239, 246, 255], [37, 99, 235]);
const t1ItemW = 32;
drawComponentBox(MARGIN + 32, tierY + 4, t1ItemW, 16, 'Super Admin', 'Governance & Audit');
drawComponentBox(MARGIN + 68, tierY + 4, t1ItemW, 16, 'Admin / HR', 'Approvals & Reports');
drawComponentBox(MARGIN + 104, tierY + 4, t1ItemW, 16, 'Staff Employee', 'Split-Shift Tracking');
drawComponentBox(MARGIN + 140, tierY + 4, t1ItemW, 16, 'Student Intern', 'OJT / Immersion Caps');

drawVerticalConnector(MARGIN + 48, tierY + 24, tierY + 30);
drawVerticalConnector(MARGIN + 84, tierY + 24, tierY + 30);
drawVerticalConnector(MARGIN + 120, tierY + 24, tierY + 30);
drawVerticalConnector(MARGIN + 156, tierY + 24, tierY + 30);

// TIER 2: EDGE BIOMETRIC & SECURITY GATEWAY
tierY += 30;
drawTierBlock(tierY, 26, 'TIER 2:\nEDGE SECURITY', [236, 253, 245], [5, 150, 105]);
const t2ItemW = 42;
drawComponentBox(MARGIN + 32, tierY + 4, t2ItemW, 18, 'Contactless QR Auth', 'Dynamic HMAC Tokens');
drawComponentBox(MARGIN + 78, tierY + 4, t2ItemW + 10, 18, 'Face-API Landmark Mesh', '68-pt Neural Net / WebGL');
drawComponentBox(MARGIN + 134, tierY + 4, t2ItemW, 18, 'Network Guard', 'IP Range & Geofence');

drawVerticalConnector(MARGIN + 53, tierY + 26, tierY + 32);
drawVerticalConnector(MARGIN + 103, tierY + 26, tierY + 32, 'Verified Liveness');
drawVerticalConnector(MARGIN + 155, tierY + 26, tierY + 32);

// TIER 3: CORE APPLICATION & CALCULATION ENGINE
tierY += 32;
drawTierBlock(tierY, 26, 'TIER 3:\nCORE ENGINE', [254, 243, 199], [217, 119, 6]);
drawComponentBox(MARGIN + 32, tierY + 4, 38, 18, 'AM/PM Split Engine', '4 Daily Punch Bounds');
drawComponentBox(MARGIN + 74, tierY + 4, 46, 18, 'Undertime Calculator', 'Form 48 Math (240m/sess)');
drawComponentBox(MARGIN + 124, tierY + 4, 48, 18, 'Public Calendar & Directives', 'Holidays & Category Links');

drawVerticalConnector(MARGIN + 51, tierY + 26, tierY + 32);
drawVerticalConnector(MARGIN + 97, tierY + 26, tierY + 32);
drawVerticalConnector(MARGIN + 148, tierY + 26, tierY + 32);

// TIER 4: OUTPUT, AI & DOCUMENT GENERATION
tierY += 32;
drawTierBlock(tierY, 26, 'TIER 4:\nINTELLIGENCE', [245, 243, 255], [124, 58, 237]);
drawComponentBox(MARGIN + 32, tierY + 4, 40, 18, 'Form 48 PDF Generator', 'Vector jsPDF Engine');
drawComponentBox(MARGIN + 76, tierY + 4, 44, 18, 'Gemini 2.5 Flash Agent', 'Tools: notifyAdmin, photos');
drawComponentBox(MARGIN + 124, tierY + 4, 48, 18, 'Completion Certificate', 'Automated SVG/PDF Badge');

drawVerticalConnector(MARGIN + 52, tierY + 26, tierY + 32);
drawVerticalConnector(MARGIN + 98, tierY + 26, tierY + 32);
drawVerticalConnector(MARGIN + 148, tierY + 26, tierY + 32);

// TIER 5: RESILIENT DUAL-PERSISTENCE LAYER
tierY += 32;
drawTierBlock(tierY, 22, 'TIER 5:\nSTORAGE', [241, 245, 249], [71, 85, 105]);
drawComponentBox(MARGIN + 32, tierY + 3, 66, 16, 'Supabase Cloud PostgreSQL', 'Remote DB & Realtime Subscriptions', [255, 255, 255], [148, 163, 184]);
drawComponentBox(MARGIN + 104, tierY + 3, 68, 16, 'IndexedDB & LocalStorage Fallback', '100% Offline Demo & Recruiter Cache', [255, 255, 255], [148, 163, 184]);

// Diagram Legend & Footnote
curY = diag1Y + diag1H + 4;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('Architecture Highlights: Edge biometrics prevent raw camera frames from leaving the browser. Dual-persistence guarantees seamless zero-configuration execution for recruiters and field offices.', MARGIN, curY);

// ============================================================================
// PAGE 4: DIAGRAM 2 — USER JOURNEY & NAVIGATION FLOWCHART
// ============================================================================
doc.addPage();
console.log('Generating Page 4: Diagram 2 (Navigation Flowchart)...');

curY = 20;
curY = drawSectionHeader(doc, curY, '3', 'USER JOURNEY & ROLE-BASED NAVIGATION ROUTING');

curY = drawParagraph(doc, 
  'The routing matrix enforces strict role-based access control (RBAC). Upon entering the application, unauthenticated sessions are directed to the login portal. Users may authenticate via credentials, QR badge scan, or 1-click recruiter demo buttons.',
  curY, 8.5, COLOR_DARK, 4.3);

curY += 2;

// Draw Flowchart Diagram Container
const diag2Y = curY;
const diag2H = 175;

doc.setFillColor(250, 250, 250);
doc.roundedRect(MARGIN, diag2Y, CONTENT_WIDTH, diag2H, 3, 3, 'F');
doc.setDrawColor(203, 213, 225);
doc.setLineWidth(0.5);
doc.roundedRect(MARGIN, diag2Y, CONTENT_WIDTH, diag2H, 3, 3, 'S');

// Diagram Title Banner
doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
doc.roundedRect(MARGIN, diag2Y, CONTENT_WIDTH, 8, 3, 3, 'F');
doc.rect(MARGIN, diag2Y + 5, CONTENT_WIDTH, 3, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
doc.text('DIAGRAM 2: ROLE-BASED ROUTING & STATE DISPATCH FLOWCHART', MARGIN + 4, diag2Y + 5.5);

// Helper for Flowchart Nodes
const drawPillNode = (x: number, y: number, w: number, h: number, text: string, fill: number[], textCol: number[] = [255, 255, 255]) => {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textCol[0], textCol[1], textCol[2]);
  doc.text(text, x + (w / 2), y + (h / 2) + 1.2, { align: 'center' });
};

const drawDecisionDiamond = (x: number, y: number, size: number, text: string) => {
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);

  const cx = x;
  const cy = y;
  const s = size / 2;

  doc.lines([[s, -s], [s, s], [-s, s], [-s, -s]], cx - s, cy, [1, 1], 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  const lines = doc.splitTextToSize(text, size - 4);
  doc.text(lines, cx, cy - (lines.length * 1.5) + 2, { align: 'center' });
};

// Flowchart Layout Coordinates
const fcCenterX = MARGIN + (CONTENT_WIDTH / 2);

// Step 1: Start Node
drawPillNode(fcCenterX - 25, diag2Y + 12, 50, 8, 'User Access: /', COLOR_PRIMARY);

// Down Arrow to Login
drawVerticalConnector(fcCenterX, diag2Y + 20, diag2Y + 25);

// Step 2: Login Box
doc.setFillColor(255, 255, 255);
doc.roundedRect(fcCenterX - 45, diag2Y + 25, 90, 16, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
doc.text('Login Portal (Authentication Gateway)', fcCenterX, diag2Y + 30, { align: 'center' });
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.5);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('• Username / Password   • Contactless QR Code   • 1-Click Recruiter Demo', fcCenterX, diag2Y + 36, { align: 'center' });

// Arrow to Authenticate Check
drawVerticalConnector(fcCenterX, diag2Y + 41, diag2Y + 47);

// Step 3: Decision Diamond
drawDecisionDiamond(fcCenterX, diag2Y + 54, 16, 'Role\nCheck?');

// Branching Lines for Roles
// Left Branch: Super Admin / Admin
doc.setDrawColor(37, 99, 235);
doc.line(fcCenterX - 8, diag2Y + 54, fcCenterX - 65, diag2Y + 54);
doc.line(fcCenterX - 65, diag2Y + 54, fcCenterX - 65, diag2Y + 68);
doc.triangle(fcCenterX - 65, diag2Y + 68, fcCenterX - 66.2, diag2Y + 66, fcCenterX - 63.8, diag2Y + 66, 'FD');

// Middle Branch: Employee
doc.line(fcCenterX, diag2Y + 62, fcCenterX, diag2Y + 68);
doc.triangle(fcCenterX, diag2Y + 68, fcCenterX - 1.2, diag2Y + 66, fcCenterX + 1.2, diag2Y + 66, 'FD');

// Right Branch: Student
doc.line(fcCenterX + 8, diag2Y + 54, fcCenterX + 65, diag2Y + 54);
doc.line(fcCenterX + 65, diag2Y + 54, fcCenterX + 65, diag2Y + 68);
doc.triangle(fcCenterX + 65, diag2Y + 68, fcCenterX + 63.8, diag2Y + 66, fcCenterX + 66.2, diag2Y + 66, 'FD');

// Labels on branches
doc.setFont('helvetica', 'bold');
doc.setFontSize(6.5);
doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.text('SUPER_ADMIN / ADMIN', fcCenterX - 38, diag2Y + 52);
doc.text('EMPLOYEE', fcCenterX + 3, diag2Y + 65);
doc.text('STUDENT (OJT/IMM)', fcCenterX + 22, diag2Y + 52);

// PORTAL CONTAINERS (3 Columns)
const pColW = 54;
const pColY = diag2Y + 68;

// Column 1: Admin Flow
doc.setFillColor(239, 246, 255);
doc.roundedRect(MARGIN + 4, pColY, pColW, 88, 2, 2, 'F');
doc.setDrawColor(191, 219, 254);
doc.roundedRect(MARGIN + 4, pColY, pColW, 88, 2, 2, 'S');

doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.roundedRect(MARGIN + 4, pColY, pColW, 7, 2, 2, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(255, 255, 255);
doc.text('ADMINISTRATIVE PORTAL', MARGIN + 4 + (pColW / 2), pColY + 4.8, { align: 'center' });

const adminViews = [
  '• /admin — Dashboard & Stats',
  '• /admin/students — Intern Rosters',
  '• /admin/employees — Staff Rosters',
  '• /admin/attendance — Record Grids',
  '• /admin/attendance-input — Manual Fix',
  '• /admin/document-links — Directives',
  '• /admin/notifications — Inbox & Alerts',
  '• /admin/logs — Tamper-Evident Logs',
  '• /admin/archived — Archival History'
];
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.2);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
adminViews.forEach((v, idx) => {
  doc.text(v, MARGIN + 7, pColY + 13 + (idx * 8.2));
});

// Column 2: Employee Flow
doc.setFillColor(240, 253, 244);
doc.roundedRect(MARGIN + 10 + pColW, pColY, pColW, 88, 2, 2, 'F');
doc.setDrawColor(187, 247, 208);
doc.roundedRect(MARGIN + 10 + pColW, pColY, pColW, 88, 2, 2, 'S');

doc.setFillColor(5, 150, 105);
doc.roundedRect(MARGIN + 10 + pColW, pColY, pColW, 7, 2, 2, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(255, 255, 255);
doc.text('STAFF EMPLOYEE PORTAL', MARGIN + 10 + pColW + (pColW / 2), pColY + 4.8, { align: 'center' });

const empViews = [
  '• /employee — Attendance Overview',
  '• /employee/dtr — Form 48 Preview',
  '• /realtime — Biometric Clock In/Out',
  '• /employee/assignments — Links',
  '• /employee/profile — User Details',
  '• Edge Face Liveness Challenge',
  '• Undertime Balance Indicator',
  '• PDF Form 48 Export Button'
];
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.2);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
empViews.forEach((v, idx) => {
  doc.text(v, MARGIN + 13 + pColW, pColY + 13 + (idx * 8.2));
});

// Column 3: Student Flow
doc.setFillColor(254, 243, 199);
doc.roundedRect(MARGIN + 16 + (pColW * 2), pColY, pColW, 88, 2, 2, 'F');
doc.setDrawColor(253, 230, 138);
doc.roundedRect(MARGIN + 16 + (pColW * 2), pColY, pColW, 88, 2, 2, 'S');

doc.setFillColor(217, 119, 6);
doc.roundedRect(MARGIN + 16 + (pColW * 2), pColY, pColW, 7, 2, 2, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(255, 255, 255);
doc.text('STUDENT INTERN PORTAL', MARGIN + 16 + (pColW * 2) + (pColW / 2), pColY + 4.8, { align: 'center' });

const stuViews = [
  '• /student — Hours Progress Bar',
  '• /student/dtr — Monthly Timesheet',
  '• /realtime — Biometric Camera',
  '• /student/logs — Punch History',
  '• /student/profile — Certificate',
  '• OJT vs Immersion Hours Cap',
  '• Target Hours (300h / 600h)',
  '• Completion Certificate Download'
];
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.2);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
stuViews.forEach((v, idx) => {
  doc.text(v, MARGIN + 19 + (pColW * 2), pColY + 13 + (idx * 8.2));
});

// Bottom Shared Services Banner
doc.setFillColor(241, 245, 249);
doc.roundedRect(MARGIN + 4, pColY + 91, CONTENT_WIDTH - 8, 11, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN + 4, pColY + 91, CONTENT_WIDTH - 8, 11, 2, 2, 'S');
doc.setFont('helvetica', 'bold');
doc.setFontSize(6.8);
doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.text('SHARED CROSS-CUTTING MODULES (AVAILABLE IN ALL ROLES):', MARGIN + 8, pColY + 95.5);
doc.setFont('helvetica', 'normal');
doc.setFontSize(6);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('• Gemini AI Assistant Chatbot (Demo/Live API)   • Public Calendar & Holidays Modal   • Network Geofence Guard   • Audit Logger', MARGIN + 8, pColY + 99.5);

curY = diag2Y + diag2H + 4;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('Flow Summary: Strict role guards prevent unauthorized traversal. Deactivated users are instantly logged out and barred from punching.', MARGIN, curY);

// ============================================================================
// PAGE 5: DIAGRAM 3 & 4 — BIOMETRICS STATE MACHINE & DATABASE ERD
// ============================================================================
doc.addPage();
console.log('Generating Page 5: Diagram 3 (Biometrics) & Diagram 4 (ERD)...');

curY = 20;
curY = drawSectionHeader(doc, curY, '4', 'BIOMETRIC STATE MACHINE & RELATIONAL DATA MODEL');

curY = drawSubSectionHeader(doc, curY, '4.1 Diagram 3: Edge Biometric Face Liveness Verification State Machine');

// Draw Diagram 3 Box (Height: 65mm)
const diag3Y = curY + 1;
const diag3H = 65;
doc.setFillColor(250, 250, 250);
doc.roundedRect(MARGIN, diag3Y, CONTENT_WIDTH, diag3H, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN, diag3Y, CONTENT_WIDTH, diag3H, 2, 2, 'S');

// Title Banner
doc.setFillColor(5, 150, 105);
doc.roundedRect(MARGIN, diag3Y, CONTENT_WIDTH, 6.5, 2, 2, 'F');
doc.rect(MARGIN, diag3Y + 4, CONTENT_WIDTH, 2.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);
doc.setTextColor(255, 255, 255);
doc.text('DIAGRAM 3: CLIENT-SIDE NEURAL FACE LIVENESS & ANTI-SPOOFING PIPELINE', MARGIN + 4, diag3Y + 4.5);

// State Pipeline Horizontal Boxes (5 Steps)
const sBoxW = 31;
const sBoxH = 34;
const sBoxY = diag3Y + 12;

const drawStateNode = (x: number, stepNum: string, title: string, sub: string, tag: string) => {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, sBoxY, sBoxW, sBoxH, 2, 2, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, sBoxY, sBoxW, sBoxH, 2, 2, 'S');

  // Step Number Badge
  doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.circle(x + (sBoxW / 2), sBoxY + 5, 3.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text(stepNum, x + (sBoxW / 2), sBoxY + 6.2, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(title, x + (sBoxW / 2), sBoxY + 13, { align: 'center' });

  // Sub
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(doc.splitTextToSize(sub, sBoxW - 4), x + (sBoxW / 2), sBoxY + 17, { align: 'center' });

  // Bottom Tag
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x + 2, sBoxY + sBoxH - 7, sBoxW - 4, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.text(tag, x + (sBoxW / 2), sBoxY + sBoxH - 3.5, { align: 'center' });
};

drawStateNode(MARGIN + 4, '1', 'Webcam Init', 'MediaDevices stream (640x480 resolution)', 'VIDEO READY');
drawStateNode(MARGIN + 39, '2', 'Face Track', 'tinyFaceDetector model (Confidence >0.70)', 'BOUNDING BOX');
drawStateNode(MARGIN + 74, '3', 'Landmarks', '68-point neural mesh for eyes, nose, mouth', 'EAR / MAR MESH');
drawStateNode(MARGIN + 109, '4', 'Liveness Test', 'Eye aspect ratio blink or head yaw challenge', 'CHALLENGE EVAL');
drawStateNode(MARGIN + 144, '5', 'DTR Commit', 'Timestamp locked; anti-spoof proof saved', 'TIMESTAMPED');

// Horizontal Arrows between states
const drawHArrow = (x1: number, x2: number, y: number) => {
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.6);
  doc.line(x1, y, x2, y);
  doc.setFillColor(5, 150, 105);
  doc.triangle(x2, y, x2 - 2, y - 1.2, x2 - 2, y + 1.2, 'FD');
};

drawHArrow(MARGIN + 35, MARGIN + 38.5, sBoxY + 16);
drawHArrow(MARGIN + 70, MARGIN + 73.5, sBoxY + 16);
drawHArrow(MARGIN + 105, MARGIN + 108.5, sBoxY + 16);
drawHArrow(MARGIN + 140, MARGIN + 143.5, sBoxY + 16);

// Decision callout inside diagram 3
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.2);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
doc.text('Pass Condition: Eye Aspect Ratio (EAR) drops below 0.20 (natural blink) within 4 seconds. Static photos/videos fail automatically.', MARGIN + 6, diag3Y + diag3H - 7);
doc.text('Security Fallback: If camera permission is denied, system prompts administrator password override with mandatory activity audit record.', MARGIN + 6, diag3Y + diag3H - 3.5);

curY = diag3Y + diag3H + 7;
curY = drawSubSectionHeader(doc, curY, '4.2 Diagram 4: Relational Entity-Relationship Diagram (ERD)');

// Draw Diagram 4 Box (Height: 88mm)
const diag4Y = curY + 1;
const diag4H = 88;
doc.setFillColor(250, 250, 250);
doc.roundedRect(MARGIN, diag4Y, CONTENT_WIDTH, diag4H, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN, diag4Y, CONTENT_WIDTH, diag4H, 2, 2, 'S');

// Title Banner
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.roundedRect(MARGIN, diag4Y, CONTENT_WIDTH, 6.5, 2, 2, 'F');
doc.rect(MARGIN, diag4Y + 4, CONTENT_WIDTH, 2.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);
doc.setTextColor(255, 255, 255);
doc.text('DIAGRAM 4: RELATIONAL DATABASE ENTITY-RELATIONSHIP SCHEMA (POSTGRESQL / SUPABASE)', MARGIN + 4, diag4Y + 4.5);

// ERD Table Box Helper
const drawERDTable = (x: number, y: number, w: number, tableName: string, fields: { name: string; type: string; key?: string }[]) => {
  const h = 7 + (fields.length * 4.0);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');

  // Table Header
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.roundedRect(x, y, w, 5.2, 1.5, 1.5, 'F');
  doc.rect(x, y + 3.2, w, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(tableName, x + 3, y + 3.8);

  // Fields
  fields.forEach((f, idx) => {
    const fy = y + 8.8 + (idx * 4.0);
    doc.setFont('helvetica', f.key ? 'bold' : 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(f.key === 'PK' ? 220 : f.key === 'FK' ? 37 : 15, f.key === 'PK' ? 38 : f.key === 'FK' ? 99 : 23, f.key === 'PK' ? 38 : f.key === 'FK' ? 235 : 42);
    
    const keyLabel = f.key ? `[${f.key}] ` : '';
    doc.text(`${keyLabel}${f.name}`, x + 3, fy);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.0);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(f.type, x + w - 3, fy, { align: 'right' });
  });
};

// 1. Users Table
drawERDTable(MARGIN + 4, diag4Y + 10, 46, 'users', [
  { name: 'id', type: 'TEXT', key: 'PK' },
  { name: 'role', type: 'TEXT' },
  { name: 'username', type: 'TEXT' },
  { name: 'password', type: 'TEXT' },
  { name: 'profile', type: 'JSONB' },
  { name: 'isActive', type: 'BOOLEAN' },
  { name: 'created_at', type: 'TIMESTAMPTZ' }
]);

// 2. Attendance Records Table
drawERDTable(MARGIN + 55, diag4Y + 10, 62, 'attendance_records', [
  { name: 'id', type: 'TEXT', key: 'PK' },
  { name: 'userId', type: 'TEXT', key: 'FK' },
  { name: 'date', type: 'TEXT (YYYY-MM-DD)' },
  { name: 'amIn', type: 'TEXT (HH:mm)' },
  { name: 'amOut', type: 'TEXT (HH:mm)' },
  { name: 'pmIn', type: 'TEXT (HH:mm)' },
  { name: 'pmOut', type: 'TEXT (HH:mm)' },
  { name: 'renderedMinutes', type: 'INT' },
  { name: 'undertimeMinutes', type: 'INT' },
  { name: 'isLocked', type: 'BOOLEAN' },
  { name: 'isMerged', type: 'BOOLEAN' },
  { name: 'remarks', type: 'TEXT' },
  { name: 'remarksHours', type: 'NUMERIC' }
]);

// 3. Activity Logs Table
drawERDTable(MARGIN + 122, diag4Y + 10, 54, 'activity_logs', [
  { name: 'id', type: 'TEXT', key: 'PK' },
  { name: 'userId', type: 'TEXT', key: 'FK' },
  { name: 'userName', type: 'TEXT' },
  { name: 'action', type: 'TEXT' },
  { name: 'details', type: 'TEXT' },
  { name: 'timestamp', type: 'TEXT' },
  { name: 'ipAddress', type: 'TEXT' }
]);

// 4. Document Links Table
drawERDTable(MARGIN + 4, diag4Y + 45, 46, 'document_links', [
  { name: 'id', type: 'TEXT', key: 'PK' },
  { name: 'title', type: 'TEXT' },
  { name: 'url', type: 'TEXT' },
  { name: 'category', type: 'TEXT' },
  { name: 'targetAudience', type: 'TEXT' },
  { name: 'addedBy', type: 'TEXT' }
]);

// 5. Calendar Notes Table
drawERDTable(MARGIN + 122, diag4Y + 45, 54, 'calendar_notes', [
  { name: 'id', type: 'TEXT', key: 'PK' },
  { name: 'date', type: 'TEXT' },
  { name: 'note', type: 'TEXT' },
  { name: 'type', type: 'TEXT' },
  { name: 'createdBy', type: 'TEXT' }
]);

// Foreign Key Connectors
doc.setDrawColor(37, 99, 235);
doc.setLineWidth(0.5);
// users -> attendance_records line
doc.line(MARGIN + 50, diag4Y + 14, MARGIN + 55, diag4Y + 14);
doc.circle(MARGIN + 50, diag4Y + 14, 0.8, 'F');
doc.circle(MARGIN + 55, diag4Y + 14, 0.8, 'F');

// users -> activity_logs line
doc.line(MARGIN + 117, diag4Y + 14, MARGIN + 122, diag4Y + 14);
doc.circle(MARGIN + 117, diag4Y + 14, 0.8, 'F');
doc.circle(MARGIN + 122, diag4Y + 14, 0.8, 'F');

// Bottom ERD Summary Box
doc.setFillColor(241, 245, 249);
doc.roundedRect(MARGIN + 4, diag4Y + 70, CONTENT_WIDTH - 8, 14, 1.5, 1.5, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN + 4, diag4Y + 70, CONTENT_WIDTH - 8, 14, 1.5, 1.5, 'S');

doc.setFont('helvetica', 'bold');
doc.setFontSize(6.2);
doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.text('KEY SCHEMA RELATIONSHIPS & CONSTRAINTS:', MARGIN + 8, diag4Y + 75);

doc.setFont('helvetica', 'normal');
doc.setFontSize(5.8);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('• users (1) ———< (N) attendance_records (Foreign Key: userId references users.id)', MARGIN + 8, diag4Y + 79);
doc.text('• users (1) ———< (N) activity_logs (Foreign Key: userId references users.id) | Dual Storage: IndexedDB mirrors PostgreSQL schema', MARGIN + 8, diag4Y + 82.5);

// ============================================================================
// PAGE 6: DIAGRAM 5 — DTR FORM 48 CALCULATION & SPLIT-SHIFT TIMELINE
// ============================================================================
doc.addPage();
console.log('Generating Page 6: Diagram 5 (DTR Form 48 Calculation)...');

curY = 20;
curY = drawSectionHeader(doc, curY, '5', 'CIVIL SERVICE FORM 48 CALCULATION ARCHITECTURE');

curY = drawParagraph(doc, 
  'Civil Service Form 48 requires strict split-session computation across morning and afternoon shifts. Unlike generic 8-hour time clocks that allow clocking in late and staying late, civil service standards penalize individual session undertime.',
  curY, 8.5, COLOR_DARK, 4.3);

curY += 2;

// Draw Diagram 5 Box (Height: 100mm)
const diag5Y = curY;
const diag5H = 98;
doc.setFillColor(250, 250, 250);
doc.roundedRect(MARGIN, diag5Y, CONTENT_WIDTH, diag5H, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN, diag5Y, CONTENT_WIDTH, diag5H, 2, 2, 'S');

// Title Banner
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.roundedRect(MARGIN, diag5Y, CONTENT_WIDTH, 6.5, 2, 2, 'F');
doc.rect(MARGIN, diag5Y + 4, CONTENT_WIDTH, 2.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);
doc.setTextColor(255, 255, 255);
doc.text('DIAGRAM 5: DAILY TIME RECORD (CS FORM 48) SPLIT-SHIFT TIMELINE & UNDERTIME MATRIX', MARGIN + 4, diag5Y + 4.5);

// Visual Timeline Graphic
const tlY = diag5Y + 16;
const tlW = CONTENT_WIDTH - 20;
const tlStartX = MARGIN + 10;

// Shift Background Bars
// AM Shift: 8:00 AM to 12:00 PM (Width: 40% of timeline)
const amW = tlW * 0.42;
doc.setFillColor(219, 234, 254); // Blue tint
doc.rect(tlStartX, tlY, amW, 14, 'F');

// Lunch Break: 12:00 PM to 1:00 PM (Width: 16% of timeline)
const lunchW = tlW * 0.16;
doc.setFillColor(241, 245, 249); // Gray tint
doc.rect(tlStartX + amW, tlY, lunchW, 14, 'F');

// PM Shift: 1:00 PM to 5:00 PM (Width: 42% of timeline)
const pmW = tlW * 0.42;
doc.setFillColor(220, 252, 231); // Green tint
doc.rect(tlStartX + amW + lunchW, tlY, pmW, 14, 'F');

// Shift Labels
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(30, 58, 138);
doc.text('AM SESSION (4.0 Hours Max / 240 Mins)', tlStartX + (amW / 2), tlY + 8, { align: 'center' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(6.5);
doc.setTextColor(100, 116, 139);
doc.text('LUNCH RECESS', tlStartX + amW + (lunchW / 2), tlY + 8, { align: 'center' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(22, 101, 52);
doc.text('PM SESSION (4.0 Hours Max / 240 Mins)', tlStartX + amW + lunchW + (pmW / 2), tlY + 8, { align: 'center' });

// Timeline Checkpoints
const drawCheckpoint = (x: number, timeStr: string, label: string) => {
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(x, tlY - 3, x, tlY + 17);

  doc.setFillColor(30, 58, 138);
  doc.circle(x, tlY + 7, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(timeStr, x, tlY - 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(37, 99, 235);
  doc.text(label, x, tlY + 20.5, { align: 'center' });
};

drawCheckpoint(tlStartX, '8:00 AM', 'amIn');
drawCheckpoint(tlStartX + amW, '12:00 PM', 'amOut');
drawCheckpoint(tlStartX + amW + lunchW, '1:00 PM', 'pmIn');
drawCheckpoint(tlStartX + amW + lunchW + pmW, '5:00 PM', 'pmOut');

// Undertime Mathematical Formula Callout
const mathY = tlY + 28;
doc.setFillColor(255, 255, 255);
doc.roundedRect(MARGIN + 6, mathY, CONTENT_WIDTH - 12, 48, 1.5, 1.5, 'FD');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN + 6, mathY, CONTENT_WIDTH - 12, 48, 1.5, 1.5, 'S');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.text('STATUTORY UNDERTIME FORMULA & ROUNDING SPECIFICATIONS', MARGIN + 10, mathY + 6);

const formulaPoints = [
  '1. Morning Session: AM_Rendered = max(0, min(12:00, amOut) - max(8:00, amIn)). Undertime_AM = max(0, 240 - AM_Rendered).',
  '2. Afternoon Session: PM_Rendered = max(0, min(17:00, pmOut) - max(13:00, pmIn)). Undertime_PM = max(0, 240 - PM_Rendered).',
  '3. Daily Undertime Total = Undertime_AM + Undertime_PM. Expressed on DTR in Hours (floor(mins/60)) and Minutes (mins % 60).',
  '4. Overtime Isolation: Staying past 5:00 PM (e.g. clocking out at 6:30 PM) CANNOT offset morning tardiness under civil service rules.',
  '5. Merged Holiday / Leave Rows: When "isMerged" is set, standard punch cells are joined into a centered remark string (e.g., "HOLIDAY", "OFFICIAL TRAVEL") with statutory credited hours (default: 8.0 hrs).'
];

doc.setFont('helvetica', 'normal');
doc.setFontSize(6.4);
doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
let ptY = mathY + 12.5;
formulaPoints.forEach((fp) => {
  const splitPt = doc.splitTextToSize(fp, CONTENT_WIDTH - 24);
  doc.text(splitPt, MARGIN + 10, ptY);
  ptY += (splitPt.length * 3.4) + 1.8;
});

curY = diag5Y + diag5H + 6;
curY = drawSubSectionHeader(doc, curY, '5.2 Sample Form 48 Monthly Export Calibration Table');

autoTable(doc, {
  startY: curY,
  head: [['Day', 'AM Arrival', 'AM Departure', 'PM Arrival', 'PM Departure', 'Rendered (Hrs)', 'Undertime (Min)', 'Status / Remarks']],
  body: [
    ['01', '07:54 AM', '12:02 PM', '12:55 PM', '05:03 PM', '8.00', '0 mins', 'Regular Full Day'],
    ['02', '08:14 AM', '12:00 PM', '01:00 PM', '05:00 PM', '7.77', '14 mins', 'Tardy (14m AM)'],
    ['03', '08:00 AM', '12:00 PM', '01:00 PM', '04:20 PM', '7.33', '40 mins', 'Undertime (40m PM)'],
    ['04', '08:00 AM', '12:00 PM', '---', '---', '4.00', '240 mins', 'Half-Day (PM Leave)'],
    ['05', '--- NATIONAL HEROES DAY (OFFICIAL NON-WORKING HOLIDAY) ---', '', '', '', '8.00', '0 mins', 'Merged Row (Credited 8h)']
  ],
  theme: 'grid',
  headStyles: {
    fillColor: [30, 58, 138],
    textColor: [255, 255, 255],
    fontSize: 7,
    fontStyle: 'bold',
    halign: 'center'
  },
  bodyStyles: {
    fontSize: 6.8,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 12, halign: 'center' },
    1: { cellWidth: 22, halign: 'center' },
    2: { cellWidth: 22, halign: 'center' },
    3: { cellWidth: 22, halign: 'center' },
    4: { cellWidth: 22, halign: 'center' },
    5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
    6: { cellWidth: 24, halign: 'center', textColor: [220, 38, 38] },
    7: { cellWidth: 34 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

// ============================================================================
// PAGE 7: FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS MATRIX
// ============================================================================
doc.addPage();
console.log('Generating Page 7: Requirements Matrix...');

curY = 20;
curY = drawSectionHeader(doc, curY, '6', 'FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS MATRIX');

curY = drawSubSectionHeader(doc, curY, '6.1 Functional Requirements Matrix (FR)');

autoTable(doc, {
  startY: curY,
  head: [['Req ID', 'Module', 'Requirement Description', 'Priority', 'Status', 'Verification Method']],
  body: [
    ['FR-1.1', 'Auth', 'Credential login (Username/Password) for all 4 roles', 'P0', 'VERIFIED', 'Automated E2E form test'],
    ['FR-1.2', 'Auth', 'Contactless QR Code mobile camera authentication', 'P0', 'VERIFIED', 'Html5Qrcode scanner test'],
    ['FR-1.3', 'Biometrics', 'Face landmark liveness check (68-pt mesh / blink)', 'P0', 'VERIFIED', 'Face-API WebGL simulation'],
    ['FR-1.4', 'Recruiter', '1-Click Demo Login switcher without password entry', 'P0', 'VERIFIED', 'Recruiter trial flow'],
    ['FR-2.1', 'Attendance', 'Enforce 4-punch daily checkpoints (amIn, amOut, pmIn, pmOut)', 'P0', 'VERIFIED', 'Unit tests on time engine'],
    ['FR-2.2', 'Attendance', 'Calculate undertime & rendered hours vs 8h civil service rule', 'P0', 'VERIFIED', 'DTR calculation tests'],
    ['FR-2.3', 'Attendance', 'Support locked states (isLocked, isPmDepartureLocked)', 'P1', 'VERIFIED', 'Role privilege tests'],
    ['FR-2.4', 'Attendance', 'Merged rows for holidays, travels, and medical leave', 'P1', 'VERIFIED', 'Table rendering validation'],
    ['FR-3.1', 'Reporting', 'Export Civil Service Form 48 PDF with signature lines', 'P0', 'VERIFIED', 'Vector jsPDF output check'],
    ['FR-3.2', 'Reporting', 'Automated Certificate of Completion for fulfilled hours', 'P1', 'VERIFIED', 'Student cap trigger test'],
    ['FR-4.1', 'Documents', 'Directive repository filtered by Regional/Province staff', 'P1', 'VERIFIED', 'Filter matrix check'],
    ['FR-5.1', 'AI Assistant', 'Gemini AI Chatbot with offline rule-based fallback mode', 'P1', 'VERIFIED', 'Simulated tool dispatching'],
    ['FR-5.2', 'AI Assistant', 'Trigger admin notifications (e.g. notifyAdmin, photos)', 'P2', 'VERIFIED', 'Context dispatch test']
  ],
  theme: 'striped',
  headStyles: {
    fillColor: [30, 58, 138],
    textColor: [255, 255, 255],
    fontSize: 7,
    fontStyle: 'bold'
  },
  bodyStyles: {
    fontSize: 6.5,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 20 },
    2: { cellWidth: 80 },
    3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    4: { cellWidth: 18, halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
    5: { cellWidth: 32 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

curY = (doc as any).lastAutoTable.finalY + 8;
curY = drawSubSectionHeader(doc, curY, '6.2 Non-Functional Requirements Matrix (NFR)');

autoTable(doc, {
  startY: curY,
  head: [['NFR ID', 'Category', 'Target Benchmark & Acceptance Criterion', 'Measurement Protocol']],
  body: [
    ['NFR-1', 'Security', 'All sensitive government identifiers and live keys sanitized from source control.', 'Static analysis & automated git commit secret scanner.'],
    ['NFR-2', 'Latency', 'Edge biometric evaluation under 1,500ms; PDF rendering under 2,000ms.', 'Chrome DevTools Performance Profiler on 4x CPU throttle.'],
    ['NFR-3', 'Offline Resilience', '100% operational in offline demo mode without Supabase connection.', 'Network offline toggle test; IndexedDB persistence verify.'],
    ['NFR-4', 'Responsiveness', 'Responsive layout integrity across Desktop (1920x1080), Tablet (768x1024), Mobile (375x667).', 'Automated viewport emulation & CSS Flex/Grid audit.']
  ],
  theme: 'grid',
  headStyles: {
    fillColor: [37, 99, 235],
    textColor: [255, 255, 255],
    fontSize: 7,
    fontStyle: 'bold'
  },
  bodyStyles: {
    fontSize: 6.5,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 26, fontStyle: 'bold' },
    2: { cellWidth: 96 },
    3: { cellWidth: 40 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

// ============================================================================
// PAGE 8: TECHNICAL STACK, SECURITY & FORMAL SIGN-OFF
// ============================================================================
doc.addPage();
console.log('Generating Page 8: Technical Stack & Sign-off...');

curY = 20;
curY = drawSectionHeader(doc, curY, '7', 'TECHNICAL STACK SPECIFICATIONS & FORMAL SIGN-OFF');

curY = drawSubSectionHeader(doc, curY, '7.1 Complete Production Technology Stack');

autoTable(doc, {
  startY: curY,
  head: [['Layer', 'Technology / Package', 'Version', 'Architecture Role & Purpose']],
  body: [
    ['Frontend Framework', 'React / TypeScript', '19.2 / 5.8', 'Component-based SPA, strict type safety, modular barrel exports.'],
    ['Bundler & Dev Server', 'Vite / ESBuild / TSX', '6.2 / 0.28', 'Sub-second HMR, optimized production tree-shaking and minification.'],
    ['Biometric ML Models', '@vladmandic/face-api', '1.7.15', 'WASM-accelerated 68-point neural landmark tracking and blink analysis.'],
    ['PDF Document Engine', 'jsPDF & jspdf-autotable', '4.2 / 5.0', 'High-precision vector generation of Civil Service Form 48 timesheets.'],
    ['QR Scanner Engine', 'html5-qrcode', '2.3.8', 'Contactless camera-based token identification for badges and mobiles.'],
    ['Cloud Persistence', '@supabase/supabase-js', '2.97.0', 'PostgreSQL database with real-time subscriptions and RLS.'],
    ['Local Persistence', 'LocalForage / IndexedDB', '1.10.0', 'Offline-first asynchronous key-value storage for zero-config demo.'],
    ['AI Reasoning Layer', '@google/genai', '1.42.0', 'Gemini 2.5 Flash integration with automated tool calling and fallback.']
  ],
  theme: 'striped',
  headStyles: {
    fillColor: [30, 58, 138],
    textColor: [255, 255, 255],
    fontSize: 7,
    fontStyle: 'bold'
  },
  bodyStyles: {
    fontSize: 6.8,
    textColor: [15, 23, 42]
  },
  columnStyles: {
    0: { cellWidth: 32, fontStyle: 'bold' },
    1: { cellWidth: 42, fontStyle: 'bold', textColor: [37, 99, 235] },
    2: { cellWidth: 18, halign: 'center' },
    3: { cellWidth: 88 }
  },
  margin: { left: MARGIN, right: MARGIN }
});

curY = (doc as any).lastAutoTable.finalY + 8;
curY = drawSubSectionHeader(doc, curY, '7.2 Formal Engineering Approval & Sign-Off Block');

// Sign-off Card Box
const signY = curY;
const signH = 68;
doc.setFillColor(248, 250, 252);
doc.roundedRect(MARGIN, signY, CONTENT_WIDTH, signH, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(MARGIN, signY, CONTENT_WIDTH, signH, 2, 2, 'S');

// Sign-off Title
doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
doc.roundedRect(MARGIN, signY, CONTENT_WIDTH, 6.5, 2, 2, 'F');
doc.rect(MARGIN, signY + 4, CONTENT_WIDTH, 2.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);
doc.setTextColor(255, 255, 255);
doc.text('FORMAL PRODUCT SPECIFICATION APPROVAL & AUDIT VERIFICATION', MARGIN + 4, signY + 4.5);

// 3 Signature Columns
const sigW = (CONTENT_WIDTH - 16) / 3;
const renderSignatureBox = (x: number, y: number, name: string, title: string, affiliation: string, status: string) => {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, sigW, 52, 1.5, 1.5, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, sigW, 52, 1.5, 1.5, 'S');

  // Status Badge
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(x + 3, y + 3, sigW - 6, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(5, 150, 105);
  doc.text(status, x + (sigW / 2), y + 6.5, { align: 'center' });

  // Signature line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(x + 5, y + 32, x + sigW - 5, y + 32);

  // Digital Signature seal representation
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text(name, x + (sigW / 2), y + 28, { align: 'center' });

  // Printed details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(name, x + (sigW / 2), y + 37, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(37, 99, 235);
  doc.text(title, x + (sigW / 2), y + 41.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text(affiliation, x + (sigW / 2), y + 46, { align: 'center' });
};

renderSignatureBox(MARGIN + 4, signY + 11, 'Clare Angelie T. Dolino', 'Lead Software Architect', 'Developer & Project Lead', 'VERIFIED & ARCHITECTED');
renderSignatureBox(MARGIN + 8 + sigW, signY + 11, 'Engr. System Evaluator', 'Technical Review Board', 'Compliance & Security Audit', 'AUDIT APPROVED');
renderSignatureBox(MARGIN + 12 + (sigW * 2), signY + 11, 'Academic Coordinator', 'Internship & OJT Directorship', 'Curriculum Hours Validation', 'ACADEMIC ENDORSED');

// Final Footnote
curY = signY + signH + 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
doc.text('Document End: TrackMyHours Product Requirements Document v3.2. All diagrams generated via native vector geometry.', MARGIN, curY);

// ============================================================================
// APPLY PAGE DECORATIONS (RUNNING HEADERS & FOOTERS)
// ============================================================================
const totalPages = (doc as any).internal.getNumberOfPages();
console.log(`Applying running headers and footers to all ${totalPages} pages...`);

for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  addDecorations(doc, p, totalPages, true);
}

// ============================================================================
// SAVE PDF TO DISK
// ============================================================================
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

// 1. Save in /docs directory
const docsOutputPath = path.resolve('docs', 'TrackMyHours_PRD_with_Diagrams.pdf');
fs.writeFileSync(docsOutputPath, pdfBuffer);
console.log(`Successfully generated: ${docsOutputPath} (${pdfBuffer.length} bytes)`);

// 2. Save in /public directory for direct HTTP download from the application
const publicOutputPath = path.resolve('public', 'TrackMyHours_PRD_with_Diagrams.pdf');
fs.writeFileSync(publicOutputPath, pdfBuffer);
console.log(`Successfully generated: ${publicOutputPath} (${pdfBuffer.length} bytes)`);
