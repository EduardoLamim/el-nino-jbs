import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
it('preserva as duas imagens oficiais homologadas sem recompressão',()=>{
for(const [file,hash] of [
['operacoes-posicionamento-equipamentos.jpg','4690494854f45e79fe6da7fad68e1b6246994fc3419f6770787382e68de42ead'],
['fluxo-acionamento-el-nino.png','5a31d9eaf6e3effd31cdb3fdeed2c53f02104bb57cecf5aa3b763e6cd7f251e2']]) expect(createHash('sha256').update(readFileSync('public/assets/'+file)).digest('hex')).toBe(hash);
});
