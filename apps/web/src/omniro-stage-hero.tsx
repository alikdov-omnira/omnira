import{OmniroStageScene,stageNodes}from"./omniro-stage-scene.js";

export function OmniroStageHero({staticMode,onEnter,onReplay,summary}:{staticMode:boolean;onEnter:()=>void;onReplay:()=>void;summary:string}){
 return <section className="stage-one-hero" aria-labelledby="stage-one-title">
  <div className="stage-atmosphere" aria-hidden="true"/>
  <header className="stage-copy">
   <p className="stage-product">OMNIRO</p><p className="stage-kicker">AI operating system</p>
   <h1 id="stage-one-title">Intelligence<br/>that builds<br/><em>the future</em></h1>
   <p>{summary}</p>
   <div className="stage-actions"><a href="#building">Enter Building <span>→</span></a><button onClick={onReplay}>Watch intro <span>▶</span></button></div>
   <small>One core. Governed flow. Human authority preserved.</small>
  </header>
  <div className="stage-system" role="img" aria-label="A living OMNIRO intelligence core exchanges governed information with Scanner, Passport, Estimate, Orchestrator, Norms and Analytics">
   <OmniroStageScene staticMode={staticMode} phase={7}/>
   <div className="stage-core-label"><strong>OMNIRO</strong><small>living intelligence core</small></div>
   {stageNodes.map(node=><article className={`stage-node node-${node.id}`} key={node.id}><i aria-hidden="true"/><div><strong>{node.label}</strong><small>{node.detail}</small><span>{node.status}</span></div></article>)}
  </div>
  <dl className="stage-metrics" aria-label="Illustrative system characteristics">
   <div><dt>06</dt><dd>Visible modules</dd></div><div><dt>∞</dt><dd>Traceable connections</dd></div><div><dt>100%</dt><dd>Human authority</dd></div><div><dt>Real-time</dt><dd>Intelligence flow</dd></div><div><dt>Global</dt><dd>By design</dd></div>
  </dl>
  <div className="stage-scroll"><span>Explore the system</span><i/></div>
 </section>
}
