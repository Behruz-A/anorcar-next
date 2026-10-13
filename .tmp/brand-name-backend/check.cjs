const fs=require('fs'),path=require('path');
const backend='C:/Users/behru/Desktop/anorcar';
const ts=require(backend+'/node_modules/typescript');
const dir=__dirname;
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const staged=new Map(manifest.map(entry=>[path.resolve(backend,entry.path).toLowerCase(),fs.readFileSync(path.join(dir,entry.file),'utf8')]));
const config=ts.readConfigFile(backend+'/apps/anorcar-api/tsconfig.app.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,backend+'/apps/anorcar-api');
const host=ts.createCompilerHost({...parsed.options,noEmit:true,incremental:false});
const read=host.readFile.bind(host),exists=host.fileExists.bind(host),source=host.getSourceFile.bind(host);
host.readFile=file=>staged.get(path.resolve(file).toLowerCase())??read(file);
host.fileExists=file=>staged.has(path.resolve(file).toLowerCase())||exists(file);
host.getSourceFile=(file,languageVersion,onError,createNew)=>{
 const text=staged.get(path.resolve(file).toLowerCase());return text===undefined?source(file,languageVersion,onError,createNew):ts.createSourceFile(file,text,languageVersion,true);
};
const roots=[...parsed.fileNames,...manifest.filter(entry=>entry.path.endsWith('.spec.ts')).map(entry=>path.resolve(backend,entry.path))];
const program=ts.createProgram(roots,{...parsed.options,noEmit:true,incremental:false,types:['node','jest'],typeRoots:[backend+'/node_modules/@types']},host);
const errors=ts.getPreEmitDiagnostics(program);
if(errors.length){console.error(ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>backend,getNewLine:()=> '\n'}));process.exitCode=1;}else console.log('Staged backend TypeScript passed; backend files unchanged.');
