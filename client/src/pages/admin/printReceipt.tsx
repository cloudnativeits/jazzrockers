import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { capitalizeFirstLetter, formatDateToDDMMYYYY } from '@/lib/utils';

interface Receipt {
  studentName: string;
  receiptNumber: string;
  paymentId: string;
  receiptDate: string;
  invoiceDate: string;
  amount: string;
  paymentMethod: string;
  remarks?: string;
  createdAt: string;
}

export default function PrintReceipt() {
  const [, params] = useRoute('/admin/print-receipt/:receiptNumber');
  const [, params2] = useRoute('/branch-admin/print-receipt/:receiptNumber');
  const receiptNumber = params?.receiptNumber || params2?.receiptNumber;

  const { data: receipt, isLoading, error } = useQuery<Receipt>({
    queryKey: ['receipt', receiptNumber],
    queryFn: async () => {
      console.log('Fetching receipt for:', receiptNumber);
      if (!receiptNumber) throw new Error("Receipt Number is required");
      const res = await fetch(`/api/receipts/${receiptNumber}`);
      if (!res.ok) throw new Error('Failed to fetch receipt data');
      return res.json();
    },
    enabled: !!receiptNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error ? error.message : "No receipt data found."}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-10 print:!bg-white">
      <div className="print-content max-w-3xl mx-auto pl-8 pr-8 bg-white border-2 border-gray-300 shadow-md print:shadow-none text-sm font-sans">
      <div className="mb-8">
          <img 
            src="/header.png" 
            alt="Letterhead"
            className="w-full h-24"
          />
        </div>
        {/* Print Button */}
        <div className="print:hidden mt-6 flex justify-end">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white px-5 py-2 rounded-md hover:bg-primary/90 transition"
          >
            Print
          </button>
        </div>
        <div className="text-center mb-4 mt-4">
          <h1 className="text-3xl font-bold text-primary">RECEIPT</h1>
        </div>
        <div className="flex justify-between items-start mt-4 mb-4">
          <div className="ml-auto text-right">
            <h2 className="text-lg font-semibold">Receipt No. {receipt.receiptNumber}</h2>
            <p>Date: {formatDateToDDMMYYYY(receipt.receiptDate)}</p>
          </div>
        </div>

        <hr className="border border-dashed my-4" />
        <table className="w-full text-sm border border-gray-300 mt-6">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 w-1/4 bg-gray-100">Received From</td>
              <td className="px-3 py-2">{receipt.studentName}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">For</td>
              <td className="px-3 py-2">Course Payment / Fee</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Amount</td>
              <td className="px-3 py-2">AED {receipt.amount}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Payment ID</td>
              <td className="px-3 py-2">{receipt.paymentId}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Payment Method</td>
              <td className="px-3 py-2">{capitalizeFirstLetter(receipt.paymentMethod)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Invoice Date</td>
              <td className="px-3 py-2">{formatDateToDDMMYYYY(receipt.invoiceDate)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        {receipt.remarks && (
          <div className="mt-6">
            <p className="text-xs text-gray-600"><strong>Remarks:</strong> {receipt.remarks}</p>
          </div>
        )}

        {/* <div className="flex justify-between mt-10">
          <div className="text-xs text-gray-500">
            <p>📧jazzrockers@gmail.com</p>
            <p>📞 +971-555-555555</p>
            <p>📍 Dubai, UAE</p>
          </div>
        </div> */}

        <div className="mt-12">
          <img 
            src="/footer.png" 
            alt="Footer" 
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
