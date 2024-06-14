// Define the packages and their costs
export const packages = {
  'Professional Package': {
    cost: 150,
    inc: [
      'Bespoke CV',
      'Cover Letter',
      'LinkedIn Optimisation',
      'ApplyMate',
      'Interview Preparation',
      'CV Circulation',
    ],
  },
  'Standard Package': {
    cost: 99,
    inc: ['Bespoke CV', 'Cover Letter', 'LinkedIn Optimisation', 'ApplyMate'],
  },
  'Basic Package': {
    cost: 75,
    inc: ['Bespoke CV', 'Cover Letter'],
  },
  'CV Package': {
    cost: 60,
    inc: ['Bespoke CV'],
  },
};

export const individualServices = {
  'Bespoke CV': 60, // 60+60 => 120
  'Cover Letter': 25, // 25+25 => 50
  'LinkedIn Optimisation': 25,
  'Interview Preparation': 50,
  ApplyMate: 30,
  'Bespoke Presentation': 60,
  'CV Circulation': 50,
  'Career Coaching': 300,
  'Personal Statement (Under 1,000 words)': 60,
  'Personal Statement (Over 1,000 words)': 90,
  'Presentation Design': 35,
  'Pro Apply': 75,
  'CV Re-Optimisation': 25,
};

// Discounts
export const discounts = {
  student: {
    label: 'Student Discount',
    discountLabel: '10%',
    value: 0.1,
  },
  unemployed: {
    label: 'Unemployed Discount',
    discountLabel: '10%',
    value: 0.1,
  },
  recentGraduate: {
    label: 'Recent Graduate Discount',
    discountLabel: '10%',
    value: 0.1,
  },
  employed: {
    label: 'Employee Discount',
    discountLabel: '0%',
    value: 0,
  },
};
