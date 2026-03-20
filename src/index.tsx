import { createRoot } from 'react-dom/client'
import App from './sidepanel/App'
// CSS is loaded via sidepanel.html link tag - PostCSS builds it directly to dist/sidepanel.css

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)
