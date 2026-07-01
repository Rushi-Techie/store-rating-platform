const validateName = (name) => {
  if (!name) return 'Name is required.';
  if (name.length < 20) return 'Name must be at least 20 characters long.';
  if (name.length > 60) return 'Name cannot exceed 60 characters.';
  return null;
};

const validateAddress = (address) => {
  if (!address) return 'Address is required.';
  if (address.length > 400) return 'Address cannot exceed 400 characters.';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters long.';
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasUppercase) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!hasSpecial) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email address format.';
  }
  return null;
};

const validateUserFields = ({ name, email, address, password }) => {
  const nameErr = validateName(name);
  if (nameErr) return nameErr;

  const emailErr = validateEmail(email);
  if (emailErr) return emailErr;

  const addressErr = validateAddress(address);
  if (addressErr) return addressErr;

  const passwordErr = validatePassword(password);
  if (passwordErr) return passwordErr;

  return null;
};

module.exports = {
  validateName,
  validateAddress,
  validatePassword,
  validateEmail,
  validateUserFields,
};
