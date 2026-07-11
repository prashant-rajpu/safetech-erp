import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isSupabaseConfigured } from './lib/supabaseClient'
import './styles/tailwind.css'

function ConfigError() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1C1C1E', color: '#E8622C', fontFamily: 'monospace', padding: '2rem', textAlign: 'center',
    }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Configuration Error</h1>
        <p>VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing or invalid.</p>
        <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>Set both in your .env file (see .env.example) and rebuild.</p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSupabaseConfigured ? <App /> : <ConfigError />}
  </React.StrictMode>
)
