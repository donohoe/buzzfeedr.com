var feedR = {
	init: function() {
		this.loadSource();
		this.addEvents();
		this.drawPreviews();
		this.businessModel();
	},
	addEvents: function() {
		var self = this;
		document.getElementById("btn-nyt").addEventListener("click", function(){
			location.hash = "/nyt";
			self.loadSource();
		}, false);
	},
	loadSource: function() {
		var hash = location.hash.replace("#/","");
		this.resetContent();
		switch (hash){
			case "nyt": 
				this.loadNYT();
				break;
			case "cnn": 
				// break;
			case "qz":	
			case "quartz":
			default :
				var items = this.makeClone(Quartz.results); 
				this.loadList(items);
		}
	},
	resetContent: function() {
		document.getElementById("big-photo-item").innerHTML = "";
		document.getElementById("items").innerHTML          = "";
		document.getElementById("side-items").innerHTML     = "";
	},
	drawPreviews: function() {
		var html = "";
		var imgs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
		imgs.sort(function() {return 0.5 - Math.random()});

		for (var i=0; i<20; i++) {
			html += "<img src='img/cats/" + imgs[i] + ".jpeg' title='Just cats, nothing more. People love cats. Click click click.'/>";
		}
		document.getElementById("previews").innerHTML = html;
	},
	loadNYT: function() {
		var script = document.createElement('script');
		script.src = 'http://json8.nytimes.com/pages/index.jsonp'
		document.getElementsByTagName('head')[0].appendChild(script);
	},
	processQZ: function() {
		
	},
	processNYT: function(json) {
		/* massage data */
		var items = json.items;
		var len = json.items.length;
		for (var i=0; i<len; i++) {
			items[i].content   = items[i].description;
			items[i].permalink = items[i].link;
		}
		this.loadList(items);
	},

	hasImage: function(item) {
		if (item.featuredImage) {
			return true;
		}

		if (item.media && item.media[0] && item.media[0]['media-metadata']) {
			return true;
		}
		return false;
		//http://graphics8.nytimes.com/images/2013/10/14/business/jp-IMF/jp-IMF-moth.jpg
	},

	getSmallImage: function(item) {

		if (item.featuredImage) {
			return item.featuredImage.sizes.small_30.url;
		}

		if (item.media && item.media[0] && item.media[0]['media-metadata']) {
			return item.media[0]['media-metadata'][0].url;
		}
		// item.featuredImage.sizes.small_30.url;
		
		// http://graphics8.nytimes.com/images/2013/10/14/business/jp-IMF/jp-IMF-moth.jpg
		return false;
	},

	loadList: function(items) {
		if (items) {
			// var items = Quartz.results;
			var len = items.length;
			var html = {};

			html.Lead = "";
			html.A = "";
			html.B = "";
			html.C = "";

		//	Randomize order of first 5 items?
			var rnd = [0, 1, 2, 3, 4];
			rnd.sort(function() {return 0.5 - Math.random()});

			for (var i=0; i<len; i++) {

				var item = (i<5) ? items[rnd[i]] : items[i];
				var skip = this.isSkippable(item);
				// var item.featuredImage = this.getImage(item);

				item.hasImage = this.hasImage(item);

				if (item.hasImage && !skip) {

					var content = item.content; // .replace(/<p>/g, "").replace(/<\/p>/g, "");
					item.counts = {};

					item.counts.character = this.getCharacterCount(content);
					item.counts.word      = this.getWordCount(content);
					item.counts.image     = this.getImageCount(content);
					item.counts.sentence  = this.getSentenceCount(content);
					item.counts.paragraph = this.getParagraphCount(content);

					item.firstLine = item.content.split(".")[0].replace("<p>", "");
					item.firstLine = (item.featuredImage) ? item.featuredImage.caption : item.description.split(".")[0];
					item.authors   = this.getAuthors(item.byline);
					item.image     = this.getSmallImage(item);//item.featuredImage.sizes.small_30.url;

					function pad(n){return n<10 ? '0'+n : n}
					
					var ts;
					if (item.date) {
						ts = new Date(item.date.published);
					} else {
						ts = new Date(item.pubdate);
					}
					item.ts = pad(ts.getHours()) + ":" + pad(ts.getMinutes());

					if (item.taxonomies) {
						if (item.taxonomies.kicker) {
							item.kicker = item.taxonomies.kicker[0].name;
						}
						item.flourish = this.getFlourish(item.taxonomies);
					}

					item.summary = "";
					item.content = "";
					item.title = this.getTitle(item);

					if (html.Lead == "") {
						html.Lead = this.createLead(item);
					} else {
						html.A += this.createItem(item);
					}

				}
			}

		//	Side Items

			var list = items.slice(len-10, len);
			for (var i=0; i<list.length; i++) {
				var item = list[i];
				var skip = this.isSkippable(item);
				if (item.hasImage && !skip) {
					html.B = this.createSideItem(item) + html.B;
				}
			}

			document.getElementById("big-photo-item").innerHTML = html.Lead;
			document.getElementById("items").innerHTML          = html.A;
			document.getElementById("side-items").innerHTML     = html.B;
		}
	},

	isSkippable: function(item) {
		var words = [ "death", "dead", "murder", "suicide", "killed", "strangled" , " sex" , "joking", "baby", "infant", "violent", "violance", "explosion", "shooting", "genocide", "racist", "racism", "massacre", "rape", "decompose", "body" ]; /* its depressing that i have to cosnider these terms. the world can be terrible */
		var len = words.length;
		var title = item.title.toLowerCase();
		for (var i=0; i<len; i++) {
			if (title.indexOf(words[i])>0) {
				return true;
			} 
		}
		return false;
	},
	getTitle: function(item) {
		var c = item.counts;

		var usePhrase = "paragraphs";
		var useNumber = c.paragraph;
		var rnd = [Math.floor(Math.random()*10)];

		if (c.image > 3) {
			usePhrase = "images";
			useNumber = c.image;
		} else {

			if (rnd<5) {
				usePhrase = "sentences";
				useNumber = c.sentence;
			}
			if (rnd>7) {
				usePhrase = "words";
				useNumber = c.word;
			}
		}

		var adjectives = [ "reflective", "cutsy", "steamroller", "dangerous", "crazy", "well written", "correlated", "wonderful", "unlikley", "inapropriate", "wild", "bewildering", "rocky", "factual", "edited", "spell-checked", "astonishing", "business-affirming", "rarely seen", "famous", "drunken", "smashing", "rejuvenating", "rollercoaster", "moving", "heartbreaking", "medicinal", "delicate"];;
		var adj = adjectives[Math.floor(Math.random()*adjectives.length)];
		if (adj.length > 1) {
			 adj += " ";
		}

		if (useNumber == 1) {
			usePhrase = usePhrase.slice(0, -1);
		}

		return this.capitaliseTitle(useNumber + " " + adj + usePhrase + " on how " + item.title);
	},
	getCharacterCount: function(content) {
		var content = content.replace(/<p>/g, "").replace(/<\/p>/g, "");
		return content.length; 
	},
	getWordCount: function(content) {
		return content.split(' ').length;
	},
	getSentenceCount: function(content) {
		return content.split('.').length;
	},
	getParagraphCount: function(content) {
		return content.split('<p>').length;
	},
	getImageCount: function(content) {
		return content.split('<img').length + 1;
	},
	getAuthors: function(byline) {
		var credit = "";

		if (typeof byline == "string") {
			return this.capitaliseTitle(byline.toLowerCase().replace("by ", ""));
		}

		if (byline.authors) {

			var len = byline.authors.length;
			for (var i=0; i<len; i++) {
				credit += "<a class='authors' target='_blank' href='" + byline.authors[i].url + "'>";
				if (i>0) {
					credit += " and ";
				}
				credit += byline.authors[i].name + "</a>";
			}
		} else {
			credit = "Somebody";
		}
		return credit;
	},
	createLead: function(item) { /* times like this i wish i used underscore.js, right? */

		var image = "";
		
		if (item.image.indexOf("nytimes.com")>0) {
			item.image = item.image.replace("moth-v2.jpg", "articleLarge");
			item.image = item.image.replace("moth-v1.jpg", "articleLarge");
			item.image = item.image.replace("moth.jpg", "articleLarge.jpg");
		} else {
			item.image = item.image + "&w=740";
		}

		html = "";
		html += "<div class='photo-wrapper'>\n";
		html += "	<img src='" + item.image + "'>\n";
		html += "</div>\n";

		item.kicker = item.kicker || "First";
		if (item.kicker) {
			html += "<div class='photo-kicker'>\n";
			html += "	<a target='_blank' href='" + item.permalink + "'><h4>" + item.kicker + "</h4></a>\n";
			html += "</div>\n";
		}

		html += "<div class='photo-title'>\n";
		html += "	<a target='_blank' href='" + item.permalink + "'><h2>" + item.title + "</h2></a>\n";
		html += "</div>\n";
		return html;
	},
	createItem: function(item) {

		html = "";
		html += "<li class='post'>\n";
		html += "	<div class='thumbnail" + ((item.flourish) ? " circle" : "") + "' data-title='" + item.flourish + "'>\n";
		html += "		<a target='_blank' href='" + item.permalink + "'>\n";
		html += "			<div style='position:relative;'>\n";
		html += "				<img src='" + item.image + "'>\n";
		html += "			</div>\n";
		html += "		</a>\n";
		html += "	</div>\n";
		html += "	<div class='details'>\n";
		html += "		<h2>\n";
		html += "			<a target='_blank' href='" + item.permalink + "'>" + item.title + "</a>\n";
		html += "		</h2>\n";
		html += "		<p class='description'>\n";
		html += "			<b>" + item.firstLine + "</b>\n";
		html += "		</p>\n";
		html += "		<p class='meta'>\n";
		html += "			<span class='generic-image icon'></span>\n";
		html += "			" + item.authors + "\n";
		html += "			<span class='time-image icon'></span>\n";
		html += "			<span class='timestamp'>" + item.ts + "</span>\n";
		html += "			<span class='tweet'><a href='" + this.getTweetLink(item) + "' target='_blank'>Tweet</a></span>\n";
		html += "		</p>\n";
		html += "	</div>\n";
		html += "</li>\n";
		return html;
	},
	createSideItem: function(item) {

		if (item.image.indexOf("nytimes.com")>0) {
			item.image = item.image.replace("moth-v2.jpg", "articleLarge");
			item.image = item.image.replace("moth-v1.jpg", "articleLarge");
			item.image = item.image.replace("moth.jpg", "articleLarge.jpg");
		} else {
			item.image = item.image + "&w=340";
		}

		html = "";
		html += "<li class='side-post'>\n";
		html += "	<div class='side-thumbnail'>\n";
		html += "		<a target='_blank' href='" + item.permalink + "'>\n";
		html += "			<img src='" + item.image + "'>\n";
		html += "		</a>\n";
		html += "	</div>\n";
		html += "	<div class='side-details'>\n";
		html += "		<h2>\n";
		html += "			<a target='_blank' href='" + item.permalink + "'>" + item.title + "</a>\n";
		html += "		</h2>\n";
		html += "		<p class='meta'>\n";
		html += "			<span class='generic-image icon'></span>\n";
		html += "			" + item.authors + "\n";
		html += "			<span class='time-image icon'></span>\n";
		html += "			<span class='timestamp'>" + item.ts + "</span>\n";
		html += "			<span class='tweet'><a href='" + this.getTweetLink(item) + "' target='_blank'>Tweet</a></span>\n";
		html += "		</p>\n";
		html += "	</div>\n";
		html += "</li>\n";
		return html;
	},
	capitaliseTitle: function (title) {
	    var words = title.split(" ");
		var result = "";
		for (var i=0; i<words.length; i++) {
			result += this.capitaliseFirstLetter(words[i]) + " ";
		}
		return result;
	},
	capitaliseFirstLetter: function (string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	},
	getTweetLink: function(item) {
		var title = "\"" + item.title + "\"";
		if (title.length <= 85) {
			title += " via http://buzzfeedr.com";
		}
		return "https://twitter.com/share?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(item.permalink);
	},
	getFlourish: function(taxonomies) {
		var tags = taxonomies.tags;
		var len = tags.length;
		for (var i=0; i<len; i++) {
			var tag = tags[i];
			if (tag.name.length<=3 || tag.name=="Google" || tag.name=="Apple") {
				return tag.name;
			}
		}
		return "";
	},
	businessModel: function() {
		var fn = [ "batman.png",  "rem.jpg", "ipod.gif", "tf.jpg" ];
		var img = fn[Math.floor(Math.random()*fn.length)];
		document.getElementById("photo-side").innerHTML = "<div class='featured-blurb'>Advertorial</div><img title='Click! Click! Click!' src='img/bm/" + img + "'/>";
	},
	makeClone: function(obj){
	    if(obj == null || typeof(obj) != 'object')
	        return obj;

	    var temp = obj.constructor(); // changed

	    for(var key in obj)
	        temp[key] = this.makeClone(obj[key]);
	    return temp;
	}
};

// function onReady ( callback ){
//     var addListener = document.addEventListener || document.attachEvent,
//         removeListener =  document.removeEventListener || document.detachEvent
//         eventName = document.addEventListener ? "DOMContentLoaded" : "onreadystatechange"
// 
//     addListener.call(document, eventName, function(){
//         removeListener( eventName, arguments.callee, false )
//         feedR.init();
//     }, false )
// }

function jsonFeedCallback(json) {
	feedR.processNYT(json);
}

feedR.init();
