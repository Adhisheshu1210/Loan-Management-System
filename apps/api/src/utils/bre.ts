export type BreInput = {
  dob: string | Date;
  salary: number;
  pan: string;
  employmentMode: string;
};

export type BreResult = {
  eligible: boolean;
  reasons: string[];
  age: number;
};

export function calculateAge(dob: string | Date) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function validatePan(pan: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

export function runBre(input: BreInput): BreResult {
  const reasons: string[] = [];
  const age = calculateAge(input.dob);
  if (age < 23 || age > 50) reasons.push("Age must be between 23 and 50 years.");
  if (input.salary < 25000) reasons.push("Monthly salary must be at least ₹25,000.");
  if (!validatePan(input.pan)) reasons.push("PAN format is invalid.");
  if (input.employmentMode === "Unemployed") reasons.push("Unemployed applicants are not eligible.");
  return { eligible: reasons.length === 0, reasons, age };
}
