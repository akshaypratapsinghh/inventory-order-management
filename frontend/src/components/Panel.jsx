export default function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
