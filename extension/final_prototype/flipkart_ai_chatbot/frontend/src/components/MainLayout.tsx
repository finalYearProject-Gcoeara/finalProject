// frontend/src/components/MainLayout.tsx
import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle?: string; // Optional page title for the header
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageTitle = "Dashboard" }) => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 md:p-8 overflow-y-auto"> 
        {/* Header within the main content area (optional, can be simpler) */}
        <header className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-slate-100/80 backdrop-blur-sm py-4 z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800">{pageTitle}</h1>
            {/* You can add breadcrumbs or other header content here */}
          </div>
          <div className="flex items-center gap-3">
            {/* Example header buttons from target design */}
            <button className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                <Bell className="w-5 h-5" />
            </button>
             <button className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                <Settings className="w-5 h-5" />
            </button>
            <button className="bg-slate-800 text-white px-4 py-2 text-sm rounded-md hover:bg-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Today
            </button>
          </div>
        </header>
        
        {children} {/* This is where the page-specific content will go */}
      </main>
    </div>
  );
};

// Temporary icons if not already imported elsewhere
const Bell: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const Settings: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const Calendar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);


export default MainLayout;