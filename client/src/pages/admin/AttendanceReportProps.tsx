import React, { useEffect, useState } from "react";
import { useCubeQuery } from "@cubejs-client/react";

interface RowData {
  id: string;
  studentName: string;
  studentRollNumber: string;
  batchName: string;
  teacherName: string;
  attendancePercentage: string;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
}

export function AttendancePercentageTable() {
  const [data, setData] = useState<RowData[]>([]);

  const { resultSet, isLoading, error } = useCubeQuery({
    measures: [
      "AttendanceReport.presentCount",
      "AttendanceReport.absentCount",
      "AttendanceReport.leaveCount",
      "AttendanceReport.attendancePercentage"
    ],
    dimensions: [
      "AttendanceReport.id",
      "AttendanceReport.studentName",
      "AttendanceReport.studentRollNumber",
      "AttendanceReport.batchName",
      "AttendanceReport.teacherName",
      "AttendanceReport.courseName"
    ],
    order: {
      "AttendanceReport.studentName": "asc"
    }
  });

  useEffect(() => {
    if (resultSet) {
      console.log("Raw data from Cube:", resultSet.tablePivot());
      
      // Group by student ID and aggregate counts
      const studentData = resultSet.tablePivot().reduce((acc, item) => {
        const studentId = item["AttendanceReport.id"];
        const studentRollNumber = item["AttendanceReport.studentRollNumber"];
        
        if (!acc[studentId]) {
          acc[studentId] = {
            id: studentId,
            studentName: item["AttendanceReport.studentName"],
            studentRollNumber: studentRollNumber,
            batchName: item["AttendanceReport.batchName"],
            teacherName: item["AttendanceReport.teacherName"],
            presentCount: 0,
            absentCount: 0,
            leaveCount: 0,
            attendancePercentage: "0%"
          };
        }

        // Aggregate counts
        acc[studentId].presentCount += Number(item["AttendanceReport.presentCount"]) || 0;
        acc[studentId].absentCount += Number(item["AttendanceReport.absentCount"]) || 0;
        acc[studentId].leaveCount += Number(item["AttendanceReport.leaveCount"]) || 0;

        // Calculate percentage if we have data
        const total = acc[studentId].presentCount + acc[studentId].absentCount;
        if (total > 0) {
          acc[studentId].attendancePercentage = 
            `${Math.round((acc[studentId].presentCount / total) * 100)}%`;
        }

        return acc;
      }, {} as Record<string, RowData>);

      const tableData = Object.values(studentData);
      console.log("Processed attendance data:", tableData);
      setData(tableData);
    }
  }, [resultSet]);

  if (isLoading) return <div className="p-6 text-center">Loading data…</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error.toString()}</div>;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-lg">
      <div className="relative bg-white p-6 border-b">
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <img 
            src="/favicon.svg" 
            alt="Jazzrockers Logo" 
            className="w-16 h-16"
          />
          <div>
            <h1 className="text-2xl font-bold text-blue-800">jazzrockers</h1>
            <p className="text-sm text-gray-600">DANCE | MUSIC | CINEMATIC | FITNESS</p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Attendance Report
        </h2>
        
        <p className="text-sm text-gray-600">
          <strong>Generated on:</strong> {new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          })}
        </p>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-800">
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">SL No</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Student Name</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Student ID</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Batch</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Teacher</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Present</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Absent</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Leave</th>
                <th className="border border-gray-300 px-4 py-2 text-white font-bold text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    {isLoading ? "Loading data..." : "No data available"}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.studentName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.studentRollNumber}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.batchName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.teacherName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.presentCount}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.absentCount}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.leaveCount}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.attendancePercentage}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}