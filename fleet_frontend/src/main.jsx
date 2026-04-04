import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/router.jsx'
import { ContextProvider } from './context/ContextProvider'
import './index.css'

// 1. Importer TanStack Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Créer l'instance du client (en dehors du rendu)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Évite des rechargements inutiles pendant que vous développez sur Fedora
      refetchOnWindowFocus: false, 
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Envelopper le tout avec le QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <ContextProvider>
        <RouterProvider router={router} />
      </ContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)