const fs = require('fs');

const filePath = 'server.ts';
let content = fs.readFileSync('server.ts', 'utf-8');

const replacements = [
  { from: "requireRoles(patientRecordRoles)", to: "requirePermission('patients.read')" },
  { from: "requireRoles(patientRecordRoles)", to: "requirePermission('patients.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('patients.delete')" },
  { from: "requireRoles(['admin', 'it_developer'])", to: "requirePermission('patients.write')" },
  
  { from: "requireRoles(patientRecordRoles)", to: "requirePermission('owners.read')" },
  { from: "requireRoles(patientRecordRoles)", to: "requirePermission('owners.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('owners.delete')" },
  
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('visits.read')" },
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('visits.write')" },
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('visits.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('visits.delete')" },
  
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('vaccinations.read')" },
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('vaccinations.write')" },
  
  { from: "requireRoles(appointmentRoles)", to: "requirePermission('appointments.read')" },
  { from: "requireRoles(appointmentRoles)", to: "requirePermission('appointments.write')" },
  { from: "requireRoles(appointmentRoles)", to: "requirePermission('appointments.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian', 'receptionist'])", to: "requirePermission('appointments.delete')" },
  
  { from: "requireRoles(appointmentRoles)", to: "requirePermission('queues.read')" },
  { from: "requireRoles(appointmentRoles)", to: "requirePermission('queues.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'receptionist'])", to: "requirePermission('queues.delete')" },
  
  { from: "requireRoles(financeRoles)", to: "requirePermission('invoices.read')" },
  { from: "requireRoles(financeRoles)", to: "requirePermission('invoices.write')" },
  { from: "requireRoles(financeRoles)", to: "requirePermission('invoices.pay')" },
  { from: "requireRoles(['admin', 'it_developer'])", to: "requirePermission('invoices.delete')" },
  
  { from: "requireRoles(boardingRoles)", to: "requirePermission('boarding.read')" },
  { from: "requireRoles(boardingRoles)", to: "requirePermission('boarding.write')" },
  { from: "requireRoles(boardingRoles)", to: "requirePermission('boarding.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('boarding.delete')" },
  
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('surgery.read')" },
  { from: "requireRoles(clinicalRecordRoles)", to: "requirePermission('surgery.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('surgery.write')" },
  { from: "requireRoles(['admin', 'it_developer', 'senior_veterinarian'])", to: "requirePermission('surgery.delete')" },
];

let contentStr = fs.readFileSync('server.ts', 'utf-8');

let modified = false;
for (const { from, to } of replacements) {
  if (contentStr.includes(from)) {
    contentStr = contentStr.replace(from, to);
    modified = true;
    console.log(`Replaced: ${from} -> ${to}`);
  } else {
    console.log(`NOT FOUND: ${from}`);
  }
}

if (modified) {
  fs.writeFileSync('server.ts', contentStr, 'utf-8');
  console.log('Replacements done!');
} else {
  console.log('No changes made');
}