import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
it('preserva as duas imagens oficiais homologadas sem recompressão',()=>{
for(const [file,hash] of [
['operacoes-posicionamento-equipamentos.png','1abf53162582bc9aabb19bbeca90f74ba28eb10fb521b3e793b4c4225592a4aa'],
['fluxo-acionamento-el-nino.png','5a31d9eaf6e3effd31cdb3fdeed2c53f02104bb57cecf5aa3b763e6cd7f251e2']]) expect(createHash('sha256').update(readFileSync('public/assets/'+file)).digest('hex')).toBe(hash);
});
