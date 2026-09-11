import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'review-manifest.json'),'utf8'));
for(const [path,digest] of Object.entries(manifest.files)){
 if(path.startsWith('/')||path.split('/').includes('..'))throw Error('Invalid manifest path');
 if(createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')!==digest)throw Error('Review digest mismatch: '+path);
}
console.log(JSON.stringify({verifiedFiles:Object.keys(manifest.files).length,signed:false,generator:manifest.generator}));
