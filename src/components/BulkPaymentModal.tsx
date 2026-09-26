import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PaymentMethod } from '../types/finance';
import { formatCurrency, convertFromUSD } from '../utils/currency';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  DollarSign,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInvoiceIds?: string[];
}

export const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedInvoiceIds = [],
}) => {
  const {
    invoices,
    currentCurrency,
    executeBulkPayment,
    currentUser,
  } = useFinance();

  // Eligible invoices are approved (or overdue) and not paid
  const eligibleInvoices = invoices.filter(
    (i) => (i.status === 'approved' || i.status === 'overdue') && i.type === 'payable'
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (preselectedInvoiceIds.length > 0) {
      return preselectedInvoiceIds;
    }
    return eligibleInvoices.map((i) => i.id);
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ach');
  const [treasuryAccount, setTreasuryAccount] = useState('Operating Treasury - JPMorgan Chase (•••• 9021)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successBatch, setSuccessBatch] = useState<any | null>(null);

  if (!isOpen) return null;

  const toggleInvoice = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedInvoicesList = invoices.filter((i) => selectedIds.includes(i.id));
  const batchTotalUSD = selectedInvoicesList.reduce((sum, i) => sum + i.baseAmountUSD, 0);
  const batchTotalDisplay = convertFromUSD(batchTotalUSD, currentCurrency);

  // Corporate treasury balance simulation
  const treasuryBalanceUSD = 1450000;
  const postDisbursementBalanceUSD = treasuryBalanceUSD - batchTotalUSD;

  // Virtual card cashback calculation (1.5%)
  const virtualCardCashbackUSD = paymentMethod === 'virtual_card' ? batchTotalUSD * 0.015 : 0;
  const cashbackDisplay = convertFromUSD(virtualCardCashbackUSD, currentCurrency);

  const handleProcessBatch = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one invoice to disburse.');
      return;
    }

    if (currentUser.approvalLimitUSD > 0 && batchTotalUSD > currentUser.approvalLimitUSD) {
      alert(
        `Approval threshold exceeded: Batch total is $${batchTotalUSD.toLocaleString()}, exceeding your role limit ($${currentUser.approvalLimitUSD.toLocaleString()}). Requires Finance Director / CFO authorization.`
      );
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const batch = executeBulkPayment(selectedIds, paymentMethod);
      setIsProcessing(false);
      setSuccessBatch(batch);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 text-white rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bulk Payment Allocation & Disbursement
              </h3>
              <div className="text-xs text-slate-500">
                Consolidated batch execution across multiple verified supplier invoices
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successBatch ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Batch Disbursement Executed Successfully
            </h4>
            <div className="text-xs text-slate-600 max-w-md mx-auto">
              Batch <strong className="font-mono">{successBatch.batchNumber}</strong> has been transmitted to Treasury for settlement.
              {successBatch.cashbackEarnedUSD > 0 && (
                <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-md font-medium border border-emerald-200">
                  🎉 Virtual Card Rebate Earned: +{formatCurrency(convertFromUSD(successBatch.cashbackEarnedUSD, currentCurrency), currentCurrency)}
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Liquidity Preview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-medium">Operating Treasury Cash</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {formatCurrency(convertFromUSD(treasuryBalanceUSD, currentCurrency), currentCurrency)}
                </div>
                <div className="text-[10px] text-slate-400">JPMorgan Tier-1 Pool</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Batch Outflow Total</span>
                <div className="text-sm font-bold font-mono text-rose-600 mt-0.5">
                  -{formatCurrency(batchTotalDisplay, currentCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {selectedInvoicesList.length} invoices selected
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Post-Settlement Liquidity</span>
                <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                  {formatCurrency(convertFromUSD(postDisbursementBalanceUSD, currentCurrency), currentCurrency)}
                </div>
                <div className="text-[10px] text-emerald-600">Ample reserve buffer</div>
              </div>
            </div>

            {/* Payment Method Allocation Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-900 block mb-2">
                1. Select Allocation Payment Rail
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'ach' as PaymentMethod, label: 'ACH Direct', note: 'Standard US 1-2 days' },
                  { id: 'virtual_card' as PaymentMethod, label: 'Virtual Card', note: 'Earn 1.5% cashback!', badge: true },
                  { id: 'wire' as PaymentMethod, label: 'Fedwire / Swift', note: 'Same-day global wire' },
                  { id: 'sepa' as PaymentMethod, label: 'SEPA Instant', note: 'Eurozone settlement' },
                ].map((m) => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 border rounded-lg text-left transition-all relative ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs">{m.label}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {m.note}
                      </div>
                      {m.badge && (
                        <span className={`inline-block mt-1 text-[9px] font-mono px-1 rounded ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          REBATE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Invoices Selection List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-900">
                  2. Select Invoices for this Allocation Batch
                </label>
                <div className="text-xs text-slate-500">
                  <button
                    onClick={() => setSelectedIds(eligibleInvoices.map((i) => i.id))}
                    className="hover:text-slate-900 font-medium underline"
                  >
                    Select All ({eligibleInvoices.length})
                  </button>
                  <span className="mx-1">·</span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="hover:text-slate-900 font-medium underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {eligibleInvoices.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No approved or overdue invoices awaiting payment.
                  </div>
                ) : (
                  eligibleInvoices.map((inv) => {
                    const isChecked = selectedIds.includes(inv.id);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => toggleInvoice(inv.id)}
                        className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-slate-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{inv.vendorName}</span>
                              <span className="text-slate-400 font-normal">·</span>
                              <span className="font-mono text-slate-600">{inv.invoiceNumber}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Due: <span className={inv.status === 'overdue' ? 'text-rose-600 font-semibold' : ''}>{inv.dueDate}</span> · Terms: {inv.paymentTerms}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums">
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(inv.totalAmount, inv.currency)}
                          </div>
                          {inv.currency !== currentCurrency && (
                            <div className="text-[10px] text-slate-400">
                              ≈ {formatCurrency(convertFromUSD(inv.baseAmountUSD, currentCurrency), currentCurrency)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Virtual card rebate highlight if selected */}
            {paymentMethod === 'virtual_card' && virtualCardCashbackUSD > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>Corporate Card Rebate Program:</strong> 1.5% instant statement credit applied on this transaction batch.
                  </span>
                </div>
                <div className="font-mono font-bold text-emerald-800 text-sm whitespace-nowrap">
                  +{formatCurrency(cashbackDisplay, currentCurrency)}
                </div>
              </div>
            )}

            {/* Authorization note */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <span>
                Authorized by <strong>{currentUser.name}</strong> ({currentUser.title}). Batch transaction will be recorded with non-repudiation audit hash in general ledger.
              </span>
            </div>

          </div>
        )}

        {/* Footer */}
        {!successBatch && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="font-mono text-slate-600">
              Disbursing{' '}
              <strong className="text-slate-900 tabular-nums">
                {formatCurrency(batchTotalDisplay, currentCurrency)}
              </strong>{' '}
              across {selectedInvoicesList.length} payments
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || isProcessing}
                onClick={handleProcessBatch}
                className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Batch...</span>
                  </>
                ) : (
                  <>
                    <span>Disburse Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
