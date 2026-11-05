import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, describeError } from '../lib/api';
import { saveSession } from '../lib/session';

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const expired = params.get('reason') === 'expired';
  const returnTo = params.get('returnTo');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const session = await api.login(email.trim(), password);
      saveSession(session);
      // Only allow internal paths, so a crafted link can't bounce the user to another site
      navigate(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/orders', { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Invalid email or password.' : describeError(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="card login__card" onSubmit={handleSubmit} noValidate data-cy="login-form">
        <h1>Sign in to Orderly</h1>

        {expired && (
          <p className="notice" data-cy="session-expired">
            Your session has expired. Please sign in again.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert" data-cy="login-error">
            {error}
          </p>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="muted small">Demo account: admin@orderly.test / demo1234</p>
      </form>
    </main>
  );
}
