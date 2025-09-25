import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    // style: 'currency',
    // currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function getInitials(name?: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function formatTimeTo12Hour(time: string) {
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hour));
  date.setMinutes(parseInt(minute));
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function capitalizeFirstLetter(str: string) {
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

export function getStatusColor(status?: string): {bg: string, text: string} {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'inactive':
      return { bg: 'bg-neutral-100', text: 'text-neutral-800' };
    case 'partially_paid':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'pending':
      return { bg: 'bg-amber-100', text: 'text-amber-800' };
    case 'paid':
      return { bg: 'bg-primary', text: 'text-white' };
    case 'unpaid':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'failed':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'music':
      return 'bg-blue-100 text-blue-800';
    case 'dance':
      return 'bg-orange-100 text-orange-800';
    case 'art':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function generateInvoiceId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `INV-${year}${month}${day}-${random}`;
}

export const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Required for loading from public/ in some browsers
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

export function extractMonth(invoiceNumber: string) {
  const parts = invoiceNumber.split('-');
  if (parts.length < 2 || parts[1].length !== 8) {
    throw new Error('Invalid invoice format');
  }

  const datePart = parts[1]; // e.g., "20250626"

  const year = parseInt(datePart.slice(0, 4), 10);
  const monthNumber = parseInt(datePart.slice(4, 6), 10);
  const day = parseInt(datePart.slice(6, 8), 10);

  const monthName = new Date(year, monthNumber - 1, day).toLocaleString('default', {
    month: 'long',
  });

  return {
    year,
    month: monthNumber,
    monthName,
    day,
  };
}

export function formatDateToDDMMYYYY(isoString: string) {
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}