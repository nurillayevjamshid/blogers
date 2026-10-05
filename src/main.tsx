import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The dashboard uses a fixed 1:1 layout on desktop and mobile. Prevent the
// browser's page zoom shortcuts without affecting normal scrolling or inputs.
const preventBrowserZoom = (event: WheelEvent | KeyboardEvent) => {
  if ('ctrlKey' in event && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
  }
};

window.addEventListener('wheel', preventBrowserZoom, { passive: false });
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '_', '0'].includes(event.key)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
