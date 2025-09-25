import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";
import { format } from "date-fns";

export const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not available");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject("Failed to load image: " + url);
    img.src = url;
  });
};

export interface Batch {
  id: number;
  name: string;
  branch: string;
  courseId: number;
}

export interface ExportAttendanceParams {
  selectedBatch: string | null;
  batches: Array<Batch>;
  getCourseName: (courseId: number) => string;
  enrolledStudents: Array<any>;
  filteredSavedAttendance: Array<any>;
  selectedYear: number;
  selectedMonth: number;
  getMonthlyAttendanceRecords: (records: any[]) => any[];
  headerImageUrl: string;
  footerImageUrl: string;
}

export const exportAttendance = async (
  type: "excel" | "pdf",
  params: ExportAttendanceParams
) => {
  const {
    selectedBatch,
    batches,
    getCourseName,
    enrolledStudents,
    filteredSavedAttendance,
    selectedYear,
    selectedMonth,
    getMonthlyAttendanceRecords,
    headerImageUrl,
    footerImageUrl,
  } = params;

  if (!selectedBatch) return;

  const currentDateTime = format(new Date(), "yyyy-MM-dd_HH-mm");
  const reportDateTime = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  const batchInfo = batches.find((b) => b.id.toString() === selectedBatch);
  const courseName = batchInfo ? getCourseName(batchInfo.courseId) : "Unknown Course";
  const selectedMonthYear = format(new Date(selectedYear, selectedMonth), "MMMM yyyy");

  const exportData = enrolledStudents.map((student, index) => {
    const studentRecords = getMonthlyAttendanceRecords(
      filteredSavedAttendance.filter((r) => r.studentId === student.id.toString())
    );

    const presentCount = studentRecords.filter((r) => r.status === "present").length;
    const absentCount = studentRecords.filter((r) => r.status === "absent").length;
    const leaveCount = studentRecords.filter((r) => r.status === "leave").length;
    const total = studentRecords.length;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return {
      "SL No": index + 1,
      "Student Name": `${student.firstName} ${student.lastName}`,
      "Student ID": student.studentId,
      Present: presentCount,
      Absent: absentCount,
      Leave: leaveCount,
      "Attendance %": `${percentage}%`,
    };
  });

  const filename = `${batchInfo?.name}_attendance_${selectedMonthYear}_${currentDateTime}`;
  const columns = ["SL No", "Student Name", "Student ID", "Present", "Absent", "Leave", "Attendance %"] as const;
//   type Column = typeof columns[number];

  if (type === "excel") {
    // Excel export
    const headerData = [
      ["Attendance Report"],
      [`Batch: ${batchInfo?.name}`],
      [`Course: ${courseName}`],
      [`Branch: ${batchInfo?.branch}`],
      [`Period: ${selectedMonthYear}`],
      [`Generated on: ${reportDateTime}`],
      [],
      [...columns],
    ];

    const ws = XLSXUtils.aoa_to_sheet(headerData);

    XLSXUtils.sheet_add_json(ws, exportData, { origin: "A7", skipHeader: true });

    const totalRow = exportData.length + 7;

    ws[`B${totalRow}`] = { t: "s", v: "Total" };

    // Columns C (Present), D (Absent), E (Leave)
    const presentCol = "C";
    const absentCol = "D";
    const leaveCol = "E";

    ws[`${presentCol}${totalRow}`] = { t: "n", f: `SUM(${presentCol}7:${presentCol}${totalRow - 1})` };
    ws[`${absentCol}${totalRow}`] = { t: "n", f: `SUM(${absentCol}7:${absentCol}${totalRow - 1})` };
    ws[`${leaveCol}${totalRow}`] = { t: "n", f: `SUM(${leaveCol}7:${leaveCol}${totalRow - 1})` };


    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Attendance");
    const excelBuffer = XLSXWrite(wb, { bookType: "xlsx", type: "array" });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    // PDF export
    const doc = new jsPDF();

    const headerBase64 = await loadImageAsBase64(headerImageUrl);
    const footerBase64 = await loadImageAsBase64(footerImageUrl);

    // Add header image (example coordinates, scale as needed)
    doc.addImage(headerBase64, "PNG", 10, 10, 180, 20);

    doc.setFontSize(14);
    const title = "Attendance Report for the month of " + selectedMonthYear;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(title);
    const textX = (pageWidth - textWidth) / 2;
    doc.text(title, textX, 40);

    doc.setFontSize(11);
    doc.text(`Batch: ${batchInfo?.name}`, 14, 50);
    doc.text(`Course: ${courseName}`, 14, 57);
    doc.text(`Branch: ${batchInfo?.branch}`, 14, 64);
    doc.text(`Period: ${selectedMonthYear}`, 14, 71);
    doc.text(`Generated on: ${reportDateTime}`, 14, 78);

    const totalPresent = exportData.reduce((sum, row) => sum + row.Present, 0);
    const totalAbsent = exportData.reduce((sum, row) => sum + row.Absent, 0);
    const totalLeave = exportData.reduce((sum, row) => sum + row.Leave, 0);

    const totalRow = ["", "Total", "", totalPresent, totalAbsent, totalLeave, ""];

    autoTable(doc, {
    head: [columns as unknown as string[]],
    body: [...exportData.map(row => columns.map(col => row[col as keyof typeof row])), totalRow],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [48, 67, 128], halign: 'center' },
    footStyles: { fillColor: [230, 230, 230], textColor: 20 },
    startY: 85,

    columnStyles: {
        1: { halign: 'left' } // index 1 = "Student Name" column
      },

    bodyStyles: {
        halign: 'center'
      },    
    
    didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.addImage(footerBase64, "PNG", 10, pageHeight - 30, 180, 20);
    },
    didParseCell: function (data) {
        if (data.section === 'body' && data.row.index === data.table.body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }      
    });

    // autoTable(doc, {
    //     head: [columns as unknown as string[]],
    //     body: exportData.map(row =>
    //       columns.map(col => row[col as keyof typeof row])
    //     ),
    //   styles: { fontSize: 8 },
    //   headStyles: { fillColor: [41, 128, 185] },
    //   startY: 70,
    //   didDrawPage: (data) => {
    //     // Add footer image at the bottom of each page
    //     const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    //     doc.addImage(footerBase64, "PNG", 10, pageHeight - 30, 190, 20);
    //   },
    // });

    doc.save(`${filename}.pdf`);
  }
};
