
import {ssg, html} from "@e280/scute"

const title = "transformer"
const domain = "omnitool.omniclip.app"
const favicon = "/assets/favicon.png"

export default ssg.page(import.meta.url, async orb => ({
	title,
	// favicon,
	dark: true,
	css: "demo/demo.css",
	js: "demo/demo.bundle.min.js",

	head: html`
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Share+Tech&display=swap" rel="stylesheet">
	`,

	socialCard: {
		title,
		description: "transformer library for pixijs",
		themeColor: "#3cff9c",
		siteName: domain,
		image: `https://${domain}${favicon}`,
	},

	body: html`
		<section>
			<h1>Kimura <small>v${orb.packageVersion()}</small></h1>
		</section>
	`,
}))
