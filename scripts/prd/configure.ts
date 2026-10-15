import { configure,type Configuration } from './configure-core';
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>32000)throw new Error('Input too large');}
try {
 const c=JSON.parse(raw) as Configuration;raw='';
 const result=await configure(c,async(path,body)=>{
  const response=await fetch(`https://api.supabase.com/v1/projects/${c.project}${path}`,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${c.pat}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!response.ok){await response.body?.cancel();throw new Error('Administrative request failed');}
  const text=await response.text();return text?JSON.parse(text):null;
 });console.log(JSON.stringify(result));
}catch{console.error('Configuração interrompida ou incerta. Não repetir; inspecionar estado administrativo. Nenhum segredo exibido.');process.exitCode=1;}
