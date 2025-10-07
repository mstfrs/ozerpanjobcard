import React from 'react'
import { NavLink } from 'react-router-dom'

const BayiNavbar = () => {
  const linkClass = ({ isActive }) =>
    `px-2 py-1 sm:px-3 sm:py-2 rounded text-sm sm:text-base ${isActive ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`

  return (
    <div className="w-full border-b bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <NavLink to="/dealerpanel" className={linkClass}>Panel</NavLink>
        <NavLink to="/dealerpanel/orders" className={linkClass}>Siparişler</NavLink>
        <NavLink to="/dealerpanel/installation" className={linkClass}>Montaj</NavLink>
        <NavLink to="/dealerpanel/service" className={linkClass}>Servis</NavLink>
        <NavLink to="/dealerpanel/worksites" className={linkClass}>Şantiyeler</NavLink>
      </div>
    </div>
  )
}

export default BayiNavbar 