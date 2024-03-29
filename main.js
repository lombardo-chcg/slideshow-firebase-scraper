const axios = require('axios')
const cheerio = require('cheerio')
const Firebase = require('firebase')

// create file in root called `firebase-config.js` with the config object from "Add Firebase to your web app" screen
const fbConfig = require('./firebase-config')

Firebase.initializeApp(fbConfig)
const dbRef = Firebase.database().ref('myFirebaseBucket')

const fetchHtml = async (url) => {
	const req = {
		method: "GET",
		url: url,
		headers: { "Accept": "text/html" }
	}
	const r = await axios(req)
	return r.data
}

const extractImgAttrs = (html) => {
	const $ = cheerio.load(html)
	let output = []
	$("img").each((idx, el) => {
		const src = $(el).attr("src")
    const title = $(el).attr("title")
		output.push({
      src: src,
      title: title || ''
    })
	}) 
	return output
}

const sendCollectionToFB = async (collection) => {
	return Promise.all(collection.map(item => dbRef.push(item)))
}

const runJob = async () => {
	// https://nodejs.org/docs/latest/api/process.html#process_process_argv
	const url = process.argv[2] || `http://chicagopast.com/page/1`

	console.log(`🤓 starting scrape job on ${url}`)
	try {
		const html = await fetchHtml(url)
		const images = await extractImgAttrs(html)
		console.log(`🕵️‍♂️  found ${images.length} image tags`)
		console.log(`🔥 sending to Firebase`)
		await sendCollectionToFB(images)
		Firebase.database().goOffline()
		console.log("💃 job completed")
	} catch(e) {
		console.log("🤕 JOB FAILED", e)
		Firebase.database().goOffline()
	}
}

runJob()