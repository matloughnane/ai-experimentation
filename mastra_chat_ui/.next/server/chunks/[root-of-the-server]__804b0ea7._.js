module.exports=[924868,(e,r,t)=>{r.exports=e.x("fs/promises",()=>require("fs/promises"))},134659,e=>{"use strict";var r=e.i(924868),t=e.i(814747);async function o(e,t,i="utf-8"){let a=Math.random().toString(36).substring(2,15),d=`${e}.${process.pid}.${Date.now()}.${a}.tmp`;try{await r.default.writeFile(d,t,i),await r.default.rename(d,e)}catch(e){try{await r.default.unlink(d)}catch{}throw e}}async function i(e){let r={},t={};for(let o of e){let e=null;for(let i=1;i<=3;i++)try{let i=await o.fetchProviders(),a="models.dev"===o.id;for(let[e,d]of Object.entries(i)){let i=a?e:e===o.id?o.id:`${o.id}/${e}`;r[i]=d,t[i]=d.models.sort()}e=null;break}catch(r){if(e=r instanceof Error?r:Error(String(r)),i<3){let e=Math.min(1e3*Math.pow(2,i-1),5e3);await new Promise(r=>setTimeout(r,e))}}if(e)throw e}return{providers:r,models:t}}function a(e){let r=Object.entries(e).map(([e,r])=>{let t=r.map(e=>`'${e}'`),o=/[^a-zA-Z0-9_$]/.test(e)?`'${e}'`:e,i=`  readonly ${o}: readonly [${t.join(", ")}];`;if(i.length>120){let e=r.map(e=>`    '${e}',`).join("\n");return`  readonly ${o}: readonly [
${e}
  ];`}return i}).join("\n");return`/**
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT
 * Generated from model gateway providers
 */

/**
 * Provider models mapping type
 * This is derived from the JSON data and provides type-safe access
 */
export type ProviderModelsMap = {
${r}
};

/**
 * Union type of all registered provider IDs
 */
export type Provider = keyof ProviderModelsMap;

/**
 * Provider models mapping interface
 */
export interface ProviderModels {
  [key: string]: string[];
}

/**
 * OpenAI-compatible model ID type
 * Dynamically derived from ProviderModelsMap
 * Full provider/model paths (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet-20241022")
 */
export type ModelRouterModelId =
  | {
      [P in Provider]: \`\${P}/\${ProviderModelsMap[P][number]}\`;
    }[Provider]
  | (string & {});

/**
 * Extract the model part from a ModelRouterModelId for a specific provider
 * Dynamically derived from ProviderModelsMap
 * Example: ModelForProvider<'openai'> = 'gpt-4o' | 'gpt-4-turbo' | ...
 */
export type ModelForProvider<P extends Provider> = ProviderModelsMap[P][number];
`}async function d(e,i,d,n){let l=t.default.dirname(e),s=t.default.dirname(i);await r.default.mkdir(l,{recursive:!0}),await r.default.mkdir(s,{recursive:!0}),await o(e,JSON.stringify({providers:d,models:n,version:"1.0.0"},null,2),"utf-8");let p=a(n);await o(i,p,"utf-8")}e.s(["atomicWriteFile",()=>o,"fetchProvidersFromGateways",()=>i,"generateTypesContent",()=>a,"writeRegistryFiles",()=>d])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__804b0ea7._.js.map