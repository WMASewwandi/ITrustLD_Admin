/** NIC reject reasons from ITrustLD_Existing popup-identity-verify.blade.php */
export const KYC_NIC_REJECT_REASONS = [
  "Please upload both sides of the document",
  "Your image is not clear. Please upload clear image",
  "Your document does not include an address",
  "Your document does not include an NIC number",
  "Your document details do not match the registration record",
  "Custom Message",
];

/** Address reject reasons from ITrustLD_Existing popup-address-verify.blade.php */
export const KYC_ADDRESS_REJECT_REASONS = [
  "Your slip is not clear",
  "Invalid document",
  "Your image is not clear. Please upload clear image",
  "Your document does not include an address",
  "Your document details do not match the registration record",
  "Custom Message",
];

export function kycRejectReasonsForField(field) {
  return field === "address" ? KYC_ADDRESS_REJECT_REASONS : KYC_NIC_REJECT_REASONS;
}
