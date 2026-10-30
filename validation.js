function validateApplication(body) {
  const x = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const fullName = typeof x.fullName === "string" ? x.fullName.trim() : "";
  const email = typeof x.email === "string" ? x.email.trim().toLowerCase() : "";
  const phone = typeof x.phone === "string" ? x.phone.trim() : "";
  const coverLetter = typeof x.coverLetter === "string" ? x.coverLetter.trim() : "";
  const opportunityId = Number(x.opportunityId);
  const errors = {};
  if (fullName.length < 2 || fullName.length > 80 || !/^[\p{L}\p{M} .'-]+$/u.test(fullName)) errors.fullName = "Enter a valid name (2–80 characters).";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";
  if (phone && !/^[+()\d .-]{7,20}$/.test(phone)) errors.phone = "Enter a valid phone number.";
  if (!Number.isSafeInteger(opportunityId) || opportunityId < 1) errors.opportunityId = "Select a valid opportunity.";
  if (coverLetter.length > 2000) errors.coverLetter = "Cover letter must be 2,000 characters or fewer.";
  return { valid: Object.keys(errors).length === 0, errors, value: {fullName,email,phone,coverLetter,opportunityId} };
}
module.exports = { validateApplication };
