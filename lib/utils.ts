/**
 * Global helper utilities for Arkatva CRM
 */

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getWhatsAppLink(phone: string | null | undefined, message: string): string {
  if (!phone) return '#';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return '#';

  // Default to India (+91) if 10-digit number
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function calculateDaysLeft(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateDocNumber(prefix: 'INV' | 'REC' | 'QUO'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}${month}${day}-${rand}`;
}
