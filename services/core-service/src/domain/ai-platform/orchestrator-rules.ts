import{agentRegistry,type AgentTruth}from"./agent-registry.js";
export type AiIntent="open_document"|"list_invoices"|"explain_estimate"|"attention_summary"|"material_delays"|"weather_risk"|"draft_contract"|"draft_message"|"calendar_notes"|"support";
export type RouteDecision={intent:AiIntent;agentId:string;truth:AgentTruth;requiredPermissions:readonly string[]};
const patterns:Array<[AiIntent,string,RegExp]>= [
 ["draft_contract","legal",/(напиши|подготов|draft|write).*(договор|contract)/i],
 ["draft_message","communication",/(напиши|сообщ|message|write).*(клиент|client|kowalski|ковальск)/i],
 ["list_invoices","finance",/(фактур|invoice)/i],
 ["explain_estimate","project-analyst",/(почему|why).*(смет|estimate)/i],
 ["material_delays","project-analyst",/(материал).*(задерж|delay)|delay.*material/i],
 ["weather_risk","project-analyst",/(погод|weather|дожд|мороз|rain|frost)/i],
 ["attention_summary","project-analyst",/(требует.*решен|attention|priority|сегодня)/i],
 ["calendar_notes","calendar-notes",/(calendar|календар|замет|notes)/i],
 ["open_document","document",/(договор|contract|черт[её]ж|drawing|фактур|invoice|протокол|protocol|смет|estimate|фото|photo|scanner)/i]
];
export function routeCommand(text:string):RouteDecision{const match=patterns.find(([, ,pattern])=>pattern.test(text)),intent=match?.[0]??"support",agentId=match?.[1]??"support",agent=agentRegistry.get(agentId)!;return{intent,agentId,truth:agent.truth,requiredPermissions:agent.requiredPermissions}}
export function missingPermissions(required:readonly string[],actual:readonly string[]){return required.filter(permission=>!actual.includes(permission))}
export function documentQuery(text:string){return{approved:/(утвержд|approved)/i.test(text),type:/(черт[её]ж|drawing)/i.test(text)?"drawing":/(фактур|invoice)/i.test(text)?"invoice":/(договор|contract)/i.test(text)?"contract":/(смет|estimate)/i.test(text)?"estimate":/(фото|photo)/i.test(text)?"photo":/(протокол|protocol)/i.test(text)?"acceptance_act":undefined,search:text.replace(/(покажи|открой|найди|последн(ий|юю)|утвержд[её]нн(ый|ую)|show|open|find|latest|approved|договор|contract|черт[её]ж|drawing|фактур[уы]?|invoice|смет[уы]?|estimate|фото|photo|протокол|protocol)/gi," ").replace(/\s+/g," ").trim()}}
