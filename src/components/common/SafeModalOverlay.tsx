import React, { useRef } from 'react';

interface SafeModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose: () => void;
}

/**
 * Backdrop overlay that only triggers onClose when both mousedown and mouseup occur
 * directly on the overlay itself, preventing accidental dismissal during text selection drags.
 */
export const SafeModalOverlay: React.FC<SafeModalOverlayProps> = ({
  onClose,
  className = 'modal-overlay',
  children,
  ...rest
}) => {
  const startedOnOverlay = useRef(false);

  return (
    <div
      className={className}
      {...rest}
      onMouseDown={(e) => {
        startedOnOverlay.current = e.target === e.currentTarget;
        rest.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (startedOnOverlay.current && e.target === e.currentTarget) {
          onClose();
        }
        startedOnOverlay.current = false;
        rest.onMouseUp?.(e);
      }}
    >
      {children}
    </div>
  );
};
