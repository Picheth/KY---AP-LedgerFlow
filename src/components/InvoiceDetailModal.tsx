import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Invoice, PaymentMethod } from '../types/finance';
import { formatCurrency, convertFromUSD } from '../utils/currency';
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Send,
  Building,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  Printer,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onOpenReminderForInvoice: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onOpenReminderForInvoice,
}) => {
  const {
    currentUser,
    currentCurrency,
    approveInvoice,
    rejectInvoice,
    executePayment,
    vendors,
  } = useFinance();

  const [approvalNote, setApprovalNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('ach');
  const [showPayOptions, setShowPayOptions] = useState(false);

  if (!invoice) return null;

  const vendor = vendors.find((v) => v.id === invoice.vendorId);
  const convertedTotal = convertFromUSD(invoice.baseAmountUSD, currentCurrency);

  const handleApprove = () => {
    const success = approveInvoice(invoice.id, approvalNote.trim() || undefined);
    if (success) {
      setApprovalNote('');
      onClose();
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for invoice rejection.');
      return;
    }
    const success = rejectInvoice(invoice.id, rejectReason.trim());
    if (success) {
      setRejectReason('');
      setShowRejectInput(false);
      onClose();
    }
  };

  const handlePay = () => {
    executePayment(invoice.id, selectedPayMethod);
    setShowPayOptions(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {invoice.invoiceNumber}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs uppercase font-semibold text-slate-500">
                {invoice.type === 'payable' ? 'Accounts Payable' : 'Accounts Receivable'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              PO Ref: <span className="font-mono">{invoice.poNumber || 'Direct Expense'}</span> · Dept: {invoice.department}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
              title="Print Remittance"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Vendor & Payment Terms Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs text-slate-400 font-medium">Beneficiary / Vendor</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{invoice.vendorName}</div>
              <div className="text-xs text-slate-500 mt-1">{invoice.vendorCategory}</div>
              {vendor && (
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Tax ID: {vendor.taxId} · Route: {vendor.bankName}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-slate-400 font-medium">Payment Timeline & Terms</div>
              <div className="text-xs text-slate-700 font-mono mt-0.5">
                Issue Date: {invoice.issueDate}
              </div>
              <div className="text-xs font-mono font-medium text-slate-900 mt-0.5">
                Due Date: <span className={invoice.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>{invoice.dueDate}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Terms: {invoice.paymentTerms}
              </div>
            </div>
          </div>

          {/* 3-Way Match Audit Box */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-semibold text-slate-900">SOX 404 3-Way Matching Verification</h4>
              </div>
              <span className={`text-xs font-medium ${invoice.threeWayMatched ? 'text-emerald-700' : 'text-amber-700'}`}>
                {invoice.threeWayMatched ? 'Verified & In Sync' : 'Pending Receipt'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                <div className="text-slate-500 font-medium">1. Purchase Order</div>
                <div className="font-mono text-slate-900 mt-1">{invoice.poNumber || 'DIRECT-AP'}</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Authorized budget</div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                <div className="text-slate-500 font-medium">2. Goods Receipt / SOW</div>
                <div className="font-mono text-slate-900 mt-1">{invoice.threeWayMatched ? 'REC-2026-OK' : 'PENDING'}</div>
                <div className={`text-[11px] mt-0.5 ${invoice.threeWayMatched ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {invoice.threeWayMatched ? 'Quantities confirmed' : 'Awaiting delivery'}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                <div className="text-slate-500 font-medium">3. Price Schedule</div>
                <div className="font-mono text-slate-900 mt-1">Contract Tier 1</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">No rate variances</div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2">Invoice Line Items</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Tax Rate</th>
                    <th className="py-2 px-3 text-right">Total ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="py-2.5 px-3 text-slate-800">{li.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">{li.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(li.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                        {(li.taxRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(li.totalAmount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="bg-slate-50/70 p-3 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount</span>
                  <span className="font-mono tabular-nums">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Invoice Total ({invoice.currency})</span>
                  <span className="font-mono tabular-nums">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
                {invoice.currency !== currentCurrency && (
                  <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                    <span>Equivalent in {currentCurrency}</span>
                    <span className="font-mono tabular-nums font-medium">
                      {formatCurrency(convertedTotal, currentCurrency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Paid details if settled */}
          {invoice.status === 'paid' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Payment Disbursed & Settled</span>
              </div>
              <div className="text-emerald-800">
                Settled on <span className="font-mono font-medium">{invoice.paidAt}</span> via{' '}
                <span className="font-semibold uppercase">{invoice.paymentMethod}</span>.
              </div>
              <div className="text-emerald-700 font-mono text-[11px]">
                Treasury Reference: {invoice.paymentReference}
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2">Audit Log & Approval Trail</h4>
            <div className="space-y-2 border-l-2 border-slate-200 pl-4 py-1 text-xs">
              {invoice.auditHistory.map((entry) => (
                <div key={entry.id} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-white" />
                  <div className="text-slate-800 font-medium">{entry.action}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {entry.userName} ({entry.role.replace('_', ' ')}) · <span className="font-mono">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reject Reason input if active */}
          {showRejectInput && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
              <label className="font-semibold text-rose-900 block">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Quantity discrepancy on line item 2, rate exceeds agreed contract..."
                className="w-full p-2 bg-white border border-rose-200 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-1 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Pay Options dropdown if active */}
          {showPayOptions && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <label className="font-semibold text-slate-900 block">Select Disbursement Treasury Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['ach', 'wire', 'sepa', 'virtual_card'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedPayMethod(method)}
                    className={`p-2 border rounded-md font-mono text-center uppercase transition-colors ${
                      selectedPayMethod === method
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {method.replace('_', ' ')}
                    {method === 'virtual_card' && (
                      <span className="block text-[9px] text-emerald-400 font-sans lowercase">1.5% rebate</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPayOptions(false)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  className="px-3 py-1 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                >
                  Authorize Payment ({formatCurrency(invoice.totalAmount, invoice.currency)})
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReminderForInvoice(invoice)}
              className="px-3 py-1.5 font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span>Email Reminder</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Approval Controls */}
            {(invoice.status === 'pending_approval' || invoice.status === 'in_review') &&
              currentUser.role !== 'auditor' &&
              !showRejectInput && (
                <>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-xs"
                  >
                    Approve Invoice
                  </button>
                </>
              )}

            {/* Payment Trigger if Approved */}
            {invoice.status === 'approved' && currentUser.role !== 'auditor' && !showPayOptions && (
              <button
                onClick={() => setShowPayOptions(true)}
                className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Execute Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
