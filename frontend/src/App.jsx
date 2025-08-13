
// import './App.css'
import React from 'react';
import { FrappeProvider } from 'frappe-react-sdk';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Jobcards from './pages/Jobcards';
import ProtectedRoute from './routes/ProtectedRoute';
import {

	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Bayipanel from './pages/Bayi/Bayipanel';
import Market from './pages/Market';
import DeliveryNoteCreate from './pages/DeliveryNoteCreate';
import Orders from './pages/Bayi/Orders';
import { Installation } from './pages/Bayi/Installation';
const queryClient = new QueryClient()
const basePath = import.meta.env.VITE_BASE_PATH || '/';


function App() {
	return (
		<div className="App overflow-hidden">


			<FrappeProvider
				socketPort={import.meta.env.VITE_SOCKET_PORT}
				siteName={import.meta.env.VITE_SITE_NAME}
			>
				<BrowserRouter basename={basePath}>
					<QueryClientProvider client={queryClient}>
						<Routes>
							<Route element={<Login />} path="/login" />
							<Route element={<ProtectedRoute />}>
								<Route element={<Jobcards />} path="/jobcards" />
								<Route element={<Bayipanel />} path="/delaerpanel" />
								<Route element={<Orders />} path="/delaerpanel/orders" />
								<Route element={<Installation />} path="/delaerpanel/installation" />
								<Route element={<Market/>} path='/market' />
								<Route element={<DeliveryNoteCreate/>} path='/sevkiyat'/>
							</Route>

						</Routes>
					</QueryClientProvider>
					<ToastContainer
							position="top-center"
							autoClose={1000} // Set time for message to auto-close in milliseconds (e.g., 5000ms = 5 seconds)
							hideProgressBar={false}
							newestOnTop={false}
							closeOnClick
							rtl={false}
							pauseOnFocusLoss
							draggable
							pauseOnHover
						/></BrowserRouter>
			</FrappeProvider>

		</div>
	);
}

export default App;
