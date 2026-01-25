import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TEAM_MEMBERS, MONTHS, DAYS_OF_WEEK } from './constants';
import { formatDate, getMonthStart, getMonthEnd, getDaysInRange, addDays, getWeekNumber } from './dateUtils';

// Generate PDF for a specific month
export const generateMonthPDF = (year, month, schedule, closures) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Calendario Turni - ${MONTHS[month]} ${year}`, pageWidth / 2, 20, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, 27, { align: 'center' });
  doc.setTextColor(0);

  // Get days of the month
  const monthStart = getMonthStart(new Date(year, month, 1));
  const monthEnd = getMonthEnd(new Date(year, month, 1));
  const days = getDaysInRange(monthStart, monthEnd);

  // Create weekly tables
  let currentY = 35;
  let currentWeek = [];
  let weekStartDate = null;

  days.forEach((date, index) => {
    const dayOfWeek = date.getDay();

    if (currentWeek.length === 0) {
      weekStartDate = date;
      // Fill empty days at start of week
      const startDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      for (let i = 0; i < startDay; i++) {
        currentWeek.push(null);
      }
    }

    currentWeek.push(date);

    // End of week (Sunday) or end of month
    if (dayOfWeek === 0 || index === days.length - 1) {
      // Fill empty days at end of week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }

      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      // Week header
      const weekNum = getWeekNumber(weekStartDate);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Settimana ${weekNum}`, margin, currentY);
      currentY += 5;

      // Create table data
      const tableHead = DAYS_OF_WEEK.map((day, i) => {
        const d = currentWeek[i];
        if (d) {
          return `${day.substring(0, 3)} ${d.getDate()}`;
        }
        return '';
      });

      // Row for each shift type
      const tableBody = [];

      // Helper to get shift data
      const getShiftData = (d, shiftId) => {
        if (!d) return '';
        const dateKey = formatDate(d);
        const daySchedule = schedule[dateKey];
        const isClosureDay = closures.includes(dateKey) || (daySchedule && daySchedule.closure);

        if (isClosureDay) return 'CHIUSO';
        if (!daySchedule || !daySchedule.shifts) return '';

        const shifts = daySchedule.shifts.filter(s => s.shift.id === shiftId);
        if (shifts.length === 0) return '';
        return shifts.map(s => s.member).join(', ');
      };

      // Early shift row (only weekdays)
      const earlyRow = ['8:00-17:00'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) {
          earlyRow.push('');
        } else if (d.getDay() === 0 || d.getDay() === 6) {
          earlyRow.push('-');
        } else {
          earlyRow.push(getShiftData(d, 'early'));
        }
      }
      tableBody.push(earlyRow);

      // Standard shift row (only weekdays)
      const standardRow = ['9:00-18:00'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) {
          standardRow.push('');
        } else if (d.getDay() === 0 || d.getDay() === 6) {
          standardRow.push('-');
        } else {
          const data = getShiftData(d, 'standard');
          // Abbreviate names if too many
          if (data && data.length > 20) {
            const names = data.split(', ');
            standardRow.push(names.map(n => n.substring(0, 3)).join(', '));
          } else {
            standardRow.push(data);
          }
        }
      }
      tableBody.push(standardRow);

      // Late shift row (only weekdays)
      const lateRow = ['12:00-21:00'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) {
          lateRow.push('');
        } else if (d.getDay() === 0 || d.getDay() === 6) {
          lateRow.push('-');
        } else {
          lateRow.push(getShiftData(d, 'late'));
        }
      }
      tableBody.push(lateRow);

      // Weekend row
      const weekendRow = ['Weekend'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) {
          weekendRow.push('');
        } else if (d.getDay() !== 0 && d.getDay() !== 6) {
          weekendRow.push('-');
        } else {
          weekendRow.push(getShiftData(d, 'weekend'));
        }
      }
      tableBody.push(weekendRow);

      // Draw table using autoTable
      autoTable(doc, {
        startY: currentY,
        head: [['Turno', ...tableHead]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [60, 60, 60],
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 22 },
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252],
        },
        margin: { left: margin, right: margin },
      });

      currentY = doc.lastAutoTable.finalY + 10;
      currentWeek = [];
    }
  });

  // Footer with legend
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Legenda:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('8:00-17:00: Turno mattutino (1 persona) | 9:00-18:00: Turno standard | 12:00-21:00: Turno serale (1 persona) | Weekend: Coppia Sab-Dom', margin, currentY + 5);

  return doc;
};

// Generate month content for year PDF
const generateMonthContent = (doc, year, month, schedule, closures) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`${MONTHS[month]} ${year}`, pageWidth / 2, 18, { align: 'center' });

  // Get days of the month
  const monthStart = getMonthStart(new Date(year, month, 1));
  const monthEnd = getMonthEnd(new Date(year, month, 1));
  const days = getDaysInRange(monthStart, monthEnd);

  let currentY = 28;
  let currentWeek = [];
  let weekStartDate = null;

  days.forEach((date, index) => {
    const dayOfWeek = date.getDay();

    if (currentWeek.length === 0) {
      weekStartDate = date;
      const startDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      for (let i = 0; i < startDay; i++) {
        currentWeek.push(null);
      }
    }

    currentWeek.push(date);

    if (dayOfWeek === 0 || index === days.length - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }

      const weekNum = getWeekNumber(weekStartDate);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sett. ${weekNum}`, margin, currentY);
      currentY += 4;

      const tableHead = DAYS_OF_WEEK.map((day, i) => {
        const d = currentWeek[i];
        return d ? `${day.substring(0, 3)} ${d.getDate()}` : '';
      });

      const getShiftData = (d, shiftId) => {
        if (!d) return '';
        const dateKey = formatDate(d);
        const daySchedule = schedule[dateKey];
        const isClosureDay = closures.includes(dateKey) || (daySchedule && daySchedule.closure);

        if (isClosureDay) return 'CHIUSO';
        if (!daySchedule || !daySchedule.shifts) return '';

        const shifts = daySchedule.shifts.filter(s => s.shift.id === shiftId);
        if (shifts.length === 0) return '';
        return shifts.map(s => s.member.substring(0, 3)).join(', ');
      };

      const tableBody = [];

      // Early
      const earlyRow = ['8-17'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) earlyRow.push('');
        else if (d.getDay() === 0 || d.getDay() === 6) earlyRow.push('-');
        else earlyRow.push(getShiftData(d, 'early'));
      }
      tableBody.push(earlyRow);

      // Standard
      const standardRow = ['9-18'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) standardRow.push('');
        else if (d.getDay() === 0 || d.getDay() === 6) standardRow.push('-');
        else standardRow.push(getShiftData(d, 'standard'));
      }
      tableBody.push(standardRow);

      // Late
      const lateRow = ['12-21'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) lateRow.push('');
        else if (d.getDay() === 0 || d.getDay() === 6) lateRow.push('-');
        else lateRow.push(getShiftData(d, 'late'));
      }
      tableBody.push(lateRow);

      // Weekend
      const weekendRow = ['WE'];
      for (let i = 0; i < 7; i++) {
        const d = currentWeek[i];
        if (!d) weekendRow.push('');
        else if (d.getDay() !== 0 && d.getDay() !== 6) weekendRow.push('-');
        else weekendRow.push(getShiftData(d, 'weekend'));
      }
      tableBody.push(weekendRow);

      autoTable(doc, {
        startY: currentY,
        head: [['', ...tableHead]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          valign: 'middle',
          halign: 'center',
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [80, 80, 80],
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 12 },
        },
        margin: { left: margin, right: margin },
      });

      currentY = doc.lastAutoTable.finalY + 6;
      currentWeek = [];
    }
  });
};

// Generate PDF for entire year
export const generateYearPDF = (year, schedule, closures) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title page
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Calendario Turni', pageWidth / 2, 60, { align: 'center' });

  doc.setFontSize(48);
  doc.text(String(year), pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Piano annuale dei turni del team', pageWidth / 2, 105, { align: 'center' });

  // Team members list
  doc.setFontSize(10);
  doc.text('Team:', pageWidth / 2, 130, { align: 'center' });
  doc.setFontSize(9);
  doc.text(TEAM_MEMBERS.join('  -  '), pageWidth / 2, 138, { align: 'center' });

  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.text(`Documento generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, 280, { align: 'center' });
  doc.setTextColor(0);

  // Generate each month
  for (let month = 0; month < 12; month++) {
    doc.addPage('landscape');
    generateMonthContent(doc, year, month, schedule, closures);
  }

  return doc;
};

// Download PDF for current month view
export const downloadMonthPDF = (year, month, schedule, closures) => {
  try {
    const doc = generateMonthPDF(year, month, schedule, closures);
    doc.save(`turni-${MONTHS[month].toLowerCase()}-${year}.pdf`);
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    alert('Errore nella generazione del PDF. Controlla la console per dettagli.');
  }
};

// Download PDF for entire year
export const downloadYearPDF = (year, schedule, closures) => {
  try {
    const doc = generateYearPDF(year, schedule, closures);
    doc.save(`turni-${year}.pdf`);
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    alert('Errore nella generazione del PDF. Controlla la console per dettagli.');
  }
};
