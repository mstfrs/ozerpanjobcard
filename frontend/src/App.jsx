
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
  const queryClient = new QueryClient()


function App() {
	return (
		<div className="App min-h-screen overflow-hidden">
			<BrowserRouter>
			<QueryClientProvider client={queryClient}>

				<FrappeProvider>
					<Routes>
						<Route element={<Login />} path="/login" />
						<Route element={<ProtectedRoute />}>
							<Route element={<Jobcards />} path="/jobcards" />

						</Route>

					</Routes>
				</FrappeProvider>
				</QueryClientProvider>
				<ToastContainer 
				position="top-center"/>
			</BrowserRouter>
		</div>
	);
}

export default App;
