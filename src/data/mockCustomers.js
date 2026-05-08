// ─── MOCK DATA ONLY ─── No real customer information ───────────────────────
// All names, account numbers, SSN digits, addresses, and phone numbers are
// entirely fictional and used for demonstration purposes only.

export const mockCustomers = [
  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOMER 1  |  James Holloway  |  Mild Delinquency (1 payment past due)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ACC-001234',
    name: 'James Holloway',
    firstName: 'James',
    ssn_last4: '4821',
    dob: { month: '03', day: '15' },
    address: '142 Maple Street, Denver, CO 80203',
    zip: '80203',
    phones: {
      home: '(720) 555-0142',
      mobile: '(720) 555-0198',
      work: '(303) 555-0071',
    },
    email: 'j.holloway@email.com',
    preferredContact: 'Mobile',
    balance: 2450.00,
    creditLimit: 5000.00,
    minDue: 65.00,
    currentDue: 65.00,
    pastDue: 65.00,
    dueDate: '2026-05-15',
    lastPaymentAmount: 65.00,
    lastPaymentDate: '2026-04-10',
    paymentsLate: 1,
    riskLevel: 'low',
    riskLabel: 'Low Risk',
    delinquencyHistory: {
      summary: { '5dpd': 2, '30dpd': 1, '60dpd': 0, '90dpd': 0, '120dpd': 0, '150dpd': 0, '180dpd': 0 },
      monthly: [
        { month: 'Apr 2025', dpd: 0,  status: 'Current' },
        { month: 'May 2025', dpd: 5,  status: '5 DPD'   },
        { month: 'Jun 2025', dpd: 0,  status: 'Current' },
        { month: 'Jul 2025', dpd: 0,  status: 'Current' },
        { month: 'Aug 2025', dpd: 5,  status: '5 DPD'   },
        { month: 'Sep 2025', dpd: 0,  status: 'Current' },
        { month: 'Oct 2025', dpd: 0,  status: 'Current' },
        { month: 'Nov 2025', dpd: 30, status: '30 DPD'  },
        { month: 'Dec 2025', dpd: 0,  status: 'Current' },
        { month: 'Jan 2026', dpd: 0,  status: 'Current' },
        { month: 'Feb 2026', dpd: 0,  status: 'Current' },
        { month: 'Mar 2026', dpd: 0,  status: 'Current' },
        { month: 'Apr 2026', dpd: 30, status: '30 DPD'  },
      ],
    },
    creditHistory: [
      {
        creditor: 'Wells Fargo', type: 'Auto Loan',
        balance: 14500.00, minPayment: 320.00,
        status: 'Current', dpd: 0, creditLimit: null,
      },
      {
        creditor: 'Chase Bank', type: 'Credit Card',
        balance: 850.00, minPayment: 25.00,
        status: 'Current', dpd: 0, creditLimit: 3000.00,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOMER 2  |  Maria Garcia  |  Moderate Delinquency (3 payments past due)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ACC-005678',
    name: 'Maria Garcia',
    firstName: 'Maria',
    ssn_last4: '7293',
    dob: { month: '07', day: '22' },
    address: '890 Riverside Drive, Austin, TX 78701',
    zip: '78701',
    phones: {
      home: '(512) 555-0890',
      mobile: '(512) 555-0445',
      work: null,
    },
    email: 'mgarcia@webmail.com',
    preferredContact: 'Mobile',
    balance: 8750.00,
    creditLimit: 12000.00,
    minDue: 175.00,
    currentDue: 175.00,
    pastDue: 525.00,
    dueDate: '2026-05-10',
    lastPaymentAmount: 175.00,
    lastPaymentDate: '2026-02-03',
    paymentsLate: 3,
    riskLevel: 'medium',
    riskLabel: 'Moderate Risk',
    delinquencyHistory: {
      summary: { '5dpd': 4, '30dpd': 5, '60dpd': 3, '90dpd': 1, '120dpd': 0, '150dpd': 0, '180dpd': 0 },
      monthly: [
        { month: 'Apr 2025', dpd: 30, status: '30 DPD'  },
        { month: 'May 2025', dpd: 60, status: '60 DPD'  },
        { month: 'Jun 2025', dpd: 5,  status: '5 DPD'   },
        { month: 'Jul 2025', dpd: 0,  status: 'Current' },
        { month: 'Aug 2025', dpd: 30, status: '30 DPD'  },
        { month: 'Sep 2025', dpd: 60, status: '60 DPD'  },
        { month: 'Oct 2025', dpd: 90, status: '90 DPD'  },
        { month: 'Nov 2025', dpd: 5,  status: '5 DPD'   },
        { month: 'Dec 2025', dpd: 0,  status: 'Current' },
        { month: 'Jan 2026', dpd: 5,  status: '5 DPD'   },
        { month: 'Feb 2026', dpd: 30, status: '30 DPD'  },
        { month: 'Mar 2026', dpd: 60, status: '60 DPD'  },
        { month: 'Apr 2026', dpd: 5,  status: '5 DPD'   },
      ],
    },
    creditHistory: [
      {
        creditor: 'Capital One', type: 'Credit Card',
        balance: 3200.00, minPayment: 80.00,
        status: '30 DPD', dpd: 30, creditLimit: 4000.00,
      },
      {
        creditor: 'Sallie Mae', type: 'Student Loan',
        balance: 22500.00, minPayment: 250.00,
        status: 'Current', dpd: 0, creditLimit: null,
      },
      {
        creditor: 'TD Auto Finance', type: 'Auto Loan',
        balance: 11200.00, minPayment: 285.00,
        status: 'Current', dpd: 0, creditLimit: null,
      },
      {
        creditor: 'Comenity Bank', type: 'Retail Credit',
        balance: 445.00, minPayment: 15.00,
        status: '30 DPD', dpd: 30, creditLimit: 600.00,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOMER 3  |  Robert Mitchell  |  Severe Delinquency (7 payments past due)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ACC-009012',
    name: 'Robert Mitchell',
    firstName: 'Robert',
    ssn_last4: '3847',
    dob: { month: '11', day: '08' },
    address: '2215 Industrial Blvd, Chicago, IL 60601',
    zip: '60601',
    phones: {
      home: null,
      mobile: '(773) 555-2215',
      work: '(312) 555-0033',
    },
    email: 'rmitchell@fastnet.com',
    preferredContact: 'Mobile',
    balance: 15800.00,
    creditLimit: 16000.00,
    minDue: 316.00,
    currentDue: 316.00,
    pastDue: 2212.00,
    dueDate: '2026-05-05',
    lastPaymentAmount: 150.00,
    lastPaymentDate: '2025-10-15',
    paymentsLate: 7,
    riskLevel: 'high',
    riskLabel: 'High Risk',
    delinquencyHistory: {
      summary: { '5dpd': 5, '30dpd': 7, '60dpd': 6, '90dpd': 5, '120dpd': 4, '150dpd': 3, '180dpd': 2 },
      monthly: [
        { month: 'Apr 2025', dpd: 30,  status: '30 DPD'  },
        { month: 'May 2025', dpd: 60,  status: '60 DPD'  },
        { month: 'Jun 2025', dpd: 90,  status: '90 DPD'  },
        { month: 'Jul 2025', dpd: 30,  status: '30 DPD'  },
        { month: 'Aug 2025', dpd: 60,  status: '60 DPD'  },
        { month: 'Sep 2025', dpd: 90,  status: '90 DPD'  },
        { month: 'Oct 2025', dpd: 120, status: '120 DPD' },
        { month: 'Nov 2025', dpd: 150, status: '150 DPD' },
        { month: 'Dec 2025', dpd: 180, status: '180 DPD' },
        { month: 'Jan 2026', dpd: 150, status: '150 DPD' },
        { month: 'Feb 2026', dpd: 120, status: '120 DPD' },
        { month: 'Mar 2026', dpd: 90,  status: '90 DPD'  },
        { month: 'Apr 2026', dpd: 120, status: '120 DPD' },
      ],
    },
    creditHistory: [
      {
        creditor: 'Discover', type: 'Credit Card',
        balance: 8900.00, minPayment: 220.00,
        status: '90 DPD', dpd: 90, creditLimit: 9000.00,
      },
      {
        creditor: 'Synchrony Bank', type: 'Retail Credit',
        balance: 1800.00, minPayment: 60.00,
        status: '60 DPD', dpd: 60, creditLimit: 2000.00,
      },
      {
        creditor: 'OneMain Financial', type: 'Personal Loan',
        balance: 5500.00, minPayment: 185.00,
        status: '120 DPD', dpd: 120, creditLimit: null,
      },
      {
        creditor: 'Midland Funding', type: 'Collection Account',
        balance: 2300.00, minPayment: 0.00,
        status: 'Collections', dpd: 0, creditLimit: null,
      },
      {
        creditor: 'AT&T', type: 'Telecommunications',
        balance: 425.00, minPayment: 0.00,
        status: 'Collections', dpd: 0, creditLimit: null,
      },
    ],
  },
]

export const getCustomerById = (id) =>
  mockCustomers.find((c) => c.id === id.toUpperCase().trim())
