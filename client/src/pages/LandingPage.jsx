import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <main className="landing">
    <nav className="landing-nav"><Link to="/" className="brand"><span className="brand-mark">S</span><span>Safe<span>Buddy</span></span></Link><div><Link className="landing-login" to="/signin">Sign in</Link><Link className="button button--small" to="/signin?mode=register">Start learning <span>→</span></Link></div></nav>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">A SAFE SPACE TO LEARN</span><h1>Your rights.<br/><em>Your voice.</em><br/>Your power.</h1><p>SafeBuddy makes children’s rights awareness and legal literacy easy to explore through short stories, quizzes, and rewards.</p><div className="hero-actions"><Link className="button" to="/signin?mode=register">Begin your journey <span>→</span></Link><a className="text-action" href="#how">See how it works <span>↓</span></a></div><div className="trust-row"><span>🛡️ Age-appropriate learning</span><span>✦ Made for India</span></div></div>
      <div className="hero-visual" aria-label="SafeBuddy learning preview"><div className="sun">☀</div><div className="cloud cloud--one">☁</div><div className="cloud cloud--two">☁</div><div className="hill hill--back"/><div className="hill hill--front"/><div className="hero-card hero-card--lesson"><div className="mini-card-icon">🎒</div><span>New lesson</span><b>Every Child Can Learn</b><div className="mini-progress"><i/></div></div><div className="hero-card hero-card--badge"><span>🏆</span><div><small>Badge unlocked!</small><b>Rights Champion</b></div></div><div className="hero-character"><div className="character-head">🧒</div><div className="character-body"/></div><div className="sparkle sparkle--a">✦</div><div className="sparkle sparkle--b">✦</div></div>
    </section>
    <section id="how" className="how-section"><div className="section-heading"><span className="eyebrow">HOW IT WORKS</span><h2>Small steps. Big confidence.</h2></div><div className="feature-grid"><article><span className="feature-icon feature-icon--violet">◈</span><h3>Explore</h3><p>Discover your rights with clear, friendly lessons built around everyday situations.</p></article><article><span className="feature-icon feature-icon--coral">✦</span><h3>Practice</h3><p>Try quick quizzes that help you remember what matters and when to seek help.</p></article><article><span className="feature-icon feature-icon--green">♛</span><h3>Grow</h3><p>Earn XP and badges as you build confident, caring safety skills.</p></article></div></section>
    <section className="safety-note"><span>💛</span><p><strong>Your safety comes first.</strong> SafeBuddy shares educational information, not legal advice. If something feels unsafe, tell a trusted adult. In an emergency in India, call <b>112</b>.</p></section>
    <footer>© 2026 SafeBuddy · Learn, grow, speak up.</footer>
  </main>;
}
