'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
module.exports=async()=>{
 const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
 const server=http.createServer((req,res)=>{let rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'');if(rel.endsWith('/'))rel+='index.html';const f=path.resolve(root,rel);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return{server,base:'http://127.0.0.1:'+server.address().port};
};
