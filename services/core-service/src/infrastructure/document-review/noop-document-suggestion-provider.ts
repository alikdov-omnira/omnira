import type{DocumentAnalysisSuggestionProvider,SuggestionInput}from"../../application/document-review/document-analysis-suggestion-provider.js";
export class NoopDocumentSuggestionProvider implements DocumentAnalysisSuggestionProvider{readonly name="omnira-noop";readonly version="1.0.0";async suggest(_input:SuggestionInput){return{suggestions:[]};}}
