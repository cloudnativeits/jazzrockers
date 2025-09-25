import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { extractMonth, formatDateToDDMMYYYY } from '@/lib/utils';

interface BillTo {
  name: string;
  address: string | null;
}

interface LineItem {
  si_no: number;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  discountType?: string;
  discountValue?: number;
  lineTotal: number;
}

interface Summary {
  totalPrice: number;
  discount: number;
  vatAmount: number;
  grandTotal: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  paymentMethod: string | null;
  billTo: BillTo;
  lineItems: LineItem[];
  summary: Summary;
  status?: 'paid' | 'pending' | 'failed';
  remarks?: string | null;
}

// Format number to currency
const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = parseFloat(amount as any);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export default function InvoicePage() {
  const [, params] = useRoute('/admin/invoice/:invoiceId');
  const [, params2] = useRoute('/parent/invoice/:invoiceId');
  const [, params3] = useRoute('/branch-admin/invoice/:invoiceId');
  const invoiceId = params?.invoiceId || params2?.invoiceId || params3?.invoiceId;

  const { data: invoice, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error("Invoice ID is required");
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch invoice data');
      }
      return res.json();
    },
    enabled: !!invoiceId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">
          {error ? error.message : "No invoice data found."}
        </p>
      </div>
    );
  }

  return (
    <div className="print:!block print:!m-0 print:!p-0 bg-gray-100 py-10">
      <div className="print-content max-w-4xl mx-auto pl-8 pr-8 bg-white shadow-lg print:shadow-none">
        {/* Header image */}
        <div className="mb-8">
          <img src="/header.png" alt="Letterhead" className="w-full h-24" />
        </div>

        {/* Print button */}
        <div className="print:hidden mb-4 flex justify-end">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white px-5 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Print
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">TAX INVOICE</h1>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">BILL TO</h3>
            <p className="font-bold text-lg">{invoice.billTo?.name}</p>
            <p className="text-gray-600">{invoice.billTo?.address || ''}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">INVOICE NO:</span> {invoice.invoiceNumber}</p>
            <p>
              <span className="font-bold">INVOICE DATE:</span>{' '}
              {formatDateToDDMMYYYY(invoice.issueDate)}
            </p>
            <p>
              <span className="font-bold">Invoice Month:</span>{' '}
              {extractMonth(invoice.invoiceNumber).monthName}
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left py-2 px-3">SI NO</th>
                <th className="text-left py-2 px-3">ITEM/DESCRIPTION</th>
                <th className="text-center py-2 px-3">QTY</th>
                <th className="text-right py-2 px-3">PRICE</th>
                <th className="text-right py-2 px-3">DISCOUNT</th>
                <th className="text-right py-2 px-3">LINE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => {
                const isExtraDiscount = item.description === 'Extra Discount';
                return (
                <tr key={item.si_no} className="border-b">
                  <td className="py-3 px-3">{item.si_no}</td>
                  <td className="py-3 px-3">{item.description}</td>
                  <td className="text-center py-3 px-3">{isExtraDiscount ? '' : item.quantity}</td>
                  <td className="text-right py-3 px-3">{isExtraDiscount ? '' :formatCurrency(item.price)}</td>
                  {/* <td className="text-right py-3 px-3">
                    {item.discountType === 'percentage'
                      ? `${item.discount}%`
                      : (item.discount)}
                  </td> */}
                  <td className="text-right py-3 px-3">
                    {isExtraDiscount ? '' :formatCurrency(item.discountValue)}
                  </td>
                  <td className={`text-right py-3 px-3 font-semibold ${isExtraDiscount ? 'text-red-500' : ''}`}>
                    {isExtraDiscount ? `- ${formatCurrency(item.lineTotal)}` : formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Totals */}
        <div className="flex justify-between">
          <div>
            {invoice.remarks && (
              <>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Notes:</h3>
                <p className="text-gray-600 border p-2 rounded max-w-xs">{invoice.remarks}</p>
              </>
            )}
          </div>
          <div className="w-1/3 text-right">
            <div className="flex justify-between mb-2">
              <span className="font-medium">TOTAL PRICE</span>
              <span>{formatCurrency(invoice.summary.totalPrice)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-red-500">DISCOUNT</span>
              <span className="text-red-500">- {formatCurrency(invoice.summary.discount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">VAT INCLUSIVE</span>
              <span>({formatCurrency(invoice.summary.vatAmount)})</span>
            </div>
            <div className="flex justify-between mt-4 pt-2 border-t-2 border-gray-400">
              <span className="font-bold text-lg">GRAND TOTAL</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.summary.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Image */}
        <div className="mt-12">
          <img src="/footer.png" alt="Footer" className="w-full" />
        </div>
      </div>
    </div>
  );
}
