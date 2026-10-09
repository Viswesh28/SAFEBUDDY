import { useState } from 'react';
import Icon from './Icon';

export function SafetyAudio({ clips = [], heading = 'Listen to a safety tip' }) {
  if (!clips.length) return null;
  return <section className="safety-media" aria-label={heading}>
    <h2 className="safety-media__title"><Icon name="volume" size={18} /> {heading}</h2>
    <div className="safety-audio__list">
      {clips.map((clip) => <figure key={clip.src} className="safety-audio__item">
        <figcaption>{clip.title}</figcaption>
        <audio controls preload="none" src={clip.src}>Your browser does not support audio playback.</audio>
      </figure>)}
    </div>
    <p className="safety-media__note">Recorded for SafeBuddy.</p>
  </section>;
}

// Shows a still image from YouTube and only loads the player after a tap,
// so no video iframe is downloaded until someone asks to watch.
function VideoFacade({ id, title }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <iframe
    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
    title={title}
    loading="lazy"
    referrerPolicy="strict-origin-when-cross-origin"
    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; autoplay"
    allowFullScreen
  />;
  return <button type="button" className="safety-videos__poster" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
    <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
    <span className="safety-videos__play"><Icon name="play" size={22} /></span>
  </button>;
}

export function YouTubeEmbeds({ videos = [], heading = 'Watch and learn', note }) {
  if (!videos.length) return null;
  return <section className="safety-media" aria-label={heading}>
    <h2 className="safety-media__title"><Icon name="play" size={18} /> {heading}</h2>
    <div className="safety-videos__grid">
      {videos.map((video) => <figure key={video.id} className="safety-videos__item">
        <div className="safety-videos__frame">
          <VideoFacade id={video.id} title={video.title} />
        </div>
        <figcaption>
          <b>{video.title}</b>
          <small>{video.channel} · <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">Open on YouTube</a></small>
        </figcaption>
      </figure>)}
    </div>
    <p className="safety-media__note">{note || 'Videos play in YouTube’s player. Watch with a trusted adult if you are unsure.'}</p>
  </section>;
}
