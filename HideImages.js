// NAME: HideImages
// AUTHOR: adventuretc, khanhas, OhItsTom
// DESCRIPTION: Throw albums or artists to a trashbin and never see their images again. What works: Almost everything except these which are not implemented yet: filtering of Discography pages, filtering of the Home page, filtering of Playlists (the icon of the playlist on the playlist's page and the playlist icons on artist overview pages). 

/// <reference path="../globals.d.ts" />

(function HideImages() {
	const skipBackBtn = document.querySelector(".main-skipBackButton-button");
	if (!Spicetify.Player.data || !Spicetify.LocalStorage || !skipBackBtn) {
		setTimeout(HideImages, 1000);
		return;
	}
	
	//const sleep = ms => new Promise(r => setTimeout(r, ms));
	
		
	    //class SerializableMap extends Map {

		//toJSON() {
		    //var object = { };
		    //for (let [key, value] of this) object[key] = value;
		    //return object;
		//}

	    //}
	
	class AlbumData
	{
	  //constructor(uri, title, imageUrls)
	  //{
		 //Assign the RGB values as a property of `this`.
		//this.values = [uri, title, imageUrls];
	  //}
	}


	function createButton(text, description, callback) {
		const container = document.createElement("div");
		container.classList.add("setting-row");
		container.innerHTML = `
		<label class="col description">${description}</label>
		<div class="col action"><button class="reset">${text}</button></div>
		`;

		const button = container.querySelector("button.reset");
		button.onclick = callback;
		return container;
	}

	function createSlider(name, desc, defaultVal, callback) {
		const container = document.createElement("div");
		container.classList.add("setting-row");
		container.innerHTML = `
			<label class="col description">${desc}</label>
			<div class="col action"><button class="switch">
			<svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
			${Spicetify.SVGIcons.check}
			</svg>
			</button></div>
		`;

		const slider = container.querySelector("button.switch");
		slider.classList.toggle("disabled", !defaultVal);

		slider.onclick = () => {
			const state = slider.classList.contains("disabled");
			slider.classList.toggle("disabled");
			Spicetify.LocalStorage.set(name, state);
			console.log(name, state);
			callback(state);
		};

		return container;
	}

	function settingsContent() {
		// Options
		header = document.createElement("h2");
		header.innerText = "Options";
		content.appendChild(header);

		content.appendChild(createSlider("hideimages-enabled", "Enabled", trashbinStatus, refreshEventListeners));
		content.appendChild(
			createSlider("TrashbinWidgetIcon", "Show Widget Icon", enableWidget, state => {
				enableWidget = state;
				state && trashbinStatus ? widget.register() : widget.deregister();
			})
		);

		// Local Storage
		header = document.createElement("h2");
		header.innerText = "Local Storage";
		content.appendChild(header);

		content.appendChild(createButton("Export", "Copy all items in trashbin to clipboard, manually save to a .json file.", exportItems));
		content.appendChild(createButton("Import", "Overwrite all items in trashbin via .json file.", importItems));
		content.appendChild(
			createButton("Clear ", "Clear all items from trashbin (cannot be reverted).", () => {
				trashAlbumList = new Map();
				trashSongList = {};
				trashArtistList = {};
				setWidgetState(false);
				putDataLocal();
				Spicetify.showNotification("Trashbin cleared!");
			})
		);
	}

	function styleSettings() {
		let style = document.createElement("style");
		style.innerHTML = `
		.main-trackCreditsModal-container {
			width: auto !important;
			background-color: var(--spice-player) !important;
		}

		.setting-row::after {
		  content: "";
		  display: table;
		  clear: both;
		}
		.setting-row {
		  display: flex;
		  padding: 10px 0;
		  align-items: center;
		  justify-content: space-between;
		}
		.setting-row .col.description {
		  float: left;
		  padding-right: 15px;
		  width: 100%;
		}
		.setting-row .col.action {
		  float: right;
		  text-align: right;
		}
		button.switch {
		  align-items: center;
		  border: 0px;
		  border-radius: 50%;
		  background-color: rgba(var(--spice-rgb-shadow), .7);
		  color: var(--spice-text);
		  cursor: pointer;
		  display: flex;
		  margin-inline-start: 12px;
		  padding: 8px;
		}
		button.switch.disabled,
		button.switch[disabled] {
		  color: rgba(var(--spice-rgb-text), .3);
		}
		button.reset {
		  font-weight: 700;
		  font-size: medium;
		  background-color: transparent;
		  border-radius: 500px;
		  transition-duration: 33ms;
		  transition-property: background-color, border-color, color, box-shadow, filter, transform;
		  padding-inline: 15px;
		  border: 1px solid #727272;
		  color: var(--spice-text);
		  min-block-size: 32px;
		  cursor: pointer;
		}
		button.reset:hover {
		  transform: scale(1.04);
		  border-color: var(--spice-text);
		}`;
		content.appendChild(style);
	}

	function initValue(item, defaultValue){
	
		try {
			// Deserializing a map requires a different method.
			if (item == "TrashAlbumList")
			{
				const value  = new Map(JSON.parse(Spicetify.LocalStorage.get(item)));
				return value ?? defaultValue;
			}
			else
			{
				const value = JSON.parse(Spicetify.LocalStorage.get(item));
				return value ?? defaultValue;
			}
		} catch {
			return defaultValue;
		}
	}

	// Settings Variables - Initial Values
	let trashbinStatus = initValue("hideimages-enabled", true);
	let enableWidget = initValue("TrashbinWidgetIcon", true);

	// Settings Menu Initialization
	const content = document.createElement("div");
	styleSettings();

	
	
	// We will hide the current playing song image dynamically.
	const styleToHideNowPlayingTrackCoverArtImage = document.createElement("style");
	styleToHideNowPlayingTrackCoverArtImage.innerHTML = `
		
		
		.main-nowPlayingWidget-coverArt, /* ebben biztos vagyok hoyg a jelenleg szóló szám cover artját tartalmazza  */
		.main-nowPlayingView-coverArt /* ebben nem vagyok biztos hogy mi  */
		{
			display: none !important;
		}
		
		`;
	
	// Beleütköztem egy nehézségbe: A Queue és hasonló track list view-kban nem látszik a HTML-ben az adott listázott track URI-je hanem csak a címe és a képe. :(
	// Egy megoldás: El kéne menteni a blokkolt számoknál az ablum nevét és előadóját stringként, és aztán ha megtaláljuk így itt akkor azt tiltani.
	// úgy kéne csinálni hogy amikor page change event van és az egy tracklistview-t tartalmaz akkor végigmegy az elemeken és ha az adott elem feketelistás akkor arra rárak egy class-t pl. "blockedTrackListViewImage" és van egy statikus CSS lap ami azokat blokkolja.
	// Hogy ezt hogyan lehet:
	// https://spicetify.app/docs/development/api-wrapper/methods/player/#addeventlistener
	// "appchange" type when user changes page.
	// Register a listener that will be called when player changes track
// Spicetify.Player.addEventListener("songchange", (event) => {
//     console.log(event.data);
// });
	
	// TODO: Ez a fenti.
	// TODO: Az artist page és album page-ek alján lévő album cover art-okat el kéne rejteni.
	
	const styleToHideTopBackgroundImageOnArtistPage = document.createElement("style");
	styleToHideTopBackgroundImageOnArtistPage.innerHTML = `
		.main-entityHeader-background.main-entityHeader-gradient
		{
			opacity: 0.0;
			background-image: none;
		}
		`;
	
	const styleToHideCoverArtImageOnAnAlbumPage = document.createElement("style");
	styleToHideCoverArtImageOnAnAlbumPage.innerHTML = `
		.album-albumPage-sectionWrapper .main-entityHeader-image /* ez az album view-ban lévő main image-t kiválasztja  */
		{
			display: none !important;
		}`;
	
	// Hide all other song images continuously. (album view main album image, playlist view main image)
	const styleToHideCoverArtImages2 = document.createElement("style");
	styleToHideCoverArtImages2.innerHTML = `
		
		.main-trackList-rowSectionStart .main-trackList-rowImage.force-hide-image  /* ebben biztos vagyok hogy a Queue és hasonló track list view-kban ez kiválasztja a cover art képet. Ezeket permanens módon elrejtem amíg nincs rá jobb megoldás.  */
		{
			display: none !important;
		}`;
		// Ne hagyj vesszőt a CSS selector végén mert úgy nem fog működni. 
		// .cover-art-image,     /* ebben nem vagyok biztos hogy mi  */
		// .cover-art,            /* ebben nem vagyok biztos hogy mi  */
		// .main-coverSlotExpanded-container,         /* ebben nem vagyok biztos hogy mi  */
		// .main-playlistEditDetailsModal-albumCover,   /* ebben nem vagyok biztos hogy mi  */
	document.body.appendChild(styleToHideCoverArtImages2);
	
	
	
	function sanitizePage()
	{
	
			//ezt fogod kapni:
			//{
				//<div class="main-trackList-rowSectionVariable" role="gridcell" aria-colindex="3" tabindex="-1"><span data-encore-id="type" class="Type__TypeElement-sc-goli3j-0 TypeElement-mesto-type"><a draggable="true" class="standalone-ellipsis-one-line" dir="auto" href="/album/4PEATKNNKmWcSoRLyVQDRS" tabindex="-1">I Know</a></span></div>
			//}
			
			const albumLinks = document.querySelectorAll("div.main-trackList-rowSectionVariable > span > a");
			
			albumLinks.forEach((userItem) =>
			{
				const uri = "spotify:album:" + userItem.getAttribute("href").replace('/album/', '');
				//const uri = `spotify:artist:${data.uri.split(":")[3]}`;
				if (trashAlbumList.has(uri))
				{
					//userItem.innerHTML = userItem.innerHTML + " TO BE CENSORED";
					
					//const rows = document.querySelectorAll(".main-trackList-rowSectionStart .main-trackList-rowImage");
					const rows = userItem.parentElement.parentElement.parentElement.querySelectorAll(".main-trackList-rowImage");
					// asszem értem hogy miben tér el a queue és  history page. Abban hogy a histry-n nincs szám a sorok elején.
					
					rows.forEach((row) =>
					{
						if (row.parentElement.parentElement === userItem.parentElement.parentElement.parentElement) // egy ilyen elemről van szó: class="main-trackList-trackListRow main-trackList-trackListRowGrid". És ha ez közös kettőnél akkor tudhatjuk hogy azonos sorban vannak.
						{
							//row.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> mégis működne, de azt kérem hogy inkább a src legyen ""-re állítva mert az szebb megoldás szerintem. Nem távolítja el a kép helyét csak átállítja a covert-t egy szürke hangjegy ikonra.
							//row.innerHTML  = "";
							row.setAttribute("src", "");
						}
					});
					
				}
				else
				{
					
				}
			});
	}
	
	
		// Function to process the element and remove "src" attribute
	function processElement(element, pageType)
	{
		if (pageType == "tracklistview")
		{
			//await sleep(1000);
			
			const parentRow = element.parentNode.parentNode.parentNode;

			const albumLink = parentRow.querySelector("div.main-trackList-rowSectionVariable > span > a");
			
			if (!albumLink) // Sometimes this is null. So discard that. 
			{
				return;
			}
			
			if (!albumLink.hasAttribute("href"))
			{
				return;
			}
			
			const uri = "spotify:album:" + albumLink.getAttribute("href").replace('/album/', '');
			//const uri = `spotify:artist:${data.uri.split(":")[3]}`;
			if (trashAlbumList.has(uri))
			{
				//albumLink.innerHTML = albumLink.innerHTML + " TO BE CENSORED";
				
				//element.removeAttribute("src");
				
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				element.setAttribute("src", "");
				
				console.log("Removed 'src' attribute from the element. uri: " + uri);
			}
		  
		}
		else if (pageType == "searchpagehighlightedresult")
		{
			//const albumLink = element;
			const albumLink = document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link")[0];
			
			
			//await sleep(1000);
			
			
			console.log("I may remove (context = searchpagehighlightedresult) the  'src' attribute from the element. albumLink.getAttribute(href): " + albumLink.getAttribute("href"));
			
			if (!albumLink.hasAttribute("href"))
			{
				console.log("it works: href was not found, aborting searchpagehighlightedresult.");
				return;
			}
			
			
			// e.g.: href="/album/38xgBOLAcKoYWMSXWUDH1E?highlight=spotify:track:11xC6P3iKYpFThT6Ce1KdG"
			const uri = "spotify:album:" + albumLink.getAttribute("href").split("?")[0].replace('/album/', '');
			//console.log(uri);
			console.log("it works: " + uri);
			if (trashAlbumList.has(uri))
			{
				//albumLink.innerHTML = albumLink.innerHTML + " TO BE CENSORED";
				
				//element.removeAttribute("src");
				
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				
				const cardimage = element.parentElement.parentElement.querySelector(".main-cardImage-imageWrapper.main-card-hero .main-cardImage-image")
				
				if (cardimage)
				{
					cardimage.setAttribute("src", "");
					console.log("Removed 'src' attribute from the element. uri: " + uri);
				}
			}
		}
		
		else if (pageType == "artistoverviewpage")
		{
			//a helyes selector az igazából ez: ".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link"
			
			// Ez kiválasztja az artist overview page-eken lévő albumokat, pontosabban azt az elemet amiben a link van az albumra, a href tartalmazza a link URL-t.  Ha a href rossz akkor hide this.
		
			//await sleep(1000);
			
			
			const albumLink = element;
			
			
			if (!albumLink.hasAttribute("href"))
			{
				return;
			}
			
			
			console.log("I will try to remove the 'src' attribute from the element. albumLink.getAttribute(href): " + albumLink.getAttribute("href") + " (context = artistoverviewpage)");
			
			// e.g.: href="/album/38xgBOLAcKoYWMSXWUDH1E?highlight=spotify:track:11xC6P3iKYpFThT6Ce1KdG"
			const uri = "spotify:album:" + albumLink.getAttribute("href").replace("/album/", "");
			//console.log("debug: " + uri); // ilyeneket ír ki, ami helyes: spotify:album:38xgBOLAcKoYWMSXWUDH1E
			if (trashAlbumList.has(uri))
			//if (true)
			{
				//albumLink.innerHTML = albumLink.innerHTML + " TO BE CENSORED";
				
				//element.removeAttribute("src");
				
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				
				//úgy kell hogy 
				const cardimage = albumLink.parentElement.parentElement.querySelector(".main-cardImage-image")
				
				if (cardimage)
				{
					cardimage.setAttribute("src", "");
					console.log("Removed 'src' attribute from the element. uri: " + uri);
				}
			}
		}
		else if (pageType == "artistoverviewpage_top_background_image")
		{
			//await sleep(1000);
			
			//a helyes selector az igazából ez: ".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link"
			
			// Ez kiválasztja az artist overview page-eken lévő albumokat, pontosabban azt az elemet amiben a link van az albumra, a href tartalmazza a link URL-t.  Ha a href rossz akkor hide this.
		
			
			const topCover = element; //  (".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
			
			//if (!topCover.hasAttribute("href"))
			//{
				//return;
			//}
			
			console.log("I may remove the 'style' attribute from the element. topCover.getAttribute(href): " + topCover.getAttribute("href") + " (context = artistoverviewpage_top_background_image)");
			
			//const uri = "spotify:album:" + topCover.getAttribute("href").replace("/album/", "");
			//if (trashAlbumList.has(uri))
			
			
			//const data = Spicetify.Player.data || Spicetify.Queue;
			//if (!data) return;

			//let artistUri = data.track.metadata["artist_uri"];
			
			const targetElements = document.querySelectorAll("main > section");
			
			if (!targetElements[0])
			{
				return;
			}
			
			const artistUri = targetElements[0].getAttribute("data-test-uri"); // gives "spotify:artist:181bsRPaVXVlUKXrxwZfHK"
			
			
			//if (true)
			if (trashArtistList[artistUri])
			{
				//topCover.innerHTML = topCover.innerHTML + " TO BE CENSORED";
				
				//element.removeAttribute("src");
				
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				
				  //const targetElements = topCover.querySelectorAll(selector);

				  // Process any existing elements on initial setup
				if (topCover)
				{
					topCover.setAttribute("style", "");
					console.log("Removed 'style' attribute and so the background image from the element. uri: " + uri);
				}
				
				  //for (const element of targetElements)
				  //{
					//if (element)
					//{
						//element.setAttribute("src", "");
						//console.log("Removed 'src' attribute from the element. uri: " + uri);
					//}
				  //}
				
			}
		}
	}

	// Function to handle the appearance of target elements in the DOM
	
	
	function handleTargetElements(records, selector, pageType)
	{
		// I have tried everything i could and the lousy MutationObserver only calls the callback once even though it should after every single mutation on the page (which is dozens). There was no .disconnect command anywhere. It just doesnt work.  So I will rewrite the code to use actively called processing methods and only use MutationObserver for the tracklists wich is the only thing that seems to be handled well (possibly due to the selector being short, only having a single class).  The weird thing is, when i run the same selector in the console, after the page has loaded, it always works and returns 42 or so results. I'm talking about this one: document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult"). But the same thing never works if inside the mutationobserver callback. It says selectorMatchesTheseElementsNodeList.length == 0 and it only gets called once per search-page load (which is erroneous).
		
		//await sleep (600);
		 //795
		//In JavaScript, I rewrite every function so that it can end as soon as possible. You want the browser back in control so it can make your DOM changes.
		
		//Every time I've wanted a sleep in the middle of my function, I refactored to use a setTimeout().
		
		const selectorMatchesTheseElementsNodeList = document.querySelectorAll(selector);
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/NodeList
			//NodeList
				//NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll().
				
				//Note: Although NodeList is not an Array, it is possible to iterate over it with forEach(). It can also be converted to a real Array using Array.from().
		}
		if (selectorMatchesTheseElementsNodeList.length == 0)
		{
			console.log("[DEBUG] selectorMatchesTheseElements was empty. Selector was: "  + selector);
			return;
		}
		
		const selectorMatchesTheseElements = Array.from(selectorMatchesTheseElementsNodeList); // to be able to use the Array.includes() fn.
		
		for (const record of records)
		{
			//if (record.addedNodes.length > 0) 
			//if (record.type === "childList" && record.addedNodes.length > 0) 
			if (record.type === "childList") 
			{
			      // Check if the added nodes include the target element with the class name
			      //for (const node of record.addedNodes) {
				//if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains(selector)) {
				   //Process the element
				  //processElement(node);
				//}
			      //}
			      
			      //https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
			      //The matches() method of the Element interface tests whether the element would be selected by the specified CSS selector.
			      
			      //          targetNode.ownerElement vagy targetNode kell ide?
			      
				for (const node of record.addedNodes)
				{
					//if ((node.nodeType === Node.ELEMENT_NODE) && node.matches(selector))
					if (node.nodeType === Node.ELEMENT_NODE)
					{
						//if ( node.matches(selector)) // There's a serious problem with the .matches method: It mathes elements locally, without a context, while I need them matched globally, in the context of the Document. The whatwg spec is not clear about this but suggests it matches locally. The MDN is even less clear about it.  My experience is clear that it matches locally.  
						//My solution: if (document.querySelectorAll(selector).includes(node) )
						
						if (selectorMatchesTheseElements.includes(node) )
						//if (true)
						{
							console.log("it works v2 " + selector);
							  // Process the element
							
							processElement(node, pageType);
						}
					}
					//https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord/type
					//if (node.ownerElement)
					//if (node.ownerElement.matches(selector))
					else if ((node.nodeType === Node.ATTRIBUTE_NODE)  && selectorMatchesTheseElements.includes(node.ownerElement))
					//else if (true)
					{
						console.log("it works v4 " + selector);
						//Process the element
						
						processElement(node.ownerElement, pageType);
					}
				}
			}
			else if (record.type === "attributes")
			{
				if (record.attributeName != "src" && record.attributeName != "style") // discard this because I will modify src and it would get into an infinite recursive loop.
				{
						
						
					    //https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord/target
					    //MutationRecord: target property
					    //The MutationRecord read-only property target is the target (i.e. the mutated/changed node) of a mutation observed with a MutationObserver.
					    //Value
					    //The Node that the mutation affected.
						///If the record's type is "attributes", this is the Element whose attributes changed.
						//If the record's type is "characterData", this is the CharacterData node.
						//If the record's type is "childList", this is the Node whose children changed.
					    
					    
						const targetNode = record.target;
						//if ((targetNode.nodeType === Node.ELEMENT_NODE)  && targetNode.matches(selector))
						if ( selectorMatchesTheseElements.includes(targetNode) )
						{
							console.log("it works v3 " + selector);
							// Process the element
							
							//setTimeout(processElement(targetNode, pageType),1000);
							processElement(targetNode, pageType);
						}
						
						//https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord/type
						//if ((targetNode.nodeType === Node.ATTRIBUTE_NODE)  && targetNode.ownerElement.matches(selector))
						//if (targetNode.ownerElement)
						//if (targetNode.ownerElement.matches(selector))
						//{
							//console.log("it works 4 " + selector);
							   //Process the element
							  //processElement(targetNode.ownerElement, pageType);
						//}
				}
			}
			else if (record.type === "characterData")
			{
				console.log("DEBUG: " + record);
			}
		}
	}


     

		//I have used it in several projects.

		//function waitForElm(selector) {
		    //return new Promise(resolve => {
			//if (document.querySelector(selector)) {
			    //return resolve(document.querySelector(selector));
			//}

			//const observer = new MutationObserver(mutations => {
			    //if (document.querySelector(selector)) {
				//resolve(document.querySelector(selector));
				//observer.disconnect();
			    //}
			//});

			//observer.observe(document.body, {
			    //childList: true,
			    //subtree: true
			//});
		    //});
		//}

		//To use it:

		//waitForElm('.some-class').then((elm) => {
		    //console.log('Element is ready');
		    //console.log(elm.textContent);
		//});

		//Or with async/await:

		//const elm = await waitForElm('.some-class');

	// Recursive function to wait for the element and process it
	function waitForElement(selector, pageType)
	{
		const targetElements = document.querySelectorAll(selector);

		 
		// Process any existing elements on initial setup
		for (const element of targetElements)
		{
			processElement(element, pageType);
		}

		// Set up a MutationObserver to monitor for changes to the DOM
		const observer = new MutationObserver((mutationsList) =>
		{
			handleTargetElements(mutationsList, selector, pageType);
			
					//Parameters
					//callback
					
					    //A function which will be called on each DOM change that qualifies given the observed node or subtree and options.
					
					    //The callback function takes as input two parameters:
					
					        //An array of MutationRecord objects, describing each change that occurred; and
					        //the MutationObserver which invoked the callback. This is most often used to disconnect the observer using MutationObserver.disconnect().
					
					    //See the examples below for more details.
					
		});

		  // Start observing the whole document for any changes
		  //observer.observe(document, { childList: true, subtree: true });
		  //observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
		  //observer.observe(document, { childList: true, subtree: true, attributes: true }); // ez nem jó mert a src attribútumot én megmásítom rajta és akkor végtelen loop-ba kerül ez a cucc. Más megoldás kéne. Vagy ignorálni kell a src változásokat. 
		  
		// talán ez a baj: https://stackoverflow.com/questions/45117558/how-can-i-observe-the-whole-body-with-mutationobserver -> nem.
		
		//ez a baj:  
		//https://stackoverflow.com/questions/65691170/javascript-mutationobserver-misses-mutations
		// cím: JavaScript, MutationObserver misses mutations
		// válasz: The usual reason is that a parent/ancestor of that element was replaced. – wOxxOm

		  
		var container = document.documentElement || document.body;
		console.log("DEBUG: container = " + container);
		
		observer.observe(container, { childList: true, subtree: true, attributes: true, characterData:true }); // ez nem jó mert a src attribútumot én megmásítom rajta és akkor végtelen loop-ba kerül ez a cucc. Más megoldás kéne. Vagy ignorálni kell a src változásokat. 
		  
		//https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
		//observer.disconnect();
		//setTimeout(observer.disconnect(), 10000);
	}

	function insertObservers()
	{
		// Ami most jön az a search page-re vonatkozik de azon belül csak a kiemelt találatra.
			waitForElement(".main-trackList-rowImage", "tracklistview");
			
			document.documentElement.addEventListener("click", documentClickEventListener); // this is to be able to react to when the user presses a button on the search page and the DOM is updated. E.g. they she goes from "All" to "Playlists" and back. Without this, the newly loaded DOM would never be sanitized.
			
			//waitForElement(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult");
				//debug: document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult").forEach((node) => { processElement(node, "searchpagehighlightedresult")} )
				
			//waitForElement(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artistoverviewpage");
				//debug: document.querySelectorAll(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artistoverviewpage")} )

			//waitForElement("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artistoverviewpage"); // ezt igazából az album page-re használom most.
				//debug: document.querySelectorAll("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artistoverviewpage")} )
			
			//waitForElement(".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
	}
	function documentClickEventListener()
	{
		tryToSanitizePage();
			
		setTimeout(() =>
		{
			tryToSanitizePage();
		}
		, 500);
		setTimeout(() =>
		{
			tryToSanitizePage();
		}
		, 1000);
		setTimeout(() =>
		{
			tryToSanitizePage();
		}
		, 1500);
	}
	function tryToSanitizePage()
	{
		processElementsBatch(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult");
		
		//waitForElement(", "");
			//debug: document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult").forEach((node) => { processElement(node, "searchpagehighlightedresult")} )
			
		processElementsBatch(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artistoverviewpage");
			//debug: document.querySelectorAll(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artistoverviewpage")} )

		processElementsBatch("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artistoverviewpage"); // ezt igazából az album page-re használom most.
			//debug: document.querySelectorAll("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artistoverviewpage")} )
		
		processElementsBatch(".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
	}
	function processElementsBatch(selector, pageType)
	{
		// Ami most jön az a search page-re vonatkozik de azon belül csak a kiemelt találatra.
		const targetElements = document.querySelectorAll(selector);
		
		// Process any existing elements on initial setup
		for (const element of targetElements)
		{
			processElement(element, pageType);
		}
	}
	
	setTimeout(() =>
	{
		insertObservers();
		
	}
	, 2000);
	
	
		// "appchange" when user changes page.
	
	Spicetify.Player.addEventListener("appchange", ({ data: data }) =>
	{
		console.log(data.path);
		
		if (data.isEmbeddedApp === true) return;
		// if (data.path !== "queue") return;
		
		if (data.path.startsWith("/queue"))
		{
			//sanitizePage();
		}
		else
		if (data.path.startsWith("/playlist"))
		{
			tryToSanitizePage();
			
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 500);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1000);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1500);
		}
		else
		if (data.path.startsWith("/history"))
		{
			//sanitizePage();
		}
		else
		if (data.path.startsWith("/search"))
		{
			tryToSanitizePage();
			
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 500);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1000);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1500);
		}
		else
		if (data.path.startsWith("/artist"))
		{
			tryToSanitizePage();
			
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 500);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1000);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1500);
			
			
			
			const targetElements = document.querySelectorAll("main > section");
			
			if (!targetElements[0])
			{
				return;
			}
			
			const artistUri = targetElements[0].getAttribute("data-test-uri"); // yields "spotify:artist:181bsRPaVXVlUKXrxwZfHK"
			
			if (trashArtistList[artistUri])
			{
				document.body.appendChild(styleToHideTopBackgroundImageOnArtistPage);
			}
			else
			{
				document.body.removeChild(styleToHideTopBackgroundImageOnArtistPage);
			}
		}
		else
		if (data.path.startsWith("/album"))
		{
			// This is for the suggested similar albums section that appear at the bottom. 
			tryToSanitizePage();
			
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 500);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1000);
			setTimeout(() =>
			{
				tryToSanitizePage();
			}
			, 1500);
			
			
			// this is for the main album image (the cover).
			const uri = "spotify:album:" + data.path.replace('/album/', '');
			//const uri = `spotify:artist:${data.uri.split(":")[3]}`;
			if (trashAlbumList.has(uri))
			{
				document.body.appendChild(styleToHideCoverArtImageOnAnAlbumPage);
			}
			else
			{
				document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
			}
		}
		else
		{
			document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
		}
		
		// data.path érték példák:
			// /queue
			// /history
			// /album/dasj9dasjasd234
			// /artist/dasj9dasjasd234
			// /playlist/dasj9dasjasd234
			// /collection/tracks // ez a liked songs page.
			// /collection/local-files 
	
	
		// const uri = `spotify:artist:${data.uri.split(":")[3]}`;
		
		//Spicetify.showNotification(data.path);
		
		
		
	      //const {Type} = Spicetify.URI;
	      //const uri = Spicetify.URI.fromString(uris[0]);
	      //switch (uri.type) {
		//case Type.TRACK:
		//case Type.LOCAL:
		//case Type.LOCAL_ARTIST:
		//case Type.LOCAL_ALBUM:
		//case Type.ALBUM:
			//Spicetify.showNotification(data.path);
		//case Type.ARTIST:
		//case Type.PLAYLIST:
		//case Type.PLAYLIST_V2:
		//case Type.SHOW:
		//case Type.EPISODE:
		//case Type.PROFILE:
		//case Type.FOLDER:
		  //return true;
		//default:
		  //return false;
	      //}
	});
	
	//document.querySelectorAll(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link")
		//-> ez még működik, de más nem. Ez 48 node-ot ad vissza.
	
	
	
	//Spicetify.Player.addEventListener("appchange", (event) =>
	//{
		//console.log(event.data.path);
		
		// console.log(event.data.URI.Type.TRACK);
		// console.log(event.data.URI.Type.TRACK);
		
		
		//const currentURI = Spicetify.Player.data?.page_metadata["context_uri"]; // Player.data.page_metadata.entity_uri: string; már ha létezik. Vagy pedig context_uri, talán az jó lesz. 
		// Kipróbáltam ezt és üres adatot tartalmazott sajnos: Spicetify.Player.data?.page_metadata.entity_uri, ez is: context_uri,
		// ezeket nézd: https://spicetify.app/docs/development/api-wrapper/types/metadata
		// https://github.com/search?q=appchange+Spicetify.Player.addEventListener&type=code
		// https://github.com/HenryNguyen5/spicetify-cli/blob/674ecd66c07edb2b261dfb27709822e0a4ff821e/Extensions/trashbin.js#L136
		 //Spicetify.showNotification(currentURI);
		// vagy:
		// event.data.path // App href path
		
	//});
		
	
		
	settingsContent();

	const trashbinIcon =
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentcolor"><path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z"/></svg>';

	const THROW_TEXT = "Hide this Image";
	const UNTHROW_TEXT = "Unhide this Image";

	new Spicetify.Menu.Item(
		"Hide Images",
		false,
		() => {
			Spicetify.PopupModal.display({
				title: "Hide-Images Settings",
				content
			});
		},
		trashbinIcon
	).register();


	const widget = new Spicetify.Playbar.Widget(
		THROW_TEXT,
		trashbinIcon,
		async (self) => {
			
			let albumUri = Spicetify.Player.data.track.metadata["album_uri"];
			console.log ("debug, albumUri: "+ albumUri);
			
			let contains = trashAlbumList.has(albumUri);
			let isBannedAlbum = contains;
			
			let meta = await fetchAlbum(albumUri); // WIP
		
			//const uri = Spicetify.Player.data.track.uri;
			//const uriObj = Spicetify.URI.fromString(uri);
			//const type = uriObj.type;

			if (!isBannedAlbum) {
				//trashSongList[uri] = true;

				
				const album = new AlbumData();
				
				 album.uri= meta.uri;
				 album.title= meta.title;
				 album.imageUrls= meta.imageUrls;
				
				trashAlbumList.set(meta.uri, album);

				
				document.body.appendChild(styleToHideCoverArtImageOnAnAlbumPage); // -> lehet hogy hibából távolítjuk el de ez nem baj mert most nem akarom megírni a checking logikát hogy ha az ember éppen egy album page-en van és az az album azonos mint a jelenleg letiltásra kerülő szám akkor rejtsük el azonnal az album page -en lévő képet is. Inkább rejtsük el mindig azt, mint könnyű megoldás. False pozitív eredményeket fog adni gyakran de ez nem gond. Néha hibából el fogja rejteni a cover art-ot. 
				document.body.appendChild(styleToHideNowPlayingTrackCoverArtImage);
				
				Spicetify.showNotification("Album added to trashbin " + meta.uri);
					
				
				setWidgetState(true);
				//if (shouldSkipCurrentTrack(uri, type))
					//Spicetify.Player.next();
			} else {
				trashAlbumList.delete(meta.uri);
				setWidgetState(false);
				
				//document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage); -> lehet hogy hibából távolítjuk el és látszódna egy amúgy blokkolandó kép, szóval ne távolítsuk el. 
				document.body.removeChild(styleToHideNowPlayingTrackCoverArtImage);
				Spicetify.showNotification("Album removed from trashbin");
			}

			putDataLocal();
		},
		false,
		false,
		enableWidget
	);

	// LocalStorage Setup
	let trashAlbumList = initValue("TrashAlbumList", new Map());
	let trashSongList = initValue("TrashSongList", {});
	let trashArtistList = initValue("TrashArtistList", {});
	// let userHitBack = false;
	const eventListener = () => (userHitBack = true);

	putDataLocal();
	refreshEventListeners(trashbinStatus);
	setWidgetState(
		trashSongList[Spicetify.Player.data.track.uri],
		Spicetify.URI.fromString(Spicetify.Player.data.track.uri).type !== Spicetify.URI.Type.TRACK
	);
	
	new Spicetify.ContextMenu.Item(
		"Hide this Image",
		async ([uri], [uid] = [], context = undefined) => {
			const type = uri.split(":")[1];
			let meta;
			switch (type) {
				case Spicetify.URI.Type.ALBUM:
					meta = await fetchAlbum(uri);
					break;
				//case Spicetify.URI.Type.ARTIST:
					//meta = await fetchArtist(uri);
					//break;
				//case Spicetify.URI.Type.SHOW:
					//meta = await fetchShow(uri);
					//break;
				//case Spicetify.URI.Type.EPISODE:
					//meta = await fetchEpisode(uri);
					//break;
				//case Spicetify.URI.Type.PLAYLIST:
				//case Spicetify.URI.Type.PLAYLIST_V2:
					//meta = await fetchPlaylist(uri);
					//break;
			}
			//LIST.addToStorage(meta);
			
			
			
			const foundElement = trashAlbumList.has(meta.uri);
			
			if (!foundElement)
			{
				//trashAlbumList[meta.title] = true;
				
				const album = new AlbumData();
				
				 album.uri= meta.uri;
				 album.title= meta.title;
				 album.imageUrls= meta.imageUrls;
				
				//let album = {
				 //"uri": meta.uri,
				 //"title": meta.title,
				 //"imageUrls": meta.imageUrls
				//}
				
				trashAlbumList.set(meta.uri, album);

				
				document.body.appendChild(styleToHideCoverArtImageOnAnAlbumPage);
				Spicetify.showNotification("Album added to trashbin " + meta.title);
			}
			else
			{
				trashAlbumList.delete(meta.uri);
				
				//trashAlbumList.remove(foundElement);
				//const index = trashAlbumList.indexOf(foundElement);
				//delete trashAlbumList[index];
				// az a baj ezzel hogy lesz egy nullpointer benne az arrayban a delete után. Istenem hogy ez a nyelv mekkora egy fos. 
				
				
				setWidgetState(false);
				document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
				Spicetify.showNotification("Album removed from trashbin");
			}
			putDataLocal(); // save the state.
		},
		([uri]) => {
			const type = uri.split(":")[1];
			switch (type) {
				//case Spicetify.URI.Type.TRACK:
				case Spicetify.URI.Type.ALBUM:
				//case Spicetify.URI.Type.ARTIST:
				//case Spicetify.URI.Type.SHOW:
				//case Spicetify.URI.Type.EPISODE:
				//case Spicetify.URI.Type.PLAYLIST:
				//case Spicetify.URI.Type.PLAYLIST_V2:
					return true;
			}
			return false;
		},
		trashbinIcon
	).register();
	
	

	const fetchAlbum = async uri => {
		const { getAlbum } = Spicetify.GraphQL.Definitions;
		const { data } = await Spicetify.GraphQL.Request(getAlbum, { uri, locale: Spicetify.Locale.getLocale(), offset: 0, limit: 10 });
		const res = data.albumUnion;
		// https://github.com/tr1ckydev/spotifly/blob/main/src/types/album.ts
		//{
			 //spotifly
			//Spotify with wings !
			//Spotify library in typescript without using the Spotify Web API.
			
			    //No authentication required.
			    //Super fast like the Web API.
			    //Lightweight with zero dependencies.
			    //Strongly typed API functions.
			    //Personalized fetching and automation using cookies.
			    //Automatic internal token refreshing.
			
		//}
		
		return {
			uri,
			title: res.name,
			description: "Album",
			imageUrls: res.coverArt.sources
			//imageUrl: res.coverArt.sources.reduce((prev, curr) => (prev.width > curr.width ? prev : curr)).url
		};
	};

	function refreshEventListeners(state) {
		trashbinStatus = state;
		if (state) {
			skipBackBtn.addEventListener("click", eventListener);
			Spicetify.Player.addEventListener("songchange", watchChange);
			enableWidget && widget.register();
			watchChange();
		} else {
			skipBackBtn.removeEventListener("click", eventListener);
			Spicetify.Player.removeEventListener("songchange", watchChange);
			widget.deregister();
		}
	}

	function setWidgetState(state, hidden = false) {
		hidden ? widget.deregister() : enableWidget && widget.register();
		widget.active = !!state;
		widget.label = state ? UNTHROW_TEXT : THROW_TEXT;
	}

	function watchChange() {
		const data = Spicetify.Player.data || Spicetify.Queue;
		if (!data) return;
		
		

		let albumUri = data.track.metadata["album_uri"];
		let contains = trashAlbumList.has(albumUri);
		let isBannedAlbum = contains;
		
		
		const isBanned = trashSongList[data.track.uri] || isBannedAlbum;
		setWidgetState(isBanned, Spicetify.URI.fromString(data.track.uri).type !== Spicetify.URI.Type.TRACK);

		// if (userHitBack) {
			// userHitBack = false;
			// return;
		// }

		if (isBanned) {
			//Spicetify.Player.next();
			// document.body.append(style, container);
			// await document.documentElement.requestFullscreen();
			// document.body.append(contextMenu);
			document.body.appendChild(styleToHideNowPlayingTrackCoverArtImage);
			return;
		}
		else
		{
			// Delay this bc when the song changes the old cover is visible for a split second if I run this without a timeout. A quick, dirty solution.
			setTimeout(() => {
				document.body.removeChild(styleToHideNowPlayingTrackCoverArtImage);
			}, 500);
			
		}
		
		
		
		// I removed this section bc: we shouldnt hide all covers from an artist, only albums that we explicitly marked they need to be hidden.
		//let uriIndex = 0;
		//let artistUri = data.track.metadata["artist_uri"];

		//while (artistUri)
		//{
			//if (trashArtistList[artistUri]) {
				//--//Spicetify.Player.next();
				//document.body.appendChild(styleToHideNowPlayingTrackCoverArtImage);
				//return;
			//}
			//else
			//{
				//--// Delay this bc when the song changes the old cover is visible for a split second if I run this without a timeout. A quick, dirty solution.
				//setTimeout(() => {
					//document.body.removeChild(styleToHideNowPlayingTrackCoverArtImage);
				//}, 500);
			//}

			//uriIndex++;
			//artistUri = data.track.metadata["artist_uri:" + uriIndex];
		//}
	}

	/**
	 *
	 * @param {string} uri
	 * @param {string} type
	 * @returns {boolean}
	 */
	function shouldSkipCurrentTrack(uri, type) {
		const curTrack = Spicetify.Player.data.track;
		if (type === Spicetify.URI.Type.TRACK) {
			if (uri === curTrack.uri) {
				return true;
			}
		}

		if (type === Spicetify.URI.Type.ARTIST) {
			let count = 1;
			let artUri = curTrack.metadata["artist_uri"];
			while (artUri) {
				if (uri === artUri) {
					return true;
				}
				artUri = curTrack.metadata[`artist_uri:${count}`];
				count++;
			}
		}

		return false;
	}

	/**
	 *
	 * @param {string[]} uris
	 */
	function toggleThrow(uris) {
		const uri = uris[0];
		const uriObj = Spicetify.URI.fromString(uri);
		const type = uriObj.type;

		let list = type === Spicetify.URI.Type.TRACK ? trashSongList : trashArtistList;

		if (!list[uri]) {
			list[uri] = true;
			
			//if (shouldSkipCurrentTrack(uri, type)) 
				//Spicetify.Player.next();
				
			Spicetify.Player.data?.track.uri === uri && setWidgetState(true);
			Spicetify.showNotification(type === Spicetify.URI.Type.TRACK ? "Song added to trashbin" : "Artist added to trashbin");
		} else {
			delete list[uri];
			Spicetify.Player.data?.track.uri === uri && setWidgetState(false);
			Spicetify.showNotification(type === Spicetify.URI.Type.TRACK ? "Song removed from trashbin" : "Artist removed from trashbin");
		}

		putDataLocal();
	}

	/**
	 * Only accept one track or artist URI
	 * @param {string[]} uris
	 * @returns {boolean}
	 */
	function shouldAddContextMenu(uris) {
		if (uris.length > 1 || !trashbinStatus) {
			return false;
		}

		const uri = uris[0];
		const uriObj = Spicetify.URI.fromString(uri);
		if (uriObj.type === Spicetify.URI.Type.TRACK) {
			this.name = trashSongList[uri] ? UNTHROW_TEXT : THROW_TEXT;
			return true;
		}

		if (uriObj.type === Spicetify.URI.Type.ARTIST) {
			this.name = trashArtistList[uri] ? UNTHROW_TEXT : THROW_TEXT;
			return true;
		}
		

		return false;
	}

	const cntxMenu = new Spicetify.ContextMenu.Item(THROW_TEXT, toggleThrow, shouldAddContextMenu, trashbinIcon);
	cntxMenu.register();

	function putDataLocal() {
		//https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
		//https://stackoverflow.com/a/53461519/5686427
		
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify([...trashAlbumList]));
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify(trashAlbumList, null, '\t'));

		Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify(Array.from(trashAlbumList.entries())));
		Spicetify.LocalStorage.set("TrashSongList", JSON.stringify(trashSongList));
		Spicetify.LocalStorage.set("TrashArtistList", JSON.stringify(trashArtistList));
	}

	function exportItems() {
		const data = {
			songs: trashSongList,
			artists: trashArtistList,
			albums: Array.from(trashAlbumList.entries())
		};
		Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(data));
		
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify(Array.from(trashAlbumList.entries())));
		
		Spicetify.showNotification("Copied to clipboard");
	}

	function importItems() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = e => {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onload = e => {
				try {
					const data = JSON.parse(e.target.result);
					trashSongList = data.songs;
					trashArtistList = data.artists;
					trashAlbumList = new Map(data.albums); // TODO: currently this doesnt work. needs special parsing. 
					putDataLocal();
					Spicetify.showNotification("File Import Successful!");
				} catch (e) {
					Spicetify.showNotification("File Import Failed!", true);
					console.error(e);
				}
			};
			reader.onerror = () => {
				Spicetify.showNotification("File Read Failed!", true);
				console.error(reader.error);
			};
			reader.readAsText(file);
		};
		input.click();
	}
})();


//TODO: Hátra van még a search page szűrése.
//Ezt a HTML-t kapod a fő találatra, amit balra kiemel:

//<div class="main-gridContainer-gridContainer main-shelf-shelfGrid" style="--column-width:191px; --column-count:2; --grid-gap:24px; --min-container-width:406px;">
	//<div aria-live="polite" data-testid="top-result-card" class="search-searchResult-topResultCard">
		//<div class="main-heroCard-card" aria-expanded="true" data-context-menu-open="true">
			//<div draggable="true" class="main-heroCard-draggable">
				//<div class="main-cardImage-imageWrapper main-card-hero" style="--card-color:#681028;">
					//<div class=""><img aria-hidden="false" draggable="false" loading="lazy" src="https://i.scdn.co/image/ab67616d00001e0224b893fb9e7953ebc9517c6a" alt="" class="main-image-image main-cardImage-image main-image-loaded"></div>
				//</div>
				//<div class="main-heroCard-cardMetadata">
					//<a draggable="false" title="Attention" class="main-cardHeader-link" dir="auto" href="/album/38xgBOLAcKoYWMSXWUDH1E?highlight=spotify:track:11xC6P3iKYpFThT6Ce1KdG">
						//<div class="Type__TypeElement-sc-goli3j-0 TypeElement-alto-textBase-type-paddingBottom_4px main-cardHeader-text" data-encore-id="type">Attention</div>
					//</a>
					//<div class="Type__TypeElement-sc-goli3j-0 TypeElement-mesto-textSubdued-type main-cardSubHeader-root" data-encore-id="type"><span aria-label="Explicit" class="main-tag-container Cv51KKt1hDVs4oYd4jZ1" title="Explicit">E</span><a draggable="false" dir="auto" href="/artist/5cj0lLjcoR7YOSnhnX0Po5">Doja Cat</a><span class="Type__TypeElement-sc-goli3j-0 TypeElement-mestoBold-textBase-type main-cardSubHeader-text" data-encore-id="type">Song</span></div>
				//</div>
				//<div class="main-heroCard-PlayButtonContainer">
					//<div class="main-playButton-PlayButton">
						//<button aria-label="Play" data-encore-id="buttonPrimary" class="Button-sc-qlcn5g-0 Button-md-buttonPrimary-useBrowserDefaultFocusStyle">
							//<span class="ButtonInner-sc-14ud5tc-0 ButtonInner-md-iconOnly encore-bright-accent-set">
								//<span aria-hidden="true" class="IconWrapper__Wrapper-sc-1hf1hjl-0 Wrapper-md-24-only">
									//<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-24-icon">
										//<path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
									//</svg>
								//</span>
							//</span>
						//</button>
					//</div>
				//</div>
				//<div class="main-heroCard-cardLink"></div>
			//</div>
		//</div>
	//</div>
//</div>


// ugye itt a "main-cardHeader-link" class-ú elemben van az album URI-je és a "main-image-image main-cardImage-image main-image-loaded" class-ú elem az aminek az src-jét ki kéne nullázni hogy eltűnjön a kép.


//A search page sorok pedig így néznek ki, ezt a HTML-t kapod:
//az a baj ezzel hogy nincs benne semmi album adat, sem album név sem URI, csak a szám címe van ott és az előadó URI-je.
//még a track URI-je sincs ott.
//ezt úgy lehetne megcsinálni hogy tárolom a problémás albumok képeinek URLjét és azt szűröm itt. ugye itt a https://i.scdn.co/image/ab67616d0000485124b893fb9e7953ebc9517c6a   az.
//A kiemelt találat képének URL-je majdnem ugyanaz de nem teljesen; esetleg ezt lehetne használni:
//https://i.scdn.co/image/ab67616d00001e0224b893fb9e7953ebc9517c6a
// Alternativa:
// Az attention by doja cat string ha tartalmazza bármelyik blokkolt album címet akkor Hide this image  
//ezzel az a baj hogy ott a szám címe van és nem az album címe, szóval sokszor nem fog egybeesni a két string.
// Szerintem hagy ki ezt a részt.
//Amúgy szerencsám van mert a lementett imageUrls listán rajta van mindkét kép URL-je, szóval azokra alapozhatsz. 

//<div class="main-trackList-trackListRow main-trackList-trackListRowGrid" draggable="true" role="presentation"><div class="main-trackList-rowSectionStart" role="gridcell" aria-colindex="1" tabindex="-1"><div class="main-trackList-rowImageWithPlay"><img aria-hidden="false" draggable="false" loading="eager" src="https://i.scdn.co/image/ab67616d0000485124b893fb9e7953ebc9517c6a" alt="" class="main-image-image main-trackList-rowImage main-image-loaded" width="40" height="40"><button class="main-trackList-rowImagePlayButton main-trackList-rowImagePlayPauseButton" aria-label="Play Attention by Doja Cat" tabindex="-1"><svg role="img" height="24" width="24" aria-hidden="true" class="Svg-sc-ytk21e-0 Svg-img-24-icon main-trackList-rowPlayPauseIcon" viewBox="0 0 24 24" data-encore-id="icon"><path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path></svg></button></div><div class="main-trackList-rowMainContent"><div dir="auto" class="Type__TypeElement-sc-goli3j-0 TypeElement-ballad-textBase-type main-trackList-rowTitle standalone-ellipsis-one-line" data-encore-id="type">Attention</div><span class="Type__TypeElement-sc-goli3j-0 TypeElement-ballad-textSubdued-type main-trackList-rowBadges" data-encore-id="type"><span aria-label="Explicit" class="main-tag-container" title="Explicit">E</span></span><span class="Type__TypeElement-sc-goli3j-0 TypeElement-mesto-textSubdued-type main-trackList-rowSubTitle standalone-ellipsis-one-line" data-encore-id="type"><a draggable="true" dir="auto" href="/artist/5cj0lLjcoR7YOSnhnX0Po5" tabindex="-1">Doja Cat</a></span></div></div><div class="main-trackList-rowSectionEnd" role="gridcell" aria-colindex="2" tabindex="-1"><button type="button" role="switch" aria-checked="false" aria-label="Save to Your Library" class="main-addButton-button main-trackList-rowHeartButton" tabindex="-1"><svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"></path></svg></button><div class="Type__TypeElement-sc-goli3j-0 TypeElement-mesto-textSubdued-type main-trackList-rowDuration" data-encore-id="type">4:37</div><button type="button" aria-haspopup="menu" aria-label="More options for Attention by Doja Cat" class="main-moreButton-button main-trackList-rowMoreButton" tabindex="-1"><svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon"><path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path></svg></button></div></div>


