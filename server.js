var http = require('http');
var port = 1337;
var ip = "127.0.0.1";
var server = new http.Server();

server.listen(port, ip );


server.on('request', function (req, resp) {
   
    

    function responseBlockOut(req) {

        
            var strToResponse = "Any request will return entered url ardress.\nYou entered: " + req.url;
            return strToResponse;
        }
    
        
        resp.end(responseBlockOut(req));
});

console.log("server is running on port: " + port + " on ip: " + ip)