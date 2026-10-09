import '../media.css';

export function SafetyAudio({ clips = [], heading = 'Listen to a safety tip' }) {
  if (!clips.length) return null;
  return <section className="safety-media safety-audio" aria-label={heading}>
    <h2>🔊 {heading}</h2>
    <div className="safety-audio__list">
      {clips.map((clip) => <figure key={clip.src}>
        <figcaption>{clip.title}</figcaption>
        <audio controls preload="none" src={clip.src}>Your browser does not support audio playback.</audio>
      </figure>)}
    </div>
    <p className="safety-media__note">Voice recordings made for SafeBuddy.</p>
  </section>;
}

export function YouTubeEmbeds({ videos = [], heading = 'Watch and learn', note }) {
  if (!videos.length) return null;
  return <section className="safety-media safety-videos" aria-label={heading}>
    <h2>▶ {heading}</h2>
    <div className="safety-videos__grid">
      {videos.map((video) => <figure key={video.id}>
        <div className="safety-videos__frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}`}
            title={video.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <figcaption><b>{video.title}</b><small>{video.channel} · <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">Open on YouTube</a></small></figcaption>
      </figure>)}
    </div>
    <p className="safety-media__note">{note || 'Videos are from YouTube channels and open in YouTube’s player. Watch with a trusted adult if you are unsure.'}</p>
  </section>;
}
