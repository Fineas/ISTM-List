import React from 'react';
import ReactDOM from 'react-dom';
import {App, App2} from './App';
import './assets/css/index.css';
import './assets/vendor/aos/aos.css';
import './assets/vendor/bootstrap/css/bootstrap.min.css';
import './assets/vendor/bootstrap-icons/bootstrap-icons.css';
import './assets/vendor/boxicons/css/boxicons.min.css';
import './assets/vendor/glightbox/css/glightbox.min.css';
import './assets/vendor/swiper/swiper-bundle.min.css';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

ReactDOM.render(
    <React.StrictMode>
        <App2 />
    </React.StrictMode>,
    document.getElementById('root2')
);

reportWebVitals();
