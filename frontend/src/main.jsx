import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css';
// import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primereact/resources/themes/rhea/theme.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css'; // PrimeReact CSS
// import 'primeflex/primeflex.css'; // PrimeFlex CSS


createRoot(document.getElementById('root')).render(
    <App />
)
