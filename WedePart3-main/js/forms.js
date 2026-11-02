// Client-side form validation and responses for the enquiry and contact pages.
document.addEventListener('DOMContentLoaded', () => {
  const recipient = 'info@canaverseclub.co.za';
  const enquiryForm = document.getElementById('enquiry-form');
  const contactForm = document.getElementById('contact-message-form');

  // These responses describe the next step; actual event and visit availability
  // must be confirmed by the club team rather than assumed by this static site.
  const enquiryOptions = {
    membership: {
      title: 'Membership application',
      response: 'Membership applications are reviewed within 3–5 working days. The team will confirm the outcome and any next steps.',
    },
    visit: {
      title: 'Clubhouse visit',
      response: 'Visit availability must be confirmed by the team. Your preferred date is a request, not a confirmed booking.',
    },
    events: {
      title: 'Events and workshops',
      response: 'Event dates and places vary. The team will confirm availability for your requested date.',
    },
    information: {
      title: 'Membership information',
      response: 'The membership team can answer your questions and explain the application process.',
    },
  };

  // Set a current-date minimum for requested visits, while allowing past dates
  // for the date of birth field used in the existing 21+ membership requirement.
  const preferredDate = document.getElementById('e-visit-date');
  if (preferredDate) {
    preferredDate.min = localDateString();
  }

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const values = {
        fullName: document.getElementById('e-name').value.trim(),
        email: document.getElementById('e-email').value.trim(),
        phone: document.getElementById('e-phone').value.trim(),
        interest: document.getElementById('e-interest').value,
        preferredDate: document.getElementById('e-visit-date').value,
        dateOfBirth: document.getElementById('e-dob').value,
        ageConfirmed: document.getElementById('e-confirm').checked,
        message: document.getElementById('e-message').value.trim(),
      };

      const errors = {
        'e-name': values.fullName.length < 2 || values.fullName.length > 80 ? 'Enter a name between 2 and 80 characters.' : '',
        'e-email': !isValidEmail(values.email) ? 'Enter a valid email address.' : '',
        'e-phone': !isValidPhone(values.phone) ? 'Enter 10 digits starting with 0, for example 0821234567.' : '',
        'e-interest': !enquiryOptions[values.interest] ? 'Choose what you are enquiring about.' : '',
        'e-visit-date': values.preferredDate && values.preferredDate < localDateString() ? 'Choose today or a future date.' : '',
        'e-dob': !values.dateOfBirth || !isOver21(values.dateOfBirth) ? 'Membership enquiries are for adults aged 21 and older.' : '',
        'e-confirm': !values.ageConfirmed ? 'Confirm that you are 21 years of age or older.' : '',
        'e-message': values.message.length < 10 || values.message.length > 1000 ? 'Enter a message between 10 and 1,000 characters.' : '',
      };

      if (!showFieldErrors(enquiryForm, errors)) {
        document.getElementById('enquiry-result').hidden = true;
        return;
      }

      const option = enquiryOptions[values.interest];
      const dateText = values.preferredDate ? ` Preferred date requested: ${values.preferredDate}.` : '';
      const result = document.getElementById('enquiry-result');
      result.replaceChildren();

      const heading = document.createElement('h3');
      heading.textContent = `${option.title}: next steps`;
      const description = document.createElement('p');
      description.textContent = `${option.response}${dateText}`;
      const deliveryNote = document.createElement('p');
      deliveryNote.textContent = 'This website has no server-side form handler. Use the email link below to send your enquiry; it will open your email application and will not send until you choose to send it.';
      const emailLink = makeEmailLink(
        recipient,
        `Club enquiry: ${option.title}`,
        formatEnquiryEmail(values, option.title)
      );

      result.append(heading, description, deliveryNote, emailLink);
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    attachLiveValidation(enquiryForm);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const values = {
        name: document.getElementById('c-name').value.trim(),
        surname: document.getElementById('c-surname').value.trim(),
        email: document.getElementById('c-email').value.trim(),
        phone: document.getElementById('c-phone').value.trim(),
        messageType: document.getElementById('c-subject').value,
        message: document.getElementById('c-message').value.trim(),
      };

      const errors = {
        'c-name': values.name.length < 2 || values.name.length > 60 ? 'Enter a name between 2 and 60 characters.' : '',
        'c-surname': values.surname.length < 2 || values.surname.length > 60 ? 'Enter a surname between 2 and 60 characters.' : '',
        'c-email': !isValidEmail(values.email) ? 'Enter a valid email address.' : '',
        'c-phone': !isValidPhone(values.phone) ? 'Enter 10 digits starting with 0, for example 0821234567.' : '',
        'c-subject': !values.messageType ? 'Choose a type of message.' : '',
        'c-message': values.message.length < 10 || values.message.length > 2000 ? 'Enter a message between 10 and 2,000 characters.' : '',
      };

      const status = document.getElementById('contact-form-status');
      status.replaceChildren();
      status.className = 'form-status';

      if (!showFieldErrors(contactForm, errors)) {
        status.classList.add('error');
        status.textContent = 'Please correct the highlighted fields before preparing your email.';
        return;
      }

      const subject = `Kanaverse Club ${values.messageType} message`;
      const body = [
        `Name: ${values.name}`,
        `Surname: ${values.surname}`,
        `Email: ${values.email}`,
        `Phone: ${values.phone}`,
        `Type of message: ${values.messageType}`,
        '',
        'Message:',
        values.message,
      ].join('\n');

      const deliveryNote = document.createElement('p');
      deliveryNote.textContent = 'Your email is ready. Select the link to open your email application; you will still need to send it there.';
      const emailLink = makeEmailLink(recipient, subject, body);
      status.append(deliveryNote, emailLink);
      status.classList.add('success');
    });

    attachLiveValidation(contactForm);
  }
});

// Show inline errors and connect each field's invalid state to assistive technology.
function showFieldErrors(form, errors) {
  let isValid = true;

  Object.entries(errors).forEach(([fieldId, message]) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    error.textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));

    if (message) {
      isValid = false;
    }
  });

  if (!isValid) {
    const firstInvalidField = form.querySelector('[aria-invalid="true"]');
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
  }

  return isValid;
}

// Clear a field's inline error as the visitor corrects that value.
function attachLiveValidation(form) {
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => clearFieldError(field));
    field.addEventListener('change', () => clearFieldError(field));
  });
}

function clearFieldError(field) {
  const error = document.getElementById(`${field.id}-error`);
  if (error) {
    error.textContent = '';
  }
  field.removeAttribute('aria-invalid');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  return /^0\d{9}$/.test(value);
}

function isOver21(dateString) {
  const birthDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 21;
}

function localDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Build an explicit mailto link, encoding the complete subject and message body.
function makeEmailLink(recipient, subject, body) {
  const link = document.createElement('a');
  link.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  link.textContent = 'Open email to send';
  return link;
}

function formatEnquiryEmail(values, enquiryTitle) {
  return [
    `Full name: ${values.fullName}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone}`,
    `Enquiry: ${enquiryTitle}`,
    `Preferred date: ${values.preferredDate || 'Not specified'}`,
    `Date of birth: ${values.dateOfBirth}`,
    '',
    'Message:',
    values.message,
  ].join('\n');
}
