import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { projectSnapshot, trustedSnapshotCommit } from '../teams/reconcile';
/** Prepares a silent baseline payload only. No network, no writes. */
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const origin=git('remote','get-url','origin');
if(!/^https:\/\/github\.com\/EduardoLamim\/el-nino-jbs(?:\.git)?$/.test(origin)&&origin!=='git@github.com:EduardoLamim/el-nino-jbs.git')throw new Error('PRD repository required');
const commit=git('log','-1','--format=%H','--','public/data/status.json');
const [author,subject]=git('show','-s','--format=%ae%n%s',commit).split('\n');
if(!trustedSnapshotCommit(author!,subject!,git('diff-tree','--no-commit-id','--name-only','-r',commit).split('\n')))throw new Error('Persisted operational commit required');
const snapshot=projectSnapshot(JSON.parse(git('show',`${commit}:public/data/status.json`)));
if(JSON.stringify(snapshot)!==JSON.stringify(projectSnapshot(JSON.parse(readFileSync('public/data/status.json','utf8')))))throw new Error('Local snapshot differs from persisted snapshot');
console.log(JSON.stringify({commit,snapshot}));
