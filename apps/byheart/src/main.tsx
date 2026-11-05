import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/eb-garamond/wght.css'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import '@fontsource/im-fell-great-primer/400.css'
import '@fontsource/im-fell-great-primer/400-italic.css'
import './styles.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
