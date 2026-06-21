import Link from 'next/link'
import {
  ArrowRight, Calendar, Globe, BarChart2, Mail,
  TrendingUp, CheckCircle2, Check, ChevronDown,
  Zap, BookOpen, Award, Users, Building2, DollarSign,
  Target,
} from 'lucide-react'

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250,249,247,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="mx-auto px-6"
        style={{ maxWidth: 1120, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: 'white',
              boxShadow: '0 4px 14px rgba(232,100,58,0.35)',
            }}
          >
            P
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pathfinder</span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: 'var(--green-subtle)', color: 'var(--green)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: '1px solid var(--green-border)',
            }}
          >
            Beta
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/signin"
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '-0.01em' }}
          >
            Sign in
          </Link>
          <Link
            href="/evaluate"
            className="btn-primary"
            style={{ fontSize: 13.5, padding: '8px 18px', textDecoration: 'none', letterSpacing: '-0.01em' }}
          >
            Get Free Score <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────

function DashboardMockup() {
  const criteria = [
    { name: 'Judging',      score: 82, pct: 82, color: '#16a34a', status: 'Met',     statusBg: 'rgba(22,163,74,0.12)',    statusColor: '#16a34a' },
    { name: 'High Salary',  score: 74, pct: 74, color: '#16a34a', status: 'Met',     statusBg: 'rgba(22,163,74,0.12)',    statusColor: '#16a34a' },
    { name: 'Press',        score: 38, pct: 38, color: '#b45309', status: 'Partial', statusBg: 'rgba(180,83,9,0.12)',     statusColor: '#b45309' },
    { name: 'Publications', score: 31, pct: 31, color: '#b45309', status: 'Partial', statusBg: 'rgba(180,83,9,0.12)',     statusColor: '#b45309' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      {/* Soft glow behind card */}
      <div style={{
        position: 'absolute', inset: -32, borderRadius: 32,
        background: 'radial-gradient(ellipse at 50% 60%, rgba(232,100,58,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div
        style={{
          background: '#1c1a17',
          borderRadius: 20,
          padding: 28,
          transform: 'rotate(1.5deg)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.07)',
          position: 'relative',
        }}
      >
        {/* Card header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            EB-1A Readiness
          </span>
          <span style={{
            background: 'rgba(180,83,9,0.2)', color: '#f59e0b',
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            border: '1px solid rgba(180,83,9,0.3)',
          }}>
            Developing
          </span>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#f59e0b', lineHeight: 1, letterSpacing: '-3px' }}>76</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>/ 100</span>
        </div>

        {/* Criteria rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 20 }}>
          {criteria.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1, minWidth: 90, letterSpacing: '-0.01em' }}>{c.name}</span>
              <div style={{ width: 76, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 999, background: c.color }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.color, minWidth: 22, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.score}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                background: c.statusBg, color: c.statusColor, flexShrink: 0,
              }}>
                {c.status}
              </span>
            </div>
          ))}
        </div>

        {/* Today's action */}
        <div style={{
          background: 'rgba(232,100,58,0.12)', borderRadius: 12, padding: '11px 15px',
          border: '1px solid rgba(232,100,58,0.22)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(232,100,58,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
            Today&apos;s Action
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Apply to judge at DeveloperWeek AI Hackathon →
          </div>
        </div>
      </div>

      {/* Label below */}
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          Your live dashboard, updated daily by AI
        </span>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 96, paddingBottom: 96 }}>
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,100,58,0.08) 0%, transparent 65%)' }}
      />

      <div className="mx-auto px-6" style={{ maxWidth: 1120, position: 'relative' }}>
        <div className="grid gap-16 items-center" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Left column */}
          <div>
            {/* Badge */}
            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 600, padding: '5px 13px', borderRadius: 999,
                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  letterSpacing: '-0.01em',
                }}
              >
                <Zap size={11} />
                AI-Powered EB-1A Case Builder
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(38px, 5vw, 58px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.08,
                letterSpacing: '-2px',
                margin: '0 0 22px',
              }}
            >
              From &ldquo;I think I qualify&rdquo; to{' '}
              <span style={{ color: 'var(--accent)' }}>petition-ready.</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                fontSize: 18,
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: '0 0 36px',
                maxWidth: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Pathfinder is the AI system that evaluates your EB-1A eligibility, discovers live opportunities every day, and tells you exactly what to do next — so you&apos;re building your case while others are still guessing.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Link
                href="/evaluate"
                style={{
                  display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  padding: '15px 28px', fontSize: 16, fontWeight: 700, borderRadius: 12,
                  background: 'var(--accent)', color: 'white',
                  textDecoration: 'none', boxShadow: '0 6px 24px rgba(232,100,58,0.32)',
                  letterSpacing: '-0.02em',
                  transition: 'all 0.15s ease',
                }}
              >
                Get Your Free Readiness Score
                <ArrowRight size={17} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500,
                  paddingLeft: 4, letterSpacing: '-0.01em',
                }}
              >
                <ChevronDown size={14} />
                See how it works
              </a>
            </div>

            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {['Free', '10 minutes', 'No account needed', 'Results emailed'].map(chip => (
                <span
                  key={chip}
                  style={{
                    fontSize: 11.5, color: 'var(--text-muted)', padding: '4px 11px',
                    borderRadius: 999, border: '1px solid var(--border)',
                    background: 'var(--bg-surface)', letterSpacing: '-0.01em',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right column: Dashboard mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '10', label: 'EB-1A criteria tracked' },
    { value: 'Daily', label: 'AI action plans generated' },
    { value: 'Worldwide', label: 'opportunity scanning' },
    { value: 'USCIS', label: 'precedent-informed scoring' },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '22px 0',
      }}
    >
      <div
        className="mx-auto px-6"
        style={{
          maxWidth: 1120,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
              padding: '0 20px',
            }}
          >
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em' }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '-0.01em' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Problem Section ──────────────────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    {
      color: '#f59e0b',
      title: 'No clear roadmap',
      body: 'Most candidates don\'t know which of their 10 criteria are met, partially met, or missing. They file with hope instead of strategy.',
    },
    {
      color: '#22d3ee',
      title: 'Opportunities are invisible',
      body: 'Judging gigs, conference CFPs, peer review invitations, and press opportunities exist. They\'re scattered across dozens of sites with no time to search daily.',
    },
    {
      color: '#60a5fa',
      title: 'Evidence strength is unknown',
      body: 'You might have strong evidence. Or you might file with evidence that triggers an RFE or denial. Without USCIS precedent knowledge, it\'s impossible to know the difference.',
    },
    {
      color: '#c084fc',
      title: 'Expert witnesses fall through',
      body: 'Recommendation letters from recognized experts are critical. But managing 5–10 relationships, follow-ups, and drafts while working full-time is chaos.',
    },
    {
      color: '#f87171',
      title: 'Attorneys step in too late',
      body: 'Most immigration attorneys engage 2–3 months before filing, when it\'s too late to fix weak criteria. The filing window closes on credentials you haven\'t built yet.',
    },
    {
      color: '#4ade80',
      title: 'Every month of delay costs you',
      body: 'Each month without a clear action plan is a month of evidence not gathered, opportunities not taken, and experts not contacted. The clock on your visa doesn\'t stop.',
    },
  ]

  return (
    <section style={{ background: '#1c1a17', padding: '96px 0' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              color: '#f2ede8',
              letterSpacing: '-1px',
              margin: '0 0 14px',
              lineHeight: 1.1,
            }}
          >
            EB-1A is hard. Here&apos;s why most people fail.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(242,237,232,0.45)', margin: 0, maxWidth: 520, marginInline: 'auto', lineHeight: 1.7, letterSpacing: '-0.01em' }}>
            These aren&apos;t rare edge cases. They&apos;re the default experience for every EB-1A candidate without a system.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
            marginBottom: 56,
          }}
        >
          {problems.map(p => (
            <div
              key={p.title}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${p.color}20`,
                borderRadius: 16,
                padding: '22px 24px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: p.color, flexShrink: 0,
                    boxShadow: `0 0 12px ${p.color}66`,
                  }}
                />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(242,237,232,0.9)', margin: 0, letterSpacing: '-0.02em' }}>
                  {p.title}
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(242,237,232,0.42)', margin: 0, lineHeight: 1.75, paddingLeft: 20, letterSpacing: '-0.01em' }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'rgba(242,237,232,0.45)', marginBottom: 18, letterSpacing: '-0.01em' }}>
            Pathfinder was built to solve every one of these problems — starting with a free 10-minute evaluation.
          </p>
          <Link
            href="/evaluate"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'white', color: '#1c1a17',
              padding: '13px 26px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              letterSpacing: '-0.02em',
            }}
          >
            Get my free score <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Free Evaluator Hook ──────────────────────────────────────────────────────

function EvaluatorHook() {
  const bullets = [
    'EB-1A Readiness Score (0–100): honest assessment, never inflated',
    'Criteria breakdown: Met / Partial / Not Met across all 10 USCIS criteria',
    'Your top 3 gaps and exactly what actions will close them fastest',
    'Month-by-month personalized roadmap with real venue names for your field',
  ]

  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-page)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: 18,
            padding: '48px 52px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="grid gap-12 items-center" style={{ gridTemplateColumns: '1fr auto' }}>
            <div>
              {/* Label */}
              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: 'var(--accent)',
                    background: 'var(--accent-subtle)', padding: '5px 12px', borderRadius: 999,
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  Free · No Signup · 10 Minutes
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  fontWeight: 800, color: 'var(--text-primary)',
                  letterSpacing: '-1px', margin: '0 0 14px', lineHeight: 1.15,
                }}
              >
                Start here: know exactly where you stand.
              </h2>
              <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.75, maxWidth: 560, letterSpacing: '-0.01em' }}>
                Most candidates spend months wondering if they qualify. The free EB-1A Profile Evaluator tells you in 10 minutes — an honest score, full criteria breakdown, and a personalized roadmap before you spend a dollar.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {bullets.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--green-subtle)', border: '1px solid var(--green-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}
                    >
                      <Check size={10} style={{ color: 'var(--green)' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, letterSpacing: '-0.01em' }}>{b}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <Link
                  href="/evaluate"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 28px', fontSize: 15, fontWeight: 700,
                    borderRadius: 12, textDecoration: 'none',
                    background: 'var(--accent)', color: 'white',
                    boxShadow: '0 6px 20px rgba(232,100,58,0.28)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Start Free Evaluation <ArrowRight size={16} />
                </Link>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                  Results emailed · No account required
                </span>
              </div>
            </div>

            {/* Right side preview card */}
            <div className="hidden lg:block" style={{ width: 190 }}>
              <div
                style={{
                  background: 'var(--bg-raised)', borderRadius: 14,
                  padding: 18, border: '1px solid var(--border)', textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  You&apos;ll receive
                </div>
                {[
                  { label: 'Readiness Score', color: 'var(--accent)' },
                  { label: 'Criteria Breakdown', color: 'var(--green)' },
                  { label: 'Gap Analysis', color: 'var(--amber)' },
                  { label: 'Monthly Roadmap', color: 'var(--blue)' },
                ].map((item, i, arr) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                  + Emailed to you
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Platform Features ────────────────────────────────────────────────────────

function PlatformFeatures() {
  const features = [
    {
      icon: <Calendar size={20} />,
      color: 'var(--accent)',
      colorBg: 'var(--accent-subtle)',
      title: '3 actions, every morning',
      headline: 'Daily AI Action Plans',
      body: 'Every day at 7am, AI generates your top 3 prioritized actions, ranked by what closes your weakest criteria fastest. No more wondering what to work on.',
    },
    {
      icon: <Globe size={20} />,
      color: 'var(--c-press)',
      colorBg: 'rgba(14,116,144,0.08)',
      title: 'Live opportunities in your field',
      headline: 'Worldwide Opportunity Discovery',
      body: 'AI agents scan daily for judging slots, conference CFPs, peer review requests, speaking invitations, and press opportunities — filtered by your exact domain.',
    },
    {
      icon: <BarChart2 size={20} />,
      color: 'var(--c-scholarly)',
      colorBg: 'rgba(37,99,235,0.08)',
      title: 'Know what\'s strong before your attorney does',
      headline: 'USCIS Precedent-Informed Scoring',
      body: 'Every evidence item scored 0–100 against real AAO decisions and USCIS standards. Know which evidence is filing-ready, which needs work, and which will trigger an RFE.',
    },
    {
      icon: <Mail size={20} />,
      color: 'var(--c-high_salary)',
      colorBg: 'rgba(22,163,74,0.08)',
      title: 'Never drop the ball with expert witnesses',
      headline: 'Recommendation Letter Tracker',
      body: 'Track every expert witness relationship: request sent, replied, committed, draft received, final submitted. Pathfinder follows up so your letters don\'t fall through.',
    },
    {
      icon: <TrendingUp size={20} />,
      color: 'var(--c-memberships)',
      colorBg: 'rgba(124,58,237,0.08)',
      title: 'Your case gets smarter every week',
      headline: 'Weekly AI Strategy Review',
      body: 'Each week, AI reviews your outcomes, completion rate, and evidence trajectory — and adjusts your opportunity priorities and action plan accordingly.',
    },
    {
      icon: <CheckCircle2 size={20} />,
      color: 'var(--c-awards)',
      colorBg: 'rgba(180,83,9,0.08)',
      title: 'Know the moment you\'re ready to file',
      headline: 'Filing Readiness Tracker',
      body: 'Watch your readiness score grow as evidence accumulates and criteria strengthen. Pathfinder tells you when you\'re petition-ready, before you spend a dollar on attorney fees.',
    },
  ]

  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-raised)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-1px', margin: '0 0 14px', lineHeight: 1.1,
            }}
          >
            The daily system that builds your case
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0, maxWidth: 480, marginInline: 'auto', lineHeight: 1.7, letterSpacing: '-0.01em' }}>
            After your free evaluation, Pathfinder becomes your AI-powered case-building partner — active every day until you file.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {features.map(f => (
            <div
              key={f.headline}
              className="card"
              style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: f.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color,
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {f.icon}
              </div>

              {/* Title */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: f.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  {f.headline}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.35, letterSpacing: '-0.02em' }}>
                  {f.title}
                </h3>
              </div>

              {/* Body */}
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.75, letterSpacing: '-0.01em' }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const phases = [
    {
      number: '01',
      label: 'Evaluate',
      badge: 'Free, no account',
      title: 'Know your starting point',
      body: 'Complete the free 10-minute profile assessment. AI evaluates your career against all 10 USCIS EB-1A criteria and returns an honest readiness score, a full criteria breakdown, and a personalized month-by-month roadmap. No account needed.',
      cta: 'Start free evaluation →',
      href: '/evaluate',
    },
    {
      number: '02',
      label: 'Build',
      badge: 'Pathfinder Platform',
      title: 'Take daily action with AI guidance',
      body: 'Every morning, AI agents surface live opportunities in your field and generate 3 concrete, prioritized actions. Track evidence. Score it against USCIS standards. Manage expert witnesses. Watch your readiness score grow week over week.',
      cta: 'Create an account →',
      href: '/signup',
    },
    {
      number: '03',
      label: 'File',
      badge: 'With confidence',
      title: 'Arrive at your attorney ready',
      body: 'When your score reaches filing strength, you have organized evidence, committed recommenders, and a documented track record. Your attorney files a petition built on substance, not guesswork.',
      cta: null,
      href: null,
    },
  ]

  return (
    <section id="how-it-works" style={{ padding: '96px 0', background: 'var(--bg-page)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-1px', margin: '0 0 10px', lineHeight: 1.1,
            }}
          >
            Three phases. One destination.
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
            From first evaluation to petition filing. Pathfinder is with you at every step.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {phases.map((p, i) => (
            <div key={p.number} style={{ position: 'relative' }}>
              <div className="card" style={{ padding: '32px 28px', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      fontSize: 32, fontWeight: 800, color: 'var(--accent)',
                      letterSpacing: '-2px', lineHeight: 1,
                    }}
                  >
                    {p.number}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', letterSpacing: '-0.01em' }}>
                      Phase {i + 1}: {p.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)',
                        background: 'var(--bg-raised)', padding: '2px 9px', borderRadius: 999,
                        border: '1px solid var(--border)', display: 'inline-block', marginTop: 4,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {p.badge}
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.03em' }}>
                  {p.title}
                </h3>

                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.75, flex: 1, letterSpacing: '-0.01em' }}>
                  {p.body}
                </p>

                {p.cta && p.href && (
                  <Link
                    href={p.href}
                    style={{
                      fontSize: 13.5, fontWeight: 600, color: 'var(--accent)',
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {p.cta} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Who It's For ─────────────────────────────────────────────────────────────

function WhoItIsFor() {
  const personas = [
    { emoji: '🧠', title: 'AI / ML Engineers', sub: 'Staff+ engineers building models, inference systems, or research at scale' },
    { emoji: '📊', title: 'Data Scientists', sub: 'Published authors, conference speakers, or citation-strong researchers' },
    { emoji: '🚀', title: 'Technical Product Managers', sub: 'Leading AI or data products with measurable market impact' },
    { emoji: '🔬', title: 'Research Scientists', sub: 'Published in top venues, serving as peer reviewers or conference panelists' },
    { emoji: '🏗️', title: 'Engineering Leaders', sub: 'Staff, principal, or director-level engineers driving major initiatives' },
  ]

  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-raised)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-1px', margin: '0 0 14px', lineHeight: 1.1,
            }}
          >
            Built for exceptional tech professionals
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: 0, maxWidth: 420, marginInline: 'auto', letterSpacing: '-0.01em' }}>
            If any of these describe you, Pathfinder was designed for your journey.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {personas.map(p => (
            <div
              key={p.title}
              className="card"
              style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <span style={{ fontSize: 28 }}>{p.emoji}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{p.title}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65, letterSpacing: '-0.01em' }}>{p.sub}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
          Currently on H-1B, L-1, F-1 OPT, O-1A, or TN status and planning your permanent residency path.
        </p>
      </div>
    </section>
  )
}

// ─── 10 Criteria ─────────────────────────────────────────────────────────────

function TenCriteria() {
  const criteria = [
    { id: 'awards',               color: 'var(--c-awards)',        label: 'Awards',                title: 'National or international prizes for excellence in the field' },
    { id: 'memberships',          color: 'var(--c-memberships)',   label: 'Memberships',           title: 'Associations requiring outstanding achievement, judged by recognized experts' },
    { id: 'press',                color: 'var(--c-press)',         label: 'Press',                 title: 'Published material about you in major media or trade publications' },
    { id: 'judging',              color: 'var(--c-judging)',       label: 'Judging',               title: 'Evaluating others\' work: peer review, competition panels, editorial boards' },
    { id: 'original_contributions', color: 'var(--c-contributions)', label: 'Original Contributions', title: 'Work of major significance adopted or cited by the field' },
    { id: 'scholarly_articles',   color: 'var(--c-scholarly)',     label: 'Scholarly Articles',    title: 'Authorship in peer-reviewed journals or major professional media' },
    { id: 'artistic_exhibitions', color: 'var(--c-exhibitions)',   label: 'Artistic Exhibitions',  title: 'Display of work at recognized exhibitions or industry showcases' },
    { id: 'critical_role',        color: 'var(--c-critical_role)', label: 'Critical Role',         title: 'Leading or critical role in organizations with distinguished reputations' },
    { id: 'high_salary',          color: 'var(--c-high_salary)',   label: 'High Salary',           title: 'Remuneration substantially above peers in your field and geography' },
    { id: 'commercial_success',   color: 'var(--c-commercial)',    label: 'Commercial Success',    title: 'Product adoption, revenue impact, or open-source usage at scale' },
  ]

  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-page)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-1px', margin: '0 0 14px', lineHeight: 1.1,
            }}
          >
            We track all 10 USCIS EB-1A criteria
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: 0, maxWidth: 580, marginInline: 'auto', lineHeight: 1.75, letterSpacing: '-0.01em' }}>
            USCIS requires strong evidence for at least 3 of the 10 criteria, plus a &ldquo;totality of evidence&rdquo; showing sustained national or international acclaim. Pathfinder scores your strength across all of them.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
          {criteria.map(c => (
            <div
              key={c.id}
              className="card"
              style={{
                padding: '16px 18px',
                display: 'flex', alignItems: 'flex-start', gap: 13,
                borderLeft: `3px solid ${c.color}`,
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '-0.02em' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '-0.01em' }}>
                  {c.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <section style={{ position: 'relative', padding: '112px 0', background: '#1c1a17', overflow: 'hidden' }}>
      {/* Warm glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(232,100,58,0.14) 0%, transparent 70%)' }}
      />

      <div className="mx-auto px-6" style={{ maxWidth: 720, textAlign: 'center', position: 'relative' }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 4.5vw, 50px)',
            fontWeight: 800, color: '#f2ede8',
            letterSpacing: '-1.5px', lineHeight: 1.12, margin: '0 0 18px',
          }}
        >
          Your EB-1A path starts with knowing where you stand.
        </h2>
        <p
          style={{
            fontSize: 17, color: 'rgba(242,237,232,0.5)',
            margin: '0 0 44px', lineHeight: 1.75, maxWidth: 500, marginInline: 'auto',
            letterSpacing: '-0.02em',
          }}
        >
          Take the free 10-minute evaluation. Get your score, criteria breakdown, and month-by-month roadmap — no account required. Join the platform when you&apos;re ready to build.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
          <Link
            href="/evaluate"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'white', color: '#1c1a17',
              padding: '16px 32px', borderRadius: 14,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              letterSpacing: '-0.03em',
            }}
          >
            Get Your Free Score <ArrowRight size={17} />
          </Link>
          <Link
            href="/signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: '#f2ede8',
              padding: '16px 32px', borderRadius: 14,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
              border: '1px solid rgba(242,237,232,0.2)',
              letterSpacing: '-0.02em',
            }}
          >
            Create an account
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {['Free evaluator', 'No credit card', 'Results emailed', '10 minutes'].map(chip => (
            <span
              key={chip}
              style={{
                fontSize: 12, color: 'rgba(242,237,232,0.38)',
                padding: '4px 13px', borderRadius: 999,
                border: '1px solid rgba(242,237,232,0.1)',
                letterSpacing: '-0.01em',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#1c1a17', borderTop: '1px solid rgba(242,237,232,0.06)', padding: '32px 0' }}>
      <div
        className="mx-auto px-6"
        style={{ maxWidth: 1120, display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'white',
              }}
            >
              P
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(242,237,232,0.7)', letterSpacing: '-0.02em' }}>Pathfinder</span>
            <span style={{ fontSize: 12, color: 'rgba(242,237,232,0.28)', letterSpacing: '-0.01em' }}>· EB-1A Case Builder</span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Free Evaluator', href: '/evaluate' },
              { label: 'Sign In', href: '/signin' },
              { label: 'Sign Up', href: '/signup' },
            ].map(l => (
              <Link
                key={l.label}
                href={l.href}
                style={{ fontSize: 13.5, color: 'rgba(242,237,232,0.38)', textDecoration: 'none', fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: 'rgba(242,237,232,0.22)', margin: 0, lineHeight: 1.75, maxWidth: 720, letterSpacing: '-0.01em' }}>
          Pathfinder is a strategic planning tool, not a law firm. It does not provide legal advice and does not create an attorney-client relationship. EB-1A petitions involve complex legal standards determined solely by USCIS. Always consult a qualified immigration attorney before filing any petition. © 2026 Pathfinder.
        </p>
      </div>
    </footer>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <Hero />
      <StatsBar />
      <ProblemSection />
      <EvaluatorHook />
      <PlatformFeatures />
      <HowItWorks />
      <WhoItIsFor />
      <TenCriteria />
      <BottomCTA />
      <Footer />
    </div>
  )
}
