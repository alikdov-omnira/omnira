import {readFile} from "node:fs/promises";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,describe,expect,it} from "vitest";
import {App,Brand,Login} from "./app.js";
import {auth} from "./api.js";
const assets=["omnira-logo-light.svg","omnira-logo-dark.svg","omnira-symbol.svg","omnira-logo-monochrome.svg"];
describe("OMNIRA product branding",()=>{
 afterEach(()=>auth.set(null));
it("renders OMNIRA on the public and login boundaries without the old visible product brand",()=>{auth.set(null);const publicHtml=renderToStaticMarkup(<App/>),loginHtml=renderToStaticMarkup(<Login onLogin={()=>undefined}/>);expect(publicHtml).toContain("OMNIRA");expect(publicHtml).toContain("Intelligence");expect(loginHtml).toContain("One platform. Every business.");expect(`${publicHtml}${loginHtml}`).not.toContain("ODLS Platform");});
 it("renders OMNIRA in the authenticated shell and uses the compact symbol",()=>{auth.set({accessToken:"a",refreshToken:"r",user:{id:"u",email:"user@example.com",displayName:"User"},permissions:["dashboard.read"]});const shell=renderToStaticMarkup(<App/>),compact=renderToStaticMarkup(<Brand surface="dark" compact/>);expect(shell).toContain("OMNIRA");expect(shell).not.toContain(">ODLS<");expect(compact).toContain("/brand/omnira-symbol.svg");expect(compact).not.toContain("AI Business Operating System");});
 it("ships valid local script-free SVG assets and OMNIRA metadata",async()=>{for(const name of assets){const svg=await readFile(new URL(`../public/brand/${name}`,import.meta.url),"utf8");expect(svg).toMatch(/<svg[^>]+viewBox="[^"]+"/);expect(svg).not.toMatch(/<script|(?:href|src)=["']https?:/i);expect(svg).toContain("<title");}const favicon=await readFile(new URL("../public/favicon.svg",import.meta.url),"utf8"),index=await readFile(new URL("../index.html",import.meta.url),"utf8");expect(favicon).toContain("viewBox=\"0 0 88 88\"");expect(index).toContain("<title>OMNIRA — Explainable AI for real-world engineering</title>");expect(index).toContain("href=\"/favicon.svg\"");expect(index).toContain("rel=\"manifest\"");});
});
