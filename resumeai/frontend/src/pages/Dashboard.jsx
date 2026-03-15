// import { useState, useRef, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const navItems = [
//   {
//     id: 'dashboard', label: 'Dashboard',
//     icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
//   },
//   {
//     id: 'upload', label: 'Upload Resume',
//     icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
//   },
// ];

// const stats = [
//   { label: 'Resumes Created', value: '0', icon: '📄' },
//   { label: 'AI Suggestions', value: '0', icon: '✨' },
//   { label: 'Profile Score', value: '—', icon: '📊' },
//   { label: 'Applications', value: '0', icon: '🎯' },
// ];

// export default function Dashboard() {

//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const [active, setActive] = useState('dashboard');
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const fileInputRef = useRef(null);

//   const [menuOpen, setMenuOpen] = useState(false);
//   const menuRef = useRef();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//     }
//   };

//   useEffect(() => {
//     const handler = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         setMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const initials = user?.name
//     ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
//     : 'U';

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex">

//       {sidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
//       )}

//       {/* SIDEBAR */}
//       <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

//         <div className="p-5 border-b border-white/[0.06]">
//           <span className="text-white font-semibold text-sm">ResumeAI</span>
//           <p className="text-slate-500 text-xs">Career Platform</p>
//         </div>

//         <nav className="flex-1 p-4 space-y-1">
//           {navItems.map(item => (
//             <button
//               key={item.id}
//               onClick={() => setActive(item.id)}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
//                 active === item.id
//                   ? 'bg-purple-600/20 text-white'
//                   : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
//               }`}
//             >
//               {item.icon}
//               {item.label}
//             </button>
//           ))}
//         </nav>

//         <div className="p-4 border-t border-white/[0.06]">
//           <p className="text-white text-sm">{user?.name}</p>
//           <p className="text-slate-500 text-xs">{user?.email}</p>
//         </div>

//       </aside>

//       {/* MAIN */}
//       <div className="flex-1 flex flex-col">

//         {/* TOPBAR */}
//         <header className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">

//           <div>
//             <h1 className="text-white text-lg font-semibold">
//               {active === 'dashboard' ? 'Dashboard' : 'Upload Resume'}
//             </h1>

//             <p className="text-slate-500 text-xs">
//               {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric'})}
//             </p>
//           </div>

//           {/* USER DROPDOWN */}
//           <div ref={menuRef} className="relative">

//             <button
//               onClick={() => setMenuOpen(!menuOpen)}
//               className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2"
//             >
//               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
//                 <span className="text-white text-xs font-bold">{initials}</span>
//               </div>

//               <span className="text-white text-sm">{user?.name?.split(' ')[0]}</span>
//             </button>

//             {menuOpen && (
//               <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-xl">

//                 <button
//                   onClick={()=>navigate('/settings')}
//                   className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
//                 >
//                   Settings
//                 </button>

//                 <button
//                   onClick={handleLogout}
//                   className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
//                 >
//                   Logout
//                 </button>

//               </div>
//             )}
//           </div>

//         </header>

//         {/* CONTENT */}
//         <main className="flex-1 p-6">

//           {active === 'dashboard' && (
//             <>
//               {/* WELCOME */}
//               <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6 mb-6">
//                 <p className="text-purple-300 text-xs uppercase mb-1">Welcome Back</p>
//                 <h2 className="text-white text-2xl font-semibold">{user?.name} 👋</h2>
//                 <p className="text-slate-400 text-sm">
//                   Your AI-powered career toolkit is ready.
//                 </p>
//               </div>

//               {/* STATS */}
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                 {stats.map((s,i)=>(
//                   <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
//                     <div className="text-2xl">{s.icon}</div>
//                     <p className="text-white text-xl">{s.value}</p>
//                     <p className="text-slate-500 text-xs">{s.label}</p>
//                   </div>
//                 ))}
//               </div>

//               <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6 text-center">
//                 <p className="text-slate-400">No resumes yet</p>
//               </div>
//             </>
//           )}

//           {active === 'upload' && (
//             <div className="space-y-6">

//               <div
//                 onClick={() => fileInputRef.current.click()}
//                 className="bg-white/[0.03] border-2 border-dashed border-white/[0.10] hover:border-purple-500/30 rounded-2xl p-16 text-center transition-all duration-200 cursor-pointer group hover:bg-purple-500/5"
//               >

//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   accept=".pdf,.doc,.docx"
//                   onChange={handleFileChange}
//                   className="hidden"
//                 />

//                 {!selectedFile && (
//                   <>
//                     <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center mx-auto mb-5">
//                       📄
//                     </div>

//                     <p className="text-white font-medium mb-1">
//                       Click to select your resume
//                     </p>

//                     <p className="text-slate-500 text-sm">
//                       PDF, DOC, DOCX up to 10MB
//                     </p>
//                   </>
//                 )}

//                 {selectedFile && (
//                   <div className="space-y-3">
//                     <p className="text-green-400 font-medium">
//                       Selected File:
//                     </p>

//                     <p className="text-white">
//                       {selectedFile.name}
//                     </p>

//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         console.log(selectedFile);
//                       }}
//                       className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl"
//                     >
//                       Upload Resume
//                     </button>
//                   </div>
//                 )}

//               </div>
//             </div>
//           )}

//         </main>

//       </div>

//     </div>
//   );
// }


import { useState, useRef, useEffect } from 'react';
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
  { label: 'Resumes Created', value: '0', icon: '📄' },
  { label: 'AI Suggestions', value: '0', icon: '✨' },
  { label: 'Profile Score', value: '—', icon: '📊' },
  { label: 'Applications', value: '0', icon: '🎯' },
];

export default function Dashboard() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedResumeId, setUploadedResumeId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadResume = async () => {

  if (!selectedFile) {
    alert("Please select a file first");
    return;
  }

  try {

    setUploading(true);

    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("userId", user._id);

    const response = await fetch("http://localhost:5000/api/resume/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    console.log("Upload response:", data);

    setUploadedResumeId(data.resumeId);

    alert("Resume uploaded successfully");

  } catch (error) {

    console.error("Upload failed:", error);
    alert("Upload failed");

  } finally {
    setUploading(false);
  }

};



  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className="p-5 border-b border-white/[0.06]">
          <span className="text-white font-semibold text-sm">ResumeAI</span>
          <p className="text-slate-500 text-xs">Career Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                active === item.id
                  ? 'bg-purple-600/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-white text-sm">{user?.name}</p>
          <p className="text-slate-500 text-xs">{user?.email}</p>
        </div>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-white text-lg font-semibold">
              {active === 'dashboard' ? 'Dashboard' : 'Upload Resume'}
            </h1>

            <p className="text-slate-500 text-xs">
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric'})}
            </p>
          </div>

          {/* USER DROPDOWN */}
          <div ref={menuRef} className="relative">

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>

              <span className="text-white text-sm">{user?.name?.split(' ')[0]}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-xl">

                <button
                  onClick={()=>navigate('/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                >
                  Logout
                </button>

              </div>
            )}
          </div>

        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6">

          {active === 'dashboard' && (
            <>
              {/* WELCOME */}
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6 mb-6">
                <p className="text-purple-300 text-xs uppercase mb-1">Welcome Back</p>
                <h2 className="text-white text-2xl font-semibold">{user?.name} 👋</h2>
                <p className="text-slate-400 text-sm">
                  Your AI-powered career toolkit is ready.
                </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((s,i)=>(
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="text-2xl">{s.icon}</div>
                    <p className="text-white text-xl">{s.value}</p>
                    <p className="text-slate-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6 text-center">
                <p className="text-slate-400">No resumes yet</p>
              </div>
            </>
          )}

          {active === 'upload' && (
            <div className="space-y-6">

              <div
                onClick={() => {
                  if (!selectedFile) {
                    fileInputRef.current.click();
                  }
                }}
                className="bg-white/[0.03] border-2 border-dashed border-white/[0.10] hover:border-purple-500/30 rounded-2xl p-16 text-center transition-all duration-200 cursor-pointer group hover:bg-purple-500/5"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center mx-auto mb-5">
                      📄
                    </div>

                    <p className="text-white font-medium mb-1">
                      Click to select your resume
                    </p>

                    <p className="text-slate-500 text-sm">
                      PDF, DOC, DOCX up to 10MB
                    </p>
                  </>
                )}

                {selectedFile && (
                  <div className="space-y-3">

                    <p className="text-green-400 font-medium">
                      Selected File:
                    </p>

                    <p className="text-white">
                      {selectedFile.name}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadResume();
                      }}
                      disabled={uploading}
                      className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl"
                    >
                      {uploading ? "Uploading..." : "Upload Resume"}
                    </button>

                    {uploadedResumeId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/analyze/${uploadedResumeId}`);
                        }}
                        className="mt-3 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl"
                      >
                        Analyze Now
                      </button>
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
