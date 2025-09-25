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

export interface ExportStudentAttendanceParams {
  student: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  attendanceRecords: Array<{
    date: string; // ISO date string
    status: "present" | "absent" | "leave";
    batch: string;
  }>;
  selectedYear: number;
  selectedMonth: number;
  headerImageUrl: string;
  footerImageUrl: string;
}

export const exportStudentAttendance = async (
  type: "excel" | "pdf",
  params: ExportStudentAttendanceParams
) => {
  const {
    student,
    attendanceRecords,
    selectedYear,
    selectedMonth,
    headerImageUrl,
    footerImageUrl,
  } = params;

  const selectedMonthYear = format(new Date(selectedYear, selectedMonth), "MMMM yyyy");
  const currentDateTime = format(new Date(), "yyyy-MM-dd_HH-mm");
  const reportDateTime = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  const fullName = `${student.firstName} ${student.lastName}`;

  const exportData = attendanceRecords.map((record, index) => ({
    "SL No": index + 1,
    // Batch: record.batchId,
    Date: format(new Date(record.date), "dd MMM yyyy"),
    Batch: record.batch || "N/A",
    Status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
  }));

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const absentCount = attendanceRecords.filter(r => r.status === "absent").length;
  const leaveCount = attendanceRecords.filter(r => r.status === "leave").length;
  const total = attendanceRecords.length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const filename = `${student.studentId}_attendance_${selectedMonthYear}_${currentDateTime}`;
  const columns = ["SL No", "Date", "Batch", "Status"] as const;

  if (type === "excel") {
    const headerData = [
      ["Student Attendance Report"],
      [`Student: ${fullName} (${student.studentId})`],
      [`Month: ${selectedMonthYear}`],
      [`Generated on: ${reportDateTime}`],
      [],
      [...columns],
    ];

    const ws = XLSXUtils.aoa_to_sheet(headerData);
    XLSXUtils.sheet_add_json(ws, exportData, { origin: "A7", skipHeader: true });

    const summaryStartRow = exportData.length + 8;
    ws[`A${summaryStartRow}`] = { t: "s", v: "Summary" };
    ws[`A${summaryStartRow + 1}`] = { t: "s", v: "Present" };
    ws[`B${summaryStartRow + 1}`] = { t: "n", v: presentCount };
    ws[`A${summaryStartRow + 2}`] = { t: "s", v: "Absent" };
    ws[`B${summaryStartRow + 2}`] = { t: "n", v: absentCount };
    ws[`A${summaryStartRow + 3}`] = { t: "s", v: "Leave" };
    ws[`B${summaryStartRow + 3}`] = { t: "n", v: leaveCount };
    ws[`A${summaryStartRow + 4}`] = { t: "s", v: "Attendance %" };
    ws[`B${summaryStartRow + 4}`] = { t: "s", v: `${percentage}%` };

    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Student Attendance");
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
    const doc = new jsPDF();
    const headerBase64 = await loadImageAsBase64(headerImageUrl);
    const footerBase64 = await loadImageAsBase64(footerImageUrl);

    doc.addImage(headerBase64, "PNG", 10, 10, 180, 20);

    doc.setFontSize(14);
    const title = `Attendance Report - ${selectedMonthYear}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(title);
    const textX = (pageWidth - textWidth) / 2;
    doc.text(title, textX, 40);

    doc.setFontSize(11);
    doc.text(`Student: ${fullName}`, 14, 50);
    doc.text(`ID: ${student.studentId}`, 14, 57);
    doc.text(`Month: ${selectedMonthYear}`, 14, 64);
    doc.text(`Generated on: ${reportDateTime}`, 14, 71);

    // const totalRow = ["", "Total", ""];
    autoTable(doc, {
      head: [columns as unknown as string[]],
      body: [...exportData.map(row => columns.map(col => row[col as keyof typeof row]))],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [48, 67, 128], halign: 'center' },
      startY: 80,
      bodyStyles: {
        halign: 'center',
      },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.addImage(footerBase64, "PNG", 10, pageHeight - 30, 180, 20);
      },
    });

    // Summary
    // doc.setFontSize(11);
    // const yAfterTable = doc.lastAutoTable.finalY + 10;
    // doc.text(`Summary:`, 14, yAfterTable);
    // doc.text(`Present: ${presentCount}`, 14, yAfterTable + 7);
    // doc.text(`Absent: ${absentCount}`, 14, yAfterTable + 14);
    // doc.text(`Leave: ${leaveCount}`, 14, yAfterTable + 21);
    // doc.text(`Attendance %: ${percentage}%`, 14, yAfterTable + 28);

    doc.save(`${fullName}_${filename}.pdf`);
  }
};
