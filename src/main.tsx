import React from 'react';
import ReactDOM from 'react-dom/client';
import CinematicApp from './cinematic/CinematicApp';
import './cinematic/iteration.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><CinematicApp /></React.StrictMode>,
);
