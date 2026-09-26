import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CurrencyCode, Invoice, InvoiceLineItem } from '../types/finance';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
  Cpu,
} from 'lucide-react';

interface InvoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
}

export const InvoiceIntakeModal: React.FC<InvoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { vendors, addInvoice, invoices } = useFinance();

  const [isScanning, setIsScanning] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Semiconductor & Mobile SoCs');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [issueDate, setIssueDate] = useState('2026-09-25');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [department, setDepartment] = useState('Hardware Engineering');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [threeWayMatched, setThreeWayMatched] = useState(true);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li_sample_1',
      description: 'Snapdragon 8 Gen 5 Mobile Application Processor (4nm TSMC)',
      quantity: 1000,
      unitPrice: 62.0,
      taxRate: 0.0,
      totalAmount: 62000.0,
    },
  ]);

  if (!isOpen) return null;

  // Preset sample receipts for instant automated intake demo
  const samplePresets = [
    {
      label: 'Qualcomm Snapdragon SoCs',
      vendor: 'Qualcomm Technologies Inc.',
      category: 'Semiconductor & Mobile SoCs',
      invNum: `QCOM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poNum: 'PO-2026-SP-1099',
      curr: 'USD' as CurrencyCode,
      dept: 'Hardware Engineering',
      terms: 'Net 30',
      items: [
        { id: '1', description: 'Snapdragon 8 Gen 5 Octa-Core Application Processor', quantity: 1500, unitPrice: 62.0, taxRate: 0.0, totalAmount: 93000 },
        { id: '2', description: 'Snapdragon X75 5G Modem-RF Baseband IC', quantity: 1500, unitPrice: 12.0, taxRate: 0.0, totalAmount: 18000 },
      ],
    },
    {
      label: 'Samsung 120Hz LTPO AMOLED',
      vendor: 'Samsung Display Co., Ltd.',
      category: 'OLED Panels & Touch Screens',
      invNum: `SDC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poNum: 'PO-2026-DISP-1120',
      curr: 'USD' as CurrencyCode,
      dept: 'Manufacturing & SMT',
      terms: 'Net 30',
      items: [
        { id: '1', description: '6.7-inch Dynamic LTPO 120Hz Flexible AMOLED Screen Module', quantity: 2500, unitPrice: 39.0, taxRate: 0.0, totalAmount: 97500 },
      ],
    },
    {
      label: '65W GaN Fast Chargers (Acc.)',
      vendor: 'Luxshare Precision Accessories Ltd.',
      category: 'Accessories & Fast Chargers',
      invNum: `LUX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poNum: 'PO-2026-ACC-1144',
      curr: 'USD' as CurrencyCode,
      dept: 'Accessories & Retail',
      terms: 'Net 15',
      items: [
        { id: '1', description: '65W Dual-Port GaN Fast Wall Chargers (Compact Foldable)', quantity: 4000, unitPrice: 8.5, taxRate: 0.0, totalAmount: 34000 },
        { id: '2', description: '100W Braided Kevlar USB-C PD Cables (2m High-Speed)', quantity: 6000, unitPrice: 2.5, taxRate: 0.0, totalAmount: 15000 },
        { id: '3', description: 'Qi2 Magnetic 15W Wireless Charging Pads', quantity: 1500, unitPrice: 8.0, taxRate: 0.0, totalAmount: 12000 },
      ],
    },
    {
      label: 'Corning Gorilla Glass Covers',
      vendor: 'Corning Incorporated (Gorilla Glass)',
      category: 'Glass Covers & Protection Materials',
      invNum: `CRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poNum: 'PO-2026-GLS-1180',
      curr: 'USD' as CurrencyCode,
      dept: 'Hardware Engineering',
      terms: 'Net 30',
      items: [
        { id: '1', description: 'Gorilla Glass Armor Front Cover Sheets', quantity: 5000, unitPrice: 4.5, taxRate: 0.0, totalAmount: 22500 },
        { id: '2', description: 'Tempered Glass Screen Protector Retail Packs', quantity: 5000, unitPrice: 1.5, taxRate: 0.0, totalAmount: 7500 },
      ],
    },
  ];

  const applyPreset = (preset: typeof samplePresets[0]) => {
    setIsScanning(true);
    setTimeout(() => {
      setVendorName(preset.vendor);
      setVendorCategory(preset.category);
      setInvoiceNumber(preset.invNum);
      setPoNumber(preset.poNum);
      setCurrency(preset.curr);
      setDepartment(preset.dept);
      setPaymentTerms(preset.terms);
      setLineItems(preset.items);
      setIsScanning(false);
    }, 600);
  };

  const handleSimulateOCRUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      applyPreset(samplePresets[0]);
      setIsScanning(false);
    }, 900);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li_${Date.now()}`,
        description: 'New service line item',
        quantity: 1,
        unitPrice: 500,
        taxRate: 0.05,
        totalAmount: 500,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((li) => li.id !== id));
    }
  };

  const updateLineItem = (
    id: string,
    field: keyof InvoiceLineItem,
    val: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        const updated = { ...li, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalAmount = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      })
    );
  };

  const subtotal = lineItems.reduce((s, li) => s + li.totalAmount, 0);
  const taxAmount = lineItems.reduce((s, li) => s + li.totalAmount * li.taxRate, 0);
  const totalAmount = subtotal + taxAmount;

  // Check duplicate invoice number
  const isDuplicate = invoices.some(
    (i) => i.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase().trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !invoiceNumber.trim()) {
      alert('Please enter Vendor Name and Invoice Number.');
      return;
    }
    if (isDuplicate) {
      alert(`Invoice number ${invoiceNumber} already exists in the system. Duplicate rejected by audit protocol.`);
      return;
    }

    const matchedVendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase()
    );

    const created = addInvoice({
      invoiceNumber: invoiceNumber.trim(),
      type: 'payable',
      poNumber: poNumber.trim() || undefined,
      vendorId: matchedVendor?.id || 'vnd_custom',
      vendorName: vendorName.trim(),
      vendorCategory,
      issueDate,
      dueDate,
      currency,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'pending_approval',
      paymentTerms,
      department,
      assignedApproverRole: totalAmount > 50000 ? 'cfo' : 'dept_manager',
      threeWayMatched,
      lineItems,
      notes: 'Automated OCR optical parsing verified. Routed to approval queue.',
    });

    onCreated(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-900" />
              <h3 className="text-base font-bold text-slate-900">
                Automated Invoice Intake & OCR Processor
              </h3>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Optical character recognition extracts vendor, line items, and matches PO reference
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Preset Buttons for Quick Demo */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Test Scans (Click to auto-extract):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors font-medium text-slate-800 flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{preset.curr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop OCR Upload Area */}
          <div
            onClick={handleSimulateOCRUpload}
            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
              isScanning
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            {isScanning ? (
              <div className="space-y-2 py-3">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                <div className="text-xs font-semibold text-blue-900">
                  Scanning invoice document with 99.4% confidence...
                </div>
                <div className="text-[11px] text-blue-600">
                  Parsing vendor EIN, line item table, and purchase order cross-match
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-800">
                  Click to drop invoice PDF or scanned image
                </div>
                <div className="text-[11px] text-slate-500">
                  Supports PDF, TIFF, PNG up to 25MB · Auto-matches existing Purchase Orders
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vendor */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vendor / Beneficiary Name *
                </label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Amazon Web Services Inc."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Vendor Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Spend Category
                </label>
                <select
                  value={vendorCategory}
                  onChange={(e) => setVendorCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-slate-500"
                >
                  <option value="Semiconductor & Mobile SoCs">Semiconductor & Mobile SoCs</option>
                  <option value="OLED Panels & Touch Screens">OLED Panels & Touch Screens</option>
                  <option value="Camera Sensors & Optics">Camera Sensors & Optics</option>
                  <option value="Contract Assembly & SMT">Contract Assembly & SMT</option>
                  <option value="Lithium Batteries & Power Cells">Lithium Batteries & Power Cells</option>
                  <option value="Accessories & Fast Chargers">Accessories & Fast Chargers</option>
                  <option value="Glass Covers & Protection Materials">Glass Covers & Protection Materials</option>
                  <option value="Supply Chain & Freight Logistics">Supply Chain & Freight Logistics</option>
                </select>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-9921"
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-md font-mono focus:outline-none ${
                    isDuplicate ? 'border-rose-500' : 'border-slate-200 focus:border-slate-500'
                  }`}
                />
                {isDuplicate && (
                  <span className="text-[10px] text-rose-600 mt-0.5 block">
                    Duplicate alert: Invoice number already exists.
                  </span>
                )}
              </div>

              {/* PO Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Purchase Order (PO) Reference
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-1044"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Invoice Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="JPY">JPY - Japanese Yen (¥)</option>
                  <option value="CAD">CAD - Canadian Dollar (CA$)</option>
                  <option value="AUD">AUD - Australian Dollar (A$)</option>
                  <option value="SGD">SGD - Singapore Dollar (S$)</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cost Center / Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-slate-500"
                >
                  <option value="Hardware Engineering">Hardware Engineering</option>
                  <option value="Manufacturing & SMT">Manufacturing & SMT</option>
                  <option value="Accessories & Retail">Accessories & Retail</option>
                  <option value="Operations & Manufacturing">Operations & Manufacturing</option>
                  <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                  <option value="Sales & Channel Distribution">Sales & Channel Distribution</option>
                  <option value="Finance & Treasury">Finance & Treasury</option>
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {/* Line items section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Line Items Breakdown</span>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((li) => (
                  <div
                    key={li.id}
                    className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 text-xs"
                  >
                    <input
                      type="text"
                      value={li.description}
                      onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-16">
                        <input
                          type="number"
                          value={li.quantity}
                          min={1}
                          onChange={(e) => updateLineItem(li.id, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-right"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={li.unitPrice}
                          min={0}
                          step="0.01"
                          onChange={(e) => updateLineItem(li.id, 'unitPrice', Number(e.target.value))}
                          placeholder="Price"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-right"
                        />
                      </div>
                      <div className="w-20 font-mono font-semibold text-slate-900 text-right">
                        {li.totalAmount.toFixed(2)}
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(li.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total display */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Calculated Tax</span>
                <span className="font-mono">{taxAmount.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Payout</span>
                <span className="font-mono">{totalAmount.toFixed(2)} {currency}</span>
              </div>
            </div>

            {/* 3-Way Match Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="threeWay"
                checked={threeWayMatched}
                onChange={(e) => setThreeWayMatched(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="threeWay" className="text-xs text-slate-700 cursor-pointer">
                Confirm 3-way match (Purchase Order, receiving slip, and contract rates verified)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDuplicate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors shadow-xs"
              >
                Log Into AP Workflow
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
