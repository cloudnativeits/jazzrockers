import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { capitalizeFirstLetter, formatDateToDDMMYYYY } from '@/lib/utils';

interface CreditNote {
  studentName: string;
  creditNoteNumber: string;
  generatedMonth: string;
  appliedInvoiceId: string;
  invoiceNumber: string;
  appliedToType: string;
  amount: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function PrintCreditNote() {
  const [, params] = useRoute('/admin/print-credit-note/:creditNoteNumber');
  const [, params2] = useRoute('/parent/print-credit-note/:creditNoteNumber');
  const [, params3] = useRoute('/branch-admin/print-credit-note/:creditNoteNumber');
  const creditNoteNumber = params?.creditNoteNumber || params2?.creditNoteNumber || params3?.creditNoteNumber;

  

  const { data: creditNote, isLoading, error } = useQuery<CreditNote>({
    queryKey: ['creditNote', creditNoteNumber],
    queryFn: async () => {
    //   console.log('Fetching credit note for:', creditNoteNumber);
      if (!creditNoteNumber) throw new Error("Credit Note Number is required");
      const res = await fetch(`/api/creditNotes/${creditNoteNumber}`);
      if (!res.ok) throw new Error('Failed to fetch credit note data');
      return res.json();
    },
    enabled: !!creditNoteNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error ? error.message : "No credit note data found."}</p>
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
          <h1 className="text-3xl font-bold text-primary">CREDIT NOTE</h1>
        </div>
        <div className="flex justify-between items-start mt-4 mb-4">
          <div className="ml-auto text-right">
            <h2 className="text-lg font-semibold">Credit Note No. {creditNote.creditNoteNumber}</h2>
            <p>Date: {formatDateToDDMMYYYY(creditNote.createdAt)}</p>
          </div>
        </div>

        <hr className="border border-dashed my-4" />
        <table className="w-full text-sm border border-gray-300 mt-6">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 w-1/4 bg-gray-100">Issued To</td>
              <td className="px-3 py-2">{creditNote.studentName}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">For</td>
              <td className="px-3 py-2">{creditNote.reason}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Amount</td>
              <td className="px-3 py-2">AED {creditNote.amount}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Applied To</td>
              <td className="px-3 py-2">{capitalizeFirstLetter(creditNote.appliedToType)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Against</td>
              <td className="px-3 py-2">{creditNote.invoiceNumber}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Generated Month</td>
              <td className="px-3 py-2">{creditNote.generatedMonth}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="font-semibold px-3 py-2 bg-gray-100">Status</td>
              <td className="px-3 py-2">{capitalizeFirstLetter(creditNote.status)}</td>
            </tr>
          </tbody>
        </table>

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
