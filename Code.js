//node Code.js --url=https://www.hackerrank.com --config=config.json


let minimist =require("minimist")
let fs=require("fs")
let puppeteer=require("puppeteer")
const { exitCode } = require("process")
let args=minimist(process.argv);
let configJson=fs.readFileSync(args.config,"utf-8");
let config=JSON.parse(configJson);

async function run(){
    let browser=await puppeteer.launch({
        headless:false,
        args:['--start-maximized'],
        defaultViewport: null
    });
    let pages=await browser.pages();
    //home page of HackerRank
    let page=pages[0];
    await page.goto(args.url);

    //1st login page of HackerRank
    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    //2nd login page of HackerRank
    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']")

    //enter username
    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']",config.username,{delay:100});

    //enter password
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']",config.password,{delay:100});
    await page.waitFor(1000);

    //click on login button
    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");
    await page.waitFor(4000);

    //go to compete section
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    //go to manage contest
    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");

    //find no. of pages
    await page.waitForSelector("a[data-attr1='Last']");
    let numpages=await page.$eval("a[data-attr1='Last']",function(atag){
        let totpages=parseInt(atag.getAttribute("data-page"));
        return totpages;
    });
    
    //loop to run over all pages 
    for(let i=1;i<=numpages;i++)
    {
        await handleAllContests(page,browser);
        if(i!=numpages)
        {
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }
    //open each contest and calls saveModerator to add moderators
    async function handleAllContests(page,browser)
    {
        await page.waitForSelector("a.backbone.block-center");
        let curls=await page.$$eval("a.backbone.block-center",function(atags){
            let urls=[];
            for(let i=0;i<atags.length;i++)
            {
                let url=atags[i].getAttribute("href");
                urls.push(url);
            }
            return urls;
        });
        await page.waitFor(1500);
        for(let i=0;i<curls.length;i++)
        {
            let ctab=await browser.newPage();
            await saveModerator(ctab,args.url+curls[i],config.moderator);
            await ctab.waitFor(1200);
            await ctab.close();
        }
    }
    //adds and saves moderator
    async function saveModerator(ctab,fullurl,moderators_id)
    {
        // if you want to add only one moderator, remove for loop statement
        for(let i=0;i<moderators_id.length;i++)
        {
            await ctab.goto(fullurl);
            await ctab.bringToFront();
            await ctab.waitFor(1000);
            await ctab.waitFor(1000);
            await ctab.waitForSelector("#content > div > section > header > div > div.tabs-cta-wrapper > ul > li:nth-child(4)");
            await ctab.click("#content > div > section > header > div > div.tabs-cta-wrapper > ul > li:nth-child(4)");
            await ctab.waitForSelector("input#moderator");
            await ctab.click("input#moderator");
            await ctab.type("input#moderator", moderators_id[i], {delay: 100});
            await ctab.waitFor(1000);
            await ctab.keyboard.press("Tab", { delay: 100 });
            await ctab.keyboard.press("Enter");
        }
    }
}
run();