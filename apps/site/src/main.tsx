import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const modules = [
  ["Projects", "Live delivery context", "01", "⌂", "CONNECTED"],
  ["Finance", "Connected financial truth", "02", "◒", "GOVERNED"],
  ["Documents", "Knowledge in motion", "03", "▤", "TRACEABLE"],
  ["People", "Roles, decisions, authority", "04", "◉", "ALIGNED"],
  ["Analytics", "Signals made actionable", "05", "⌁", "EXPLAINED"],
  ["Automation", "Controlled intelligent workflows", "06", "✦", "ORCHESTRATED"],
];

const buildingCapabilities = [
  ["Project Management", "Built", "built"],
  ["Room Scanner", "Built", "built"],
  ["Work Scope", "Built", "built"],
  ["Technology & Engineering Norms", "Built", "built"],
  ["AI Cost Estimation", "Being developed", "development"],
  ["Materials", "Platform architecture", "development"],
  ["Procurement", "Planned capability", "planned"],
  ["Budget Control", "Planned capability", "planned"],
  ["Client Collaboration", "Planned capability", "planned"],
  ["Risk Intelligence", "Planned capability", "planned"],
];

const agents = [
  ["Legal AI", "Contracts & Compliance", "legal", "Architecture", ["Contract analysis", "Claims & disputes", "Risk & compliance", "Legal alerts"]],
  ["Finance AI", "Budget & Cash Flow", "finance", "In Development", ["Budget control", "Cash flow", "Cost tracking", "Financial reporting"]],
  ["Estimator AI", "Costs & Takeoff", "estimator", "In Development", ["Quantity takeoff", "Cost estimation", "BOQ preparation", "Margin control"]],
  ["Project AI", "Schedule & Progress", "project", "Architecture", ["Project planning", "Progress tracking", "Schedule control", "Issue management"]],
  ["Procurement AI", "Materials & Suppliers", "procurement", "Planned", ["Material planning", "Supplier coordination", "Purchase control", "Delivery tracking"]],
  ["Risk AI", "Risks & Delays", "risk", "Planned", ["Risk identification", "Delay analysis", "Impact assessment", "Evidence-linked reporting"]],
  ["Document AI", "OCR & Evidence", "document", "In Development", ["OCR & data capture", "Document classification", "Search", "Evidence linking"]],
  ["Analytics AI", "Signals & Insights", "analytics", "Planned", ["KPI monitoring", "Trend detection", "Forecasting", "Capacity analysis"]],
] as const;
const decisionChain = [
  ["Reality", "◉"], ["Scanner", "⌗"], ["Work Scope", "▦"], ["Technology", "✣"], ["Engineering Norms", "◇"],
  ["Materials", "⬡"], ["Pricing", "◒"], ["Estimate", "▤"], ["Execution", "↗"], ["Analytics", "⌁"],
];
const roles = [
  ["Owner / Director", "Portfolio truth, financial control and decisions that need authority.", "Strategic view", ["Portfolio", "Finance", "Analytics", "Decisions", "Growth"]],
  ["Foreman / Manager", "Scope, progress, evidence and the next operational action on site.", "Operational view", ["Projects", "Team", "Progress", "Problems"]],
  ["Worker", "Clear assignments, verified context and less administrative noise.", "Action view", ["Tasks", "Reports", "Photos", "Voice"]],
  ["Client", "Transparent progress, documents and approvals in one shared context.", "Collaboration view", ["Progress", "Photos", "Documents", "Approvals"]],
] as const;

const roadmap = [
  ["Foundation", "Built", "built"],
  ["Construction Intelligence", "In Development", "development"],
  ["AI Orchestration", "In Development", "development"],
  ["Commercial Platform", "Planned", "planned"],
  ["International Expansion", "Planned", "planned"],
  ["Business OS", "Planned", "planned"],
];

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="OMNIRO home">
      <span className="brand-orbit" aria-hidden="true" />
      <span>OMNIR<span className="brand-o">O</span></span>
      {!compact && <small>Intelligent systems</small>}
    </a>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Pill({ children, tone = "violet" }: { children: ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Avatar({ kind, label, avatarUrl, showBadge = true }: { kind: string; label: string; avatarUrl?: string; showBadge?: boolean }) {
  return <div className={`ai-avatar avatar-${kind}`} role="img" aria-label={`${label} portrait`}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <><span className="avatar-head" /><span className="avatar-body" /></>}{showBadge && <i className="avatar-badge">AI</i>}</div>;
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="section-intro reveal">
      <p className="eyebrow"><span />{eyebrow}</p>
      <h2>{title}</h2>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}

function SystemVisual({ className = "" }: { className?: string }) {
  const nodes = [
    ["Projects", "node-projects"], ["Finance", "node-finance"], ["Documents", "node-documents"],
    ["Building", "node-building"], ["Analytics", "node-analytics"], ["AI Agents", "node-agents"],
  ];
  return (
    <div className={`system-visual ${className}`} aria-label="OMNIRO system connecting projects, finance, documents, building, analytics and AI agents">
      <div className="visual-grid" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="core">
        <span className="core-halo" aria-hidden="true" />
        <span className="core-mark">O</span>
        <strong>OMNIRO</strong>
        <small>AI CORE</small>
      </div>
      {nodes.map(([label, placement], index) => (
        <div className={`system-node ${placement}`} key={label} style={{ "--delay": `${index * -0.7}s` } as React.CSSProperties}>
          <span className="node-signal" aria-hidden="true" />
          <small>0{index + 1}</small>
          <strong>{label}</strong>
        </div>
      ))}
      <div className="data-pulse pulse-a" aria-hidden="true" />
      <div className="data-pulse pulse-b" aria-hidden="true" />
      <div className="data-pulse pulse-c" aria-hidden="true" />
      <div className="hero-agents" aria-label="Specialized AI agent ecosystem">
        {agents.slice(0, 4).map(([name,,kind]) => <div className="hero-agent" key={name}><Avatar kind={kind} label={name} avatarUrl={`/agents/${kind}-ai.webp`} /><span><strong>{name}</strong><small>Specialized intelligence</small></span></div>)}
      </div>
      <div className="hero-control-panels" aria-label="Command center presentation states"><span><small>PROJECTS</small><strong>Connected</strong></span><span><small>FINANCIAL CONTROL</small><strong>Governed</strong></span><span><small>RISK SIGNALS</small><strong>Evidence-linked</strong></span></div>
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["Platform", "#platform"], ["OMNIRO Building", "#building"], ["Technology", "#technology"],
    ["Investors", "#investors"], ["Roadmap", "#roadmap"], ["Contact", "#contact"],
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Mark compact />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <label className="language"><span className="sr-only">Language</span><select defaultValue="EN" aria-label="Language"><option>EN</option><option>PL</option><option>NL</option><option>RU</option></select></label>
          <a className="button button-small button-primary" href="#platform">Explore OMNIRO <Arrow /></a>
        </div>
        <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
          <button type="button" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)}><span /><span /></button>
          {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation">
            {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
            <div className="mobile-languages" aria-label="Languages">EN <span>/</span> PL <span>/</span> NL <span>/</span> RU</div>
          </nav>}
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#content">Skip to content</a>
      <Header />
      <main id="content">
        <section className="hero section" aria-labelledby="hero-title">
          <div className="hero-ambient ambient-one" aria-hidden="true" />
          <div className="hero-ambient ambient-two" aria-hidden="true" />
          <div className="section-grid hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow"><span />AI BUSINESS OPERATING SYSTEM</p>
              <h1 id="hero-title">The Operating System for the <em>AI-Powered Business</em></h1>
              <p className="hero-lead">OMNIRO connects projects, people, finance, documents, construction data and artificial intelligence into one intelligent operating system.</p>
              <div className="button-row">
                <a className="button button-primary" href="#platform">Explore the Platform <Arrow /></a>
                <a className="button button-ghost" href="#investors">Investor Relations</a>
              </div>
              <div className="hero-proof" aria-label="Platform principles">
                <span><i className="status-dot" />Operational foundation</span>
                <span>Human authority</span>
                <span>European vision</span>
              </div>
            </div>
            <SystemVisual className="hero-system" />
          </div>
          <div className="scroll-cue" aria-hidden="true"><span />Discover the system</div>
        </section>

        <section className="problem section" aria-labelledby="problem-title">
          <div className="section-grid split-grid">
            <div>
              <SectionIntro eyebrow="THE PROBLEM" title="Business is fragmented. Intelligence should not be." />
              <p className="section-copy wide">Critical work is scattered across tools, inboxes, spreadsheets and individual memory. Context disappears between departments. Decisions arrive late.</p>
            </div>
            <div className="fragment-map reveal" aria-label="Fragmented business information converging into OMNIRO">
              {['Projects','Spreadsheets','Documents','Messages','Finance','Workers','Clients','Suppliers'].map((item, i) => <span key={item} style={{ "--i": i } as React.CSSProperties}>{item}</span>)}
              <div className="fragment-center"><strong>OMNIRO</strong><small>CONNECTED TRUTH</small></div>
            </div>
          </div>
        </section>

        <section id="platform" className="platform section" aria-labelledby="platform-title">
          <div className="section-grid">
            <SectionIntro eyebrow="THE PLATFORM" title="One company. One source of truth. One intelligent system." copy="A shared operational layer where every module understands the same business context." />
            <div className="module-grid">
              {modules.map(([title, copy, number, icon, signal]) => (
                <article className="module-card reveal" key={title} tabIndex={0}>
                  <div className="module-top"><span>{number}</span><i aria-hidden="true" /></div>
                  <div className="module-icon" aria-hidden="true">{icon}</div>
                  <h3>{title}</h3><p>{copy}</p>
                  <div className="module-data"><span>{signal}</span><i><b /></i></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="building" className="building section" aria-labelledby="building-title">
          <div className="section-grid building-grid">
            <div className="building-copy">
              <SectionIntro eyebrow="OMNIRO BUILDING" title="Built in construction. Designed for business." copy="Our first operational vertical turns real project evidence into governed, explainable decisions — while the wider platform continues to evolve." />
              <div className="building-stats">
                <div><strong>01</strong><span>Operational vertical</span></div>
                <div><strong>REAL</strong><span>Connected foundations</span></div>
                <div><strong>EU</strong><span>Market focus</span></div>
              </div>
            </div>
            <div className="capability-panel glass-panel reveal">
              <div className="panel-head"><div><small>CAPABILITY MAP</small><strong>Construction Intelligence</strong></div><Pill tone="cyan">ACTIVE FOUNDATION</Pill></div>
              <div className="capability-list">
                {buildingCapabilities.map(([title, status, kind], index) => (
                  <div className="capability-row" key={title}>
                    <span className="cap-index">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{title}</strong>
                    <span className={`cap-status ${kind}`}>{status}</span>
                  </div>
                ))}
              </div>
              <div className="foundation-flow" aria-label="Built operational foundation"><span>Scanner</span><i>→</i><span>Work Scope</span><i>→</i><span>Technology</span><i>→</i><span>Engineering Norms</span></div>
            </div>
          </div>
        </section>

        <section id="technology" className="command section" aria-labelledby="command-title">
          <div className="section-grid">
            <SectionIntro eyebrow="AI COMMAND CENTER" title="Intelligence coordinated, not fragmented." copy="A governed orchestration layer designed to coordinate specialized intelligence around real business state — never to invent authority." />
            <div className="command-map glass-panel reveal" aria-label="Presentation preview of specialized AI agents coordinated by OMNIRO Core">
              <div className="command-toolbar"><div><span className="live-indicator" />AI COMMAND CENTER <small>CONCEPT PREVIEW</small></div><span>System architecture online</span></div>
              <div className="command-grid" aria-hidden="true" />
              <div className="command-core"><span className="command-ring" /><b>O</b><strong>OMNIRO CORE</strong><small>COORDINATION LAYER</small></div>
              {agents.slice(0,6).map(([name, functionText, kind], index) => (
                <div className={`agent agent-${index + 1}`} key={name} style={{ "--agent-index": index } as React.CSSProperties}>
                  <Avatar kind={kind} label={name} avatarUrl={`/agents/${kind}-ai.webp`} /><span><strong>{name}</strong><small>{functionText}</small></span>
                </div>
              ))}
              <div className="ops-panel ops-projects"><small>ACTIVE PROJECTS</small><strong>Connected context</strong><span><i style={{width:'72%'}} /></span></div>
              <div className="ops-panel ops-finance"><small>FINANCIAL CONTROL</small><strong>Governed inputs</strong><span><i style={{width:'58%'}} /></span></div>
              <div className="ops-panel ops-insights"><small>AI INSIGHTS</small><strong>Evidence-linked</strong><em>Concept state</em></div>
              <div className="ops-panel ops-deadlines"><small>UPCOMING DEADLINES</small><strong>Authority aware</strong><em>No live data</em></div>
              <div className="ops-panel ops-risk"><small>RISKS & DELAYS</small><strong>Review required</strong><em>Presentation UI</em></div>
              <div className="ops-panel ops-health"><small>SYSTEM HEALTH</small><strong>Architecture online</strong><em>● Modules connected</em></div>
              <p className="concept-label"><span />PRESENTATION UI · NO LIVE COMPANY DATA</p>
            </div>
            <div className="agents-heading"><div><p className="eyebrow"><span />OMNIRO AI AGENTS</p><h3>Specialized intelligence. One coordinated system.</h3></div><Pill tone="violet">CONCEPT ARCHITECTURE</Pill></div>
            <div className="agent-ecosystem reveal" aria-label="OMNIRO AI Agents ecosystem">
              {agents.map(([name, functionText, kind, status, capabilities]) => <article className={`agent-card accent-${kind}`} key={name} tabIndex={0}><div className="agent-portrait"><Avatar kind={kind} label={name} avatarUrl={`/agents/${kind}-ai.webp`} /><span className="agent-status">{status}</span></div><div className="agent-card-content"><span className="agent-role">SPECIALIZED AGENT</span><h3>{name}</h3><p>{functionText}</p><ul>{capabilities.map(capability=><li key={capability}>{capability}</li>)}</ul></div></article>)}
            </div>
          </div>
        </section>

        <section className="decision section" aria-labelledby="decision-title">
          <div className="section-grid">
            <SectionIntro eyebrow="FROM REALITY TO DECISION" title="One continuous intelligence chain." copy="Every decision can trace its origin — from physical evidence to engineering context, commercial logic and operational learning." />
            <div className="decision-flow reveal" aria-label="Reality to analytics decision chain">
              {decisionChain.map(([item, icon], index) => (
                <div className="decision-step" key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span><b aria-hidden="true">{icon}</b><strong>{item}</strong>
                  {index < decisionChain.length - 1 && <i aria-hidden="true"><b /></i>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="roles section" aria-labelledby="roles-title">
          <div className="section-grid">
            <SectionIntro eyebrow="FOR EVERY ROLE" title="Different responsibilities. One shared reality." copy="Each person sees what matters to their role, while every action remains connected to the same governed system." />
            <div className="role-grid">
              {roles.map(([title, copy, view, features], index) => (
                <article className="role-card reveal" key={title}>
                  <div className="role-visual"><Avatar kind={['legal','estimator','project','document'][index]} label={title as string} avatarUrl={`/agents/${['finance','estimator','project','document'][index]}-ai.webp`} showBadge={false} /><span>0{index + 1}</span></div>
                  <small>ROLE 0{index + 1}</small><h3>{title}</h3><p>{copy}</p><strong>{view}<Arrow /></strong>
                  <ul>{features.map(feature=><li key={feature}>{feature}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="investors" className="investors section" aria-labelledby="investors-title">
          <div className="section-grid investor-grid">
            <div>
              <SectionIntro eyebrow="INVESTOR PERSPECTIVE" title="Building infrastructure for the next generation of business." copy="OMNIRO begins where operational complexity is real: construction. The architecture is designed to expand through modular, governed intelligence." />
              <a className="button button-primary" href="mailto:investors@omniro.ai">Investor Relations <Arrow /></a>
            </div>
            <div className="investor-visual reveal">
              <svg className="europe-network" viewBox="0 0 520 260" role="img" aria-label="Abstract European expansion network">
                <path d="M83 54 143 32l42 21 44-15 35 25 50-14 32 32 53 10 31 45-35 30-8 38-52 14-36-14-52 26-38-30-49 10-18-41-43-24 25-40-21-40Z" />
                {[[143,77],[224,91],[285,116],[349,95],[390,147],[307,181],[206,169],[121,139]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="5" />)}
                <path className="network-line" d="M143 77 224 91 285 116 349 95 390 147 307 181 206 169 121 139 143 77M224 91 206 169M285 116 307 181" />
              </svg>
              <div className="investor-chain" aria-label="OMNIRO expansion architecture"><span>Construction</span><i>↓</i><span>Operational Data</span><i>↓</i><span>AI Intelligence</span><i>↓</i><span>Commercial Platform</span><i>↓</i><span>Business OS</span></div>
              <div className="thesis-grid">
                {['Construction-first strategy','Operational foundation','Modular architecture','European market focus','SaaS model potential','Multi-industry vision'].map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="roadmap" className="roadmap section" aria-labelledby="roadmap-title">
          <div className="section-grid">
            <SectionIntro eyebrow="ROADMAP" title="A disciplined path from foundation to Business OS." copy="Direction without artificial deadlines. Each stage advances only when its authority, data and operational foundations are ready." />
            <div className="roadmap-track reveal">
              {roadmap.map(([title, status, kind], index) => (
                <article className={`roadmap-item ${kind}`} key={title}>
                  <div className="roadmap-marker"><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <small>{status}</small><h3>{title}</h3>
                </article>
              ))}
            </div>
            <div className="status-legend"><span><i className="built" />Built</span><span><i className="development" />In Development</span><span><i className="planned" />Planned</span></div>
          </div>
        </section>

        <section id="contact" className="final-cta section" aria-labelledby="final-title">
          <div className="cta-orbit cta-orbit-one" aria-hidden="true" /><div className="cta-orbit cta-orbit-two" aria-hidden="true" />
          <div className="section-grid cta-content reveal">
            <p className="eyebrow"><span />THE NEXT OPERATING LAYER</p>
            <h2 id="final-title">The future of business will not be managed by disconnected software.</h2>
            <p className="orchestrated">It will be orchestrated.</p>
            <div className="giant-mark">OMNIR<span>O</span></div>
            <div className="button-row centered"><a className="button button-primary" href="#platform">Explore OMNIRO <Arrow /></a><a className="button button-ghost" href="mailto:partners@omniro.ai">Become a Partner</a></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-grid footer-grid">
          <div className="footer-brand"><Mark /><p>AI Operating System for Construction and Business.</p></div>
          {[
            ["Platform", ["Overview", "Intelligence", "Automation"]],
            ["Building", ["Construction", "Room Scanner", "Engineering"]],
            ["Technology", ["Architecture", "AI Agents", "Security"]],
            ["Company", ["Investors", "Roadmap", "Contact"]],
          ].map(([heading, links]) => <div className="footer-column" key={heading as string}><strong>{heading as string}</strong>{(links as string[]).map(link => <a href="#top" key={link}>{link}</a>)}</div>)}
        </div>
        <div className="section-grid footer-bottom"><span>© 2026 OMNIRO. All rights reserved.</span><div><a href="#top">Privacy</a><a href="#top">Terms</a><span>EN&nbsp; / &nbsp;PL&nbsp; / &nbsp;NL&nbsp; / &nbsp;RU</span></div></div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
