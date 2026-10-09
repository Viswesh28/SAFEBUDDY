import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const avatars = ['🌟', '🦊', '🐼', '🐯', '🦋'];
export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const registerMode = searchParams.get('mode') === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '', avatar: '🌟' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  // Admins land in the Guide Space; learners go to their dashboard unless they were sent to a page first.
  const redirect = location.state?.from || (user?.role === 'admin' ? '/admin' : '/dashboard');
  if (user) return <Navigate to={redirect} replace />;
  const switchMode = (isRegister) => { setError(''); setSearchParams(isRegister ? { mode: 'register' } : {}); };
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const currentUser = registerMode ? await register(form) : await login({ email: form.email, password: form.password }); navigate(currentUser.role === 'admin' ? '/admin' : redirect, { replace: true }); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const useDemo = () => { setForm((current) => ({ ...current, email: 'aarav@example.com', password: 'Learn@123' })); switchMode(false); };
  return <main className="auth-page">
    <aside className="auth-art">
      <Link to="/" className="brand" aria-label="SafeBuddy home"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-name">Safe<span>Buddy</span></span></Link>
      <div className="auth-art__copy">
        <h1>Learn your rights, safely.</h1>
        <p>Short lessons, quizzes and games written for children in India. Your progress is saved to your account.</p>
      </div>
      <p className="auth-art__note"><Icon name="shield" size={16} /> Educational content. Not legal advice.</p>
    </aside>

    <section className="auth-panel">
      <div className="auth-panel__inner">
        <Link className="back-link" to="/"><Icon name="arrowLeft" size={15} /> Back to home</Link>
        <p className="eyebrow">Welcome</p>
        <h2>{registerMode ? 'Create your account' : 'Sign in'}</h2>
        <p className="muted">{registerMode ? 'Choose an avatar and start learning.' : 'Continue where you left off.'}</p>
        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={!registerMode} className={!registerMode ? 'active' : ''} onClick={() => switchMode(false)}>Sign in</button>
          <button role="tab" aria-selected={registerMode} className={registerMode ? 'active' : ''} onClick={() => switchMode(true)}>Create account</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {registerMode && <>
            <label>Your name<input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Ananya" required maxLength="60" /></label>
            <fieldset>
              <legend>Pick an avatar</legend>
              <div className="avatar-picker">{avatars.map((avatar) => <button type="button" aria-label={`Choose avatar ${avatar}`} className={form.avatar === avatar ? 'selected' : ''} key={avatar} onClick={() => update('avatar', avatar)}>{avatar}</button>)}</div>
            </fieldset>
          </>}
          <label>Email address<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={registerMode ? 'At least 8 characters' : 'Your password'} required minLength="8" /></label>
          {error && <p className="form-error"><Icon name="alert" size={15} /> {error}</p>}
          <button className="button button--full" disabled={busy}>{busy ? 'One moment…' : registerMode ? 'Create account' : 'Sign in'} <Icon name="arrowRight" size={16} /></button>
        </form>
        {!registerMode && <div className="demo-login">
          <span>Want a quick look?</span>
          <button onClick={useDemo}>Fill in the learner demo account</button>
          <small>aarav@example.com · Learn@123</small>
        </div>}
        <p className="auth-privacy"><Icon name="lock" size={14} /> We only use account details to save your learning progress.</p>
      </div>
    </section>
  </main>;
}
