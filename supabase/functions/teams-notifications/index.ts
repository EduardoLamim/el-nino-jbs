import { prdUrl } from '../_shared/environment.ts';
import { createHandler, type Rpc } from './handler.ts';
const env = (key: string) => Deno.env.get(key) ?? '';
const project = prdUrl(env('PRD_SUPABASE_PROJECT_REF'), env('SUPABASE_URL'));
const rpc: Rpc = async (scope, action, payload = {}) => {
  if (env('SUPABASE_URL') !== project) throw new Error('PRD only');
  const token = env(`TEAMS_DB_${scope.toUpperCase()}_TOKEN_PRD`);
  const apikey = env('JBS_SUPABASE_PUBLISHABLE_KEY'); // Existing public project key, never the Impacto backend credential.
  if (token.length < 64 || !apikey) throw new Error('Missing scoped credential');
  const response = await fetch(`${project}/rest/v1/rpc/jbs_teams_rpc`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey },
    body: JSON.stringify({ p_token: token, p_action: action, p_payload: payload }), signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error('Notification persistence unavailable'); }
  return response.json();
};
// Read configuration for each request, including changes to the live-send switch.
Deno.serve(request => createHandler({ rpc, wakeToken: env('TEAMS_WAKE_TOKEN_PRD'), adminToken: env('TEAMS_ADMIN_TOKEN_PRD'),
  webhook: env('TEAMS_WORKFLOW_URL_PRD'), liveEnabled: false })(request));
