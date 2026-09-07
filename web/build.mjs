import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const f of ['index.html','styles.css','app.js'])fs.copyFileSync(path.join(root,f),path.join(dist,f));
fs.cpSync(path.join(root,'public'),path.join(dist,'public'),{recursive:true});console.log('built static site -> dist');
