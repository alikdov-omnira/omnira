export type PublicLocale="en"|"nl"|"de"|"pl"|"ru"|"uk";
export type CapabilityState="available"|"foundation"|"in_development"|"planned"|"vision"|"unavailable";

export type Capability={
 id:string;name:string;galaxy:"construction"|"knowledge"|"finance"|"operations"|"future";
 state:CapabilityState;summary:string;evidence:string[];publicDemo:boolean;
};

export type EnergyFlow={id:string;origin:string;destination:string;semanticType:"verified_data"|"command"|"recommendation"|"approval_request"|"completed_calculation"|"warning"|"unavailable_dependency"|"governed_transition";state:"illustrative"|"available"|"paused";explanation:string;capabilityId:string};
export type LearningEntry={id:string;ability:string;explanation:string;capabilityId:string;release:string;entryPoint:string};
export type FutureGalaxy={id:string;name:string;status:"vision";language:string};

export const capabilities:Capability[]=[
 {id:"room-scanner",name:"Room Scanner",galaxy:"construction",state:"foundation",summary:"Captures reviewed room geometry, measurements and evidence into an approvable room passport.",evidence:["Approved immutable scan snapshots","Measurement and opening provenance","Photo evidence references"],publicDemo:true},
 {id:"technical-assignment",name:"Technical Assignment",galaxy:"construction",state:"available",summary:"Turns customer intent into a reviewed and approved work scope.",evidence:["Review lifecycle","Accepted statements","Immutable approved revision"],publicDemo:true},
 {id:"design-project",name:"Design Project",galaxy:"construction",state:"available",summary:"Connects approved physical facts and work scope to design decisions.",evidence:["Source snapshot validation","Decision lifecycle","Approved design snapshot"],publicDemo:true},
 {id:"work-catalog",name:"Work & Technology Catalog",galaxy:"knowledge",state:"available",summary:"Defines construction work and technology as governed catalog knowledge.",evidence:["International measurement units","Hierarchical work catalog","Technology lifecycle"],publicDemo:true},
 {id:"materials",name:"Materials & Norms",galaxy:"knowledge",state:"available",summary:"Connects materials, consumption rules and versioned construction norms.",evidence:["Material catalog","Norm versions","Consumption calculation provenance"],publicDemo:true},
 {id:"regional-pricing",name:"Regional Pricing",galaxy:"finance",state:"available",summary:"Applies governed price lists by market, currency and validity period.",evidence:["Regional price lists","Validity windows","Currency-preserving estimates"],publicDemo:true},
 {id:"estimate",name:"Estimate Engine",galaxy:"finance",state:"available",summary:"Calculates estimate lines from approved quantities, norms and regional prices.",evidence:["Versioned estimate lines","Approval lifecycle","Causality records"],publicDemo:true},
 {id:"causality",name:"Engineering Causality Chain",galaxy:"knowledge",state:"foundation",summary:"Preserves why an engineering value exists and which approved evidence supports it.",evidence:["Source snapshot references","Formula and dependency lineage","Impact analysis contracts"],publicDemo:true},
 {id:"omniro",name:"OMNIRO Orchestrator",galaxy:"operations",state:"foundation",summary:"Interprets user intent and directs attention across authoritative workflow state without inventing facts.",evidence:["Read-only command interpretation","Explicit unavailable capability responses","Source availability disclosure"],publicDemo:true},
 {id:"documents",name:"Documents & OCR",galaxy:"operations",state:"available",summary:"Stores governed document versions and supports auditable OCR and extraction workflows.",evidence:["Immutable document versions","OCR job lifecycle","Reviewed extraction results"],publicDemo:false},
 {id:"scheduling",name:"Construction Scheduling",galaxy:"future",state:"planned",summary:"Planned orchestration of work sequence, dependencies and project duration.",evidence:[],publicDemo:false},
 {id:"weather",name:"Weather Intelligence",galaxy:"future",state:"unavailable",summary:"Weather-derived construction risk is not connected to authoritative project state.",evidence:[],publicDemo:false},
 {id:"robotics",name:"Construction Robotics",galaxy:"future",state:"vision",summary:"A long-term direction for evidence-led machine coordination on site.",evidence:[],publicDemo:false},
];

export const stateLabel:Record<CapabilityState,string>={available:"Available",foundation:"Foundation",in_development:"In development",planned:"Planned",vision:"Vision",unavailable:"Unavailable"};
export const publicCapability=(id:string)=>capabilities.find(item=>item.id===id);
export const demonstratedCapabilities=capabilities.filter(item=>item.publicDemo&&item.evidence.length>0);

export const buildingStages=[
 {id:"project",title:"Project",input:"Authorized project context",action:"Defines the governed boundary",output:"Project identity",owner:"Project owner",confirmation:true},
 {id:"room-scanner",title:"Room Scanner",input:"Manual or external-laser measurements and evidence",action:"Captures and validates physical facts",output:"Reviewed scan",owner:"Survey operator",confirmation:true},
 {id:"passport",title:"Digital Room Passport",input:"Approved scan snapshot",action:"Freezes verified room geometry",output:"Immutable room passport",owner:"Approver",confirmation:true},
 {id:"technical-assignment",title:"Work Scope",input:"Room passport and customer intent",action:"Structures requested work",output:"Approved technical assignment",owner:"Customer and project team",confirmation:true},
 {id:"work-catalog",title:"Technology",input:"Approved work scope",action:"Maps intent to governed work definitions",output:"Selected technology",owner:"Engineer",confirmation:true},
 {id:"materials",title:"Knowledge & Norms",input:"Technology and quantities",action:"Applies versioned norms and consumption rules",output:"Engineering material demand",owner:"Engineering authority",confirmation:true},
 {id:"regional-pricing",title:"Regional Pricing",input:"Material demand and valid price list",action:"Preserves market, currency and validity",output:"Priced demand",owner:"Commercial authority",confirmation:true},
 {id:"estimate",title:"Estimate",input:"Priced demand and labor",action:"Calculates explainable estimate lines",output:"Versioned estimate",owner:"Estimator",confirmation:true},
 {id:"omniro",title:"OMNIRO Analysis",input:"Authorized workflow state",action:"Directs attention without changing records",output:"Explainable recommendation",owner:"Human decision-maker",confirmation:true},
] as const;

export const energyFlows:EnergyFlow[]=[
 {id:"scan-passport",origin:"Room Scanner",destination:"Digital Room Passport",semanticType:"verified_data",state:"available",explanation:"Reviewed measurements enter an approved immutable snapshot.",capabilityId:"room-scanner"},
 {id:"scope-technology",origin:"Work Scope",destination:"Technology",semanticType:"governed_transition",state:"available",explanation:"Approved intent is mapped to governed construction work.",capabilityId:"work-catalog"},
 {id:"norm-demand",origin:"Engineering Norm",destination:"Material Demand",semanticType:"completed_calculation",state:"available",explanation:"A versioned formula calculates demand from verified quantity.",capabilityId:"materials"},
 {id:"estimate-approval",origin:"Estimate",destination:"Human Approver",semanticType:"approval_request",state:"illustrative",explanation:"The public scenario pauses for human approval; no live project is connected.",capabilityId:"estimate"},
 {id:"weather-unavailable",origin:"Weather provider",destination:"Project Risk",semanticType:"unavailable_dependency",state:"paused",explanation:"No authoritative forecast is connected, so no weather risk is inferred.",capabilityId:"weather"},
];

export const learningEntries:LearningEntry[]=[
 {id:"room-passports",ability:"OMNIRO learned to build verified Digital Room Passports.",explanation:"Approved scanner snapshots preserve geometry and evidence references.",capabilityId:"room-scanner",release:"061d144",entryPoint:"#building"},
 {id:"technology",ability:"OMNIRO learned to connect construction intent with technology.",explanation:"Approved work scope maps to governed work and technology definitions.",capabilityId:"work-catalog",release:"843e62b",entryPoint:"#learning"},
 {id:"demand",ability:"OMNIRO learned to calculate engineering material demand.",explanation:"Versioned norms preserve formula inputs and calculation lineage.",capabilityId:"materials",release:"d1e0ee7",entryPoint:"#why"},
 {id:"explain",ability:"OMNIRO learned to explain why an engineering value exists.",explanation:"The Engineering Causality Chain links outputs to approved evidence.",capabilityId:"causality",release:"1ac9d2f",entryPoint:"#why"},
];

export const futureGalaxies:FutureGalaxy[]=["Legal","Finance","Manufacturing","Logistics","Healthcare","Agriculture","Energy"].map(name=>({id:name.toLowerCase(),name,status:"vision",language:"Not yet awakened · future governed domain"}));

export const investorContent=[
 ["Problem","Construction workflows fragment physical evidence, engineering knowledge and commercial decisions."],
 ["Current product","OMNIRO Building connects approved room facts, scope, technology, norms, demand, pricing and estimates."],
 ["Architecture","A reusable multi-tenant core provides identity, permissions, audit, snapshots and orchestration."],
 ["Commercial chain","Verified geometry becomes governed material demand and an explainable estimate."],
 ["Expansion model","Future governed domains may reuse the trusted platform core; they are vision, not products."],
 ["Moat","Authoritative domain passports, evidence lineage, human approvals and explainability compound together."],
 ["Next milestone","Complete the first launchable end-to-end OMNIRO Building workflow."],
] as const;

export const capabilityCanBeLearned=(id:string)=>{const capability=publicCapability(id);return Boolean(capability&&capability.evidence.length>0&&["available","foundation"].includes(capability.state))};

export const copy:Record<PublicLocale,{nav:string[];birth:string[];hero:string;sub:string;enter:string;skip:string;why:string;learning:string;privacy:string}>={
 en:{nav:["Building","Why OMNIRA","Learning","Galaxy","Platform","Vision"],birth:["There was evidence.","Then there was understanding.","Then there was a system that could explain why."],hero:"An AI operating system for real-world engineering",sub:"OMNIRA connects verified evidence, construction knowledge and commercial decisions—without hiding the chain between them.",enter:"Enter OMNIRA",skip:"Skip introduction",why:"This value exists because…",learning:"OMNIRA learns only through governed, attributable knowledge.",privacy:"Privacy choices"},
 nl:{nav:["Gebouw","Waarom OMNIRA","Leren","Melkweg","Platform","Visie"],birth:["Er was bewijs.","Toen kwam begrip.","Toen kwam een systeem dat kon uitleggen waarom."],hero:"Een AI-besturingssysteem voor echte techniek",sub:"OMNIRA verbindt geverifieerd bewijs, bouwkennis en commerciële beslissingen.",enter:"Open OMNIRA",skip:"Intro overslaan",why:"Deze waarde bestaat omdat…",learning:"OMNIRA leert alleen via beheerde, herleidbare kennis.",privacy:"Privacykeuzes"},
 de:{nav:["Gebäude","Warum OMNIRA","Lernen","Galaxie","Plattform","Vision"],birth:["Es gab Belege.","Dann kam Verständnis.","Dann ein System, das das Warum erklären konnte."],hero:"Ein KI-Betriebssystem für reale Ingenieurarbeit",sub:"OMNIRA verbindet verifizierte Belege, Bauwissen und kommerzielle Entscheidungen.",enter:"OMNIRA öffnen",skip:"Einführung überspringen",why:"Dieser Wert existiert, weil…",learning:"OMNIRA lernt nur durch kontrolliertes, zuordenbares Wissen.",privacy:"Datenschutz"},
 pl:{nav:["Budynek","Dlaczego OMNIRA","Nauka","Galaktyka","Platforma","Wizja"],birth:["Najpierw były dowody.","Potem przyszło zrozumienie.","Potem system, który potrafił wyjaśnić dlaczego."],hero:"System operacyjny AI dla rzeczywistej inżynierii",sub:"OMNIRA łączy zweryfikowane dowody, wiedzę budowlaną i decyzje handlowe.",enter:"Wejdź do OMNIRA",skip:"Pomiń wprowadzenie",why:"Ta wartość istnieje, ponieważ…",learning:"OMNIRA uczy się wyłącznie z kontrolowanej, przypisanej wiedzy.",privacy:"Ustawienia prywatności"},
 ru:{nav:["Здание","Почему OMNIRA","Обучение","Галактика","Платформа","Видение"],birth:["Сначала были доказательства.","Затем пришло понимание.","Затем система, способная объяснить почему."],hero:"Операционная система ИИ для реальной инженерии",sub:"OMNIRA связывает проверенные данные, строительные знания и коммерческие решения.",enter:"Войти в OMNIRA",skip:"Пропустить вступление",why:"Это значение существует, потому что…",learning:"OMNIRA учится только на управляемых данных с указанием источника.",privacy:"Настройки приватности"},
 uk:{nav:["Будівля","Чому OMNIRA","Навчання","Галактика","Платформа","Бачення"],birth:["Спочатку були докази.","Потім з’явилося розуміння.","Потім система, здатна пояснити чому."],hero:"Операційна система ШІ для реальної інженерії",sub:"OMNIRA поєднує перевірені докази, будівельні знання та комерційні рішення.",enter:"Увійти в OMNIRA",skip:"Пропустити вступ",why:"Це значення існує, тому що…",learning:"OMNIRA навчається лише з керованих даних із зазначеним джерелом.",privacy:"Налаштування приватності"}
};
