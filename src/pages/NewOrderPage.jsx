import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, describeError } from '../lib/api';
import { validateNewOrder } from '../lib/validation.mjs';
import { useToast } from '../components/Toast';

const FIELDS = [
  { name: 'customerName', label: 'Customer name', autoComplete: 'off' },
  { name: 'email', label: 'Customer email', type: 'email', autoComplete: 'off' },
  { name: 'itemName', label: 'Item' },
  { name: 'quantity', label: 'Quantity', inputMode: 'numeric' },
  { name: 'unitPrice', label: 'Unit price (USD)', inputMode: 'decimal' },
];

const EMPTY = { customerName: '', email: '', itemName: '', quantity: '1', unitPrice: '' };

export function NewOrderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  // A ref, not state: a fast double click fires two submits before React re-renders
  const inFlight = useRef(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function showErrors(nextErrors) {
    setErrors(nextErrors);
    const first = FIELDS.find((f) => nextErrors[f.name]);
    if (first) formRef.current.elements[first.name].focus();
  }

  function handleChange(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    // Once a field is flagged, re-check it as the user types so the message goes away when it's fixed
    if (errors[name]) {
      const fieldError = validateNewOrder({ ...values, [name]: value })[name];
      setErrors((e) => ({ ...e, [name]: fieldError }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    setFormError('');
    const clientErrors = validateNewOrder(values);
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      const order = await api.createOrder({ ...values, quantity: Number(values.quantity) });
      toast(`Order ${order.id} created`);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      inFlight.current = false;
      setSubmitting(false);
      if (err.status === 401) return;
      if (err.status === 422 && err.body?.errors) {
        showErrors(err.body.errors);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(`The order wasn't saved. ${describeError(err)}`);
      }
    }
  }

  return (
    <main className="page page--narrow">
      <Link to="/orders" className="back-link">
        Back to orders
      </Link>
      <h1>New order</h1>

      <form ref={formRef} className="card form" onSubmit={handleSubmit} noValidate data-cy="new-order-form">
        {FIELDS.map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              value={values[field.name]}
              aria-invalid={errors[field.name] ? 'true' : undefined}
              aria-describedby={`error-${field.name}`}
              onChange={(e) => handleChange(field.name, e.target.value)}
              data-cy={`input-${field.name}`}
            />
            <p className="field-error" id={`error-${field.name}`} data-cy={`error-${field.name}`}>
              {errors[field.name]}
            </p>
          </div>
        ))}

        {formError && (
          <p className="form-error" role="alert" data-cy="form-error">
            {formError}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting} data-cy="submit-order">
          {submitting ? 'Creating...' : 'Create order'}
        </button>
      </form>
    </main>
  );
}
