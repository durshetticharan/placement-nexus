const http=require('http');  
const body=JSON.stringify({email:'student.demo@placementnexus.dev',password:'AuditPass123!'});  
const req=http.request({hostname:'localhost',port:5000,path:'/api/v1/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},res= 
let d='';res.on('data',c==c);res.on('end',()=,res.statusCode,'\\nBODY:',d.substring(0,800)));  
});req.on('error',e=,e.message));req.write(body);req.end();  
