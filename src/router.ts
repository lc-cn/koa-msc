import KoaRouter from '@koa/router'
import {WebSocketServer} from "ws";
import http from "http";
import {parse} from "url";
export class Router extends KoaRouter{
    wsStack: WebSocketServer[] = []
    ws(path:string, server:http.Server) {
        const wsServer = new WebSocketServer({ noServer: true,path })
        this.wsStack.push(wsServer)
        server.on('upgrade',(request, socket, head)=>{
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
export namespace Router{
    export interface Options{
        /**
         * Prefix for all routes.
         */
        prefix?: string | undefined;
        /**
         * Methods which should be supported by the router.
         */
        methods?: string[] | undefined;
        routerPath?: string | undefined;
        /**
         * Whether or not routing should be case-sensitive.
         */
        sensitive?: boolean | undefined;
        /**
         * Whether or not routes should matched strictly.
         *
         * If strict matching is enabled, the trailing slash is taken into
         * account when matching routes.
         */
        strict?: boolean | undefined;
    }
}
