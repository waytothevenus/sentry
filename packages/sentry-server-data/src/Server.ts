import * as os from "os";
import * as express from "express";
import { exec } from "child_process";

const app = express();
const packageConfig = require("../package.json");
const config = require("../config.json")

import Cache from "./Cache";

export const staticInfo = {
    arch: os.arch(),
    platform: os.platform(),
    release: os.release(),
    type: os.type(),
    endianness: os.endianness()
};

export const dynamicInfo = () => {
    return new Promise((resolve, reject) => {
        resolve({
            hostname: os.hostname(),
            uptime: os.uptime(),
            freemem: os.freemem(),
            totalmem: os.totalmem(),
            cpus: os.cpus()
        });
    });
}

export const serviceInfo = () => {
    const services = config.services;
    let serviceFunctions: any[] = [];
    Object.keys(services).forEach((key) => {
        function serviceFunction() {
            let service = services[key];
            return new Promise((resolve, reject) => {
                exec(service.script, (error, stdout, stderr) => {
                    resolve(Object.assign({}, service,
                        { status: (stdout.indexOf(service.test) > -1) }
                    ));
                });
            });
        }

        serviceFunctions.push(serviceFunction);
    });
    return serviceFunctions;
};

export default class Server {
    port: number;
    cache: Cache;

    constructor(port = 3333) {
        this.port = port;
        this.cache = new Cache();
        this.cache.set("staticInfo", staticInfo);
        this.cache.addCacheFunction("dynamicInfo", dynamicInfo);
        this.cache.addCacheFunctions("serviceInfo", serviceInfo());
        this.cache.runCacheFunctions();
    }

    serverInfo() {
        return {
            "staticInfo": this.cache.get("staticInfo"),
            "dynamicInfo": this.cache.get("dynamicInfo"),
            "serviceInfo": this.cache.get("serviceInfo")
        }
    }

    start() {
        app.get("/", (request, response) => {
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Content-Type: application/json");
            response.send(JSON.stringify(this.serverInfo()));
        });

        app.listen(this.port, (error: any) => {
            if (error) {
                return console.error("Server error", error);
            }
            console.log(`${packageConfig.name}@${packageConfig.version} is running on port ${this.port}`);
        });
    }
};