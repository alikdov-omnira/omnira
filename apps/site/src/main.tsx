import { Fragment, StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "./i18n/useTranslation";
import { TERMS } from "./i18n/terminology";
import type { Language, SiteCopy } from "./i18n/types";
import "./styles.css";
import "./localization.css";

const moduleMeta = [["01","⌂"],["02","◒"],["03","▤"],["04","◉"],["05","⌁"],["06","✦"]];
const agentKinds = ["legal","finance","estimator","project","procurement","risk","document","analytics"] as const;
const processIcons = ["◉","⌗","▦","✣","◇","⬡","◒","▤","↗","⌁"];
const capabilityKinds = ["built","built","built","built","development","development","planned","planned","planned","planned"];
const roadmapKinds = ["built","development","development","planned","planned","planned"];

function Mark({ compact = false, copy }: { compact?: boolean; copy: SiteCopy }) {
  return (
    <a className="brand" href="#top" aria-label={copy.a11y[1]}>
      <span className="brand-orbit" aria-hidden="true" />
      <span>OMNIR<span className="brand-o">O</span></span>
      {!compact && <small>{copy.hero[0]}</small>}
    </a>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Pill({ children, tone = "violet" }: { children: ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Avatar({ kind, label, copy, avatarUrl, showBadge = true }: { kind: string; label: string; copy: SiteCopy; avatarUrl?: string; showBadge?: boolean }) {
  return <div className={`ai-avatar avatar-${kind}`} role="img" aria-label={`${label}: ${copy.a11y[19]}`}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <><span className="avatar-head" /><span className="avatar-body" /></>}{showBadge && <i className="avatar-badge">AI</i>}</div>;
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

function SystemVisual({ copy, className = "" }: { copy: SiteCopy; className?: string }) {
  const placements = ["node-projects","node-finance","node-documents","node-building","node-analytics","node-agents"];
  return (
    <div className={`system-visual ${className}`} aria-label={copy.a11y[9]}>
      <div className="visual-grid" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="core">
        <span className="core-halo" aria-hidden="true" />
        <span className="core-mark">O</span>
        <strong>OMNIRO</strong>
        <small>AI CORE</small>
      </div>
      {copy.hero.slice(14,20).map((label, index) => (
        <div className={`system-node ${placements[index]}`} key={label} style={{ "--delay": `${index * -0.7}s` } as React.CSSProperties}>
          <span className="node-signal" aria-hidden="true" />
          <small>0{index + 1}</small>
          <strong>{label}</strong>
        </div>
      ))}
      <div className="data-pulse pulse-a" aria-hidden="true" />
      <div className="data-pulse pulse-b" aria-hidden="true" />
      <div className="data-pulse pulse-c" aria-hidden="true" />
      <div className="hero-agents" aria-label={copy.a11y[10]}>
        {TERMS.agents.slice(0, 4).map((name,index) => <div className="hero-agent" key={name}><Avatar kind={agentKinds[index]} label={name} copy={copy} avatarUrl={`/agents/${agentKinds[index]}-ai.webp`} /><span><strong>{name}</strong><small>{copy.hero[10]}</small></span></div>)}
      </div>
      <div className="hero-control-panels" aria-label={copy.a11y[11]}><span><small>{copy.hero[14]}</small><strong>{copy.hero[11]}</strong></span><span><small>{copy.hero[20]}</small><strong>{copy.hero[12]}</strong></span><span><small>{copy.hero[21]}</small><strong>{copy.hero[13]}</strong></span></div>
    </div>
  );
}

function Header({copy, language, setLanguage, languages}: {copy: SiteCopy; language: Language; setLanguage: (language: Language) => void; languages: {code: Language; label: string}[]}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const links = copy.nav.slice(0,6).map((label,index) => [label,["#platform","#building","#technology","#investors","#roadmap","#contact"][index]]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setLanguageOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Mark compact copy={copy} />
        <nav className="desktop-nav" aria-label={copy.a11y[2]}>
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <div className="language-control" ref={languageRef}>
            <button className="language-trigger" type="button" aria-label={copy.a11y[7]} aria-haspopup="listbox" aria-expanded={languageOpen} onClick={() => setLanguageOpen(open => !open)}>🌐 <span>{languages.find(item=>item.code===language)?.label}</span></button>
            {languageOpen && <div className="language-menu" role="listbox" aria-label={copy.a11y[7]}>{languages.map(item=><button type="button" role="option" aria-selected={item.code===language} key={item.code} onClick={()=>{setLanguage(item.code);setLanguageOpen(false);}}><span>{item.label}</span><small>{item.code.toUpperCase()}</small></button>)}</div>}
          </div>
          <a className="button button-small button-primary" href="#platform">{copy.nav[6]} <Arrow /></a>
        </div>
        <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
          <button type="button" aria-label={menuOpen ? copy.a11y[5] : copy.a11y[4]} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)}><span /><span /></button>
          {menuOpen && <nav id="mobile-navigation" aria-label={copy.a11y[3]}>
            {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
            <div className="mobile-language-list" aria-label={copy.legal[4]}>{languages.map(item=><button type="button" aria-pressed={item.code===language} key={item.code} onClick={()=>{setLanguage(item.code);setMenuOpen(false);}}>{item.label}</button>)}</div>
          </nav>}
        </div>
      </div>
    </header>
  );
}

function App() {
  const {copy, language, setLanguage, languages} = useTranslation();
  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#content">{copy.a11y[0]}</a>
      <Header copy={copy} language={language} setLanguage={setLanguage} languages={languages} />
      <main id="content">
        <section className="hero section" aria-labelledby="hero-title">
          <div className="hero-ambient ambient-one" aria-hidden="true" />
          <div className="hero-ambient ambient-two" aria-hidden="true" />
          <div className="section-grid hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow"><span />{copy.hero[0]}</p>
              <h1 id="hero-title">{copy.hero[1]} <em>{copy.hero[2]}</em></h1>
              <p className="hero-lead">{copy.hero[3]}</p>
              <div className="button-row">
                <a className="button button-primary" href="#platform">{copy.hero[4]} <Arrow /></a>
                <a className="button button-ghost" href="#investors">{copy.hero[5]}</a>
              </div>
              <div className="hero-proof" aria-label={copy.a11y[8]}>
                <span><i className="status-dot" />{copy.hero[6]}</span>
                <span>{copy.hero[7]}</span>
                <span>{copy.hero[8]}</span>
              </div>
            </div>
            <SystemVisual copy={copy} className="hero-system" />
          </div>
          <div className="scroll-cue" aria-hidden="true"><span />{copy.hero[9]}</div>
        </section>

        <section className="problem section" aria-labelledby="problem-title">
          <div className="section-grid split-grid">
            <div>
              <SectionIntro eyebrow={copy.problem[0]} title={copy.problem[1]} />
              <p className="section-copy wide">{copy.problem[2]}</p>
            </div>
            <div className="fragment-map reveal" aria-label={copy.a11y[12]}>
              {copy.fragments.map((item, i) => <span key={item} style={{ "--i": i } as React.CSSProperties}>{item}</span>)}
              <div className="fragment-center"><strong>OMNIRO</strong><small>{copy.problem[3]}</small></div>
            </div>
          </div>
        </section>

        <section id="platform" className="platform section" aria-labelledby="platform-title">
          <div className="section-grid">
            <SectionIntro eyebrow={copy.platform[0]} title={copy.platform[1]} copy={copy.platform[2]} />
            <div className="module-grid">
              {copy.modules.map(([title, description, signal],index) => (
                <article className="module-card reveal" key={title} tabIndex={0}>
                  <div className="module-top"><span>{moduleMeta[index][0]}</span><i aria-hidden="true" /></div>
                  <div className="module-icon" aria-hidden="true">{moduleMeta[index][1]}</div>
                  <h3>{title}</h3><p>{description}</p>
                  <div className="module-data"><span>{signal}</span><i><b /></i></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="building" className="building section" aria-labelledby="building-title">
          <div className="section-grid building-grid">
            <div className="building-copy">
              <SectionIntro eyebrow="OMNIRO BUILDING" title={copy.building[0]} copy={copy.building[1]} />
              <div className="building-stats">
                <div><strong>01</strong><span>{copy.building[2]}</span></div>
                <div><strong>REAL</strong><span>{copy.building[3]}</span></div>
                <div><strong>EU</strong><span>{copy.building[4]}</span></div>
              </div>
            </div>
            <div className="capability-panel glass-panel reveal">
              <div className="panel-head"><div><small>{copy.building[5]}</small><strong>{copy.building[6]}</strong></div><Pill tone="cyan">{copy.building[7]}</Pill></div>
              <div className="capability-list">
                {copy.capabilities.map(([title, status], index) => (
                  <div className="capability-row" key={title}>
                    <span className="cap-index">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{title}</strong>
                    <span className={`cap-status ${capabilityKinds[index]}`}>{status}</span>
                  </div>
                ))}
              </div>
              <div className="foundation-flow" aria-label={copy.a11y[13]}>{copy.process.slice(4,8).map((item,index)=><Fragment key={item}>{index > 0 && <i>→</i>}<span>{item}</span></Fragment>)}</div>
            </div>
          </div>
        </section>

        <section id="technology" className="command section" aria-labelledby="command-title">
          <div className="section-grid">
            <SectionIntro eyebrow={copy.command[0]} title={copy.command[1]} copy={copy.command[2]} />
            <div className="command-map glass-panel reveal" aria-label={copy.a11y[14]}>
              <div className="command-toolbar"><div><span className="live-indicator" />{copy.command[0]} <small>{copy.command[3]}</small></div><span>{copy.command[4]}</span></div>
              <div className="command-grid" aria-hidden="true" />
              <div className="command-core"><span className="command-ring" /><b>O</b><strong>OMNIRO CORE</strong><small>{copy.command[5]}</small></div>
              {TERMS.agents.slice(0,6).map((name, index) => (
                <div className={`agent agent-${index + 1}`} key={name} style={{ "--agent-index": index } as React.CSSProperties}>
                  <Avatar kind={agentKinds[index]} label={name} copy={copy} avatarUrl={`/agents/${agentKinds[index]}-ai.webp`} /><span><strong>{name}</strong><small>{copy.agents[index][0]}</small></span>
                </div>
              ))}
              <div className="ops-panel ops-projects"><small>{copy.command[6]}</small><strong>{copy.command[7]}</strong><span><i style={{width:'72%'}} /></span></div>
              <div className="ops-panel ops-finance"><small>{copy.command[8]}</small><strong>{copy.command[9]}</strong><span><i style={{width:'58%'}} /></span></div>
              <div className="ops-panel ops-insights"><small>{copy.command[10]}</small><strong>{copy.command[11]}</strong><em>{copy.command[12]}</em></div>
              <div className="ops-panel ops-deadlines"><small>{copy.command[13]}</small><strong>{copy.command[14]}</strong><em>{copy.command[15]}</em></div>
              <div className="ops-panel ops-risk"><small>{copy.command[16]}</small><strong>{copy.command[17]}</strong><em>{copy.command[18]}</em></div>
              <div className="ops-panel ops-health"><small>{copy.command[19]}</small><strong>{copy.command[20]}</strong><em>● {copy.command[21]}</em></div>
              <p className="concept-label"><span />{copy.command[22]}</p>
            </div>
            <div className="agents-heading"><div><p className="eyebrow"><span />{copy.command[23]}</p><h3>{copy.command[24]}</h3></div><Pill tone="violet">{copy.command[25]}</Pill></div>
            <div className="agent-ecosystem reveal" aria-label={copy.a11y[15]}>
              {TERMS.agents.map((name,index) => <article className={`agent-card accent-${agentKinds[index]}`} key={name} tabIndex={0}><div className="agent-portrait"><Avatar kind={agentKinds[index]} label={name} copy={copy} avatarUrl={`/agents/${agentKinds[index]}-ai.webp`} /><span className="agent-status">{copy.agents[index][1]}</span></div><div className="agent-card-content"><span className="agent-role">{copy.command[26]}</span><h3>{name}</h3><p>{copy.agents[index][0]}</p><ul>{copy.agents[index][2].map(capability=><li key={capability}>{capability}</li>)}</ul></div></article>)}
            </div>
          </div>
        </section>

        <section className="decision section" aria-labelledby="decision-title">
          <div className="section-grid">
            <SectionIntro eyebrow={copy.process[0]} title={copy.process[1]} copy={copy.process[2]} />
            <div className="decision-flow reveal" aria-label={copy.a11y[16]}>
              {copy.process.slice(3).map((item, index) => (
                <div className="decision-step" key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span><b aria-hidden="true">{processIcons[index]}</b><strong>{item}</strong>
                  {index < processIcons.length - 1 && <i aria-hidden="true"><b /></i>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="roles section" aria-labelledby="roles-title">
          <div className="section-grid">
            <SectionIntro eyebrow={copy.roleIntro[0]} title={copy.roleIntro[1]} copy={copy.roleIntro[2]} />
            <div className="role-grid">
              {copy.roles.map(([title, description, view, features], index) => (
                <article className="role-card reveal" key={title}>
                  <div className="role-visual"><Avatar kind={['legal','estimator','project','document'][index]} label={title} copy={copy} avatarUrl={`/agents/${['finance','estimator','project','document'][index]}-ai.webp`} showBadge={false} /><span>0{index + 1}</span></div>
                  <small>{copy.command[26]} 0{index + 1}</small><h3>{title}</h3><p>{description}</p><strong>{view}<Arrow /></strong>
                  <ul>{features.map(feature=><li key={feature}>{feature}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="investors" className="investors section" aria-labelledby="investors-title">
          <div className="section-grid investor-grid">
            <div>
              <SectionIntro eyebrow={copy.investors[0]} title={copy.investors[1]} copy={copy.investors[2]} />
              <a className="button button-primary" href="mailto:investors@omniro.ai">{copy.investors[3]} <Arrow /></a>
            </div>
            <div className="investor-visual reveal">
              <svg className="europe-network" viewBox="0 0 520 260" role="img" aria-label={copy.a11y[17]}>
                <path d="M83 54 143 32l42 21 44-15 35 25 50-14 32 32 53 10 31 45-35 30-8 38-52 14-36-14-52 26-38-30-49 10-18-41-43-24 25-40-21-40Z" />
                {[[143,77],[224,91],[285,116],[349,95],[390,147],[307,181],[206,169],[121,139]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="5" />)}
                <path className="network-line" d="M143 77 224 91 285 116 349 95 390 147 307 181 206 169 121 139 143 77M224 91 206 169M285 116 307 181" />
              </svg>
              <div className="investor-chain" aria-label={copy.a11y[18]}>{copy.investors.slice(4,9).map((item,index)=><Fragment key={item}>{index > 0 && <i>↓</i>}<span>{item}</span></Fragment>)}</div>
              <div className="thesis-grid">
                {copy.investors.slice(9).map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="roadmap" className="roadmap section" aria-labelledby="roadmap-title">
          <div className="section-grid">
            <SectionIntro eyebrow={copy.final[0]} title={copy.final[1]} copy={copy.final[2]} />
            <div className="roadmap-track reveal">
              {copy.roadmap.map(([title, status], index) => (
                <article className={`roadmap-item ${roadmapKinds[index]}`} key={title}>
                  <div className="roadmap-marker"><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <small>{status}</small><h3>{title}</h3>
                </article>
              ))}
            </div>
            <div className="status-legend"><span><i className="built" />{copy.final[3]}</span><span><i className="development" />{copy.final[4]}</span><span><i className="planned" />{copy.final[5]}</span></div>
          </div>
        </section>

        <section id="contact" className="final-cta section" aria-labelledby="final-title">
          <div className="cta-orbit cta-orbit-one" aria-hidden="true" /><div className="cta-orbit cta-orbit-two" aria-hidden="true" />
          <div className="section-grid cta-content reveal">
            <p className="eyebrow"><span />{copy.final[6]}</p>
            <h2 id="final-title">{copy.final[7]}</h2>
            <p className="orchestrated">{copy.final[8]}</p>
            <div className="giant-mark">OMNIR<span>O</span></div>
            <div className="button-row centered"><a className="button button-primary" href="#platform">{copy.final[9]} <Arrow /></a><a className="button button-ghost" href="mailto:partners@omniro.ai">{copy.final[10]}</a></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-grid footer-grid">
          <div className="footer-brand"><Mark copy={copy} /><p>{copy.legal[0]}</p></div>
          {copy.footer.map(([heading, links]) => <div className="footer-column" key={heading}><strong>{heading}</strong>{links.map(link => <a href="#top" key={link}>{link}</a>)}</div>)}
        </div>
        <div className="section-grid footer-bottom"><span>© 2026 OMNIRO. {copy.legal[1]}</span><div><a href="#top">{copy.legal[2]}</a><a href="#top">{copy.legal[3]}</a><span>{languages.map(item=>item.code.toUpperCase()).join(" · ")}</span></div></div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
