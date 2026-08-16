<!-- PURPOSE OF THIS FILE: React uygulama başlatma — createRoot, StrictMode, RouterProvider -->
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './assets/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
