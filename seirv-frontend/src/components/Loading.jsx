export default function Loading({ small } = {}) {
  // small prop allows using compact spinner if required
  return (
    <div className="loading">
      <div className="loading-spinner" style={small ? { width: 20, height: 20 } : undefined} />
    </div>
  );
}
