const r = await fetch('http://127.0.0.1:3000/__reset',{method:'POST'});
if (!r.ok) process.exit(1);
console.log('server state reset');
