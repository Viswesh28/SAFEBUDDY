import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const tabs = [
  { id: 'level-cards', label: 'Level cards' },
  { id: 'badges', label: 'Badges' }
];

export default function CardsPage() {
  const { token, user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const tabRefs = useRef([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/collection', { token })
      .then((data) => { if (active) setCollection(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, retryCount]);

  const selectTab = (tabId, moveFocus = false) => {
    setActiveTab(tabId);
    if (moveFocus) tabRefs.current[tabs.findIndex((tab) => tab.id === tabId)]?.focus();
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[nextIndex].id, true);
  };

  if (loading && !collection) return <main className="loading-page"><span className="spinner" /> Getting your collection ready…</main>;
  if (error && !collection) return <section className="error-card collection-error" role="alert"><h2>My Collection is unavailable right now.</h2><p>We couldn’t load your cards just now. Please try again.</p><button className="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></section>;
  if (!collection) return null;

  const xp = Number(user?.xp) || 0;
  const earnedBadges = collection.badges.filter((badge) => badge.earned).length;
  const currentPanel = activeTab === 'level-cards' ? 'collection-level-cards-panel' : 'collection-badges-panel';

  return <div className="my-collection">
    <section className="page-heading">
      <div><p className="eyebrow">Your progress, collected</p><h1>My Collection</h1></div>
    </section>

    <section className="collection-level-banner" aria-label="Current level">
      <div className="collection-level-banner__icon" aria-hidden="true">{collection.level.icon}</div>
      <div className="collection-level-banner__content">
        <p className="collection-level-banner__label">Current level</p>
        <h2>{collection.level.title}</h2>
        <div className="collection-level-banner__meta"><strong>{xp} XP</strong><span>{collection.level.xpToNext ? `${collection.level.xpToNext} XP to go` : 'All levels reached!'}</span></div>
        <div className="collection-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={collection.level.percent}>
          <span style={{ width: `${collection.level.percent}%` }} />
        </div>
        {collection.level.nextLevelXp && <p className="collection-level-banner__next">Next level at {collection.level.nextLevelXp} XP</p>}
      </div>
    </section>

    <div className="collection-tabs" role="tablist" aria-label="My collection">
      {tabs.map((tab, index) => <button
        key={tab.id}
        ref={(element) => { tabRefs.current[index] = element; }}
        id={`collection-tab-${tab.id}`}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`collection-${tab.id}-panel`}
        tabIndex={activeTab === tab.id ? 0 : -1}
        className={activeTab === tab.id ? 'active' : ''}
        onClick={() => selectTab(tab.id)}
        onKeyDown={(event) => handleTabKeyDown(event, index)}
      >{tab.label}{tab.id === 'badges' && <span className="collection-tabs__count">{earnedBadges}</span>}</button>)}
    </div>

    <section id={currentPanel} className="collection-panel" role="tabpanel" aria-labelledby={`collection-tab-${activeTab}`} tabIndex="0">
      {activeTab === 'level-cards' ? <>
        <div className="collection-section-heading"><h2>Level cards</h2><p>Every milestone is part of your journey.</p></div>
        <div className="collection-grid">
          {collection.levelCards.map((card) => <article key={card.level} className={`collection-card collection-card--level${card.unlocked ? '' : ' is-locked'}`} style={{ '--collection-card-color': card.color }}>
            <div className="collection-card__top"><span className="collection-card__icon" aria-hidden="true">{card.icon}</span><span className="collection-card__tag">Level {card.level}</span></div>
            <h3>{card.title}</h3>
            <p>{card.unlocked ? card.unlockMessage : `Reach ${card.minXp} XP to unlock`}</p>
            <span className="collection-card__xp">{card.minXp} XP</span>
          </article>)}
        </div>
      </> : <>
        <div className="collection-section-heading"><div><h2>Badges</h2><p>{earnedBadges} of {collection.badges.length} badges collected</p></div></div>
        <div className="collection-grid">
          {collection.badges.map((badge) => <article key={badge.key} className={`collection-card collection-card--badge${badge.earned ? '' : ' is-locked'}`}>
            <div className="collection-card__top"><span className="collection-card__icon" aria-hidden="true">{badge.earned ? badge.icon : <Icon name="lock" size={20} />}</span>{badge.earned && <span className="collection-card__tag">Collected</span>}</div>
            <h3>{badge.title}</h3>
            <p>{badge.earned ? 'A bright milestone in your learning journey.' : badge.howToEarn}</p>
            {badge.earned && badge.earnedAt && <time className="collection-card__date" dateTime={badge.earnedAt}>{new Date(badge.earnedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>}
          </article>)}
        </div>
      </>}
    </section>
  </div>;
}
