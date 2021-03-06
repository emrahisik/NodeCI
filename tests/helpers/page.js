const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory")
const userFactory = require("../factories/userFactory")

class Page {
    static async build(){
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
        });
        const page = await browser.newPage();
        const customPage = new Page(page);
        return new Proxy(customPage,{
            get: function(target, prop){
                return target[prop] || browser[prop] || page[prop];
            }
        })
    };

    constructor(page){
        this.page = page;
    };

    async login(){
        //userFactory returns a promise
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);
        await this.setCookie({ name: 'session', value: session}, {name: 'session.sig', value: sig});
        await this.goto("http://localhost:3000/blogs");
        //if your test runs faster than chromium response
        //await this.waitFor("a[href='/auth/logout']") 
    }

    async getContentsOf(selector){
        return await this.$eval(selector, el => el.innerHTML);
    };

    get(path){
        return this.evaluate(
            (_path)=>{
                return fetch(_path, {
                  method: "GET",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                }).then(res => res.json());
            }, path
        );
    };

    post(path, data){
        return this.evaluate(
            (_path, _data)=>{
                return fetch(_path, {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(_data),
                }).then(res => res.json());
            },path, data
        );
    };

    execRequests(actions){
        return Promise.all(actions.map(({method, path, data})=>{
            return this[method](path,data);
        }));
    }


}

module.exports = Page;