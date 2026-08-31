import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';
import './styles/modal.css';
import './styles/compact.css';
import './styles/settings.css';
import './styles/categories.css';
import './styles/planning.css';
import './styles/finance-ui.css';
import './styles/analytics.css';
import './styles/payments.css';
import './styles/users.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
