import { prdUrl } from '../_shared/environment.ts';
prdUrl(Deno.env.get('PRD_SUPABASE_PROJECT_REF') ?? '', Deno.env.get('SUPABASE_URL') ?? '');
import { criarDispatchHandler } from './handler.ts';
Deno.serve(criarDispatchHandler({
  secret: Deno.env.get('MONITORAMENTO_CRON_SECRET_PRD') ?? '',
  token: Deno.env.get('GITHUB_DISPATCH_TOKEN_PRD') ?? '',
}, { fetch, log: event => console.log(JSON.stringify(event)) }));
