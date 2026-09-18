import React from 'react';
import ReactDOM from 'react-dom/client';
import { DemoApp } from './demo/DemoApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="dark">
      <DemoApp />
    </div>
  </React.StrictMode>
);
