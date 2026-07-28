export type SpeechEvent={transcript:string;final:boolean};
export interface SpeechRecognitionAdapter{supported:boolean;start(onResult:(event:SpeechEvent)=>void,onError:(message:string)=>void,onEnd:()=>void):void;stop():void}
export interface SpeechSynthesisAdapter{supported:boolean;speak(text:string):void;cancel():void}
type RecognitionLike={continuous:boolean;interimResults:boolean;lang:string;onresult?:(e:any)=>void;onerror?:(e:any)=>void;onend?:()=>void;start():void;stop():void};
export class BrowserSpeechRecognitionAdapter implements SpeechRecognitionAdapter{
 supported=false;private recognition?:RecognitionLike;
 constructor(scope:Window=window){const Ctor=(scope as any).SpeechRecognition??(scope as any).webkitSpeechRecognition;if(Ctor){this.recognition=new Ctor();this.supported=true;}}
 start(onResult:(event:SpeechEvent)=>void,onError:(message:string)=>void,onEnd:()=>void){if(!this.recognition)return;const r=this.recognition;r.continuous=false;r.interimResults=true;r.lang=document.documentElement.lang||navigator.language||"en";r.onresult=e=>{const item=e.results[e.resultIndex];onResult({transcript:String(item[0]?.transcript??""),final:Boolean(item.isFinal)});};r.onerror=e=>onError(e.error==="not-allowed"?"Microphone permission was denied. Text commands remain available.":`Voice input stopped: ${String(e.error)}`);r.onend=onEnd;r.start();}
 stop(){this.recognition?.stop();}
}
export class BrowserSpeechSynthesisAdapter implements SpeechSynthesisAdapter{
 supported:boolean;constructor(private scope:Window=window){this.supported="speechSynthesis"in scope&&"SpeechSynthesisUtterance"in scope}
 speak(text:string){if(!this.supported)return;this.cancel();this.scope.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}
 cancel(){if(this.supported)this.scope.speechSynthesis.cancel();}
}
