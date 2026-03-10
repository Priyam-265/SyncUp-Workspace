import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Hash, Zap, ArrowRight, Building2, X, Link, Mail, Copy, Check, LogIn, AtSign } from 'lucide-react';

const generateInviteId = () => Math.random().toString(36).substring(2, 10).toUpperCase();
const generateInviteLink = (id) => `https://syncup.io/join/${id}`;

const WorkspaceSelectionPage = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', icon: '🏢' });
  const [createdWorkspace, setCreatedWorkspace] = useState(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [joinValue, setJoinValue] = useState('');
  const [joinError, setJoinError] = useState('');
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0]);

  const mainRef = useRef(null);
  const createModalRef = useRef(null);
  const joinModalRef = useRef(null);
  const stepRef = useRef(null);
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const gridRef = useRef(null);
  const statsRef = useRef(null);
  const overlayRef = useRef(null);

  const workspaces = [
    { id: 1, name: 'Acme Corporation', icon: '🏢', members: 24, channels: 12, color: 'from-blue-500 to-cyan-500', lastActive: '2 minutes ago' },
    { id: 2, name: 'Startup Labs', icon: '🚀', members: 8, channels: 6, color: 'from-purple-500 to-pink-500', lastActive: '1 hour ago' },
    { id: 3, name: 'Design Team', icon: '🎨', members: 15, channels: 9, color: 'from-orange-500 to-red-500', lastActive: '3 hours ago' },
    { id: 4, name: 'Engineering Hub', icon: '⚙️', members: 32, channels: 18, color: 'from-green-500 to-emerald-500', lastActive: '5 minutes ago' }
  ];



  // ── 2. Master page-load timeline ───────────────────────────────
  useEffect(() => {
    // Set initial hidden state BEFORE first paint — prevents flash
    gsap.set(headerRef.current, { y: -60, opacity: 0 });
    gsap.set('.header-logo', { rotate: -180, scale: 0, opacity: 0 });
    gsap.set(titleRef.current, { opacity: 0, y: 50, skewY: 3 });
    gsap.set(subtitleRef.current, { opacity: 0, y: 25 });
    gsap.set('.workspace-card', { opacity: 0, y: 60, rotateX: 10, scale: 0.94 });
    gsap.set('.stat-card', { opacity: 0, y: 35 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

    // Header slides down
    tl.to(headerRef.current,
      { y: 0, opacity: 1, duration: 1.0 }
    )
    // Logo zap icon spins in
    .to('.header-logo', { rotate: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)' }, '-=0.5')
    // Title fades up
    .to(titleRef.current, { opacity: 1, y: 0, skewY: 0, duration: 1.1 }, '-=0.4')
    // Subtitle fades up
    .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
    // Cards stagger in
    .to('.workspace-card',
      { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.85, stagger: { amount: 0.75, from: 'start' } },
      '-=0.5'
    )
    // Stat cards
    .to('.stat-card',
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.18 },
      '-=0.4'
    );

    // Animate stat numbers counting up (delayed to match when cards appear)
    const targets = [workspaces.length, workspaces.reduce((a,w)=>a+w.members,0), workspaces.reduce((a,w)=>a+w.channels,0)];
    targets.forEach((target, i) => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.8,
        delay: 1.8 + i * 0.2,
        ease: 'power2.out',
        onUpdate: () => {
          setAnimatedStats(prev => {
            const next = [...prev];
            next[i] = Math.round(obj.val);
            return next;
          });
        }
      });
    });
  }, []);

  // ── 3. Workspace card hover (scale + glow) ──────────────────────
  useEffect(() => {
    const cards = document.querySelectorAll('.workspace-card');
    cards.forEach((card) => {
      const enter = () => {
        gsap.to(card, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
        gsap.to(card.querySelector('.card-icon'), { rotate: 8, scale: 1.15, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(card.querySelector('.card-arrow'), { x: 5, duration: 0.25, ease: 'power2.out' });
      };
      const leave = () => {
        gsap.to(card, { scale: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(card.querySelector('.card-icon'), { rotate: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(card.querySelector('.card-arrow'), { x: 0, duration: 0.25, ease: 'power2.out' });
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
    });
  }, []);

  // ── 4. Create modal open/close ──────────────────────────────────
  useEffect(() => {
    if (showCreateModal && createModalRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(createModalRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }
      );
    }
  }, [showCreateModal]);

  // ── 5. Join modal open ──────────────────────────────────────────
  useEffect(() => {
    if (showJoinModal && joinModalRef.current) {
      gsap.fromTo(joinModalRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }
      );
    }
  }, [showJoinModal]);

  // ── 6. Step 2 (invite) slide transition ────────────────────────
  useEffect(() => {
    if (createdWorkspace && stepRef.current) {
      gsap.fromTo(stepRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
      // Success badge bounce
      gsap.fromTo('.success-badge',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.15 }
      );
    }
  }, [createdWorkspace]);

  // ── Modal close animation helper ────────────────────────────────
  const closeWithAnimation = (ref, cb) => {
    gsap.to(ref.current, {
      y: 60, opacity: 0, scale: 0.93, duration: 0.28, ease: 'power2.in',
      onComplete: cb
    });
    if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 });
  };

  // ── Button ripple ───────────────────────────────────────────────
  const addRipple = (e) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'absolute rounded-full bg-white/20 pointer-events-none';
    const size = Math.max(btn.offsetWidth, btn.offsetHeight) * 1.5;
    const rect = btn.getBoundingClientRect();
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() });
  };

  // ── Handlers ────────────────────────────────────────────────────
  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    // Button press animation
    gsap.to(e.submitter || e.target, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
    const inviteId = generateInviteId();
    const inviteLink = generateInviteLink(inviteId);
    setCreatedWorkspace({ ...newWorkspace, inviteId, inviteLink });
  };

  const handleFinishCreate = () => {
    closeWithAnimation(createModalRef, () => {
      setShowCreateModal(false);
      setCreatedWorkspace(null);
      setNewWorkspace({ name: '', icon: '🏢' });
      setInviteEmails('');
      setCopiedLink(false);
      setCopiedId(false);
    });
  };

  const handleCloseCreate = () => {
    closeWithAnimation(createModalRef, () => {
      setShowCreateModal(false);
      setCreatedWorkspace(null);
      setNewWorkspace({ name: '', icon: '🏢' });
      setInviteEmails('');
      setCopiedLink(false);
      setCopiedId(false);
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(createdWorkspace.inviteLink);
    setCopiedLink(true);
    gsap.fromTo('.copy-link-btn', { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(createdWorkspace.inviteId);
    setCopiedId(true);
    gsap.fromTo('.copy-id-btn', { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleJoinWorkspace = (e) => {
    e.preventDefault();
    const val = joinValue.trim();
    if (!val) { setJoinError('Please enter a workspace ID or invite link.'); gsap.fromTo('.join-input', { x: 0 }, { x: 8, duration: 0.07, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }
    const isLink = val.startsWith('http');
    const isId = /^[A-Z0-9]{8}$/i.test(val);
    if (!isLink && !isId) { setJoinError('Invalid format. Enter a valid ID (e.g. AB12CD34) or full invite link.'); gsap.fromTo('.join-input', { x: 0 }, { x: 8, duration: 0.07, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }
    closeWithAnimation(joinModalRef, () => {
      setShowJoinModal(false);
      setJoinValue('');
      setJoinError('');
      navigate('/dashboard/1');
    });
  };

  const handleCloseJoin = () => {
    closeWithAnimation(joinModalRef, () => {
      setShowJoinModal(false);
      setJoinValue('');
      setJoinError('');
    });
  };

  const statLabels = ['Total Workspaces', 'Total Members', 'Total Channels'];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#222831] text-slate-900 dark:text-[#EEEEEE] transition-colors duration-500 font-sans overflow-hidden">

      <div className="relative min-h-screen flex flex-col z-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header ref={headerRef} className="py-5 px-6 bg-white/90 dark:bg-[#31363F]/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-[#76ABAE]/20 transition-colors duration-500">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="header-logo w-10 h-10 bg-blue-600 dark:bg-[#76ABAE] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20">
                <Zap className="w-5 h-5 text-white dark:text-[#222831]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#EEEEEE]">
                SyncUp <span className="text-blue-600 dark:text-[#76ABAE]">Workspace</span>
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 dark:bg-[#76ABAE] rounded-full flex items-center justify-center text-white dark:text-[#222831] font-bold text-sm">JD</div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-[#EEEEEE]">John Doe</div>
                  <div className="text-xs text-slate-500 dark:text-[#EEEEEE]/50">john@company.com</div>
                </div>
              </div>
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#EEEEEE]/70 hover:bg-slate-100 dark:hover:bg-[#222831]/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-[#76ABAE]/30 transition-all duration-300">
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main ref={mainRef} className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-6xl">

            {/* Title */}
            <div className="text-center mb-12">
              <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-[#EEEEEE] mb-4">
                Choose your <span className="text-blue-600 dark:text-[#76ABAE]">workspace</span>
              </h1>
              <p ref={subtitleRef} className="text-lg text-slate-500 dark:text-[#EEEEEE]/70">
                Select a workspace to continue or create a new one
              </p>
            </div>

            {/* Workspace Grid */}
            <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => navigate(`/dashboard/${workspace.id}`)}
                  className="workspace-card group bg-white/90 dark:bg-[#31363F]/85 backdrop-blur-xl rounded-[1.5rem] p-6 border border-slate-200/50 dark:border-[#76ABAE]/20 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-[#76ABAE]/10 transition-shadow duration-300 text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`card-icon w-14 h-14 bg-gradient-to-br ${workspace.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                      {workspace.icon}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#EEEEEE]/50 font-medium">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#EEEEEE] mb-3 group-hover:text-blue-600 dark:group-hover:text-[#76ABAE] transition-colors duration-300">
                    {workspace.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-[#EEEEEE]/50 mb-3">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><span>{workspace.members} members</span></div>
                    <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /><span>{workspace.channels} channels</span></div>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-[#EEEEEE]/40">Last active: {workspace.lastActive}</div>
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-[#76ABAE]/20 flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-600 dark:text-[#76ABAE]">Open workspace</span>
                    <ArrowRight className="card-arrow w-4 h-4 text-blue-600 dark:text-[#76ABAE]" />
                  </div>
                </button>
              ))}

              {/* Create Card */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="workspace-card group bg-white/90 dark:bg-[#31363F]/85 backdrop-blur-xl rounded-[1.5rem] p-6 border-2 border-dashed border-slate-300 dark:border-[#76ABAE]/30 hover:border-blue-500 dark:hover:border-[#76ABAE] hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-[#76ABAE]/10 transition-all duration-300"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[220px]">
                  <div className="card-icon w-14 h-14 bg-blue-600 dark:bg-[#76ABAE] rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20">
                    <Plus className="w-7 h-7 text-white dark:text-[#222831]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#EEEEEE] mb-2">Create Workspace</h3>
                  <p className="text-sm text-slate-500 dark:text-[#EEEEEE]/50 text-center">Start a new workspace for your team</p>
                  <div className="card-arrow opacity-0 group-hover:opacity-100 mt-4 flex items-center gap-1 text-blue-600 dark:text-[#76ABAE] text-sm font-bold transition-opacity duration-200">Get started <ArrowRight className="w-3.5 h-3.5" /></div>
                </div>
              </button>

              {/* Join Card */}
              <button
                onClick={() => setShowJoinModal(true)}
                className="workspace-card group bg-white/90 dark:bg-[#31363F]/85 backdrop-blur-xl rounded-[1.5rem] p-6 border-2 border-dashed border-slate-300 dark:border-[#76ABAE]/30 hover:border-blue-500 dark:hover:border-[#76ABAE] hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-[#76ABAE]/10 transition-all duration-300"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[220px]">
                  <div className="card-icon w-14 h-14 bg-slate-600 dark:bg-[#31363F] border-2 border-slate-300 dark:border-[#76ABAE]/40 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 dark:group-hover:bg-[#76ABAE] transition-colors duration-300 shadow-lg">
                    <LogIn className="w-7 h-7 text-white dark:text-[#EEEEEE] dark:group-hover:text-[#222831]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#EEEEEE] mb-2">Join Workspace</h3>
                  <p className="text-sm text-slate-500 dark:text-[#EEEEEE]/50 text-center">Join using an invite link or workspace ID</p>
                  <div className="card-arrow opacity-0 group-hover:opacity-100 mt-4 flex items-center gap-1 text-blue-600 dark:text-[#76ABAE] text-sm font-bold transition-opacity duration-200">Enter code <ArrowRight className="w-3.5 h-3.5" /></div>
                </div>
              </button>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {statLabels.map((label, i) => (
                <div key={i} className="stat-card bg-white/90 dark:bg-[#31363F]/85 backdrop-blur-xl rounded-[1.25rem] p-4 border border-slate-200/50 dark:border-[#76ABAE]/20 text-center transition-colors duration-500">
                  <div className="text-2xl font-bold text-blue-600 dark:text-[#76ABAE]">{animatedStats[i]}</div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/50 mt-1">{label}</div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>

      {/* ── Create Workspace Modal ───────────────────────────────── */}
      {showCreateModal && (
        <div ref={overlayRef} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50" style={{ opacity: 0 }}>
          <div ref={createModalRef} className="bg-white/90 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200/50 dark:border-[#76ABAE]/20 transition-colors duration-500 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/50 dark:border-[#76ABAE]/20 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#EEEEEE]">
                {createdWorkspace
                  ? <><span className="text-blue-600 dark:text-[#76ABAE]">Invite</span> your team</>
                  : <>Create a <span className="text-blue-600 dark:text-[#76ABAE]">workspace</span></>}
              </h3>
              <button onClick={handleCloseCreate} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-[#222831]/60 flex items-center justify-center transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#76ABAE]/30">
                <X className="w-4 h-4 text-slate-500 dark:text-[#EEEEEE]/50" />
              </button>
            </div>

            {/* Step 1 */}
            {!createdWorkspace && (
              <form ref={stepRef} onSubmit={handleCreateWorkspace} className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">Workspace Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-[#EEEEEE]/50 group-focus-within:text-blue-500 dark:group-focus-within:text-[#76ABAE] transition-colors z-10" />
                    <input
                      type="text"
                      value={newWorkspace.name}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/30 px-12 py-3 rounded-xl outline-none text-slate-900 dark:text-[#EEEEEE] focus:border-blue-500 dark:focus:border-[#76ABAE] focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-[#76ABAE]/20 placeholder:text-slate-400 dark:placeholder:text-[#EEEEEE]/40 font-medium transition-all shadow-sm"
                      placeholder="e.g., Marketing Team"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-[#EEEEEE]/40 ml-1">This will be the name of your workspace</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">Choose an Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['🏢','🚀','💼','🎨','⚙️','🔬','📚','🎯','💡','🌟','🔥','⚡'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                          setNewWorkspace({ ...newWorkspace, icon: emoji });
                          gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
                        }}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-200 border ${
                          newWorkspace.icon === emoji
                            ? 'bg-blue-600 dark:bg-[#76ABAE] border-blue-600 dark:border-[#76ABAE] shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20'
                            : 'bg-slate-50 dark:bg-[#222831]/80 border-slate-200 dark:border-[#76ABAE]/20 hover:border-blue-400 dark:hover:border-[#76ABAE]/50 hover:scale-110'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">
                    Invite by Code <span className="normal-case font-normal text-slate-400 dark:text-[#EEEEEE]/30">(generated on create)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/20 px-4 py-3 rounded-xl flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400 dark:text-[#EEEEEE]/30 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold tracking-widest text-slate-400 dark:text-[#EEEEEE]/30">XXXXXXXX</span>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-[#222831]/60 text-slate-400 dark:text-[#EEEEEE]/30 border border-slate-200 dark:border-[#76ABAE]/10 cursor-not-allowed flex items-center gap-2 select-none">
                      <Copy className="w-4 h-4" /> Copy
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">
                    Invite by Link <span className="normal-case font-normal text-slate-400 dark:text-[#EEEEEE]/30">(generated on create)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/20 px-4 py-3 rounded-xl flex items-center gap-2 overflow-hidden">
                      <Link className="w-4 h-4 text-slate-400 dark:text-[#EEEEEE]/30 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-400 dark:text-[#EEEEEE]/30 truncate">
                        {newWorkspace.name ? `syncup.io/join/${newWorkspace.name.toLowerCase().replace(/\s+/g,'-')}-xxxx` : 'syncup.io/join/your-workspace-xxxx'}
                      </span>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-[#222831]/60 text-slate-400 dark:text-[#EEEEEE]/30 border border-slate-200 dark:border-[#76ABAE]/10 cursor-not-allowed flex items-center gap-2 select-none">
                      <Copy className="w-4 h-4" /> Copy
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 dark:bg-[#222831]/80 rounded-xl p-4 border border-slate-200 dark:border-[#76ABAE]/20">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/50 mb-3">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-600 dark:bg-[#76ABAE] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 dark:shadow-[#76ABAE]/10">
                      {newWorkspace.icon}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-[#EEEEEE]">{newWorkspace.name || 'Your Workspace'}</div>
                      <div className="text-xs text-slate-500 dark:text-[#EEEEEE]/50">0 members • 0 channels</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleCloseCreate} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 rounded-xl border border-slate-200 dark:border-[#76ABAE]/20 hover:bg-slate-200 dark:hover:bg-[#222831] font-bold tracking-wide transition-all duration-300">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={addRipple}
                    className="flex-1 py-3 px-4 bg-blue-600 dark:bg-[#76ABAE] hover:bg-blue-700 dark:hover:bg-[#76ABAE]/80 text-white dark:text-[#222831] rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    Create & Invite
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2 — Invite */}
            {createdWorkspace && (
              <div ref={stepRef} className="p-6 space-y-5 overflow-y-auto">
                <div className="success-badge bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-green-700 dark:text-green-400 text-sm">Workspace created!</div>
                    <div className="text-xs text-green-600 dark:text-green-500">{createdWorkspace.icon} {createdWorkspace.name}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">Invite by Code</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/30 px-4 py-3 rounded-xl flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600 dark:text-[#76ABAE] flex-shrink-0" />
                      <span className="text-sm font-mono font-bold tracking-widest text-blue-600 dark:text-[#76ABAE]">{createdWorkspace.inviteId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className={`copy-id-btn px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 border ${copiedId ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 border-slate-200 dark:border-[#76ABAE]/20 hover:bg-blue-600 dark:hover:bg-[#76ABAE] hover:text-white dark:hover:text-[#222831] hover:border-transparent'}`}
                    >
                      {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-[#EEEEEE]/40 ml-1">Share this 8-character code so teammates can join directly</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">Invite Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/30 px-4 py-3 rounded-xl text-sm text-slate-500 dark:text-[#EEEEEE]/50 font-mono truncate">
                      {createdWorkspace.inviteLink}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`copy-link-btn px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 border ${copiedLink ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 border-slate-200 dark:border-[#76ABAE]/20 hover:bg-blue-600 dark:hover:bg-[#76ABAE] hover:text-white dark:hover:text-[#222831] hover:border-transparent'}`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleFinishCreate} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 rounded-xl border border-slate-200 dark:border-[#76ABAE]/20 hover:bg-slate-200 dark:hover:bg-[#222831] font-bold tracking-wide transition-all duration-300">
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { addRipple(e); handleFinishCreate(); }}
                    className="flex-1 py-3 px-4 bg-blue-600 dark:bg-[#76ABAE] hover:bg-blue-700 dark:hover:bg-[#76ABAE]/80 text-white dark:text-[#222831] rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {inviteEmails ? 'Send Invites' : 'Go to Workspace'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Join Workspace Modal ─────────────────────────────────── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div ref={joinModalRef} className="bg-white/90 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200/50 dark:border-[#76ABAE]/20 transition-colors duration-500">
            <div className="p-6 border-b border-slate-200/50 dark:border-[#76ABAE]/20 flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#EEEEEE]">
                Join a <span className="text-blue-600 dark:text-[#76ABAE]">workspace</span>
              </h3>
              <button onClick={handleCloseJoin} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-[#222831]/60 flex items-center justify-center transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#76ABAE]/30">
                <X className="w-4 h-4 text-slate-500 dark:text-[#EEEEEE]/50" />
              </button>
            </div>

            <form onSubmit={handleJoinWorkspace} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-[#222831]/80 rounded-xl p-3 border border-slate-200 dark:border-[#76ABAE]/20 text-center">
                  <Link className="w-5 h-5 text-blue-600 dark:text-[#76ABAE] mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-700 dark:text-[#EEEEEE]">Invite Link</div>
                  <div className="text-xs text-slate-400 dark:text-[#EEEEEE]/40 mt-0.5">syncup.io/join/…</div>
                </div>
                <div className="bg-slate-50 dark:bg-[#222831]/80 rounded-xl p-3 border border-slate-200 dark:border-[#76ABAE]/20 text-center">
                  <Hash className="w-5 h-5 text-blue-600 dark:text-[#76ABAE] mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-700 dark:text-[#EEEEEE]">Workspace ID</div>
                  <div className="text-xs text-slate-400 dark:text-[#EEEEEE]/40 mt-0.5">e.g. AB12CD34</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-[#EEEEEE]/70 ml-1">Invite Link or Workspace ID</label>
                <div className="relative group">
                  <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-[#EEEEEE]/50 group-focus-within:text-blue-500 dark:group-focus-within:text-[#76ABAE] transition-colors z-10" />
                  <input
                    type="text"
                    value={joinValue}
                    onChange={(e) => { setJoinValue(e.target.value); setJoinError(''); }}
                    className="join-input w-full bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/30 px-12 py-3 rounded-xl outline-none text-slate-900 dark:text-[#EEEEEE] focus:border-blue-500 dark:focus:border-[#76ABAE] focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-[#76ABAE]/20 placeholder:text-slate-400 dark:placeholder:text-[#EEEEEE]/40 font-medium transition-all shadow-sm"
                    placeholder="https://syncup.io/join/AB12CD34  or  AB12CD34"
                  />
                </div>
                {joinError && <p className="text-xs text-red-500 dark:text-red-400 ml-1 font-medium">{joinError}</p>}
                <p className="text-xs text-slate-400 dark:text-[#EEEEEE]/40 ml-1">Paste the invite link or enter the 8-character workspace ID</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleCloseJoin} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 rounded-xl border border-slate-200 dark:border-[#76ABAE]/20 hover:bg-slate-200 dark:hover:bg-[#222831] font-bold tracking-wide transition-all duration-300">
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={addRipple}
                  className="flex-1 py-3 px-4 bg-blue-600 dark:bg-[#76ABAE] hover:bg-blue-700 dark:hover:bg-[#76ABAE]/80 text-white dark:text-[#222831] rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 dark:shadow-[#76ABAE]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  Join Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelectionPage;