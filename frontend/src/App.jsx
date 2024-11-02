
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
  const queryClient = new QueryClient()


function App() {
	return (
		<div className="App">
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

			</BrowserRouter>
		</div>
	);
}

export default App;
