import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './index.css';

import 'primeicons/primeicons.css';
        


createRoot(document.getElementById('root')).render(
    <App />
)
