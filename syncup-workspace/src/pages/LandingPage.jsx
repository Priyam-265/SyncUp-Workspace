import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MessageSquare, Users, Shield, FolderOpen, Zap, Activity,
  ArrowRight, Check, Github, Mail, Linkedin, Sun, Moon,
  Hash, Bell, Search, Send, Paperclip, Smile, MoreHorizontal,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   DESIGN TOKENS + GLOBAL CSS
───────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap');

/* ── Dark (default) ── */
:root {
  --bg-page    : #222831;
  --bg-surface : #1C2029;
  --bg-card    : rgba(49,54,63,0.85);
  --bg-card-hov: rgba(56,62,72,0.92);
  --border     : rgba(118,171,174,0.18);
  --border-lit : rgba(118,171,174,0.45);
  --accent     : #76ABAE;
  --accent-dim : rgba(118,171,174,0.13);
  --accent-glow: rgba(118,171,174,0.28);
  --teal-hi    : #A8D8DA;
  --text-1     : #EEEEEE;
  --text-2     : rgba(238,238,238,0.65);
  --text-3     : rgba(238,238,238,0.32);
  --loader-bg  : #1A1D23;

  /* Liquid glass navbar */
  --nav-bg     : rgba(34,40,49,0.55);
  --nav-border : rgba(118,171,174,0.25);
  --nav-spec   : rgba(255,255,255,0.06);

  --r          : 18px;
  --font-d     : 'ClashDisplay', 'Syne', -apple-system, sans-serif;
  --font-b     : 'Satoshi',      'DM Sans', -apple-system, sans-serif;
}

/* ── Light mode ── */
.light-mode {
  --bg-page    : #F0F2F5;
  --bg-surface : #E8EBF0;
  --bg-card    : rgba(255,255,255,0.90);
  --bg-card-hov: rgba(255,255,255,0.98);
  --border     : rgba(74,139,142,0.14);
  --border-lit : rgba(74,139,142,0.42);
  --accent     : #4A8B8E;
  --accent-dim : rgba(74,139,142,0.1);
  --accent-glow: rgba(74,139,142,0.22);
  --teal-hi    : #2D7D80;
  --text-1     : #1A1A2E;
  --text-2     : rgba(26,26,46,0.62);
  --text-3     : rgba(26,26,46,0.34);
  --loader-bg  : #F0F2F5;

  --nav-bg     : rgba(240,242,245,0.58);
  --nav-border : rgba(74,139,142,0.22);
  --nav-spec   : rgba(255,255,255,0.55);
}

/* ── Reset ── */
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html { scroll-behavior:smooth; -webkit-font-smoothing:antialiased; }
body {
  background : var(--bg-page);
  color      : var(--text-1);
  font-family: var(--font-b);
  font-size  : 16px;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.6;
  overflow-x : hidden;
  display    : flex;
  flex-direction: column;
  transition : background .55s ease, color .55s ease;
}

/* ── Premium heading typography — Clash Display / Syne ── */
h1, h2, h3, h4 {
  font-family   : var(--font-d);
  font-weight   : 700;
  letter-spacing: -0.04em;
  line-height   : 1.08;
  color         : var(--text-1);
}
main {
  display      : block;
  width        : 100%;
  position     : relative;
  padding-top  : 1px;
  margin-top   : -1px;
  overflow     : hidden;
}

/* Grain overlay */
body::after {
  content          : '';
  position         : fixed;
  inset            : 0;
  background       : url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
  pointer-events   : none;
  z-index          : 9998;
  opacity          : .28;
  mix-blend-mode   : overlay;
}

/* ── Scroll progress ── */
#su-progress {
  position : fixed;
  top:0; left:0;
  height   : 2px;
  width    : 0%;
  background: linear-gradient(90deg, var(--accent), var(--teal-hi));
  z-index  : 10001;
  pointer-events: none;
  box-shadow: 0 0 8px var(--accent-glow);
  transition: width .08s linear;
}

/* ── Loader ── */
#su-loader {
  position        : fixed;
  inset           : 0;
  z-index         : 9999;
  background      : var(--loader-bg);
  display         : flex;
  flex-direction  : column;
  align-items     : center;
  justify-content : center;
  gap             : 20px;
}
.l-mark {
  font-family   : var(--font-d);
  font-size     : 36px;
  font-weight   : 700;
  letter-spacing: -0.03em;
  color         : var(--text-1);
  opacity       : 0;
  transform     : translateY(20px);
}
.l-sub {
  font-family   : var(--font-b);
  font-size     : 10px;
  font-weight   : 500;
  letter-spacing: .32em;
  text-transform: uppercase;
  color         : var(--text-3);
  opacity       : 0;
}
.l-track { width:180px; height:1px; background:var(--border); overflow:hidden; margin-top:6px; }
.l-fill  { height:100%; width:0; background:linear-gradient(90deg,var(--accent),var(--teal-hi)); }

/* ─────────────────────────────────────────────
   iOS LIQUID GLASS NAVBAR
   • bg: rgba(49,54,63,0.40) dark translucent slate
   • blur: blur(20px) saturate(180%) — vibrancy
   • border: 1px rgba(255,255,255,0.08) — hair-thin glass edge
   • shape: floating pill, 90% wide, 100px radius
   • GSAP entrance: slides from y:-100, fades in expo.out
   • scroll: scale(0.98) + bg opacity bumps to 0.80
───────────────────────────────────────────── */
.navbar-pill {
  position : fixed;
  top      : 20px;
  left     : 50%;
  transform: translateX(-50%) translateY(-100px);   /* GSAP start state */
  opacity  : 0;                                      /* GSAP start state */
  z-index  : 10000;

  width         : 90%;
  max-width     : 1200px;
  height        : 64px;
  padding       : 0 24px;

  /* Liquid glass */
  background          : rgba(49, 54, 63, 0.40);
  backdrop-filter     : blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  /* Perfect pill */
  border-radius : 100px;
  border        : 1px solid rgba(255, 255, 255, 0.08);

  /* Specular top-edge glow */
  box-shadow:
    inset 0  1px 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(0,0,0,0.06),
    0 8px 32px rgba(0,0,0,0.20),
    0 2px  8px rgba(0,0,0,0.10);

  display        : flex;
  align-items    : center;
  justify-content: space-between;

  /* Smooth scroll-morph — height + padding animate with width */
  transition: width   .55s cubic-bezier(.22,1,.36,1),
              height  .55s cubic-bezier(.22,1,.36,1),
              padding .55s cubic-bezier(.22,1,.36,1),
              background .35s ease,
              box-shadow .35s ease,
              top .45s cubic-bezier(.22,1,.36,1),
              transform .45s cubic-bezier(.22,1,.36,1);

  will-change: transform, opacity, background;
}
/* Light mode glass */
.light-mode .navbar-pill {
  background: rgba(240, 242, 245, 0.50);
  border-color: rgba(74,139,142,0.14);
  box-shadow:
    inset 0  1px 0 rgba(255,255,255,0.65),
    inset 0 -1px 0 rgba(0,0,0,0.03),
    0 8px 32px rgba(0,0,0,0.08);
}
/* Scroll-compact: shrinks height, width, lifts higher, deepens glass */
.navbar-pill.compact {
  width     : 78%;
  height    : 50px;
  top       : 8px;
  padding   : 0 20px;
  background: rgba(34, 40, 49, 0.82);
  box-shadow:
    inset 0  1px 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(0,0,0,0.14),
    0 20px 60px rgba(0,0,0,0.35),
    0  4px 16px rgba(0,0,0,0.20),
    0  0  0  1px rgba(118,171,174,0.12);
  transform : translateX(-50%) scale(0.97);
}
.light-mode .navbar-pill.compact {
  background: rgba(240, 242, 245, 0.90);
  box-shadow:
    inset 0  1px 0 rgba(255,255,255,0.80),
    0 12px 40px rgba(0,0,0,0.10);
}
/* Prismatic inner edge shimmer */
.navbar-pill::before {
  content      : '';
  position     : absolute;
  inset        : 0;
  border-radius: inherit;
  background   : linear-gradient(108deg,
    rgba(255,255,255,.07) 0%,
    rgba(118,171,174,.05) 35%,
    transparent 60%,
    rgba(118,171,174,.04) 100%);
  pointer-events: none;
  z-index      : 0;
}
/* All direct children sit above pseudo */
.navbar-pill > * { position:relative; z-index:1; }

/* Nav link hover — teal glow underline */
.nav-link {
  position     : relative;
  font-family  : var(--font-b);
  font-size    : 14px;
  font-weight  : 500;
  letter-spacing: -0.01em;
  color        : var(--text-2);
  text-decoration: none;
  transition   : color .22s ease;
  white-space  : nowrap;
  padding-bottom: 2px;
}
.nav-link::after {
  content   : '';
  position  : absolute;
  bottom    : -2px;
  left      : 50%;
  width     : 0%;
  height    : 1px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
  transform : translateX(-50%);
  transition: width .28s cubic-bezier(.22,1,.36,1);
}
.nav-link:hover {
  color: var(--accent);
  text-shadow: 0 0 12px var(--accent-glow);
}
.nav-link:hover::after { width: 100%; }


/* ── Glass card ── */
.glass {
  background      : var(--bg-card);
  border          : 1px solid var(--border);
  border-radius   : var(--r);
  backdrop-filter : blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: background .3s, border-color .3s, box-shadow .3s;
}
.glass:hover {
  background  : var(--bg-card-hov);
  border-color: var(--border-lit);
  box-shadow  : 0 0 40px var(--accent-dim), 0 20px 60px rgba(0,0,0,.15);
}
/* Shimmer sweep */
.shimmer { position:relative; overflow:hidden; }
.shimmer::before {
  content   : '';
  position  : absolute;
  top:0; left:-100%;
  width     : 55%;
  height    : 100%;
  background: linear-gradient(90deg,transparent,rgba(118,171,174,.06),transparent);
  transition: left .75s ease;
  pointer-events:none;
}
.shimmer:hover::before { left:160%; }

/* ── Buttons ── */
.btn { position:relative; overflow:hidden; cursor:pointer; }
.btn-p {
  background  : var(--accent);
  color       : #fff;
  font-family : var(--font-b);
  font-weight : 600;
  border      : none;
  transition  : box-shadow .3s, filter .2s;
}
.btn-p:hover {
  box-shadow: 0 0 26px var(--accent-glow), 0 6px 28px rgba(118,171,174,.2);
  filter    : brightness(1.08);
}
.btn-s {
  background  : var(--bg-card);
  color       : var(--text-1);
  border      : 1px solid var(--border);
  font-family : var(--font-b);
  font-weight : 600;
  transition  : background .3s, border-color .3s;
}
.btn-s:hover { background:var(--bg-card-hov); border-color:var(--border-lit); }
.ripple {
  position     : absolute;
  border-radius: 50%;
  background   : rgba(255,255,255,.18);
  transform    : scale(0);
  animation    : rpl .65s ease-out forwards;
  pointer-events:none;
}
@keyframes rpl { to { transform:scale(4); opacity:0; } }

/* ── Typography helpers ── */
.display  { font-family:var(--font-d); font-weight:700; letter-spacing:-0.04em; line-height:1.08; }
.nav-logo-text { font-family:var(--font-d); font-weight:700; letter-spacing:-0.03em; transition: font-size .4s ease; }
.reveal-text { opacity:0; transform:translateY(50px); }
.grad-h {
  background: linear-gradient(130deg, var(--text-1) 0%, var(--accent) 55%, var(--teal-hi) 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}

/* ── Blobs ── */
.blob { position:absolute; border-radius:50%; filter:blur(88px); pointer-events:none; will-change:transform; }

/* ── Feature card icon float ── */
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
.icon-float { animation:float 3.4s ease-in-out infinite; }

/* ── Counter ── */
.cval {
  font-family  : var(--font-d);
  font-size    : clamp(2.8rem,5.5vw,4.2rem);
  letter-spacing: .06em;
  line-height  : 1;
  color        : var(--accent);
}

/* ── Showcase chat ── */
.cbub { opacity:0; transform:translateY(14px); }

/* ── Scrollbar ── */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:var(--bg-page); }
::-webkit-scrollbar-thumb { background:var(--accent); border-radius:99px; }
`;

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const FEATURES = [
  { Icon: MessageSquare, title: 'Real-Time Messaging', desc: 'Sub-100 ms delivery — typing indicators, threads, reactions.', col: '#76ABAE' },
  { Icon: Hash, title: 'Organized Channels', desc: 'Structure conversations by team, project, or topic. Zero noise.', col: '#A8D8DA' },
  { Icon: FolderOpen, title: 'Secure File Sharing', desc: 'Drag-and-drop with versioning and granular permissions.', col: '#76ABAE' },
  { Icon: Shield, title: 'Role-Based Access', desc: 'Enterprise-grade — the right people see the right things.', col: '#A8D8DA' },
  { Icon: Activity, title: 'Activity Tracking', desc: 'Timelines, audit logs, and productivity analytics built-in.', col: '#76ABAE' },
  { Icon: Users, title: 'Scalable Architecture', desc: '99.99 % SLA. From 10 to 100,000 users without missing a beat.', col: '#A8D8DA' },
];

const STATS = [
  { value: 99.99, suffix: '%', label: 'Uptime SLA', dec: 2 },
  { value: 10, suffix: 'K+', label: 'Messages / day', dec: 0 },
  { value: 2, suffix: 'K+', label: 'Teams worldwide', dec: 0 },
  { value: 180, suffix: 'ms', label: 'Avg. delivery', dec: 0 },
];

const HOW = [
  { n: '01', title: 'Create a Workspace', body: 'Set up your team environment in seconds — invite members, configure roles.' },
  { n: '02', title: 'Organize Channels', body: 'Structure projects and topics with dedicated channels. Keep everything contextual.' },
  { n: '03', title: 'Collaborate Live', body: 'Message, share files, and track activity in real time — from any device.' },
];

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */
function useMagnetic(ready) {
  useEffect(() => {
    if (!ready) return;
    const fns = [];
    document.querySelectorAll('.btn-p,.btn-s').forEach((btn) => {
      const enter = () => {
        const mm = (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - r.left - r.width / 2) * 0.27,
            y: (e.clientY - r.top - r.height / 2) * 0.27,
            duration: 0.4, ease: 'power2.out', overwrite: 'auto',
          });
        };
        btn.addEventListener('mousemove', mm, { passive: true });
        btn._mm = mm;
      };
      const leave = () => {
        if (btn._mm) { btn.removeEventListener('mousemove', btn._mm); delete btn._mm; }
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1.2,.5)', overwrite: 'auto' });
      };
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mouseleave', leave);
      fns.push(() => { btn.removeEventListener('mouseenter', enter); btn.removeEventListener('mouseleave', leave); });
    });
    return () => fns.forEach(f => f());
  }, [ready]);
}

function useRipple() {
  useEffect(() => {
    const h = (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rip = document.createElement('span');
      rip.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const sz = Math.max(rect.width, rect.height);
      Object.assign(rip.style, {
        width: `${sz}px`, height: `${sz}px`,
        left: `${e.clientX - rect.left - sz / 2}px`,
        top: `${e.clientY - rect.top - sz / 2}px`,
      });
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 750);
    };
    document.addEventListener('click', h, { passive: true });
    return () => document.removeEventListener('click', h);
  }, []);
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  const loaderRef = useRef(null);
  const mainRef = useRef(null);
  const featRef = useRef(null);
  const statsRef = useRef(null);
  const pinRef = useRef(null);
  const howRef = useRef(null);
  const ctaRef = useRef(null);

  useMagnetic(ready);
  useRipple();

  /* Theme */
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !dark);
  }, [dark]);

  /* Inject CSS */
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'su-global';
    el.textContent = GLOBAL_CSS;
    if (!document.getElementById('su-global')) document.head.appendChild(el);
    return () => document.getElementById('su-global')?.remove();
  }, []);

  /* ── Loader + hero stagger ── */
  useEffect(() => {
    const loader = loaderRef.current;
    const main = mainRef.current;
    if (!loader || !main) return;
    gsap.set(main, { opacity: 0 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => { setReady(true); ScrollTrigger.refresh(); }
      });
      tl.to('.l-mark', { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
        .to('.l-sub', { opacity: 1, duration: 0.3 }, '-=0.15')
        .to('.l-fill', { width: '100%', duration: 1.4, ease: 'power4.inOut' }, '-=0.2')
        .to(loader, { yPercent: -100, duration: 0.85, ease: 'expo.inOut', delay: 0.1 })
        .to(main, { opacity: 1, duration: 0.4 }, '-=0.55')
        .to('#su-hero .reveal-text', {
          y: 0, opacity: 1, duration: 1.15, stagger: 0.13, ease: 'power4.out',
        }, '-=0.3')
        // Navbar slides down from y:-100 with expo.out — iOS spring feel
        .to('.navbar-pill', {
          y: 0, opacity: 1, duration: 1.0, ease: 'expo.out',
        }, '-=0.85')
        .set(loader, { display: 'none' });
    });
    return () => ctx.revert();
  }, []);

  /* ── All ScrollTrigger animations ── */
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {

      /* Section entrances */
      gsap.utils.toArray('.section-entry').forEach((sec) => {
        gsap.fromTo(sec,
          { opacity: 0, y: 54 },
          {
            opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 88%', toggleActions: 'play none none none' }
          });
        const texts = sec.querySelectorAll('.reveal-text');
        if (texts.length)
          gsap.fromTo(texts,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out',
              scrollTrigger: { trigger: sec, start: 'top 85%', toggleActions: 'play none none none' }
            });
      });

      /* Feature cards stagger */
      if (featRef.current)
        gsap.fromTo(featRef.current.querySelectorAll('.feat-card'),
          { opacity: 0, y: 60, scale: 0.94 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: featRef.current, start: 'top 82%', toggleActions: 'play none none none' }
          });

      /* Counters */
      if (statsRef.current)
        STATS.forEach((s, i) => {
          const el = document.getElementById(`ctr-${i}`);
          if (!el) return;
          ScrollTrigger.create({
            trigger: statsRef.current, start: 'top 80%', once: true,
            onEnter: () => {
              gsap.fromTo({ v: 0 }, { v: s.value },
                {
                  duration: 2.4, ease: 'power2.out',
                  onUpdate: function () { el.textContent = this.targets()[0].v.toFixed(s.dec) + s.suffix; }
                });
            }
          });
        });

      /* Pinned showcase — scroll-scrubbed chat bubbles */
      if (pinRef.current) {
        const bubbles = pinRef.current.querySelectorAll('.cbub');
        const stl = gsap.timeline({
          scrollTrigger: {
            trigger: pinRef.current,
            start: 'top top',
            end: `+=${bubbles.length * 130 + 200}`,
            pin: true,
            scrub: 1.4,
            anticipatePin: 1,
          }
        });
        bubbles.forEach((b) => stl.to(b, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }));
      }

      /* Workflow line-draw + step slide */
      if (howRef.current) {
        const line = howRef.current.querySelector('.hw-line');
        if (line)
          gsap.fromTo(line,
            { scaleY: 0, transformOrigin: 'top center' },
            {
              scaleY: 1, duration: 1.7, ease: 'power2.inOut',
              scrollTrigger: { trigger: howRef.current, start: 'top 78%', toggleActions: 'play none none none' }
            });
        gsap.fromTo(howRef.current.querySelectorAll('.hw-step'),
          { opacity: 0, x: -34 },
          {
            opacity: 1, x: 0, duration: 0.75, stagger: 0.2, ease: 'power3.out',
            scrollTrigger: { trigger: howRef.current, start: 'top 78%', toggleActions: 'play none none none' }
          });
      }

      /* CTA */
      if (ctaRef.current)
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.91, y: 42 },
          {
            opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power4.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 87%', toggleActions: 'play none none none' }
          });

      /* Hero visual parallax */
      gsap.to('#su-hero .hero-vis', {
        yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: '#su-hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });

      /* Blob slow drift */
      gsap.utils.toArray('.blob').forEach((b, i) => {
        gsap.to(b, {
          x: `${(i % 2 ? -1 : 1) * 65}px`,
          y: `${(i % 3 ? -1 : 1) * 85}px`,
          duration: 14 + i * 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
        });
      });
    });
    return () => ctx.revert();
  }, [ready]);

  /* Navbar scroll: shrink height 64→50, width, scale + deeper glass */
  useEffect(() => {
    const nav = document.querySelector('.navbar-pill');
    if (!nav) return;
    let last = false;
    const fn = () => {
      const scrolled = window.scrollY > 60;
      if (scrolled === last) return;
      last = scrolled;
      nav.classList.toggle('compact', scrolled);
      // GSAP animates scale; CSS transition handles height/width/padding
      gsap.to(nav, {
        scale: scrolled ? 0.97 : 1,
        duration: scrolled ? 0.45 : 0.65,
        ease: scrolled ? 'power2.out' : 'elastic.out(1.1,0.6)',
        overwrite: 'auto',
      });
      // Shrink logo text size smoothly
      const logoText = nav.querySelector('.nav-logo-text');
      if (logoText) {
        gsap.to(logoText, {
          fontSize: scrolled ? '15px' : '18px',
          duration: 0.4, ease: 'power2.out', overwrite: 'auto',
        });
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Scroll progress */
  useEffect(() => {
    const bar = document.getElementById('su-progress');
    if (!bar) return;
    const fn = () => {
      const d = document.documentElement;
      bar.style.width = `${Math.min((d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100, 100)}%`;
    };
    addEventListener('scroll', fn, { passive: true });
    return () => removeEventListener('scroll', fn);
  }, []);

  /* ─────────────────────────────────────────
     SHARED INLINE STYLES (tokens → objects)
  ───────────────────────────────────────── */
  const S = {
    wrap: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
    sLabel: { fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600, letterSpacing: '.22em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 },
    h2: { fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(2.2rem,5.5vw,3.8rem)', letterSpacing: '-0.05em', color: 'var(--text-1)', lineHeight: 1.1, marginBottom: 18 },
    body: { fontFamily: 'var(--font-b)', fontWeight: 400, fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, letterSpacing: '-0.01em', maxWidth: 480, margin: '0 auto' },
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <>
      <div id="su-progress" />

      {/* ── LOADER ── */}
      <div id="su-loader" ref={loaderRef}>
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 4 }}>
          <defs>
            <linearGradient id="lgA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A6FA5" />
              <stop offset="50%" stopColor="#6B5EA8" />
              <stop offset="100%" stopColor="#8B7BC8" />
            </linearGradient>
            <linearGradient id="lgB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D4F8A" />
              <stop offset="100%" stopColor="#5A4A9E" />
            </linearGradient>
          </defs>
          <ellipse cx="38" cy="42" rx="24" ry="11" transform="rotate(-35 38 42)"
            fill="none" stroke="url(#lgA)" strokeWidth="9" strokeLinecap="round" opacity="0.95" />
          <ellipse cx="62" cy="58" rx="24" ry="11" transform="rotate(-35 62 58)"
            fill="none" stroke="url(#lgB)" strokeWidth="9" strokeLinecap="round" opacity="0.90" />
          <ellipse cx="50" cy="50" rx="18" ry="8" transform="rotate(55 50 50)"
            fill="none" stroke="url(#lgA)" strokeWidth="6.5" strokeLinecap="round" opacity="0.75" />
        </svg>
        <span className="l-mark">SYNCUP</span>
        <span className="l-sub">Workspace</span>
        <div className="l-track"><div className="l-fill" /></div>
      </div>

      <div ref={mainRef}>

        {/* ══════════════════════════════════════
            iOS LIQUID GLASS NAVBAR
        ══════════════════════════════════════ */}
        <nav className="navbar-pill">
          {/* ── Logo — SVG recreation of the SyncUp infinity-link mark ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* SVG logo mark: two interlocked ovals forming the S/∞ shape */}
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <defs>
                <linearGradient id="gA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A6FA5" />
                  <stop offset="50%" stopColor="#6B5EA8" />
                  <stop offset="100%" stopColor="#8B7BC8" />
                </linearGradient>
                <linearGradient id="gB" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2D4F8A" />
                  <stop offset="100%" stopColor="#5A4A9E" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Outer oval — top-left, tilted ~-30deg */}
              <ellipse cx="38" cy="42" rx="24" ry="11" transform="rotate(-35 38 42)"
                fill="none" stroke="url(#gA)" strokeWidth="9" strokeLinecap="round" opacity="0.95" filter="url(#glow)" />
              {/* Outer oval — bottom-right, tilted ~+30deg */}
              <ellipse cx="62" cy="58" rx="24" ry="11" transform="rotate(-35 62 58)"
                fill="none" stroke="url(#gB)" strokeWidth="9" strokeLinecap="round" opacity="0.90" />
              {/* Inner crossing oval — gives the link/chain illusion */}
              <ellipse cx="50" cy="50" rx="18" ry="8" transform="rotate(55 50 50)"
                fill="none" stroke="url(#gA)" strokeWidth="6.5" strokeLinecap="round" opacity="0.75" />
            </svg>
            <span className="nav-logo-text display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>
              SyncUp
            </span>
          </div>

          {/* Nav links — Features · Enterprise · How it works */}
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              ['Features', '#su-features'],
              ['Enterprise', '#su-stats'],
              ['How it works', '#su-how'],
            ].map(([l, h]) => (
              <a key={l} href={h} className="nav-link">{l}</a>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/login')} className="btn btn-s"
              style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}>
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-p"
              style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 5 }}>
              Get Started <ArrowRight size={12} />
            </button>
            {/* Theme toggle */}
            <button onClick={() => setDark(d => !d)} className="btn btn-s"
              style={{ width: 36, height: 36, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
              {dark ? <Sun size={14} color="var(--accent)" /> : <Moon size={14} color="var(--accent)" />}
            </button>
          </div>
        </nav>

        <main>

          {/* ══════════════════════════════════════
              HERO
          ══════════════════════════════════════ */}
          <section id="su-hero" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
            <div className="blob" style={{ width: 580, height: 580, background: 'radial-gradient(circle,rgba(118,171,174,.16) 0%,transparent 70%)', top: -80, left: -100 }} />
            <div className="blob" style={{ width: 440, height: 440, background: 'radial-gradient(circle,rgba(168,216,218,.1) 0%,transparent 70%)', bottom: 0, right: -60 }} />

            <div style={S.wrap}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

                {/* ── Copy ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <div className="reveal-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 13px', borderRadius: 99, background: 'var(--accent-dim)', border: '1px solid var(--border-lit)', width: 'fit-content' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 7px var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 500, color: 'var(--accent)', letterSpacing: '.05em' }}>
                      Now in public beta
                    </span>
                  </div>

                  <h1 className="reveal-text display" style={{ fontSize: 'clamp(3rem,6.5vw,5.8rem)', letterSpacing: '-0.05em', lineHeight: 1.05, color: 'var(--text-1)' }}>
                    WORK<br />
                    <span className="grad-h">TOGETHER.</span><br />
                    IN REAL TIME.
                  </h1>

                  <p className="reveal-text" style={{ fontFamily: 'var(--font-b)', fontSize: 17, fontWeight: 400, lineHeight: 1.65, letterSpacing: '-0.01em', color: 'var(--text-2)', maxWidth: 420 }}>
                    A unified digital workspace built for modern teams. Channels, messages, files, and activity — all in one place.
                  </p>

                  <div className="reveal-text" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/register')} className="btn btn-p"
                      style={{ padding: '12px 26px', borderRadius: 12, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Get Started Free <ArrowRight size={15} />
                    </button>
                    <button className="btn btn-s"
                      style={{ padding: '12px 26px', borderRadius: 12, fontSize: 15 }}>
                      Live Demo
                    </button>
                  </div>

                  <div className="reveal-text" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                    <div style={{ display: 'flex' }}>
                      {['#76ABAE', '#A8D8DA', '#4A8B8E', '#5BA3A6'].map((c, i) => (
                        <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--bg-page)', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>2,000+ teams trust SyncUp</span>
                  </div>
                </div>

                {/* ── Dashboard mockup ── */}
                <div className="hero-vis" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(ellipse,rgba(118,171,174,.16) 0%,transparent 70%)', pointerEvents: 'none' }} />
                  <div className="glass" style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.32),0 0 0 1px var(--border-lit)' }}>

                    {/* Title bar */}
                    <div style={{ background: 'rgba(0,0,0,.32)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 7, padding: '3px 10px', fontSize: 11, color: 'var(--text-3)' }}>syncup.app</div>
                      <Search size={12} color="var(--text-3)" />
                    </div>

                    {/* App layout */}
                    <div style={{ display: 'flex', height: 370 }}>
                      {/* Sidebar */}
                      <div style={{ width: 186, background: 'rgba(118,171,174,.07)', borderRight: '1px solid var(--border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.14em', padding: '4px 8px', marginBottom: 6 }}>WORKSPACE</div>
                        {['# general', '# design', '# dev-ops', '# random'].map((ch, i) => (
                          <div key={ch} style={{ padding: '7px 10px', borderRadius: 8, background: i === 0 ? 'var(--accent-dim)' : 'transparent', color: i === 0 ? 'var(--accent)' : 'var(--text-2)', fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>
                            {ch}
                          </div>
                        ))}
                        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--teal-hi))', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>A</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Alex</div>
                            <div style={{ fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />Online
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chat pane */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Hash size={13} color="var(--accent)" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>general</span>
                          </div>
                          <div style={{ display: 'flex', gap: 11 }}>
                            <Bell size={13} color="var(--text-3)" />
                            <MoreHorizontal size={13} color="var(--text-3)" />
                          </div>
                        </div>
                        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                          {[
                            { n: 'Jordan', c: 'var(--accent)', msg: '🚀 Just pushed the new design system!', t: '10:24 AM' },
                            { n: 'Sam', c: 'var(--teal-hi)', msg: 'Looks incredible — ship it 🔥', t: '10:25 AM' },
                            { n: 'Alex', c: 'var(--accent)', msg: 'Staging is clean. Deploying now.', t: '10:26 AM' },
                          ].map(m => (
                            <div key={m.n} style={{ display: 'flex', gap: 9 }}>
                              <div style={{ width: 27, height: 27, borderRadius: 8, background: m.c, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{m.n[0]}</div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{m.n}</span>
                                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.t}</span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{m.msg}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: '7px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>Message #general…</span>
                            <Paperclip size={12} color="var(--text-3)" />
                            <Smile size={12} color="var(--text-3)" />
                            <Send size={12} color="var(--accent)" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              FEATURES
          ══════════════════════════════════════ */}
          <section id="su-features" ref={featRef} className="section-entry" style={{ padding: '120px 24px' }}>
            <div style={S.wrap}>
              <div style={{ textAlign: 'center', marginBottom: 68 }}>
                <p className="reveal-text" style={S.sLabel}>Platform</p>
                <h2 className="reveal-text display" style={{ fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.05em', color: 'var(--text-1)', lineHeight: 1.1, textAlign: 'center', marginBottom: 18 }}>
                  Everything your team needs
                </h2>
                <p className="reveal-text" style={{ ...S.body, textAlign: 'center', marginTop: 0 }}>
                  Six core capabilities designed to eliminate friction and amplify your team's velocity.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} className="glass shimmer feat-card" style={{ padding: 26, borderRadius: 18 }}>
                    <div className="icon-float" style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--accent-dim)', border: '1px solid var(--border-lit)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <f.Icon size={21} color="var(--accent)" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.04em', lineHeight: 1.2, color: 'var(--text-1)', marginBottom: 9 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-2)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              STATS
          ══════════════════════════════════════ */}
          <section id="su-stats" ref={statsRef} className="section-entry" style={{ padding: '100px 24px', background: 'linear-gradient(180deg,transparent,rgba(118,171,174,.04),transparent)' }}>
            <div style={S.wrap}>
              <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <h2 className="reveal-text display" style={{ fontWeight: 800, fontSize: 'clamp(1.9rem,4.5vw,3.2rem)', letterSpacing: '-0.05em', lineHeight: 1.1, color: 'var(--text-1)', textAlign: 'center' }}>
                  Built for scale. Designed for speed.
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
                {STATS.map((s, i) => (
                  <div key={i} className="glass" style={{ padding: 30, borderRadius: 18, textAlign: 'center' }}>
                    <div id={`ctr-${i}`} className="cval" style={{ marginBottom: 7 }}>0{s.suffix}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              PINNED SHOWCASE
          ══════════════════════════════════════ */}
          <div ref={pinRef} style={{ position: 'relative', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ ...S.wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center', minHeight: '100vh', padding: '80px 24px' }}>

              <div>
                <p style={{ ...S.sLabel }}>Live Experience</p>
                <h2 className="display" style={{ fontWeight: 800, fontSize: 'clamp(2rem,4.5vw,3.2rem)', letterSpacing: '-0.05em', lineHeight: 1.08, color: 'var(--text-1)', marginBottom: 22, maxWidth: 400 }}>
                  Watch your team<br />
                  <span style={{ color: 'var(--accent)' }}>come alive.</span>
                </h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.65, color: 'var(--text-2)', marginBottom: 30, maxWidth: 400 }}>
                  Every message, file, and update syncs across your team the instant it happens.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {['Sub-100 ms message delivery', 'Live typing indicators', 'Instant file previews', 'Presence & status sync'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 19, height: 19, borderRadius: 6, background: 'var(--accent-dim)', border: '1px solid var(--border-lit)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={10} color="var(--accent)" />
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat feed */}
              <div className="glass" style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.22)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Hash size={13} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>general</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                    24 online
                  </span>
                </div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 15, minHeight: 360 }}>
                  {[
                    { n: 'Jordan', msg: '🚀 Just deployed v2.4 to production!', file: null },
                    { n: 'Sam', msg: 'Checking metrics — looks great!', file: null },
                    { n: 'Alex', msg: null, file: 'Q4-Report.pdf' },
                    { n: 'Jordan', msg: 'We just hit 10k users 🎉', file: null },
                    { n: 'Sam', msg: 'The team absolutely crushed it 💪', file: null },
                  ].map((m, i) => (
                    <div key={i} className="cbub" style={{ display: 'flex', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{m.n[0]}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{m.n}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>just now</span>
                        </div>
                        {m.msg && <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{m.msg}</div>}
                        {m.file && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', background: 'var(--accent-dim)', borderRadius: 9, border: '1px solid var(--border-lit)', marginTop: 4 }}>
                            <FolderOpen size={13} color="var(--accent)" />
                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{m.file}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════
              HOW IT WORKS
          ══════════════════════════════════════ */}
          <section id="su-how" ref={howRef} className="section-entry" style={{ padding: '120px 24px' }}>
            <div style={S.wrap}>
              <div style={{ textAlign: 'center', marginBottom: 76 }}>
                <p className="reveal-text" style={S.sLabel}>How it works</p>
                <h2 className="reveal-text display" style={{ fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.4rem)', letterSpacing: '-0.05em', lineHeight: 1.1, color: 'var(--text-1)', textAlign: 'center' }}>
                  Up and running in minutes
                </h2>
              </div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div className="hw-line" style={{ position: 'absolute', left: 37, top: 34, bottom: 34, width: 1, background: 'linear-gradient(180deg,var(--accent),var(--teal-hi))' }} />
                {HOW.map((step, i) => (
                  <div key={i} className="hw-step" style={{ display: 'flex', gap: 28, padding: '30px 0', borderBottom: i < HOW.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 76, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid var(--border-lit)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.03em', color: 'var(--accent)', position: 'relative', zIndex: 1 }}>
                        {step.n}
                      </div>
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.05em', lineHeight: 1.1, color: 'var(--text-1)', marginBottom: 10 }}>{step.title}</h3>
                      <p style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.65, color: 'var(--text-2)', maxWidth: 500 }}>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
              CTA
          ══════════════════════════════════════ */}
          <section style={{ padding: '80px 24px 120px' }}>
            <div style={{ maxWidth: 880, margin: '0 auto' }} ref={ctaRef}>
              <div style={{ borderRadius: 26, background: 'linear-gradient(135deg,rgba(118,171,174,.12) 0%,rgba(168,216,218,.06) 100%)', border: '1px solid var(--border-lit)', padding: '76px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Dot-grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(118,171,174,.15) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', opacity: .5 }} />
                <div style={{ position: 'relative' }}>
                  <h2 className="display" style={{ fontWeight: 800, fontSize: 'clamp(2.2rem,5.5vw,3.8rem)', letterSpacing: '-0.05em', lineHeight: 1.05, color: 'var(--text-1)', marginBottom: 18 }}>
                    Ready to transform<br />how your team works?
                  </h2>
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.65, color: 'var(--text-2)', maxWidth: 440, margin: '0 auto 38px' }}>
                    Join 2,000+ teams already on SyncUp. Free forever for small teams.
                  </p>
                  <div style={{ display: 'flex', gap: 11, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/register')} className="btn btn-p"
                      style={{ padding: '13px 30px', borderRadius: 12, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Start for free <ArrowRight size={15} />
                    </button>
                    <button className="btn btn-s"
                      style={{ padding: '13px 30px', borderRadius: 12, fontSize: 15 }}>
                      Book a demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* ══════════════════════════════════════
            FOOTER
        ══════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '56px 24px 40px' }}>
          <div style={S.wrap}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 44 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <defs>
                      <linearGradient id="ftA" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4A6FA5" />
                        <stop offset="100%" stopColor="#8B7BC8" />
                      </linearGradient>
                      <linearGradient id="ftB" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2D4F8A" />
                        <stop offset="100%" stopColor="#5A4A9E" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="38" cy="42" rx="24" ry="11" transform="rotate(-35 38 42)" fill="none" stroke="url(#ftA)" strokeWidth="9" strokeLinecap="round" opacity="0.95" />
                    <ellipse cx="62" cy="58" rx="24" ry="11" transform="rotate(-35 62 58)" fill="none" stroke="url(#ftB)" strokeWidth="9" strokeLinecap="round" opacity="0.90" />
                    <ellipse cx="50" cy="50" rx="18" ry="8" transform="rotate(55 50 50)" fill="none" stroke="url(#ftA)" strokeWidth="6.5" strokeLinecap="round" opacity="0.75" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>SyncUp</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.72, maxWidth: 220 }}>
                  Real-time collaboration for modern, fast-moving teams.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  {[Github, Mail, Linkedin].map((Icon, i) => (
                    <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', textDecoration: 'none', transition: 'all .25s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                      <Icon size={14} />
                    </a>
                  ))}
                </div>
              </div>
              {[
                { head: 'Product', items: ['Features', 'Pricing', 'Security', 'Changelog'] },
                { head: 'Company', items: ['About', 'Blog', 'Careers', 'Press'] },
                { head: 'Legal', items: ['Privacy', 'Terms', 'Cookies', 'DPA'] },
              ].map(col => (
                <div key={col.head}>
                  <h4 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 14 }}>{col.head}</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {col.items.map(item => (
                      <li key={item}>
                        <a href="#" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', transition: 'color .2s' }}
                          onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2025 SyncUp Workspace, Inc.</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Made with precision ◈</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}