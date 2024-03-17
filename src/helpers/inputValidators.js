export function emailValidator(email) {
  const re = /\S+@\S+\.\S+/;
  if (!email) {
    return "Email can't be empty.";
  } else if (!re.test(email)) {
    return "Ooops! We need a valid email address.";
  } else return "";
}

export function passwordValidator(password) {
  if (!password) {
    return "Password can't be empty";
  } else if (password.length < 5) {
    return "Password must be at least 5 characters long";
  } else return "";
}

export function nameValidator(name) {
  const re = /[a-zA-Z]/;
  if (!name) {
    return "Name field can't be empty";
  } else if (name.length < 3) {
    return "Name too short";
  } else if (!re.test(name)) {
    return "Names should contain alphabets only";
  } else return "";
}

export function telValidator(tel) {
  const re = /\+?(254|0)7\d{8}/;
  if (!tel) {
    return "Tel field can't be empty";
  } else if (!re.test(tel)) {
    // console.log(" > Parsed a non-Kenyan phone number: " + tel);
    return "Sorry, we dont support non-Kenyan phone numbers";
  } else return "";
}
