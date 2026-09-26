import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Invoice,
  Vendor,
  CurrencyCode,
  UserRole,
  UserProfile,
  NotificationItem,
  PaymentBatch,
  PaymentMethod,
  EmailReminderTemplate,
} from '../types/finance';
import {
  INITIAL_INVOICES,
  INITIAL_VENDORS,
  INITIAL_NOTIFICATIONS,
  USER_PROFILES,
  EMAIL_TEMPLATES,
} from '../data/mockFinanceData';
import { convertToUSD, formatCurrency } from '../utils/currency';

interface FinanceContextType {
  invoices: Invoice[];
  vendors: Vendor[];
  notifications: NotificationItem[];
  currentRole: UserRole;
  currentUser: UserProfile;
  currentCurrency: CurrencyCode;
  emailTemplates: EmailReminderTemplate[];
  paymentBatches: PaymentBatch[];
  unreadNotificationsCount: number;
  
  // Actions
  setCurrentRole: (role: UserRole) => void;
  setCurrentCurrency: (currency: CurrencyCode) => void;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'auditHistory' | 'baseAmountUSD' | 'remindersSentCount'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>, auditNote?: string) => void;
  approveInvoice: (id: string, note?: string) => boolean;
  rejectInvoice: (id: string, reason: string) => boolean;
  executePayment: (invoiceId: string, method: PaymentMethod) => void;
  executeBulkPayment: (invoiceIds: string[], method: PaymentMethod) => PaymentBatch;
  sendEmailReminder: (invoiceId: string, templateId: string, customSubject?: string, customBody?: string) => void;
  addVendor: (vendorData: Omit<Vendor, 'id' | 'totalSpendUSD' | 'openInvoicesCount'>) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToSampleData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_INVOICES = 'ledgerflow_ap_invoices_v1';
const STORAGE_KEY_VENDORS = 'ledgerflow_ap_vendors_v1';
const STORAGE_KEY_NOTIFS = 'ledgerflow_ap_notifs_v1';
const STORAGE_KEY_ROLE = 'ledgerflow_ap_role_v1';
const STORAGE_KEY_CURR = 'ledgerflow_ap_currency_v1';
const STORAGE_KEY_BATCHES = 'ledgerflow_ap_batches_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VENDORS);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE);
      return (saved as UserRole) || 'cfo';
    } catch {
      return 'cfo';
    }
  });

  const [currentCurrency, setCurrentCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURR);
      return (saved as CurrencyCode) || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BATCHES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURR, currentCurrency);
  }, [currentCurrency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(paymentBatches));
  }, [paymentBatches]);

  const currentUser = useMemo(() => {
    return USER_PROFILES.find((p) => p.role === currentRole) || USER_PROFILES[0];
  }, [currentRole]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
  };

  const setCurrentCurrency = (currency: CurrencyCode) => {
    setCurrentCurrencyState(currency);
  };

  const addInvoice = (
    invoiceData: Omit<Invoice, 'id' | 'auditHistory' | 'baseAmountUSD' | 'remindersSentCount'>
  ): Invoice => {
    const baseAmountUSD = convertToUSD(invoiceData.totalAmount, invoiceData.currency);
    const newId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: newId,
      baseAmountUSD,
      remindersSentCount: 0,
      auditHistory: [
        {
          id: `ah_${Date.now()}`,
          timestamp: nowStr,
          userName: currentUser.name,
          role: currentUser.role,
          action: 'Invoice received and entered into ledger',
        },
      ],
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'New Invoice Processed',
      message: `${newInvoice.vendorName} #${newInvoice.invoiceNumber} (${formatCurrency(newInvoice.totalAmount, newInvoice.currency)}) logged into AP pipeline.`,
      timestamp: 'Just now',
      type: 'approval_required',
      invoiceId: newInvoice.id,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>, auditNote?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const newHistory = [...inv.auditHistory];
        if (auditNote) {
          newHistory.push({
            id: `ah_${Date.now()}`,
            timestamp: nowStr,
            userName: currentUser.name,
            role: currentUser.role,
            action: auditNote,
          });
        }
        return { ...inv, ...updates, auditHistory: newHistory };
      })
    );
  };

  const approveInvoice = (id: string, note?: string): boolean => {
    const target = invoices.find((i) => i.id === id);
    if (!target) return false;

    // RBAC Limit check
    if (currentUser.approvalLimitUSD > 0 && target.baseAmountUSD > currentUser.approvalLimitUSD) {
      alert(`Approval exceeded: Your role (${currentUser.title}) limit is $${currentUser.approvalLimitUSD.toLocaleString()}. Please escalate to Finance Director/CFO.`);
      return false;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          status: 'approved',
          auditHistory: [
            ...inv.auditHistory,
            {
              id: `ah_${Date.now()}`,
              timestamp: nowStr,
              userName: currentUser.name,
              role: currentUser.role,
              action: `Approved invoice for payment${note ? `: ${note}` : ''}`,
            },
          ],
        };
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Invoice Approved',
        message: `${target.invoiceNumber} (${target.vendorName}) approved by ${currentUser.name}. Ready for disbursement batch.`,
        timestamp: 'Just now',
        type: 'approval_required',
        invoiceId: target.id,
        read: false,
      },
      ...prev,
    ]);

    return true;
  };

  const rejectInvoice = (id: string, reason: string): boolean => {
    const target = invoices.find((i) => i.id === id);
    if (!target) return false;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          status: 'rejected',
          auditHistory: [
            ...inv.auditHistory,
            {
              id: `ah_${Date.now()}`,
              timestamp: nowStr,
              userName: currentUser.name,
              role: currentUser.role,
              action: `Rejected invoice: ${reason}`,
            },
          ],
        };
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Invoice Rejected',
        message: `${target.invoiceNumber} rejected: ${reason}`,
        timestamp: 'Just now',
        type: 'approval_required',
        invoiceId: target.id,
        read: false,
      },
      ...prev,
    ]);

    return true;
  };

  const executePayment = (invoiceId: string, method: PaymentMethod) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const ref = `${method.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        return {
          ...inv,
          status: 'paid',
          paidAt: nowStr,
          paymentMethod: method,
          paymentReference: ref,
          auditHistory: [
            ...inv.auditHistory,
            {
              id: `ah_${Date.now()}`,
              timestamp: nowStr,
              userName: currentUser.name,
              role: currentUser.role,
              action: `Disbursed payment via ${method.toUpperCase()} (Ref: ${ref})`,
            },
          ],
        };
      })
    );

    // Update vendor total spend
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === target.vendorId) {
          return {
            ...v,
            totalSpendUSD: v.totalSpendUSD + target.baseAmountUSD,
            openInvoicesCount: Math.max(0, v.openInvoicesCount - 1),
          };
        }
        return v;
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Payment Disbursed',
        message: `Settled ${formatCurrency(target.totalAmount, target.currency)} to ${target.vendorName} (${ref}).`,
        timestamp: 'Just now',
        type: 'payment_executed',
        invoiceId: target.id,
        read: false,
      },
      ...prev,
    ]);
  };

  const executeBulkPayment = (invoiceIds: string[], method: PaymentMethod): PaymentBatch => {
    const targets = invoices.filter((i) => invoiceIds.includes(i.id));
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const batchNum = `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalUSD = targets.reduce((sum, inv) => sum + inv.baseAmountUSD, 0);

    // Virtual cards get a 1.5% treasury rebate
    const cashbackUSD = method === 'virtual_card' ? totalUSD * 0.015 : 0;

    const newBatch: PaymentBatch = {
      id: `batch_${Date.now()}`,
      batchNumber: batchNum,
      createdAt: nowStr,
      totalAmountUSD: totalUSD,
      invoiceCount: targets.length,
      paymentMethod: method,
      cashbackEarnedUSD: cashbackUSD,
      status: 'settled',
      invoices: targets,
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (!invoiceIds.includes(inv.id)) return inv;
        const ref = `${method.toUpperCase()}-${batchNum.slice(-4)}-${inv.invoiceNumber.slice(-4)}`;
        return {
          ...inv,
          status: 'paid',
          paidAt: nowStr,
          paymentMethod: method,
          paymentReference: ref,
          auditHistory: [
            ...inv.auditHistory,
            {
              id: `ah_${Date.now()}`,
              timestamp: nowStr,
              userName: currentUser.name,
              role: currentUser.role,
              action: `Settled via Bulk Payment Batch ${batchNum} (${method.toUpperCase()})`,
            },
          ],
        };
      })
    );

    // Update vendors
    setVendors((prev) =>
      prev.map((v) => {
        const vendorInvoices = targets.filter((ti) => ti.vendorId === v.id);
        if (vendorInvoices.length > 0) {
          const additionalSpend = vendorInvoices.reduce((s, vi) => s + vi.baseAmountUSD, 0);
          return {
            ...v,
            totalSpendUSD: v.totalSpendUSD + additionalSpend,
            openInvoicesCount: Math.max(0, v.openInvoicesCount - vendorInvoices.length),
          };
        }
        return v;
      })
    );

    setPaymentBatches((prev) => [newBatch, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Bulk Disbursement Completed',
        message: `Batch ${batchNum}: Disbursed ${formatCurrency(totalUSD, 'USD')} across ${targets.length} invoices via ${method.toUpperCase()}.${cashbackUSD > 0 ? ` Earned $${cashbackUSD.toFixed(2)} corporate card rebate!` : ''}`,
        timestamp: 'Just now',
        type: 'payment_executed',
        read: false,
      },
      ...prev,
    ]);

    return newBatch;
  };

  const sendEmailReminder = (
    invoiceId: string,
    templateId: string,
    customSubject?: string,
    customBody?: string
  ) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        return {
          ...inv,
          remindersSentCount: inv.remindersSentCount + 1,
          lastReminderDate: nowStr.slice(0, 10),
          auditHistory: [
            ...inv.auditHistory,
            {
              id: `ah_${Date.now()}`,
              timestamp: nowStr,
              userName: currentUser.name,
              role: currentUser.role,
              action: `Dispatched automated email reminder (${tmpl?.name || 'Custom Notice'}) to ${inv.vendorName}`,
            },
          ],
        };
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Email Reminder Dispatched',
        message: `Automated reminder delivered to ${target.vendorName} regarding ${target.invoiceNumber}.`,
        timestamp: 'Just now',
        type: 'reminder_dispatched',
        invoiceId: target.id,
        read: false,
      },
      ...prev,
    ]);
  };

  const addVendor = (vendorData: Omit<Vendor, 'id' | 'totalSpendUSD' | 'openInvoicesCount'>): Vendor => {
    const newId = `vnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newVendor: Vendor = {
      ...vendorData,
      id: newId,
      totalSpendUSD: 0,
      openInvoicesCount: 0,
    };
    setVendors((prev) => [newVendor, ...prev]);
    return newVendor;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToSampleData = () => {
    setInvoices(INITIAL_INVOICES);
    setVendors(INITIAL_VENDORS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setPaymentBatches([]);
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_VENDORS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_BATCHES);
  };

  return (
    <FinanceContext.Provider
      value={{
        invoices,
        vendors,
        notifications,
        currentRole,
        currentUser,
        currentCurrency,
        emailTemplates: EMAIL_TEMPLATES,
        paymentBatches,
        unreadNotificationsCount,
        setCurrentRole,
        setCurrentCurrency,
        addInvoice,
        updateInvoice,
        approveInvoice,
        rejectInvoice,
        executePayment,
        executeBulkPayment,
        sendEmailReminder,
        addVendor,
        updateVendor,
        markNotificationRead,
        markAllNotificationsRead,
        resetToSampleData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
