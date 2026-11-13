import { render } from 'preact';
import { App } from './ui/App';
import './ui/styles.css';
import './ui/review.css';
import './ui/r2.css';
import './ui/r3.css';
import './ui/r3-fixes.css';
import './ui/accessibility.css';
import './ui/review-local.css';
import './ui/review-local-fixes.css';
import './ui/final-polish.css';

render(<App />, document.getElementById('app')!);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
