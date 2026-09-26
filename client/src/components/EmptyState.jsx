export default function EmptyState({ icon = '✨', title, body, action }) {
  return <section className="empty-state"><span className="empty-state__icon">{icon}</span><h2>{title}</h2><p>{body}</p>{action}</section>;
}
