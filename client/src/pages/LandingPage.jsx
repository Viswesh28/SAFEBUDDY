import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const steps = [
  { icon: 'compass', title: 'Explore', text: 'Short lessons on your rights, written around everyday situations.' },
  { icon: 'game', title: 'Practise', text: 'Quizzes and safety games that help you decide what to do and who to ask.' },
  { icon: 'award', title: 'Track', text: 'See your progress, streaks and badges as you go.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <main className="landing">
    <nav className="landing-nav">
      <Link to="/" className="brand" aria-label="SafeBuddy home"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-name">Safe<span>Buddy</span></span></Link>
      <div className="landing-nav__actions">
        <Link className="landing-login" to="/signin">Sign in</Link>
        <Link className="button button--small" to="/signin?mode=register">Create account</Link>
      </div>
    </nav>

    <section className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">Rights education for children in India</p>
        <h1>Learn your rights, one short lesson at a time.</h1>
        <p className="hero-lede">SafeBuddy covers children’s rights and legal basics through short lessons, quizzes and safety games, with a clear note on who to contact for help.</p>
        <div className="hero-actions">
          <Link className="button" to="/signin?mode=register">Start learning <Icon name="arrowRight" size={16} /></Link>
          <a className="text-action" href="#how">How it works</a>
        </div>
        <ul className="trust-row">
          <li><Icon name="shield" size={15} /> Age-appropriate content</li>
          <li><Icon name="check" size={15} /> Built around Indian law</li>
        </ul>
      </div>

      <div className="hero-visual" aria-label="Preview of the SafeBuddy dashboard">
        <div className="preview">
          <div className="preview__head"><span>Up next</span><small>Safety</small></div>
          <b className="preview__title">Personal Safety &amp; Trusted Help</b>
          <div className="preview__bar"><i style={{ width: '35%' }} /></div>
          <div className="preview__meta"><span>2 of 6 sections</span><span>6 min</span></div>
        </div>
        <div className="preview preview--stats">
          <div><b>60</b><small>XP</small></div>
          <div><b>67%</b><small>Quiz average</small></div>
          <div><b>2</b><small>Badges</small></div>
        </div>
      </div>
    </section>

    <section id="how" className="how-section">
      <header className="section-heading">
        <h2>How it works</h2>
        <p>Three steps, at your own pace.</p>
      </header>
      <div className="feature-grid">
        {steps.map((step, index) => <article key={step.title}>
          <span className="feature-icon"><Icon name={step.icon} size={20} /></span>
          <span className="feature-step">Step {index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>)}
      </div>
    </section>

    <aside className="safety-note">
      <Icon name="alert" size={20} />
      <p><strong>Your safety comes first.</strong> SafeBuddy shares educational information, not legal advice. If something feels unsafe, tell a trusted adult. In an emergency in India, call <b>112</b>. For free help any time, call <b>CHILDLINE 1098</b>.</p>
    </aside>

    <footer className="landing-footer">© 2026 SafeBuddy</footer>
  </main>;
}
