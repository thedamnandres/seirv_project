export default function Modal({ children, onClose }) {
  return (
    <div className="users-modal-overlay" onClick={onClose}>
      <div className="users-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
