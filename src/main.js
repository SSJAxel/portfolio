import './styles/main.css';
import App from './core/App.js';

// Arrancamos cuando el DOM está listo. App se encarga del resto.
const boot = () => new App();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
