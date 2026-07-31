import { createPortal } from 'react-dom';

export function Portal({ children, container }) {
    const mountNode = container || document.body;
    return createPortal(children, mountNode);
}