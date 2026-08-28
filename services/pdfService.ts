import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, User, ADMIN_IN_CHARGE } from '../types';
import { formatTime12HourNoPeriod } from './utils';

export const generateDTRPdf = (user: User, records: AttendanceRecord[], month: string, year: string, action: 'download' | 'preview' = 'download') => {
  // A4 size: 210mm x 297mm
  const doc = new jsPDF();
  const daysInMonth = new Date(parseInt(year), new Date(`${month} 1, ${year}`).getMonth() + 1, 0).getDate();

  // --- Helper function to draw one DTR form ---
  const drawDTRForm = (startX: number, startY: number) => {
      // Dimensions matching the look of CS Form 48
      const colWidths = {
          day: 8,
          time: 12, 
          undef: 11
      };
      
      const width = colWidths.day + (colWidths.time * 4) + (colWidths.undef * 2); // 8 + 48 + 22 = 78mm
      const centerX = startX + (width / 2);

      // --- Header (Adjusted Spacing) ---
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.text('Civil Service Form No. 48', startX, startY);
      
      doc.setFontSize(11); 
      doc.setFont('times', 'bold');
      doc.text('DAILY TIME RECORD', centerX, startY + 10, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.text('-----o0o-----', centerX, startY + 15, { align: 'center' });
      
      // --- Name ---
      doc.setFontSize(11); // Slightly larger for header name too
      doc.setFont('times', 'bold');
      doc.text(user.profile.name.toUpperCase(), centerX, startY + 25, { align: 'center' });
      doc.setLineWidth(0.3);
      doc.line(startX, startY + 26, startX + width, startY + 26);
      
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.text('(Name)', centerX, startY + 29, { align: 'center' });
      
      // --- Month ---
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.text(`For the month of`, startX, startY + 38);
      doc.setFont('times', 'bold');
      doc.text(`${month} ${year}`, startX + 30, startY + 38);
      doc.setLineWidth(0.2);
      doc.line(startX + 30, startY + 39, startX + width, startY + 39);

      // --- Date Started ---
      if (user.profile.dateStarted) {
          doc.setFontSize(8);
          doc.setFont('times', 'bold');
          doc.text(`Date Started: ${new Date(user.profile.dateStarted).toLocaleDateString()}`, centerX, startY + 43, { align: 'center' });
      }
      
      // --- Official Hours (Increased Font Size) ---
      doc.setFont('times', 'italic');
      doc.setFontSize(9); // Increased from 8
      doc.text(`Official hours for`, startX, startY + 47);
      doc.text(`arrival and departure`, startX, startY + 51); // Adjusted Y for spacing
      
      // Right side of Official Hours
      doc.setFont('times', 'normal');
      doc.text(`Regular days`, startX + 40, startY + 47);
      doc.line(startX + 58, startY + 47, startX + width, startY + 47);
      
      doc.text(`Saturdays`, startX + 40, startY + 51); // Adjusted Y
      doc.line(startX + 58, startY + 51, startX + width, startY + 51); // Adjusted Y

      // --- Layout Calculation for Full Page Fit ---
      const PAGE_HEIGHT = 297;
      const MARGIN_BOTTOM = 15; // Safe bottom margin
      const HEADER_HEIGHT_SPACE = 58; 
      const GAP_BEFORE_FOOTER = 10; // Increased from 5
      
      // Calculate Footer Height with Larger Fonts
      const certifyText = "I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.";
      doc.setFontSize(9); // Increased from 8
      doc.setFont('times', 'italic');
      const certifyLines = doc.splitTextToSize(certifyText, width);
      const footerTextHeight = certifyLines.length * 4; // Increased multiplier from 3.5 for larger font
      
      // Footer components height: Text + Gap + Name + Gap + Verified + Gap + Admin + Text
      // Adjusted estimates for larger fonts:
      // Name area ~12mm, Verified ~5mm, Admin ~12mm, InCharge ~5mm
      // Decreased the first gap estimate from 9 to 6 to account for decreased spacing
      const FOOTER_TOTAL_HEIGHT = footerTextHeight + 6 + 12 + 5 + 5 + 10 + 12 + 5;
      
      // Calculate available height for the table
      const tableTopY = startY + HEADER_HEIGHT_SPACE;
      const tableBottomLimit = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_TOTAL_HEIGHT - GAP_BEFORE_FOOTER;
      const availableTableHeight = tableBottomLimit - tableTopY;
      
      const totalRows = 2 + daysInMonth + 1; // 2 Header rows, N Data rows, 1 Total row
      const calculatedRowHeight = availableTableHeight / totalRows;

      // --- Table Body ---
      const tableBody = [];
      let totalMinutesWorked = 0;

      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString();
        // Construct YYYY-MM-DD
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth() + 1;
        const dateStr = `${year}-${String(monthIndex).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const record = records.find(r => r.date === dateStr);
        const dateObj = new Date(parseInt(year), monthIndex - 1, i);
        const dayOfWeek = dateObj.getDay();

        let rowData = [];
        
        // Accumulate Worked Minutes
        if (record) {
            totalMinutesWorked += record.totalDailyMinutes;
        }

        // Priority: Explicit record (merged or not) -> Weekend defaults -> Empty
        if (record) {
            if (record.isMerged) {
                 // Spanning cell
                 const remarksText = `${record.remarks || ''} ${record.remarksHours ? `(${record.remarksHours} hrs)` : ''}`.trim();
                 rowData = [
                     { content: dayStr, styles: { halign: 'center' } },
                     { content: remarksText, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
                 ];
            } else {
                 rowData = [dayStr];

                 // AM Session
                 if (record.amRemarks) {
                     rowData.push({ 
                         content: record.amRemarks, 
                         colSpan: 2, 
                         styles: { halign: 'center', textColor: [255, 0, 0], fontSize: 6, fontStyle: 'bold' } 
                     });
                 } else {
                     rowData.push(formatTime12HourNoPeriod(record.amIn || ''));
                     rowData.push(formatTime12HourNoPeriod(record.amOut || ''));
                 }

                 // PM Session
                 if (record.pmRemarks) {
                     rowData.push({ 
                         content: record.pmRemarks, 
                         colSpan: 2, 
                         styles: { halign: 'center', textColor: [255, 0, 0], fontSize: 6, fontStyle: 'bold' } 
                     });
                 } else {
                     rowData.push(formatTime12HourNoPeriod(record.pmIn || ''));
                     rowData.push(formatTime12HourNoPeriod(record.pmOut || ''));
                 }

                 rowData.push(record.undertimeMinutes > 0 ? Math.floor(record.undertimeMinutes / 60) : '');
                 rowData.push(record.undertimeMinutes > 0 ? (record.undertimeMinutes % 60) : '');
            }
        } else {
            // No record, check for weekend
            if (dayOfWeek === 0) { // Sunday
                rowData = [
                    { content: dayStr, styles: { halign: 'center' } },
                    { content: 'SUNDAY', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
                ];
            } else if (dayOfWeek === 6) { // Saturday
                rowData = [
                    { content: dayStr, styles: { halign: 'center' } },
                    { content: 'SATURDAY', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
                ];
            } else {
                rowData = [dayStr, '', '', '', '', '', ''];
            }
        }
        tableBody.push(rowData);
      }
      
      const totalHours = Math.floor(totalMinutesWorked / 60);
      const totalMinutes = totalMinutesWorked % 60;

      tableBody.push([
          { content: 'Total', styles: { fontStyle: 'bold' } }, 
          '', '', '', '', 
          totalHours > 0 ? totalHours.toString() : '', 
          totalMinutes > 0 ? totalMinutes.toString() : ''
      ]);

      // @ts-ignore
      autoTable(doc, {
        startY: tableTopY,
        margin: { left: startX },
        tableWidth: width,
        head: [
            [{ content: 'Day', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'A.M.', colSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'P.M.', colSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'Undertime', colSpan: 2, styles: { halign: 'center', valign: 'middle' } }],
            ['Arrival', 'Departure', 'Arrival', 'Departure', 'Hours', 'Minutes']
        ],
        body: tableBody,
        theme: 'plain',
        styles: {
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            fontSize: 8, // Increased from 6.5
            cellPadding: { top: 0, right: 0.5, bottom: 0, left: 0.5 },
            valign: 'middle',
            halign: 'center',
            font: 'times',
            minCellHeight: calculatedRowHeight
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.2,
            fontStyle: 'normal',
            fontSize: 8, // Increased from 7
            minCellHeight: calculatedRowHeight 
        },
        columnStyles: {
            0: { cellWidth: colWidths.day },
            1: { cellWidth: colWidths.time },
            2: { cellWidth: colWidths.time },
            3: { cellWidth: colWidths.time },
            4: { cellWidth: colWidths.time },
            5: { cellWidth: colWidths.undef },
            6: { cellWidth: colWidths.undef },
        }
      });

      // --- Footer ---
      // @ts-ignore
      const footerStartY = doc.lastAutoTable.finalY + GAP_BEFORE_FOOTER;
      
      doc.setFontSize(9); // Increased from 8
      doc.setFont('times', 'italic');
      
      // Print justified text
      doc.text(certifyText, startX, footerStartY, { maxWidth: width, align: 'justify' });
      
      // Signature Line & User Name
      // Decreased spacing from 12 to 8
      const signatureY = footerStartY + footerTextHeight + 8; 
      doc.setFont('times', 'bold');
      doc.setFontSize(11); 
      doc.text(user.profile.name.toUpperCase(), centerX, signatureY, { align: 'center' });
      
      doc.setLineWidth(0.3);
      doc.line(startX + 5, signatureY + 1, startX + width - 5, signatureY + 1);
      
      // Verified text
      const verifiedY = signatureY + 6;
      doc.setFont('times', 'normal');
      doc.setFontSize(9); // Increased from 8
      doc.text('VERIFIED as to the prescribed office hours:', centerX, verifiedY, { align: 'center' });
      
      // Admin Signature
      const adminSignY = verifiedY + 14; 
      doc.setFontSize(11); 
      doc.setFont('times', 'bold');
      doc.text(ADMIN_IN_CHARGE.toUpperCase(), centerX, adminSignY, { align: 'center' });
      doc.setLineWidth(0.3);
      doc.line(startX + 10, adminSignY + 1, startX + width - 10, adminSignY + 1);
      
      doc.setFontSize(9); // Increased from 8
      doc.setFont('times', 'italic');
      doc.text('In Charge', centerX, adminSignY + 4, { align: 'center' });
  };

  // --- Front Page: Draw Two Forms Side by Side ---
  drawDTRForm(15, 12);  
  drawDTRForm(115, 12); 

  // --- Back Page: Instructions ---
  doc.addPage();
  
  const drawInstructions = (startX: number) => {
      const width = 80; 
      const centerX = startX + (width / 2);
      let currentY = 20;

      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.text('INSTRUCTIONS', centerX, currentY, { align: 'center' });
      
      currentY += 8;
      doc.setFontSize(9);
      doc.setFont('times', 'normal');

      const instructions = [
          "Civil Service Form No. 48, after completion, should be filed in the records of the Bureau or Office which submits the monthly report on Civil Service Form No. 3 to the Bureau of Civil Service.",
          "In lieu of the above, court interpreters and stenographers who accompany the judges of the Court of First Instance will fill out the daily time reports on this form in triplicate, after which they should be approved by the judge with whom service has been rendered, or by an officer of the Department of Justice authorized to do so. The original should be forwarded promptly after the end of the month to the Bureau of Civil Service, thru the Department of Justice, the duplicate to be kept in the Department of Justice; and the triplicate, in the office of the Clerk of Court where service was rendered.",
          "In the space provided for the purpose on the other side will be indicated the office hours the employee is required to observe, as for example, \"Regular days, 8:00 to 12:00 and 1:00 to 4:00; Saturdays 8:00 to 1:00.\"",
          "Attention is invited to paragraph 3, Civil Service Rule XV, Executive Order No. 5, series of 1909, which reads as follows:",
          "\"Each chief of a Bureau or Office shall require a daily record of attendance of all the officers and employees under him entitled to leave of absence or vacation (including teachers) to be kept on the proper form and also a systematic office record showing for each day all absences from duty from any cause whatever. At the beginning of each month he shall report to the Commissioner on the proper form of all absences from any cause whatever, including the exact amount of undertime of each person for each day. Officers or employees serving in the field or on the water need not be required to keep a daily record, but all absences of such employees must be included in the monthly report of changes and absences. Falsification of time records will render the offending officers or employee liable to summary removal from the service and criminal prosecution.\""
      ];

      instructions.forEach(text => {
          const lines = doc.splitTextToSize(text, width);
          doc.text(text, startX, currentY, { maxWidth: width, align: 'justify' });
          currentY += (lines.length * 4) + 2; 
      });

      currentY += 3;
      doc.setLineWidth(0.2);
      doc.line(startX, currentY, startX + width, currentY);
      currentY += 5;

      doc.setFontSize(8); 
      const note = "(NOTE - A record made from memory at sometime subsequent to the occurrence of an event is not reliable. Non-observance of office hours deprives the employee of the leave privileges although he may have rendered overtime service. Where service rendered outside of the Office for the whole morning or afternoon, notation to that effect should be made clearly.)";
      
      const noteLines = doc.splitTextToSize(note, width);
      doc.text(note, startX, currentY, { maxWidth: width, align: 'justify' });
      
      currentY += (noteLines.length * 3.5) + 3;
      doc.line(startX, currentY, startX + width, currentY);
  };

  drawInstructions(15);
  drawInstructions(115);

  if (action === 'download') {
      doc.save(`DTR_${user.profile.name}_${month}_Double.pdf`);
  } else {
      return doc.output('bloburl');
  }
};