interface TrailerModalProps {
  open: boolean;
  trailerId: string;
  title: string;
  onClose: () => void;
}

export default function TrailerModal({ open, trailerId, title, onClose }: TrailerModalProps) {
  if (!open || !trailerId) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="videoWrap">
          <iframe
            src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
            title="Trailer"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
