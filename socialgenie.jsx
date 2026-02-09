"use client";
/*  SocialGenie.jsx  (Single-file UI preview)
    ✅ Upload this ONE file to GitHub to preview the full UI flow (Landing → Auth → Onboarding → App → Admin)
    ✅ Works as a standalone React component in Vite/CRA/Next (client-side only)
    ✅ No Firebase needed for preview — uses localStorage mock data (easy to swap later)

    How to use:
    - Vite: put in src/SocialGenie.jsx and render <SocialGenie /> in main.jsx
    - CRA: put in src/SocialGenie.jsx and render <SocialGenie /> in App.js
    - Next.js: put in app/SocialGenie.jsx and import into app/page.jsx

    Tailwind:
    - If you already use Tailwind, UI will look perfect.
    - If not, it still runs, just looks plain.
*/

import React, { useEffect, useMemo, useState } from "react";

/* -------------------- Small utilities -------------------- */
const ls = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem(key);
  },
};

const uid = () => "u_" + Math.random().toString(36).slice(2, 10);
const id = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

const formatDT = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const toDatetimeLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

function scoreHook(text) {
  let s = 50;
  const firstLine = (text.split("\n")[0] || "").trim();
  if (firstLine.length > 0 && firstLine.length <= 70) s += 10;
  if (/[0-9]/.test(text)) s += 8;
  if (/\?/.test(firstLine)) s += 8;
  if (/(exposed|truth|mistake|secret|nobody|stop|why|how)/i.test(firstLine)) s += 10;
  if (/(subscribe|follow|comment|share|save)/i.test(text)) s += 4;
  return Math.max(1, Math.min(100, s));
}

function hashtagPack(topic) {
  const base = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  const tags = [
    "#marketing",
    "#socialmedia",
    "#contentcreator",
    "#growth",
    "#branding",
    "#ai",
    "#productivity",
    "#entrepreneur",
  ];
  base.forEach((w) => tags.unshift(`#${w}`));
  return Array.from(new Set(tags)).slice(0, 12);
}

function generateDrafts({ topic, audience, tone, goal }) {
  const tags = hashtagPack(topic);
  const cta =
    goal === "Leads"
      ? "Reply “GENIE” and I’ll share a free checklist."
      : goal === "Followers"
      ? "Follow for more practical growth tactics."
      : "Drop your take in the comments 👇";

  const toneTag =
    tone === "Bold" ? "🔥 " : tone === "Funny" ? "😂 " : tone === "Friendly" ? "✨ " : "";

  const mk = (arr) =>
    arr.map((v) => ({ ...v, text: toneTag + v.text, hookScore: scoreHook(v.text) }));

  return {
    telegram: mk([
      {
        text:
          `<b>${topic}</b>\n\n` +
          `Here’s the 60-second breakdown for ${audience}:\n` +
          `• What’s changing right now\n` +
          `• Why it matters\n` +
          `• What to do next\n\n` +
          `<b>Quick question:</b> What’s your biggest challenge with this?\n\n` +
          `✅ ${cta}`,
        hashtags: tags,
        cta,
      },
      {
        text:
          `<b>Most people get ${topic} wrong.</b>\n\n` +
          `If you’re ${audience}, focus on these 3 moves:\n` +
          `1) Identify the lever\n` +
          `2) Build the habit\n` +
          `3) Measure weekly\n\n` +
          `⚡ ${cta}`,
        hashtags: tags,
        cta,
      },
      {
        text:
          `<b>${topic} — the simple playbook</b>\n\n` +
          `Step 1: Define the outcome\n` +
          `Step 2: Create 3 content angles\n` +
          `Step 3: Post + learn + iterate\n\n` +
          `💬 ${cta}`,
        hashtags: tags,
        cta,
      },
    ]),
    linkedin: mk([
      {
        text:
          `${topic}\n\n` +
          `Most people chase “more content.”\n` +
          `The winners chase “better angles.”\n\n` +
          `For ${audience}, here’s a simple framework:\n` +
          `1) Problem → 2) Proof → 3) Process → 4) Prompt\n\n` +
          `${cta}`,
        hashtags: tags,
        cta,
      },
      {
        text:
          `3 unpopular truths about ${topic}:\n\n` +
          `1) Consistency beats intensity.\n` +
          `2) Hooks matter more than hashtags.\n` +
          `3) Feedback loops compound.\n\n` +
          `${cta}`,
        hashtags: tags,
        cta,
      },
    ]),
    x: mk([
      {
        text:
          `🚨 ${topic} (thread)\n\n` +
          `1/ Most people miss the real lever.\n` +
          `2/ Here’s the simple framework:\n` +
          `3/ Mistake #1: posting without a hook.\n` +
          `4/ Mistake #2: no CTA.\n` +
          `5/ Use this prompt: “What’s the 1 thing you’d change?”\n\n` +
          `${cta}`,
        hashtags: tags.slice(0, 5),
        cta,
      },
    ]),
    instagram: mk([
      {
        text:
          `${topic} ✨\n\n` +
          `Save this.\n\n` +
          `✅ What to do:\n` +
          `1) One strong hook\n` +
          `2) One clear takeaway\n` +
          `3) One action step\n\n` +
          `Comment “🔥” if you want part 2.\n\n` +
          `${cta}`,
        hashtags: tags,
        cta,
      },
    ]),
  };
}

function limitsFor(plan, isTeam) {
  if (plan === "starter" && isTeam)
    return { maxPlatforms: 4, maxSeats: 5, monthlyTopicCredits: 900, dailyPostLimit: 25 };
  if (plan === "pro" && isTeam)
    return { maxPlatforms: 11, maxSeats: 10, monthlyTopicCredits: 2400, dailyPostLimit: 50 };
  if (plan === "starter")
    return { maxPlatforms: 4, maxSeats: 1, monthlyTopicCredits: 300, dailyPostLimit: 10 };
  if (plan === "pro")
    return { maxPlatforms: 11, maxSeats: 1, monthlyTopicCredits: 800, dailyPostLimit: 20 };
  return { maxPlatforms: 0, maxSeats: 1, monthlyTopicCredits: 20, dailyPostLimit: 2 };
}

/* -------------------- UI atoms -------------------- */
function NeonCard({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.08)] " +
        className
      }
    >
      {children}
    </div>
  );
}

function GlowButton({ children, onClick, type = "button", variant = "primary", disabled }) {
  const base =
    "rounded-xl px-5 py-3 font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,0,255,0.25)]"
      : "border border-white/15 bg-white/5 text-white hover:bg-white/10";
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles}`} disabled={disabled}>
      {children}
    </button>
  );
}

function Pill({ children }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
      {children}
    </span>
  );
}

/* -------------------- Main Component -------------------- */
export default function SocialGenie() {
  // Simple hash router: #/ , #/pricing, #/auth/signup, #/app, etc
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Mock DB
  const [dbState, setDbState] = useState(() =>
    ls.get("sg_db", {
      users: {}, // uid -> {email, password, verified, defaultWid}
      workspaces: {}, // wid -> {name, ownerUid, plan, isTeam, limits}
      members: {}, // wid -> {uid -> {role,email}}
      invites: {}, // wid -> [{email, role, status}]
      integrations: {}, // wid -> [{id, provider, meta}]
      topics: {}, // wid -> [{id, topic, brief, createdAt}]
      drafts: {}, // wid -> [{id, topicId, platform, variants, selected}]
      posts: {}, // wid -> [{id, platform, content, scheduledAt, status, approvedBy}]
      audit: {}, // wid -> [{id, action, time, platform, postId}]
      usage: {}, // wid -> {topicsThisMonth, postsTodayDate, postsTodayCount}
    })
  );
  useEffect(() => ls.set("sg_db", dbState), [dbState]);

  // Session
  const [session, setSession] = useState(() => ls.get("sg_session", null)); // {uid}
  useEffect(() => ls.set("sg_session", session), [session]);

  const me = session ? dbState.users[session.uid] : null;
  const wid = me?.defaultWid || null;
  const ws = wid ? dbState.workspaces[wid] : null;
  const myRole = wid ? dbState.members?.[wid]?.[session?.uid]?.role : null;
  const isAdmin = myRole === "owner" || myRole === "admin";

  // Helpers to mutate DB
  const mutate = (fn) =>
    setDbState((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const goto = (path) => (window.location.hash = "#" + path);

  // Simulated scheduler (runs in browser) to mark scheduled posts as posted
  useEffect(() => {
    const t = setInterval(() => {
      if (!wid) return;
      mutate((s) => {
        const posts = s.posts[wid] || [];
        const now = Date.now();
        let changed = false;
        posts.forEach((p) => {
          if (p.status === "scheduled" && p.approvedBy && new Date(p.scheduledAt).getTime() <= now) {
            p.status = "posted";
            changed = true;
            s.audit[wid] = s.audit[wid] || [];
            s.audit[wid].unshift({
              id: id("log"),
              action: "POSTED",
              time: new Date().toISOString(),
              platform: p.platform,
              postId: p.id,
            });
          }
        });
        if (changed) s.posts[wid] = posts;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [wid]);

  // Enforcements
  const enforceAddPlatform = () => {
    if (!wid) return { ok: false, reason: "Workspace not set." };
    const max = ws?.limits?.maxPlatforms ?? 0;
    const current = (dbState.integrations[wid] || []).length;
    if (max <= 0) return { ok: false, reason: "Your plan does not allow platform connections. Upgrade." };
    if (current >= max)
      return { ok: false, reason: `Platform limit reached (${current}/${max}). Upgrade to add more.` };
    return { ok: true, current, max };
  };

  const enforceDailyPosts = () => {
    if (!wid) return { ok: false, reason: "Workspace not set." };
    const lim = ws?.limits?.dailyPostLimit ?? 0;
    if (lim <= 0) return { ok: false, reason: "Daily post limit is 0. Upgrade." };

    const key = `postsToday_${new Date().toISOString().slice(0, 10)}`;
    const used = (dbState.usage?.[wid]?.[key] ?? 0);
    if (used >= lim) return { ok: false, reason: `Daily post limit reached (${used}/${lim}). Upgrade.` };
    return { ok: true, used, lim, key };
  };

  /* -------------------- Pages -------------------- */

  const PageShell = ({ children }) => (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-40 right-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#050514]" />
      </div>
      {children}
    </main>
  );

  const TopNav = () => (
    <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
      <div className="font-bold tracking-tight text-xl cursor-pointer" onClick={() => goto("/")}>
        Social<span className="text-cyan-300">Genie</span>
        <span className="text-white/40 text-sm ml-2">.online</span>
      </div>
      <nav className="flex items-center gap-4 text-white/80">
        <a className="hover:text-white cursor-pointer" onClick={() => goto("/pricing")}>
          Pricing
        </a>
        <a className="hover:text-white cursor-pointer" onClick={() => goto("/demo")}>
          Demo
        </a>
        {me ? (
          <>
            <a className="hover:text-white cursor-pointer" onClick={() => goto("/app")}>
              App
            </a>
            <a
              className="hover:text-white cursor-pointer"
              onClick={() => {
                setSession(null);
                ls.del("sg_session");
                goto("/");
              }}
            >
              Logout
            </a>
          </>
        ) : (
          <>
            <a className="hover:text-white cursor-pointer" onClick={() => goto("/auth/login")}>
              Login
            </a>
            <a
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
              onClick={() => goto("/auth/signup")}
            >
              Start Free
            </a>
          </>
        )}
      </nav>
    </header>
  );

  /* Landing */
  const Landing = () => (
    <PageShell>
      <TopNav />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              1 Topic →{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400">
                11 Platform-Ready
              </span>{" "}
              Posts.
            </h1>
            <p className="mt-5 text-lg text-white/70">
              SocialGenie helps you research, generate, and optimize content for maximum engagement.
              <span className="text-white"> You approve everything</span>, then we schedule + crosspost safely.
            </p>
            <div className="mt-7 flex gap-3">
              <GlowButton onClick={() => goto(me ? "/app" : "/auth/signup")}>Start Free</GlowButton>
              <GlowButton variant="ghost" onClick={() => goto("/demo")}>
                Try Live Demo
              </GlowButton>
            </div>
            <div className="mt-5 text-sm text-white/60">✅ Email verification • ✅ Approval-first posting • ✅ Monthly subscriptions</div>
          </div>

          <NeonCard className="p-6">
            <div className="text-sm text-white/60">Preview</div>
            <div className="mt-2 text-xl font-semibold">“AI Revolution in Indian IT”</div>
            <div className="mt-4 space-y-3 text-sm">
              {["LinkedIn", "X Thread", "Instagram"].map((k) => (
                <div key={k} className="rounded-xl bg-black/40 border border-white/10 p-3">
                  <div className="text-white/70">{k}</div>
                  <div className="mt-1 text-white/85">Hook + story + insight + CTA… (platform-native formatting)</div>
                </div>
              ))}
            </div>
          </NeonCard>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["Research", "Summarize key angles from reliable sources."],
            ["Create", "Generate platform-native variants with hooks & CTAs."],
            ["Approve & Post", "You approve. We schedule and crosspost safely."],
          ].map(([t, d]) => (
            <NeonCard key={t} className="p-6">
              <div className="text-lg font-semibold">{t}</div>
              <div className="mt-2 text-white/70">{d}</div>
            </NeonCard>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-white/60 text-sm">
        © {new Date().getFullYear()} SocialGenie.online
      </footer>
    </PageShell>
  );

  /* Pricing */
  const Pricing = () => {
    const [mode, setMode] = useState("solo");
    const plans = {
      solo: [
        { name: "Free", price: "$0", desc: "Try the engine", tag: "Drafts + exports", cta: "Start Free" },
        { name: "Starter", price: "$24.99", desc: "Up to 4 platforms", tag: "Scheduling + approvals", cta: "Start Starter" },
        { name: "Pro", price: "$49.99", desc: "Up to 11 platforms", tag: "More limits + analytics", cta: "Go Pro" },
      ],
      team: [
        { name: "Starter Team", price: "$74.97", desc: "Up to 4 platforms", tag: "Roles + approvals (3×)", cta: "Start Team" },
        { name: "Pro Team", price: "$149.97", desc: "Up to 11 platforms", tag: "Roles + approvals (3×)", cta: "Start Team" },
        { name: "Enterprise", price: "Custom", desc: "Custom", tag: "SSO + SLA + support", cta: "Talk to Sales" },
      ],
    };
    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">Pricing</h1>
              <p className="text-white/70 mt-2">Team is 3× and includes workspace + roles + approvals.</p>
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                className={`px-4 py-2 rounded-lg ${mode === "solo" ? "bg-white/10" : "text-white/70"}`}
                onClick={() => setMode("solo")}
              >
                Solo
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${mode === "team" ? "bg-white/10" : "text-white/70"}`}
                onClick={() => setMode("team")}
              >
                Team (3×)
              </button>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {plans[mode].map((p) => (
              <NeonCard key={p.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">{p.name}</div>
                  <Pill>{p.tag}</Pill>
                </div>
                <div className="mt-3 text-4xl font-bold">
                  {p.price}
                  {p.price !== "Custom" && <span className="text-base font-medium text-white/60">/mo</span>}
                </div>
                <div className="mt-3 text-white/70">{p.desc}</div>
                <div className="mt-5">
                  <GlowButton onClick={() => goto(me ? "/app/onboarding" : "/auth/signup")}>{p.cta}</GlowButton>
                </div>
              </NeonCard>
            ))}
          </div>
        </div>
      </PageShell>
    );
  };

  /* Demo */
  const Demo = () => {
    const [topic, setTopic] = useState("AI revolution impact on Indian IT sector");
    const [audience, setAudience] = useState("Indian creators & founders");
    const [tone, setTone] = useState("Bold");
    const [goal, setGoal] = useState("Engagement");
    const drafts = useMemo(() => generateDrafts({ topic, audience, tone, goal }), [topic, audience, tone, goal]);

    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-extrabold">Live Demo</h1>
          <p className="text-white/70 mt-2">Type a topic and see instant platform-ready outputs.</p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <NeonCard className="p-6">
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic"
                />
                <input
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Audience"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option>Professional</option>
                    <option>Bold</option>
                    <option>Friendly</option>
                    <option>Funny</option>
                  </select>
                  <select
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option>Engagement</option>
                    <option>Followers</option>
                    <option>Leads</option>
                  </select>
                </div>
                <GlowButton onClick={() => goto(me ? "/app/topic/new" : "/auth/signup")}>Use in App</GlowButton>
              </div>
            </NeonCard>

            <NeonCard className="p-6">
              <div className="text-sm text-white/60">Preview output</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-black/40 border border-white/10 p-3">
                  <div className="text-white/70">Telegram</div>
                  <pre className="mt-2 whitespace-pre-wrap text-white/85">{drafts.telegram[0].text}</pre>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/10 p-3">
                  <div className="text-white/70">LinkedIn</div>
                  <pre className="mt-2 whitespace-pre-wrap text-white/85">{drafts.linkedin[0].text}</pre>
                </div>
              </div>
            </NeonCard>
          </div>
        </div>
      </PageShell>
    );
  };

  /* Auth: Signup/Login/Verify (mock) */
  const Signup = () => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [msg, setMsg] = useState(null);

    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-md px-6 py-10">
          <NeonCard className="p-6">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-white/70 mt-2">Free signup with email verification (preview mode).</p>

            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                placeholder="Password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <GlowButton
                onClick={() => {
                  setMsg(null);
                  if (!email.includes("@")) return setMsg("Enter a valid email");
                  if (pass.length < 6) return setMsg("Password must be at least 6 characters");

                  mutate((s) => {
                    // If invited, auto-accept in onboarding; for preview we keep it simple.
                    const newUid = uid();
                    s.users[newUid] = { email, password: pass, verified: false, defaultWid: null };
                  });
                  setMsg("✅ Account created. Click Verify Email to continue.");
                }}
              >
                Sign up
              </GlowButton>

              <GlowButton variant="ghost" onClick={() => goto("/auth/verify")}>
                Verify Email (Preview)
              </GlowButton>

              {msg && <div className="text-sm text-white/80">{msg}</div>}
              <div className="text-sm text-white/60 mt-4">
                Already have an account?{" "}
                <span className="text-cyan-300 cursor-pointer" onClick={() => goto("/auth/login")}>
                  Login
                </span>
              </div>
            </div>
          </NeonCard>
        </div>
      </PageShell>
    );
  };

  const Login = () => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [msg, setMsg] = useState(null);

    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-md px-6 py-10">
          <NeonCard className="p-6">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-white/70 mt-2">Login to your workspace (preview mode).</p>

            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                placeholder="Password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <GlowButton
                onClick={() => {
                  setMsg(null);
                  const matchUid = Object.keys(dbState.users).find(
                    (u) => dbState.users[u].email === email && dbState.users[u].password === pass
                  );
                  if (!matchUid) return setMsg("Invalid credentials (preview DB).");
                  if (!dbState.users[matchUid].verified)
                    return setMsg("Please verify email first. Go to Verify Email.");

                  setSession({ uid: matchUid });
                  goto("/app/onboarding");
                }}
              >
                Login
              </GlowButton>

              <GlowButton variant="ghost" onClick={() => goto("/auth/verify")}>
                Verify Email
              </GlowButton>

              {msg && <div className="text-sm text-white/80">{msg}</div>}
            </div>
          </NeonCard>
        </div>
      </PageShell>
    );
  };

  const Verify = () => {
    const [msg, setMsg] = useState("Click verify to simulate email verification.");
    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-md px-6 py-10">
          <NeonCard className="p-6">
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-white/70 mt-2">Preview mode: this simulates Firebase email verification.</p>

            <div className="mt-5">
              <GlowButton
                onClick={() => {
                  // verify the latest created user for preview convenience
                  const uids = Object.keys(dbState.users);
                  if (!uids.length) return setMsg("No users found. Signup first.");
                  const latest = uids[uids.length - 1];
                  mutate((s) => {
                    s.users[latest].verified = true;
                  });
                  setMsg("✅ Verified. Now login.");
                }}
              >
                Verify Email (Preview)
              </GlowButton>
              <div className="mt-4 text-sm text-white/80">{msg}</div>
              <div className="mt-4 text-sm text-white/60">
                Go to{" "}
                <span className="text-cyan-300 cursor-pointer" onClick={() => goto("/auth/login")}>
                  Login
                </span>
              </div>
            </div>
          </NeonCard>
        </div>
      </PageShell>
    );
  };

  /* Onboarding */
  const Onboarding = () => {
    const [name, setName] = useState("My SocialGenie Workspace");
    const [isTeam, setIsTeam] = useState(false);
    const [plan, setPlan] = useState("free");
    const [msg, setMsg] = useState(null);

    const limits = useMemo(() => limitsFor(plan, isTeam), [plan, isTeam]);

    if (!me) {
      goto("/auth/login");
      return null;
    }

    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-4xl font-extrabold">Welcome to SocialGenie</h1>
          <p className="text-white/70 mt-2">Create your workspace. Start Free, upgrade anytime.</p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <NeonCard className="p-6">
              <h2 className="text-xl font-semibold">Workspace setup</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm text-white/60">Workspace name</div>
                  <input
                    className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`rounded-xl px-4 py-3 border ${
                      !isTeam ? "border-cyan-400/40 bg-white/10" : "border-white/10 bg-white/5"
                    }`}
                    onClick={() => setIsTeam(false)}
                  >
                    <div className="font-semibold">Solo</div>
                    <div className="text-xs text-white/60 mt-1">1 seat</div>
                  </button>
                  <button
                    className={`rounded-xl px-4 py-3 border ${
                      isTeam ? "border-cyan-400/40 bg-white/10" : "border-white/10 bg-white/5"
                    }`}
                    onClick={() => setIsTeam(true)}
                  >
                    <div className="font-semibold">Team</div>
                    <div className="text-xs text-white/60 mt-1">Roles + approvals</div>
                  </button>
                </div>

                <div>
                  <div className="text-sm text-white/60">Start plan</div>
                  <select
                    className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter {isTeam ? "Team ($74.97)" : "($24.99)"}</option>
                    <option value="pro">Pro {isTeam ? "Team ($149.97)" : "($49.99)"}</option>
                    <option value="ent">Enterprise (Custom)</option>
                  </select>
                </div>

                <GlowButton
                  onClick={() => {
                    setMsg(null);
                    if (!name.trim()) return setMsg("Workspace name required.");
                    const newWid = id("ws");
                    mutate((s) => {
                      s.workspaces[newWid] = { name: name.trim(), ownerUid: session.uid, plan, isTeam, limits };
                      s.members[newWid] = s.members[newWid] || {};
                      s.members[newWid][session.uid] = { role: "owner", email: me.email };

                      // set default workspace
                      s.users[session.uid].defaultWid = newWid;

                      s.integrations[newWid] = [];
                      s.topics[newWid] = [];
                      s.drafts[newWid] = [];
                      s.posts[newWid] = [];
                      s.audit[newWid] = [];
                      s.invites[newWid] = [];
                      s.usage[newWid] = {};
                    });
                    setSession({ uid: session.uid });
                    goto("/app");
                  }}
                >
                  Create Workspace
                </GlowButton>

                {msg && <div className="text-sm text-white/80">{msg}</div>}
              </div>
            </NeonCard>

            <NeonCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">Current Plan</div>
                  <div className="text-xl font-semibold mt-1">
                    {plan.toUpperCase()} {isTeam ? <span className="text-cyan-200">(TEAM)</span> : <span className="text-white/60">(SOLO)</span>}
                  </div>
                </div>
                <Pill>Limits</Pill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Platforms", limits.maxPlatforms],
                  ["Seats", limits.maxSeats],
                  ["Monthly Credits", limits.monthlyTopicCredits],
                  ["Daily Posts", limits.dailyPostLimit],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-white/60">{k}</div>
                    <div className="text-lg font-semibold mt-1">{v}</div>
                  </div>
                ))}
              </div>

              <NeonCard className="p-4 mt-4">
                <div className="text-white/70 text-sm">
                  Next: Connect Telegram → Create Topic → Approve & Schedule
                </div>
              </NeonCard>
            </NeonCard>
          </div>
        </div>
      </PageShell>
    );
  };

  /* App Shell */
  const AppNav = ({ tab, setTab }) => (
    <div className="flex flex-wrap gap-2">
      {[
        ["Dashboard", "dash"],
        ["New Topic", "newTopic"],
        ["Integrations", "integrations"],
        ["Schedule", "schedule"],
        ["Team", "team"],
        ["Admin", "admin"],
        ["Billing", "billing"],
      ].map(([label, key]) => (
        <button
          key={key}
          className={`px-4 py-2 rounded-xl border ${
            tab === key ? "border-cyan-400/40 bg-white/10" : "border-white/10 bg-white/5"
          }`}
          onClick={() => setTab(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const Billing = () => (
    <NeonCard className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Billing</h2>
          <p className="text-white/70 text-sm mt-1">Preview mode: upgrades just change limits locally.</p>
        </div>
        <Pill>Razorpay ready</Pill>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
        <NeonCard className="p-5">
          <div className="font-semibold">Starter {ws?.isTeam ? "Team" : ""}</div>
          <div className="text-white/60 mt-1">{ws?.isTeam ? "$74.97/mo" : "$24.99/mo"}</div>
          <div className="mt-3">
            <GlowButton
              onClick={() =>
                mutate((s) => {
                  s.workspaces[wid].plan = "starter";
                  s.workspaces[wid].limits = limitsFor("starter", s.workspaces[wid].isTeam);
                })
              }
            >
              Upgrade to Starter
            </GlowButton>
          </div>
        </NeonCard>

        <NeonCard className="p-5">
          <div className="font-semibold">Pro {ws?.isTeam ? "Team" : ""}</div>
          <div className="text-white/60 mt-1">{ws?.isTeam ? "$149.97/mo" : "$49.99/mo"}</div>
          <div className="mt-3">
            <GlowButton
              onClick={() =>
                mutate((s) => {
                  s.workspaces[wid].plan = "pro";
                  s.workspaces[wid].limits = limitsFor("pro", s.workspaces[wid].isTeam);
                })
              }
            >
              Upgrade to Pro
            </GlowButton>
          </div>
        </NeonCard>
      </div>
    </NeonCard>
  );

  const Dashboard = () => (
    <div className="grid md:grid-cols-3 gap-4">
      <NeonCard className="p-6 md:col-span-2">
        <h2 className="text-xl font-semibold">Today’s Queue</h2>
        <p className="text-white/70 text-sm mt-1">Telegram posts auto-mark as posted in preview mode.</p>
        <div className="mt-4 space-y-2">
          {(dbState.posts[wid] || []).slice(0, 5).map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-white/80">
                  <b>{p.platform}</b> • {p.status}
                </div>
                <div className="text-white/50">{formatDT(new Date(p.scheduledAt))}</div>
              </div>
              <div className="mt-2 text-white/70">{p.content.slice(0, 160)}{p.content.length>160?"…":""}</div>
            </div>
          ))}
          {!((dbState.posts[wid] || []).length) && (
            <div className="text-white/60 text-sm">No scheduled posts yet. Create a topic and schedule Telegram.</div>
          )}
        </div>
      </NeonCard>

      <NeonCard className="p-6">
        <div className="text-sm text-white/60">Workspace</div>
        <div className="text-lg font-semibold mt-1">{ws?.name}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>{ws?.plan?.toUpperCase()}</Pill>
          <Pill>{ws?.isTeam ? "TEAM" : "SOLO"}</Pill>
          <Pill>Platforms: {ws?.limits?.maxPlatforms}</Pill>
          <Pill>Daily posts: {ws?.limits?.dailyPostLimit}</Pill>
        </div>
        <div className="mt-4">
          <GlowButton variant="ghost" onClick={() => goto("/pricing")}>
            See Pricing
          </GlowButton>
        </div>
      </NeonCard>
    </div>
  );

  const Integrations = () => {
    const [channelId, setChannelId] = useState("@mychannel");
    const [msg, setMsg] = useState(null);

    const list = dbState.integrations[wid] || [];

    return (
      <NeonCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Integrations</h2>
            <p className="text-white/70 text-sm mt-1">
              Plan enforcement enabled. If you hit platform limit, upgrade in Billing.
            </p>
          </div>
          <Pill>Max platforms: {ws?.limits?.maxPlatforms}</Pill>
        </div>

        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <NeonCard className="p-5">
            <h3 className="font-semibold">Connect Telegram</h3>
            <p className="text-white/60 text-sm mt-1">
              Preview mode stores channel ID and enables scheduling.
            </p>
            <input
              className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@yourchannel or -100..."
            />
            <div className="mt-3 flex gap-2">
              <GlowButton
                onClick={() => {
                  setMsg(null);
                  const c = enforceAddPlatform();
                  if (!c.ok) {
                    setMsg(c.reason);
                    return;
                  }
                  mutate((s) => {
                    s.integrations[wid] = s.integrations[wid] || [];
                    s.integrations[wid].push({ id: id("int"), provider: "telegram", meta: { channelId } });
                  });
                  setMsg("✅ Telegram connected.");
                }}
              >
                Connect
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => setMsg("Tip: upgrade to Starter/Pro to unlock more platforms.")}>
                Help
              </GlowButton>
            </div>
            {msg && <div className="mt-3 text-sm text-white/80">{msg}</div>}
          </NeonCard>

          <NeonCard className="p-5">
            <h3 className="font-semibold">Connected</h3>
            <div className="mt-3 space-y-2 text-sm">
              {list.map((x) => (
                <div key={x.id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex justify-between">
                  <div className="text-white/80">
                    <b>{x.provider}</b> <span className="text-white/50">({x.meta?.channelId || ""})</span>
                  </div>
                  <button
                    className="text-white/60 hover:text-white"
                    onClick={() =>
                      mutate((s) => {
                        s.integrations[wid] = (s.integrations[wid] || []).filter((i) => i.id !== x.id);
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!list.length && <div className="text-white/60">No integrations connected yet.</div>}
            </div>
          </NeonCard>
        </div>
      </NeonCard>
    );
  };

  const NewTopic = () => {
    const [topic, setTopic] = useState("AI impact on Indian IT sector");
    const [audience, setAudience] = useState("Indian creators & founders");
    const [tone, setTone] = useState("Bold");
    const [goal, setGoal] = useState("Engagement");
    const [msg, setMsg] = useState(null);

    return (
      <NeonCard className="p-6">
        <h2 className="text-xl font-semibold">New Topic</h2>
        <p className="text-white/70 text-sm mt-1">Generate drafts (Telegram auto-post; others export).</p>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic"
          />
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audience"
          />
          <div className="grid md:grid-cols-2 gap-3">
            <select
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option>Professional</option>
              <option>Bold</option>
              <option>Friendly</option>
              <option>Funny</option>
            </select>
            <select
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              <option>Engagement</option>
              <option>Followers</option>
              <option>Leads</option>
            </select>
          </div>

          <GlowButton
            onClick={() => {
              setMsg(null);
              if (!topic.trim()) return setMsg("Topic required.");
              const topicId = id("topic");
              const drafts = generateDrafts({ topic, audience, tone, goal });

              mutate((s) => {
                s.topics[wid] = s.topics[wid] || [];
                s.drafts[wid] = s.drafts[wid] || [];

                s.topics[wid].unshift({
                  id: topicId,
                  topic,
                  brief: { audience, tone, goal },
                  createdAt: new Date().toISOString(),
                });

                ["telegram", "linkedin", "x", "instagram"].forEach((p) => {
                  s.drafts[wid].unshift({
                    id: id("draft"),
                    topicId,
                    platform: p,
                    variants: drafts[p],
                    selected: 0,
                  });
                });
              });

              ls.set("sg_active_topic", topicId);
              setMsg("✅ Drafts generated. Open Topic Studio below.");
            }}
          >
            Generate Drafts
          </GlowButton>

          {msg && <div className="text-sm text-white/80">{msg}</div>}
        </div>
      </NeonCard>
    );
  };

  const TopicStudio = () => {
    const activeTopicId = ls.get("sg_active_topic", null) || (dbState.topics[wid] || [])[0]?.id;
    const [platform, setPlatform] = useState("telegram");
    const [msg, setMsg] = useState(null);
    const [scheduleAt, setScheduleAt] = useState(toDatetimeLocal(new Date(Date.now() + 10 * 60 * 1000)));

    const topic = (dbState.topics[wid] || []).find((t) => t.id === activeTopicId);
    const drafts = (dbState.drafts[wid] || []).filter((d) => d.topicId === activeTopicId);
    const draft = drafts.find((d) => d.platform === platform);

    const tgIntegration = (dbState.integrations[wid] || []).find((i) => i.provider === "telegram");

    if (!topic) {
      return (
        <NeonCard className="p-6">
          <div className="text-white/70">No topic yet. Create one in “New Topic”.</div>
        </NeonCard>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-4">
        <NeonCard className="p-6 md:col-span-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Topic Studio</h2>
              <p className="text-white/70 text-sm mt-1">{topic.topic}</p>
            </div>
            <Pill>Approval-first</Pill>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["telegram", "linkedin", "x", "instagram"].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 rounded-xl border ${
                  platform === p ? "border-cyan-400/40 bg-white/10" : "border-white/10 bg-white/5"
                }`}
                onClick={() => setPlatform(p)}
              >
                {p.toUpperCase()} {p === "telegram" ? <span className="text-cyan-200 text-xs ml-1">AUTO</span> : <span className="text-white/50 text-xs ml-1">EXPORT</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {!draft ? (
              <div className="text-white/70">Draft loading…</div>
            ) : (
              draft.variants.map((v, idx) => {
                const selected = idx === draft.selected;
                return (
                  <div key={idx} className={`rounded-xl border p-4 bg-black/30 ${selected ? "border-cyan-400/40" : "border-white/10"}`}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="text-sm text-white/60">
                        Variant {idx + 1} • Hook score <span className="text-white">{v.hookScore}</span>
                      </div>
                      <div className="flex gap-2">
                        <GlowButton
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(v.text + "\n\n" + v.hashtags.join(" "));
                            setMsg("Copied ✅");
                          }}
                        >
                          Copy
                        </GlowButton>
                        <GlowButton
                          onClick={() =>
                            mutate((s) => {
                              const dd = (s.drafts[wid] || []).find((x) => x.id === draft.id);
                              if (dd) dd.selected = idx;
                            })
                          }
                        >
                          {selected ? "Selected" : "Select"}
                        </GlowButton>
                      </div>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-white/85 leading-relaxed">{v.text}</pre>
                    <div className="mt-3 text-sm text-white/70">{v.hashtags.join(" ")}</div>
                  </div>
                );
              })
            )}
          </div>
        </NeonCard>

        <NeonCard className="p-6">
          <h3 className="text-lg font-semibold">Actions</h3>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <div>
              Telegram auto-post requires:
              <ul className="list-disc ml-5 mt-2">
                <li>Telegram integration connected</li>
                <li>Selected variant</li>
                <li>Approval (required)</li>
                <li>Within daily limit</li>
              </ul>
            </div>

            <div>
              <div className="text-sm text-white/60">Schedule Telegram at</div>
              <input
                className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </div>

            <GlowButton
              onClick={() => {
                setMsg(null);
                if (platform !== "telegram") return setMsg("Export-only: use Copy for this platform.");
                if (!tgIntegration) return setMsg("Connect Telegram in Integrations first.");
                if (!draft) return setMsg("Draft missing.");

                const limit = enforceDailyPosts();
                if (!limit.ok) return setMsg(limit.reason);

                const v = draft.variants[draft.selected];
                const content = v.text + "\n\n" + v.hashtags.join(" ");
                const when = new Date(scheduleAt);
                if (Number.isNaN(when.getTime())) return setMsg("Invalid schedule time.");

                mutate((s) => {
                  s.posts[wid] = s.posts[wid] || [];
                  s.posts[wid].unshift({
                    id: id("post"),
                    platform: "telegram",
                    content,
                    scheduledAt: when.toISOString(),
                    status: "scheduled",
                    approvedBy: session.uid, // approval-first ✅
                  });

                  // increment daily usage
                  s.usage[wid] = s.usage[wid] || {};
                  s.usage[wid][limit.key] = (s.usage[wid][limit.key] || 0) + 1;

                  // audit
                  s.audit[wid] = s.audit[wid] || [];
                  s.audit[wid].unshift({
                    id: id("log"),
                    action: "SCHEDULED",
                    time: new Date().toISOString(),
                    platform: "telegram",
                    postId: s.posts[wid][0].id,
                  });
                });

                setMsg("✅ Approved & scheduled. It will auto-mark as posted in ~1–2 seconds after time.");
              }}
            >
              Approve & Schedule Telegram
            </GlowButton>

            <GlowButton variant="ghost" onClick={() => goto("/pricing")}>
              Upgrade plan
            </GlowButton>

            {msg && <div className="text-sm text-white/80">{msg}</div>}
          </div>
        </NeonCard>
      </div>
    );
  };

  const Schedule = () => (
    <NeonCard className="p-6">
      <h2 className="text-xl font-semibold">Schedule</h2>
      <p className="text-white/70 text-sm mt-1">Telegram posts list (preview scheduler marks posted).</p>
      <div className="mt-4 space-y-2 text-sm">
        {(dbState.posts[wid] || []).map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-white/80">
                <b>{p.platform}</b> • {p.status}
              </div>
              <div className="text-white/50">{formatDT(new Date(p.scheduledAt))}</div>
            </div>
            <div className="mt-2 text-white/70">{p.content.slice(0, 220)}{p.content.length>220?"…":""}</div>
          </div>
        ))}
        {!((dbState.posts[wid] || []).length) && <div className="text-white/60">No scheduled posts yet.</div>}
      </div>
    </NeonCard>
  );

  const Team = () => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [msg, setMsg] = useState(null);

    const members = Object.entries(dbState.members?.[wid] || {}).map(([uidKey, v]) => ({ uid: uidKey, ...v }));
    const invites = dbState.invites?.[wid] || [];
    const maxSeats = ws?.limits?.maxSeats ?? 1;

    return (
      <NeonCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Team</h2>
            <p className="text-white/70 text-sm mt-1">Seat cap enforced by plan.</p>
          </div>
          <Pill>Seats: {members.length}/{maxSeats}</Pill>
        </div>

        {!ws?.isTeam ? (
          <div className="mt-4 text-sm text-white/70">
            Team features are available on <b>Team plans</b>. Switch to Team in onboarding or upgrade plan.
          </div>
        ) : (
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <NeonCard className="p-5">
              <h3 className="font-semibold">Invite member</h3>
              <p className="text-white/60 text-sm mt-1">Admin/Owner only. Invite link is shown for preview.</p>

              {!isAdmin ? (
                <div className="mt-3 text-sm text-white/60">Only Owner/Admin can invite.</div>
              ) : (
                <>
                  <input
                    className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <select
                    className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="approver">Approver</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="mt-3">
                    <GlowButton
                      onClick={() => {
                        setMsg(null);
                        if (!email.includes("@")) return setMsg("Enter a valid email.");

                        const pending = invites.filter((i) => i.status === "pending").length;
                        if (members.length + pending >= maxSeats) {
                          return setMsg(`Seat limit reached (${members.length + pending}/${maxSeats}). Upgrade.`);
                        }

                        mutate((s) => {
                          s.invites[wid] = s.invites[wid] || [];
                          s.invites[wid].unshift({ id: id("inv"), email: email.toLowerCase(), role, status: "pending" });
                        });

                        setMsg(`✅ Invite created. Send this link: /auth/signup?invite_wid=${wid}`);
                        setEmail("");
                      }}
                    >
                      Create Invite
                    </GlowButton>
                  </div>
                </>
              )}
              {msg && <div className="mt-3 text-sm text-white/80">{msg}</div>}
            </NeonCard>

            <NeonCard className="p-5">
              <h3 className="font-semibold">Members</h3>
              <div className="mt-3 space-y-2 text-sm">
                {members.map((m) => (
                  <div key={m.uid} className="rounded-xl border border-white/10 bg-black/30 p-3 flex justify-between">
                    <div>
                      <div className="text-white/85">{m.email || m.uid}</div>
                      <div className="text-white/50 text-xs">{m.role}</div>
                    </div>
                    <Pill>active</Pill>
                  </div>
                ))}
                {!members.length && <div className="text-white/60">No members.</div>}
              </div>

              <h3 className="font-semibold mt-6">Invites</h3>
              <div className="mt-3 space-y-2 text-sm">
                {invites.map((i) => (
                  <div key={i.id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex justify-between">
                    <div>
                      <div className="text-white/85">{i.email}</div>
                      <div className="text-white/50 text-xs">{i.role} • {i.status}</div>
                    </div>
                  </div>
                ))}
                {!invites.length && <div className="text-white/60">No invites.</div>}
              </div>
            </NeonCard>
          </div>
        )}
      </NeonCard>
    );
  };

  const Admin = () => {
    const logs = dbState.audit[wid] || [];
    if (!isAdmin) {
      return (
        <NeonCard className="p-6">
          <h2 className="text-xl font-semibold">Admin</h2>
          <p className="text-white/70 text-sm mt-2">Access denied. Only Owner/Admin can view this page.</p>
        </NeonCard>
      );
    }
    return (
      <NeonCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Admin Logs</h2>
            <p className="text-white/70 text-sm mt-1">Audit trail (Scheduled / Posted). Preview mode.</p>
          </div>
          <Pill>Role: {myRole}</Pill>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {logs.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex justify-between">
              <div className="text-white/85">
                <b>{l.action}</b> • {l.platform} • postId: {l.postId}
              </div>
              <div className="text-white/50">{formatDT(new Date(l.time))}</div>
            </div>
          ))}
          {!logs.length && <div className="text-white/60">No logs yet. Schedule a Telegram post.</div>}
        </div>
      </NeonCard>
    );
  };

  const App = () => {
    if (!me) {
      goto("/auth/login");
      return null;
    }
    if (!wid || !ws) {
      goto("/app/onboarding");
      return null;
    }

    const [tab, setTab] = useState("dash");

    return (
      <PageShell>
        <TopNav />
        <div className="mx-auto max-w-6xl px-6 pb-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">App</h1>
              <p className="text-white/70 mt-1">
                {ws.name} • {ws.plan.toUpperCase()} {ws.isTeam ? "(TEAM)" : "(SOLO)"} • {me.email}
              </p>
            </div>
            <AppNav tab={tab} setTab={setTab} />
          </div>

          <div className="mt-6 space-y-4">
            {tab === "dash" && <Dashboard />}
            {tab === "newTopic" && (
              <div className="space-y-4">
                <NewTopic />
                <TopicStudio />
              </div>
            )}
            {tab === "integrations" && <Integrations />}
            {tab === "schedule" && <Schedule />}
            {tab === "team" && <Team />}
            {tab === "admin" && <Admin />}
            {tab === "billing" && <Billing />}
          </div>

          <div className="mt-8 text-xs text-white/40">
            Preview build: everything is stored in localStorage (“sg_db”). Replace with Firebase when ready.
          </div>
        </div>
      </PageShell>
    );
  };

  /* Router */
  if (route === "/") return <Landing />;
  if (route === "/pricing") return <Pricing />;
  if (route === "/demo") return <Demo />;
  if (route === "/auth/signup") return <Signup />;
  if (route === "/auth/login") return <Login />;
  if (route === "/auth/verify") return <Verify />;
  if (route === "/app/onboarding") return <Onboarding />;
  if (route === "/app") return <App />;

  // default
  return <Landing />;
}
