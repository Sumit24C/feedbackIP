import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from './AppRouter.jsx'
import store from './store/store.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
