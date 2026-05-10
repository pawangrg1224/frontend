// 'use client'

// import React, { useState } from 'react'
// import { Calendar, Users, Briefcase, Clock, Settings, LogOut, Menu, X, Home } from 'lucide-react'
// import Link from 'next/link'

// interface SidebarProps {
//   isOpen?: boolean
//   onClose?: () => void
// }

// const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
//   const menuItems = [
//     { icon: Home, label: 'Dashboard', href: '/', badge: null, color: 'from-blue-500 to-cyan-500' },
//     { icon: Calendar, label: 'Appointments', href: '/appointments', badge: '5', color: 'from-purple-500 to-pink-500' },
//     { icon: Users, label: 'Customers', href: '/customers', badge: null, color: 'from-emerald-500 to-teal-500' },
//     { icon: Briefcase, label: 'Services', href: '/services', badge: null, color: 'from-orange-500 to-amber-500' },
//   ]

//   const secondaryItems = [
//     { icon: Settings, label: 'Settings', href: '/settings', color: 'from-indigo-500 to-purple-500' },
//     { icon: LogOut, label: 'Logout', href: '/logout', color: 'from-red-500 to-rose-500' },
//   ]

//   return (
//     <>
//       {/* Mobile Overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <div
//         className={`fixed lg:relative top-0 left-0 h-screen bg-linear-to-b from-white via-blue-50 to-indigo-50 border-r border-indigo-200/50 w-64 flex flex-col z-50 transition-all duration-300 ease-in-out shadow-lg ${
//           isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
//         }`}
//       >
//         {/* Header */}
//         <div className="px-6 py-8 border-b border-indigo-200/50 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500">
//           <div className="flex items-center gap-3 mb-0 lg:mb-0">
//             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
//               <Calendar className="w-6 h-6 bg-linear-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent" />
//             </div>
//             <div className="flex-1 flex-col hidden xs:flex">
//               <h1 className="text-lg font-bold text-white">Appointments</h1>
//               <p className="text-xs text-white/80">Pro</p>
//             </div>
//             {isOpen && onClose && (
//               <button
//                 onClick={onClose}
//                 className="lg:hidden p-1.5 hover:bg-white/20 rounded-lg transition"
//               >
//                 <X size={20} className="text-white" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Main Navigation */}
//         <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
//           {menuItems.map((item) => (
//             <Link
//               key={item.label}
//               href={item.href}
//               className="group relative flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:text-white transition-all duration-300 overflow-hidden"
//             >
//               <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 rounded-xl`} />
//               <div className="flex items-center gap-3 relative z-10">
//                 <item.icon size={20} className="text-gray-600 group-hover:text-white transition-colors" />
//                 <span className="text-sm font-semibold group-hover:text-white transition-colors">{item.label}</span>
//               </div>
//               {item.badge && (
//                 <span className="px-2.5 py-1 bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
//                   {item.badge}
//                 </span>
//               )}
//             </Link>
//           ))}
//         </nav>

//         {/* Divider */}
//         <div className="border-t border-indigo-200/50 mx-3" />

//         {/* Secondary Navigation */}
//         <nav className="px-3 py-4 space-y-2">
//           {secondaryItems.map((item) => (
//             <Link
//               key={item.label}
//               href={item.href}
//               className="group relative flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-white transition-all duration-300 overflow-hidden"
//             >
//               <div className={`absolute inset-0 bg-linear-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 rounded-xl`} />
//               <item.icon size={20} className="text-gray-600 group-hover:text-white transition-colors relative z-10" />
//               <span className="text-sm font-semibold text-gray-700 group-hover:text-white transition-colors relative z-10">{item.label}</span>
//             </Link>
//           ))}
//         </nav>

//         {/* Footer */}
//         <div className="px-3 py-4 border-t border-indigo-200/50">
//           <div className="bg-linear-to-r from-blue-100 to-purple-100 rounded-lg p-4 text-center border border-indigo-200">
//             <p className="text-xs text-indigo-700 font-semibold mb-3">💡 Quick Tip</p>
//             <button className="w-full px-3 py-2 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
//               Get Support
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

// export default Sidebar








'use client'

import React, { useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings, LogOut, X, Home, ChevronDown, ChevronRight,
  Heart, Brain, Bone, Eye, Baby, Stethoscope, Activity, Syringe, Wind, Microscope,
  Ear, Smile
} from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const DEPARTMENTS = [
  { name: 'Cardiology', slug: 'cardiology', icon: Heart, color: 'text-red-500' },
  { name: 'Neurology', slug: 'neurology', icon: Brain, color: 'text-purple-500' },
  { name: 'Orthopedics', slug: 'orthopedics', icon: Bone, color: 'text-orange-500' },
  { name: 'Ophthalmology', slug: 'ophthalmology', icon: Eye, color: 'text-blue-500' },
  { name: 'Pediatrics', slug: 'pediatrics', icon: Baby, color: 'text-pink-500' },
  { name: 'General Medicine', slug: 'general-medicine', icon: Stethoscope, color: 'text-teal-500' },
  { name: 'Cardio ICU', slug: 'cardio-icu', icon: Activity, color: 'text-rose-500' },
  { name: 'Vaccination', slug: 'vaccination', icon: Syringe, color: 'text-green-500' },
  { name: 'Pulmonology', slug: 'pulmonology', icon: Wind, color: 'text-cyan-500' },
  { name: 'Pathology', slug: 'pathology', icon: Microscope, color: 'text-indigo-500' },
  { name: 'ENT', slug: 'ent', icon: Ear, color: 'text-yellow-600' },
  { name: 'Dentistry', slug: 'dentistry', icon: Smile, color: 'text-lime-600' },
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const [openDept, setOpenDept] = useState(false)

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', badge: null, color: 'from-blue-500 to-cyan-500' },
    { icon: Calendar, label: 'Appointments', href: '/dashboard/appointments', badge: null, color: 'from-purple-500 to-pink-500' },
    { icon: Users, label: 'Patients', href: '/dashboard/customers', badge: null, color: 'from-emerald-500 to-teal-500' },
    { icon: Briefcase, label: 'Services', href: '/dashboard/services', badge: null, color: 'from-orange-500 to-amber-500' },
  ]

  const secondaryItems = [
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', color: 'from-indigo-500 to-purple-500' },
    { icon: LogOut, label: 'Logout', href: '/api/auth/signout', color: 'from-red-500 to-rose-500' },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 h-screen bg-linear-to-b from-white via-blue-50 to-indigo-50 
          border-r border-indigo-200/50 w-64 flex flex-col z-50 transition-all duration-300 ease-in-out shadow-lg 
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >

        {/* Header */}
        <div className="px-6 py-8 border-b border-indigo-200/50 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 bg-linear-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent" />
            </div>
            <div className="flex-1 flex-col hidden xs:flex">
              <h1 className="text-lg font-bold text-white">Appointments</h1>
              <p className="text-xs text-white/80">Pro</p>
            </div>
            {isOpen && onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X size={20} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:text-white"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 rounded-xl`} />
              <div className="flex items-center gap-3 relative z-10">
                <item.icon size={20} className="text-gray-600 group-hover:text-white" />
                <span className="text-sm font-semibold group-hover:text-white">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2.5 py-1 bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Departments Dropdown */}
          <div>
            <button
              onClick={() => setOpenDept(!openDept)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${openDept
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span className="flex items-center gap-3">
                <Stethoscope size={20} className={openDept ? 'text-blue-600' : 'text-gray-600'} />
                <span className="text-sm font-semibold">Departments</span>
              </span>
              {openDept
                ? <ChevronDown size={16} className="text-blue-600" />
                : <ChevronRight size={16} className="text-gray-400" />
              }
            </button>

            {openDept && (
              <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-blue-100 pl-3">
                {DEPARTMENTS.map((dept) => (
                  <Link
                    key={dept.slug}
                    href={`/dashboard/services?dept=${dept.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                  >
                    <dept.icon size={16} className={`${dept.color} shrink-0`} />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </nav>

        {/* Divider */}
        <div className="border-t border-indigo-200/50 mx-3" />

        {/* Secondary */}
        <nav className="px-3 py-4 space-y-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-white relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 rounded-xl`} />
              <item.icon size={20} className="text-gray-600 group-hover:text-white relative z-10" />
              <span className="text-sm font-semibold relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-indigo-200/50">
          <div className="bg-linear-to-r from-blue-100 to-purple-100 rounded-lg p-4 text-center border border-indigo-200">
            <p className="text-xs text-indigo-700 font-semibold mb-3">💡 Quick Tip</p>
            <button className="w-full px-3 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-lg shadow-lg">
              Get Support
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar