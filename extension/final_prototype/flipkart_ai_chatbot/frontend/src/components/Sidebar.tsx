// frontend/src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom'; // For active link styling
import { LayoutDashboard, BarChart3, MessageSquare, Settings, LogOut, ShoppingBag } from 'lucide-react'; // Example icons

const navigationItems = [
  // { name: 'Home', href: 'http://localhost:5000/Landing_page/index.html', icon: LayoutDashboard }, // Example, adjust routes
  { name: 'Home', href: '/home', icon: LayoutDashboard },
  { name: 'Product Analysis', href: '/', icon: ShoppingBag }, // Your current view
//   { name: 'Chatbot Log', href: '/', icon: MessageSquare }, // Link to your ChatbotView
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-800 text-slate-100 p-4 space-y-6 fixed top-0 left-0 h-screen flex flex-col">
      <div className="text-2xl font-bold text-center py-4 border-b border-slate-700">
        Product and Reviews Analysis
      </div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 transition-colors
                   ${isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
    </aside>
  );
};

export default Sidebar;