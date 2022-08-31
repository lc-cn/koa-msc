import KoaRouter,{RouterOptions as Options} from '@koa/router'
import {WebSocketServer} from "ws";
import http from "http";
import {parse} from "url";
export class Router extends KoaRouter{
    constructor(public server:http.Server,options:RouterOptions) {
        super(options);
    }
    wsStack: WebSocketServer[] = []
    ws(path:string) {
        const wsServer = new WebSocketServer({ noServer: true,path })
        this.wsStack.push(wsServer)
        this.server.on('upgrade',(request, socket, head)=>{
            const { pathname } = parse(request.url);
            if(this.wsStack.findIndex(wss=>wss.options.path===path)===-1){
                socket.destroy()
            }else if (pathname === path) {
                wsServer.handleUpgrade(request, socket, head, function done(ws) {
                    wsServer.emit('connection', ws, request);
                });
            }
        })
        return wsServer
    }
}
export interface RouterOptions extends Options{}