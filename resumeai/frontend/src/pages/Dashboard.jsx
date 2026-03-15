import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
  },
  {
    id: 'upload', label: 'Upload Resume',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
  },
];

const stats = [
  { label: 'Resumes Created', value: '0', icon: '📄', change: null },
  { label: 'AI Suggestions', value: '0', icon: '✨', change: null },
  { label: 'Profile Score', value: '—', icon: '📊', change: null },
  { label: 'Applications', value: '0', icon: '🎯', change: null },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex">
      {/* Ambient */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-tight">ResumeAI</span>
              <p className="text-slate-500 text-xs">Career Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-medium px-3 mb-3">Menu</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active === item.id
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/10 text-white border border-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className={`transition-colors ${active === item.id ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              {item.label}
              {active === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <div>
              <h1 className="text-white font-semibold text-base">
                {active === 'dashboard' ? 'Dashboard' : 'Upload Resume'}
              </h1>
              <p className="text-slate-500 text-xs hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <span className="text-white text-sm font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 relative">
          {active === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-purple-600/20 via-purple-600/10 to-blue-600/5 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative">
                  <p className="text-purple-300 text-xs font-medium uppercase tracking-widest mb-1">Welcome back</p>
                  <h2 className="text-white text-2xl font-semibold mb-1">{user?.name || 'User'} 👋</h2>
                  <p className="text-slate-400 text-sm">Your AI-powered career toolkit is ready. Upload your first resume to get started.</p>
                  <button className="mt-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
                    Get Started →
                  </button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 group">
                    <div className="text-2xl mb-3">{s.icon}</div>
                    <p className="text-2xl font-semibold text-white mb-0.5">{s.value}</p>
                    <p className="text-slate-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <h3 className="text-white font-medium mb-1">Recent Activity</h3>
                <p className="text-slate-500 text-xs mb-6">Your resume activity will appear here</p>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No resumes yet</p>
                  <p className="text-slate-600 text-xs mt-1 mb-4">Upload your resume to get AI-powered insights</p>
                  <button
                    onClick={() => setActive('upload')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-purple-900/30"
                  >
                    Upload Resume
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-white text-xl font-semibold mb-1">Upload Resume</h2>
                <p className="text-slate-400 text-sm">Get AI-powered analysis and suggestions</p>
              </div>
              <div className="bg-white/[0.03] border-2 border-dashed border-white/[0.10] hover:border-purple-500/30 rounded-2xl p-16 text-center transition-all duration-200 cursor-pointer group hover:bg-purple-500/5">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center mx-auto mb-5 group-hover:border-purple-500/30 transition-colors">
                  <svg className="w-7 h-7 text-slate-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">Drop your resume here</p>
                <p className="text-slate-500 text-sm mb-4">PDF, DOC, or DOCX up to 10MB</p>
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-purple-900/30">
                  Browse Files
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
