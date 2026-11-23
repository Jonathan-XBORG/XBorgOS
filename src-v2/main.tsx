import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { trackInputModality } from './inputModality'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/structure.css'
import './styles/portal.css'
import './styles/components.css'
import './styles/stake.css'
import './styles/polish.css'
import './styles/system.css'
import './styles/desk.css'

trackInputModality()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
