require('dotenv').config()
const discord = require("discord.js");
const url = process.env.URL.match(/^(https?:\/\/)?discord\.com\/api\/webhooks\/([^\/]+)\/([^\/]+)\/?/);
const client = new discord.WebhookClient({ id: url[2], token: url[3] });

let fetch;
import("node-fetch").then(({default: f}) => fetch = f);
const cheerio = require("cheerio");
const fs = require("fs");

let latest;
(() => {
	if (fs.existsSync('latest.txt')) latest = fs.readFileSync('latest.txt', 'utf8');
})();

setInterval(async () => {
	const data = await (await fetch('https://bilimolimpiyatlari.tubitak.gov.tr/tr/duyurular')).text();
	const $ = cheerio.load(data);
	const title = $(".announcements-list .item.nso h2").first().text();
	const main = $(".announcements-list .item.nso").first().html();
	let body = "";
	$('p', main).each(function() {
		body += $(this).text() + "\n";
	});
	if (!latest) {
		latest = title;
		fs.writeFileSync("latest.txt", latest);
		return;
	}
	if (latest == title) return;
	console.log(title, body);
	latest = title;
	fs.writeFileSync("latest.txt", title);
	
	const embed = new discord.EmbedBuilder()
		.setTitle(title.slice(0, 256))
		.setDescription(body.slice(0, 4096));
	
	client.send({ content: process.env.CONTENT, embeds: [embed] });
}, (process.env.PING_EVERY || 1)*60*1000); // pings every minute
