export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateOtp = (otp) => {
  return otp.length === 6 && /^\d+$/.test(otp);
};

export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};
