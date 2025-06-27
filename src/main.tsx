import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StarknetProvider } from './components/StarknetProvider'

createRoot(document.getElementById("root")!).render(
    <StarknetProvider>
        <App />
    </StarknetProvider>
);
