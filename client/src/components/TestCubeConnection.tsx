// TestCubeConnection.tsx
import { useCubeQuery } from '@cubejs-client/react';

export default function TestCubeConnection() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Attendance.count'],
  });

  if (error) return <div className="text-red-500">❌ Error: {error.message}</div>;
  if (isLoading) return <div>⏳ Loading Cube data...</div>;

  return (
    <div className="p-4 border rounded bg-green-100 text-green-800">
      ✅ Cube.js Connected! Total Attendance Count: {resultSet?.rawData()[0]['Attendance.count']}
    </div>
  );
}
