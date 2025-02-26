// NAME: HideImages
// AUTHOR: adventuretc, khanhas, OhItsTom
// VERSION: 1.9
// DESCRIPTION: Throw albums or artists to a trashbin and never see their images again. What works: Almost everything except these which are not implemented yet: filtering of Discography pages, filtering of the Home page, filtering of Playlists (the icon of the playlist on the playlist's page and the playlist icons on artist overview pages). 

/// <reference path="../globals.d.ts" />

// For JSHint:
/* global Spicetify*/

(function HideImages()
{
	'use strict';
	
	console.log("HideImages extension loaded");
	
	const skipBackBtn =
		document.querySelector(".main-skipBackButton-button") ??
		document.querySelector(".player-controls__left > button[data-encore-id='buttonTertiary']");
	if ( ! Spicetify.Player.data || ! Spicetify.LocalStorage || ! skipBackBtn)
	{
		setTimeout(HideImages, 1000);
		return;
	}
	
	const HideImages_config_version_dbkey = "HideImages-config-version";
	
	class AlbumData
	{
		//constructor(uri, title, imageUrls)
		//{
			//Assign the values as a property of `this`.
			//this.values = [uri, title, imageUrls];
		//}
	}
	
	// Convert Map to object for serialization
	function mapToObject(map)
	{
		const obj = {};
		map.forEach((value, key) =>
		{
			obj[key] = value;
		});
		return obj;
	}
	
	// Convert object back to Map
	function objectToMap(obj)
	{
		return new Map(Object.entries(obj));
	}
	
	// Convert Map to string for saving
	function mapToString(map)
	{
		const trashAlbumListObject = mapToObject(map); // Convert Map to Object
		return JSON.stringify(trashAlbumListObject); // Convert Object to string
	}
	
	// Convert string back to Map
	function mapFromString(str)
	{
		const trashAlbumListObject = JSON.parse(str); // Parse string into Object
		return objectToMap(trashAlbumListObject); // Convert Object back to Map
	}
	
	// Save the data to LocalStorage (as string)
	//const savedData = convertToString(map);
	//Spicetify.LocalStorage.set("HideImages_TrashAlbumList", savedData);
	
	// Retrieve and convert back to Map when needed
	//const loadedData = Spicetify.LocalStorage.get("HideImages_TrashAlbumList");
	//const trashAlbumListFromStorage = convertFromString(loadedData); // Convert back to Map
	
	
	// Convert object to string for saving
	function objectToString(object)
	{
		return JSON.stringify(object);  // Convert object to JSON string
	}
	
	// Convert string back to object
	function objectFromString(str)
	{
		return JSON.parse(str);  // Parse JSON string back to object
	}
	
	// Save the data to LocalStorage (as string)
	//const savedData = convertToString(object);
	//Spicetify.LocalStorage.set("HideImages_TrashArtistList", savedData);
	
	// Retrieve and convert back to object when needed
	//const loadedData = Spicetify.LocalStorage.get("HideImages_TrashArtistList");
	//const trashArtistListFromStorage = convertFromString(loadedData);  // Convert string back to object
	
	function createButton(text, description, callback)
	{
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
	
	function createSlider(name, desc, defaultVal, callback)
	{
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
		slider.classList.toggle("disabled", ! defaultVal);
		
		slider.onclick = () =>
		{
			const state = slider.classList.contains("disabled");
			slider.classList.toggle("disabled");
			Spicetify.LocalStorage.set(name, state);
			//console.log(name, state);
			callback(state);
		};
		
		return container;
	}
	function settingsContent()
	{
		// Options
		let header = document.createElement("h2");
		header.innerText = "Options";
		content.appendChild(header);
		
		content.appendChild(createSlider("hideimages-enabled", "Enabled", trashbinStatus, refreshEventListeners));
		content.appendChild(
			createSlider("HideImagesWidgetIcon", "Show Widget Icon", enableWidget, state =>
			{
				enableWidget = state;
				state && trashbinStatus ? widget.register() : widget.deregister();
			})
		);
		
		// Local Storage
		let header2 = document.createElement("h2");
		header2.innerText = "Local Storage";
		content.appendChild(header2);
		
		content.appendChild(createButton("Export (clipboard)", "Copy all items in trashbin to clipboard, manually save to a .json file.", exportItems));
		content.appendChild(createButton("Export (file)", "Copy all items to a JSON file.", exportItems2));
		content.appendChild(createButton("Import default blocklist", "Contains about 288 blocked items, mostly naked women (naked breasts, naked thighs, naked bottoms, naked vaginas (yes, really, you wouldn't believe), naked waists). Overwrites all items in the blocklist.", importDefaultItems));
		content.appendChild(createButton("Import...", "Overwrite all items in the blocklist via a .json file.", importItems));
		content.appendChild(
			createButton("Clear ", "Clear all items from trashbin (cannot be reverted).", () =>
			{
				trashAlbumList = new Map();
				trashSongList = {};
				trashArtistList = {};
				setWidgetState(false);
				putDataLocal();
				Spicetify.showNotification("Trashbin cleared!");
			})
		);
	}
	function styleSettings()
	{
		const style = document.createElement("style");
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
	function initValue(item, defaultValue)
	{
		try
		{
			// Deserializing a map requires a different method.
			// Accept both the old and the new storage key.
			if (item === "TrashAlbumList" || item === "HideImages_TrashAlbumList")
			{
				// Retrieve and convert back to Map when needed
				const loadedData = Spicetify.LocalStorage.get("HideImages_TrashAlbumList");
				//if (loadedData) {
				const trashAlbumListFromStorage = mapFromString(loadedData); // Convert back to Map
				
				return trashAlbumListFromStorage ?? defaultValue;
			}
			else
			{
				const value = objectFromString(Spicetify.LocalStorage.get(item));
				return value ?? defaultValue;
			}
		} catch
		{
			return defaultValue;
		}
	}
	
	// Settings Variables - Initial Values
	let trashbinStatus = initValue("hideimages-enabled", true);
	let enableWidget = initValue("HideImagesWidgetIcon", true);
	
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
	
	
	const styleToHideTopBackgroundImageOnArtistPage = document.createElement("style");
	styleToHideTopBackgroundImageOnArtistPage.innerHTML = `
		.main-entityHeader-background.main-entityHeader-gradient
		{
			opacity: 0.0;
			background-image: none;
		}
		`;
	
	const styleToHideBottomBackgroundImageOnArtistPage = document.createElement("style");
	styleToHideBottomBackgroundImageOnArtistPage.innerHTML = `
		button.artist-artistAbout-container.artist-artistAbout-backgroundImage
		{
			background-image: none !important;
		}
		`;
	
	//A 2024-08-02-es updatekor megváltozott a helyes selector.
	//.album-albumPage-sectionWrapper .main-entityHeader-image /* ez az album view-ban lévő main image-t kiválasztja  */
	const styleToHideCoverArtImageOnAnAlbumPage = document.createElement("style");
	styleToHideCoverArtImageOnAnAlbumPage.innerHTML = `
		.main-entityHeader-imageContainer .main-entityHeader-image /* ez az album view-ban lévő main image-t kiválasztja  */
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
	
	const styleToHideCoverArtImages3 = document.createElement("style");
	styleToHideCoverArtImages3.innerHTML = `
		
		[pleaseHideThis="true"]
		{
			background-color: black;
		}`;
	// Ne hagyj vesszőt a CSS selector végén mert úgy nem fog működni.
	// .cover-art-image,     /* ebben nem vagyok biztos hogy mi  */
	// .cover-art,            /* ebben nem vagyok biztos hogy mi  */
	// .main-coverSlotExpanded-container,         /* ebben nem vagyok biztos hogy mi  */
	// .main-playlistEditDetailsModal-albumCover,   /* ebben nem vagyok biztos hogy mi  */
	document.body.appendChild(styleToHideCoverArtImages3);
	
	
	//Ez egy outdated fv és semmire nem használom:
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
			// − const uri = `spotify:artist:${data.uri.split(":")[3]}`;
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
		if (pageType === "Handle the Discography page.")
		{
			// the parent element: ".artist-artistDiscography-headerContainer"
			// the image containing element: ".artist-artistDiscography-headerImage img" -> the src and srcset attribute
			// the album-uri containing element: ".artist-artistDiscography-headerMetadata .artist-artistDiscography-headerTitle a" -> the href attribute
			
			
			const albumLinks = element.querySelectorAll(".artist-artistDiscography-headerMetadata .artist-artistDiscography-headerTitle a");
			
			for (const albumLink of albumLinks)
			{
				if ( ! albumLink.hasAttribute("href"))
				{
					continue;
				}
				
				const albumUri = "spotify:album:" + albumLink.getAttribute("href").replace('/album/', '');
				
				if (trashAlbumList.has(albumUri))
				{
					const imageToBeHiddenFallback = element.querySelector(".artist-artistDiscography-headerImage");
					
					const imageToBeHidden = element.querySelector(".artist-artistDiscography-headerImage img");
					
					if (imageToBeHidden)
					{
						imageToBeHidden.setAttribute("src", "");
						imageToBeHidden.setAttribute("srcset", "");
						imageToBeHidden.setAttribute("extensionProcessed", "true");
					}
					else if (imageToBeHiddenFallback.hasAttribute("extensionProcessed") === "false")
					{
						//imageToBeHiddenFallback.style.visibility = "hidden";
						imageToBeHiddenFallback.setAttribute("extensionProcessed", "true");
						imageToBeHiddenFallback.setAttribute("pleaseHideThis", "true");
					}
					
					//console.log("Removed 'src' attribute from the element. uri: " + albumUri);
				}
			}
		}
		else if (pageType === "The Artists row on the All tab of the Search page")
		{
			
			// element is a ".main-card-card"
			
			const artistLinks = element.querySelectorAll(".main-card-cardMetadata .main-cardHeader-link");
			
			for (const artistLink of artistLinks)
			{
				if ( ! artistLink.hasAttribute("href"))
				{
					return;
				}
				
				const artistUri = "spotify:artist:" + artistLink.getAttribute("href").replace('/artist/', '');
				
				//console.log("DEBUG1 it works but: " + artistUri);
				//console.log(element);
				
				if (trashArtistList[artistUri])
				{
					const imageToBeHiddenFallback = element.querySelector(".main-card-imageContainer");
					
					const imageToBeHidden = element.querySelector(".main-card-imageContainer img");
					
					if (imageToBeHidden)
					{
						imageToBeHidden.setAttribute("src", "");
						imageToBeHidden.setAttribute("extensionProcessed", "true");
					}
					else if (imageToBeHiddenFallback.hasAttribute("extensionProcessed") === "false")
					{
						//imageToBeHiddenFallback.style.visibility = "hidden";
						imageToBeHiddenFallback.setAttribute("extensionProcessed", "true");
						imageToBeHiddenFallback.setAttribute("pleaseHideThis", "true");
					}
				}
			}
		}
		else if (pageType == "The albums tab of the Search page")
		{
			
			// element is a ".main-card-card"
			
			const albumLinks = element.querySelectorAll(".main-card-cardMetadata .main-cardHeader-link");
			
			for (const albumLink of albumLinks)
			{
				if ( ! albumLink.hasAttribute("href"))
				{
					continue;
				}
				
				const albumUri = "spotify:album:" + albumLink.getAttribute("href").replace('/album/', '');
				
				if (trashAlbumList.has(albumUri))
				{
					const imageToBeHiddenFallback = element.querySelector(".main-card-imageContainer");
					
					const imageToBeHidden = element.querySelector(".main-card-imageContainer img");
					
					if (imageToBeHidden)
					{
						imageToBeHidden.setAttribute("src", "");
						imageToBeHidden.setAttribute("extensionProcessed", "true");
					}
					else if (imageToBeHiddenFallback.hasAttribute("extensionProcessed") == "false")
					{
						//imageToBeHiddenFallback.style.visibility = "hidden";
						imageToBeHiddenFallback.setAttribute("extensionProcessed", "true");
						imageToBeHiddenFallback.setAttribute("pleaseHideThis", "true");
					}
					
					//console.log("Removed 'src' attribute from the element. uri: " + albumUri);
				}
			}
		}
		else if (pageType == "tracklistview")
		{
			//await sleep(1000);
			
			const parentRow = element.parentNode.parentNode.parentNode;
			
			//const albumLink = parentRow.querySelector("div.main-trackList-rowSectionVariable > span > a");
			//const albumLink = parentRow.querySelector("div.main-trackList-rowSectionVariable span a"); // from 2024-02-03 and on.
			const albumLink = parentRow.querySelector("div.main-trackList-rowSectionVariable span a"); // from 2024-08-02 and on.
			
			if ( ! albumLink) // Sometimes this is null. So discard that.
			{
				return;
			}
			
			if ( ! albumLink.hasAttribute("href"))
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
				
				//console.log("Removed 'src' attribute from the element. uri: " + uri);
			}
			
		}
		else if (pageType == "searchpagehighlightedresult")
		{
			//const albumLink = element;
			//const albumLink = document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link")[0];
			const albumLink = document.querySelectorAll(".search-searchResult-topResultCard .main-cardHeader-link")[0];
			
			
			//await sleep(1000);
			
			
			//console.log("I may remove (context = searchpagehighlightedresult) the  'src' attribute from the element. albumLink.getAttribute(href): " + albumLink.getAttribute("href"));
			
			if ( ! albumLink.hasAttribute("href"))
			{
				//console.log(" href was not found, aborting searchpagehighlightedresult.");
				return;
			}
			
			
			// e.g.: href="/album/38xgBOLAcKoYWMSXWUDH1E?highlight=spotify:track:11xC6P3iKYpFThT6Ce1KdG"
			const uri = "spotify:album:" + albumLink.getAttribute("href").split("?")[0].replace('/album/', '');
			//console.log(uri);
			//console.log("it works: " + uri);
			if (trashAlbumList.has(uri))
			{
				//albumLink.innerHTML = albumLink.innerHTML + " TO BE CENSORED";
				
				//element.removeAttribute("src");
				
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				
				
				const cardimage = element.querySelector(".main-cardImage-imageWrapper.main-card-hero .main-cardImage-image");
				
				if (cardimage)
				{
					cardimage.setAttribute("src", "");
					//console.log("Removed 'src' attribute from the element. uri: " + uri);
				}
				else
				{
					const cardimageFallback = element.querySelector(".main-cardImage-imageWrapper");
					
					cardimageFallback.style.visibility = "hidden";
					
					setTimeout(function ()
					{
						cardimageFallback.style.visibility = "visible";
					}, 500);
				}
			}
			
			// e.g.: href="/artist/9823rhd298j
			const artistUri = "spotify:artist:" + albumLink.getAttribute("href").replace('/artist/', '');
			//console.log(uri);
			//console.log("it works: " + artistUri);
			if (trashArtistList[artistUri])
			{
				//element.classList.add("force-hide-image"); // ez működik de a Spotify azonnal eltávlítja szóval csak kb. 1 ms-ig marad rejtve a cover art. ez nem jó. -> ezt itt nem hívhatod meg mert végtelen loop-ba kerül.
				
				const imageToBeHidden = element.parentElement.parentElement.querySelector(".main-cardImage-imageWrapper.main-card-hero img.main-cardImage-image");
				
				if (imageToBeHidden)
				{
					imageToBeHidden.setAttribute("src", "");
					//console.log("Removed 'src' attribute from the element. uri: " + artistUri);
				}
			}
		}
		else if (pageType === "artist over view page or album page")
		{
			//a helyes selector az igazából ez: ".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link"
			
			// Ez kiválasztja az artist overview page-eken lévő albumokat, pontosabban azt az elemet amiben a link van az albumra, a href tartalmazza a link URL-t.  Ha a href rossz akkor hide this.
			
			//await sleep(1000);
			
			const albumLink = element;
			
			if ( ! albumLink.hasAttribute("href"))
			{
				return;
			}
			
			//console.log("I will try to remove the 'src' attribute from the element. albumLink.getAttribute(href): " + albumLink.getAttribute("href") + " (context = artistoverviewpage)");
			
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
				const cardimage = albumLink.parentElement.parentElement.parentElement.querySelector(".main-card-imageContainer img");
				
				if (cardimage)
				{
					cardimage.setAttribute("src", "");
					//console.log("Removed 'src' attribute from the element. uri: " + uri);
				}
			}
		}
		else if (pageType === "artistoverviewpage_top_background_image")
		{
			//await sleep(1000);
			
			//a helyes selector az igazából ez: ".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link"
			
			// Ez kiválasztja az artist overview page-eken lévő albumokat, pontosabban azt az elemet amiben a link van az albumra, a href tartalmazza a link URL-t.  Ha a href rossz akkor hide this.
			
			
			const topCover = element; //  (".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
			
			//if (!topCover.hasAttribute("href"))
			//{
			//return;
			//}
			
			//console.log("I may remove the 'style' attribute from the element. topCover.getAttribute(href): " + topCover.getAttribute("href") + " (context = artistoverviewpage_top_background_image)");
			
			//const uri = "spotify:album:" + topCover.getAttribute("href").replace("/album/", "");
			//if (trashAlbumList.has(uri))
			
			
			//const data = Spicetify.Player.data || Spicetify.Queue;
			//if (!data) return;
			
			//let artistUri = data.track.metadata["artist_uri"];
			
			const targetElements = document.querySelectorAll("main > section");
			
			if ( ! targetElements[0])
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
					//console.log("Removed 'style' attribute and so the background image from the element. uri: " + artistUri);
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
		//EDIT:
		//I think I figured out what causes the problem:  MutationObserver works asynchronously and sometimes its collection period never ends I guess.
		//We have an array of MutationRecord because MutationObserver works asynchronously as it's more efficient this way. The callback will not be fired until the DOM has finished changing. So at a given time, all mutations will be “collected” in an array.2019. febr. 19.
		//Listening to the DOM changes with MutationObserver - Medium
		//medium.com
		//https://medium.com › abbeal › listening-to-the-dom-cha...
		
		
		// "In JavaScript, I rewrite every function so that it can end as soon as possible. You want the browser back in control so it can make your DOM changes."
		// "Every time I've wanted a sleep in the middle of my function, I refactored to use a setTimeout()."
		
		const selectorMatchesTheseElementsNodeList = document.querySelectorAll(selector);
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/NodeList
			//NodeList
			//NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll().
			
			//Note: Although NodeList is not an Array, it is possible to iterate over it with forEach(). It can also be converted to a real Array using Array.from().
		}
		if (selectorMatchesTheseElementsNodeList.length === 0)
		{
			//console.log("[DEBUG] selectorMatchesTheseElements was empty. Selector was: "  + selector);
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
					if (node.nodeType === Node.ELEMENT_NODE)
					{
						//if ( node.matches(selector)) // There's a serious problem with the .matches method: It mathes elements locally, without a context, while I need them matched globally, in the context of the Document. The whatwg spec is not clear about this but suggests it matches locally. The MDN is even less clear about it.  My experience is clear that it matches locally.
						//My solution: if (document.querySelectorAll(selector).includes(node) )
						
						if (selectorMatchesTheseElements.includes(node))
							//if (true)
						{
							//console.log("it works v2 " + selector);
							// Process the element
							
							processElement(node, pageType);
						}
					}
						//https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord/type
						//if (node.ownerElement)
					//if (node.ownerElement.matches(selector))
					else if ((node.nodeType === Node.ATTRIBUTE_NODE) && selectorMatchesTheseElements.includes(node.ownerElement))
						//else if (true)
					{
						//console.log("it works v4 " + selector);
						//Process the element
						
						processElement(node.ownerElement, pageType);
					}
				}
			}
			else if (record.type === "attributes")
			{
				const targetNode2 = record.target;
				//if ((targetNode.nodeType === Node.ELEMENT_NODE)  && targetNode.matches(selector))
				
				//if ( Array.from(document.querySelectorAll(".main-card-card")).includes(targetNode2) )
				//{
				//if (targetNode2.innerHTML.includes("Artist name here"))
				//{
				//console.log("Debug2 works v3, Artist name here found");
				
				//record.target.innerHTML = "";
				//}
				//}
				
				if (record.attributeName !== "src" && record.attributeName !== "style" || (record.attributeName === "src" && record.target.getAttribute("src") !== "")) // discard this because I will modify src and it would get into an infinite recursive loop.
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
					if (selectorMatchesTheseElements.includes(targetNode))
					{
						//console.log("it works v3 " + selector);
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
				//console.log("DEBUG: " + record);
				
				const element = record.target.parentElement;
				
				if (element)
				{
					if (selectorMatchesTheseElements.includes(element))
					{
						//console.log("it works v5 " + selector);
						
						processElement(element, pageType);
					}
				}
			}
		}
	}
	
	
	// snippet from the internet:
	// "I have used it in several projects."
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
		//const targetElements = document.querySelectorAll(selector);
		
		// Process any existing elements on initial setup
		//for (const element of targetElements)
		//{
		//processElement(element, pageType);
		//}
		
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
		//console.log("DEBUG: container = " + container);
		
		observer.observe(container, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		}); // ez nem jó mert a src attribútumot én megmásítom rajta és akkor végtelen loop-ba kerül ez a cucc. Más megoldás kéne. Vagy ignorálni kell a src változásokat.
		
		//https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
		//observer.disconnect();
		//setTimeout(observer.disconnect(), 10000);
	}
	
	function insertObservers()
	{
		// Ami most jön az a search page-re vonatkozik de azon belül csak a kiemelt találatra.
		waitForElement(".main-trackList-rowImage", "tracklistview");
		
		
		document.documentElement.addEventListener("click", documentClickEventListener); // this is to be able to react to when the user presses a button on the search page and the DOM is updated. E.g. they she goes from "All" to "Playlists" and back. Without this, the newly loaded DOM would never be sanitized.
		
		
		waitForElement(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult");
		
		
		//2024-08-02 előttig:
		//waitForElement(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page");
		waitForElement("a.Gi6Lr1whYBA2jutvHvjQ", "artist over view page or album page");
		
		waitForElement("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page"); // ezt igazából az album page-re használom most.
		
		waitForElement(".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
		
		waitForElement(".main-card-card", "The Artists row on the All tab of the Search page");
		
		waitForElement(".main-card-card", "The albums tab of the Search page");
		
		// Handle the Discography page.
		// the parent element: ".artist-artistDiscography-headerContainer"
		// the image containing element: ".artist-artistDiscography-headerImage img" -> the src and srcset attribute
		// the album-uri containing element: ".artist-artistDiscography-headerMetadata .artist-artistDiscography-headerTitle a" -> the href attribute
		waitForElement(".artist-artistDiscography-headerContainer", "Handle the Discography page.");
		
		
		//waitForElement(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult");
		//debug: document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult").forEach((node) => { processElement(node, "searchpagehighlightedresult")} )
		
		//waitForElement(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page");
		//debug: document.querySelectorAll(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artist over view page or album page")} )
		
		//waitForElement("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page"); // ezt igazából az album page-re használom most.
		//debug: document.querySelectorAll("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artist over view page or album page")} )
		
		//waitForElement(".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
	}
	
	function documentKeyStrokeEventListener()
	{
		tryToSanitizePage();
	}
	
	function documentClickEventListener()
	{
		tryToSanitizePage();
	}
	
	
	// In my experience, the MutationObserver way of blocking images works 90% of the time but sometimes fails. To work around this, I use this manual enforced blocking as well. The MutationObserver way of blocking images I still keep however because in many cases it reacts faster and prevents the album art from flashing for a split second that I'd otherwise get.
	function tryToSanitizePage()
	{
		SanitizePage();
		
		setTimeout(() =>
			{
				SanitizePage();
			}
			, 100);
		setTimeout(() =>
			{
				SanitizePage();
			}
			, 300);
		setTimeout(() =>
			{
				SanitizePage();
			}
			, 900);
		setTimeout(() =>
			{
				SanitizePage();
			}
			, 1800);
	}
	
	function SanitizePage()
	{
		//".search-searchResult-topResult" or:
		processElementsBatch(".search-searchResult-topResultCard", "searchpagehighlightedresult");
		
		//waitForElement(", "");
		//debug: document.querySelectorAll(".main-gridContainer-gridContainer.search-searchResult-searchResultGrid .main-cardHeader-link", "searchpagehighlightedresult").forEach((node) => { processElement(node, "searchpagehighlightedresult")} )
		
		//processElementsBatch(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page");
		processElementsBatch("a.Gi6Lr1whYBA2jutvHvjQ", "artist over view page or album page");
		//debug: document.querySelectorAll(".artist-artistOverview-artistOverviewContent div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artist over view page or album page")} )
		
		processElementsBatch("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link", "artist over view page or album page"); // ezt igazából az album page-re használom most.
		//debug: document.querySelectorAll("div.main-gridContainer-gridContainer.main-shelf-shelfGrid div.main-card-cardMetadata > a.main-cardHeader-link").forEach((node) => { processElement(node, "artist over view page or album page")} )
		
		processElementsBatch(".main-entityHeader-background.main-entityHeader-gradient", "artistoverviewpage_top_background_image");
		
		// The "Artists" row on the "All" tab of the Search page.
		processElementsBatch(".main-card-card", "The Artists row on the All tab of the Search page");
		
		processElementsBatch(".main-card-card", "The albums tab of the Search page");
		
		
		// Handle the Discography page.
		// the parent element: ".artist-artistDiscography-headerContainer"
		// the image containing element: ".artist-artistDiscography-headerImage img" -> the src and srcset attribute
		// the album-uri containing element: ".artist-artistDiscography-headerMetadata .artist-artistDiscography-headerTitle a" -> the href attribute
		processElementsBatch(".artist-artistDiscography-headerContainer", "Handle the Discography page.");
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
	
	
	//Spicetify.Player.addEventListener("appchange", ({ data: data }) =>
	Spicetify.Platform.History.listen((location) =>
	{
		// Log the current pathname every time the user navigates to a new page.
		//console.log(location.pathname);
		
		// 2024-02-02 mostantól ez a helyes mód: Spicetify.Player.data.context.uri
		// és
		// 2024-02-02 mostantól ez a helyes mód: Spicetify.Player.data.context.url
		// ne, várj, ez nem jó, ez a jelenleg szóló zenéről szól, nem a jelenlegi lapról.
		
		//console.log("[info] URL aka location.pathname has changed: " + location.pathname);
		
		//if (data.isEmbeddedApp === true) return;
		// if (location.pathname !== "queue") return;
		
		if (location.pathname.startsWith("/queue"))
		{
			//sanitizePage();
		}
		else if (location.pathname.startsWith("/playlist"))
		{
			tryToSanitizePage();
		}
		else if (location.pathname.startsWith("/history"))
		{
			//sanitizePage();
		}
		else if (location.pathname.startsWith("/search"))
		{
			tryToSanitizePage();
			
			document.querySelectorAll(".main-topBar-searchBar input").forEach((e) =>  // this is the search bar at the top.
			{
				e.removeEventListener("input", documentKeyStrokeEventListener);
				e.addEventListener("input", documentKeyStrokeEventListener); // this is to be able to react to when the user presses a button on the search page and the DOM is updated. E.g. they she goes from "All" to "Playlists" and back. Without this, the newly loaded DOM would never be sanitized.
			});
		}
		else if (location.pathname.startsWith("/artist"))
		{
			tryToSanitizePage();
			
			
			const targetElements = document.querySelectorAll("main > section");
			
			if ( ! targetElements[0])
			{
				return;
			}
			
			const artistUri = targetElements[0].getAttribute("data-test-uri"); // yields "spotify:artist:181bsRPaVXVlUKXrxwZfHK"
			
			if (trashArtistList[artistUri])
			{
				document.body.appendChild(styleToHideTopBackgroundImageOnArtistPage);
				document.body.appendChild(styleToHideBottomBackgroundImageOnArtistPage);
			}
			else
			{
				if (document.body.contains(styleToHideTopBackgroundImageOnArtistPage))
				{
					document.body.removeChild(styleToHideTopBackgroundImageOnArtistPage);
				}
				if (document.body.contains(styleToHideBottomBackgroundImageOnArtistPage))
				{
					document.body.removeChild(styleToHideBottomBackgroundImageOnArtistPage);
				}
			}
		}
		else if (location.pathname.startsWith("/album"))
		{
			// This is for the suggested similar albums section that appear at the bottom.
			tryToSanitizePage();
			
			
			// this is for the main album image (the cover).
			const uri = "spotify:album:" + location.pathname.replace('/album/', '');
			//const uri = `spotify:artist:${data.uri.split(":")[3]}`;
			if (trashAlbumList.has(uri))
			{
				document.body.appendChild(styleToHideCoverArtImageOnAnAlbumPage);
			}
			else
			{
				if (document.body.contains(styleToHideCoverArtImageOnAnAlbumPage))
				{
					document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
				}
			}
		}
		else
		{
			if (document.body.contains(styleToHideCoverArtImageOnAnAlbumPage))
			{
				document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
			}
			
			tryToSanitizePage();
			
		}
		
		if (location.pathname.startsWith("/search") == false)
		{
			// don't listen to keystrokes outside of the search page because it would just lag the app for no reason.
			document.documentElement.removeEventListener("input", documentKeyStrokeEventListener);
		}
		
		
		// location.pathname érték példák:
		// /queue
		// /history
		// /album/dasj9dasjasd234
		// /artist/dasj9dasjasd234
		// /artist/4kYSro6naA4h99UJvo89HB/discography/album
		//this is the "discography" page (the event only fires if you change to this from a non /artist/ page e.g. the home page. )
		// /playlist/dasj9dasjasd234
		// /collection/tracks
		// this is the "liked songs" page.
		// /collection/local-files
		// /search
		// /search/what you typed
		// (the event only fires when you visit the Search page and then also when you start typing something, (only your first search), but not afterwards.)
		
		
		// const uri = `spotify:artist:${data.uri.split(":")[3]}`;
		
		//Spicetify.showNotification(location.pathname);
		
		
		//const {Type} = Spicetify.URI;
		//const uri = Spicetify.URI.fromString(uris[0]);
		//switch (uri.type) {
		//case Type.TRACK:
		//case Type.LOCAL:
		//case Type.LOCAL_ARTIST:
		//case Type.LOCAL_ALBUM:
		//case Type.ALBUM:
		//Spicetify.showNotification(location.pathname);
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
	
	
	//Spicetify.Player.addEventListener("appchange", (event) =>
	//{
	//console.log(event.location.pathname);
	
	// console.log(event.data.URI.Type.TRACK);
	
	
	//const currentURI = Spicetify.Player.data?.page_metadata["context_uri"]; // Player.data.page_metadata.entity_uri: string; már ha létezik. Vagy pedig context_uri, talán az jó lesz.
	// Kipróbáltam ezt és üres adatot tartalmazott sajnos: Spicetify.Player.data?.page_metadata.entity_uri, ez is: context_uri,
	// ezeket nézd: https://spicetify.app/docs/development/api-wrapper/types/metadata
	// https://github.com/search?q=appchange+Spicetify.Player.addEventListener&type=code
	// https://github.com/HenryNguyen5/spicetify-cli/blob/674ecd66c07edb2b261dfb27709822e0a4ff821e/Extensions/trashbin.js#L136
	//Spicetify.showNotification(currentURI);
	// vagy:
	// event.location.pathname // App href path
	
	//});
	
	
	settingsContent();
	
	const trashbinIcon =
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentcolor"><path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z"/></svg>';
	
	const THROW_TEXT = "Hide this Image";
	const UNTHROW_TEXT = "Unhide this Image";
	
	
	// escaped with https://www.freeformatter.com/javascript-escape.html
	// Escaping 's manually gave me odd errors (the last 20% of the string was lost).
	// But for some reason it still doesn't work. I have zero idea why. Use the included JSON file instead.
	// update: don't escape anything, just use backticks for the string literal.
	const defaultBlockListJSONString =
	`{"songs": "{\"spotify:track:7F1lHcpnTycnimQrCxDFI5\":true,\"spotify:track:7FhZ0fcmBhizimiHxnCAK6\":true,\"spotify:track:0Wi6hvPJTZBKrXjmvVFtOQ\":true,\"spotify:track:52hQY9AntPqOQM46N9BnfC\":true,\"spotify:track:0jdNoNSnFwqftO9s7az6r4\":true}","artists": "{\"spotify:artist:5Uh9Oco0Khv18UvTo2PucM\":true,\"spotify:artist:4kYSro6naA4h99UJvo89HB\":true,\"spotify:artist:181bsRPaVXVlUKXrxwZfHK\":true,\"spotify:artist:3MdXrJWsbVzdn6fe5JYkSQ\":true,\"spotify:artist:3XSkS0dvC7HqbspstKciWc\":true,\"spotify:artist:6S2OmqARrzebs0tKUEyXyp\":true,\"spotify:artist:0AsThoR4KZSVktALiNcQwW\":true,\"spotify:artist:5FWi1mowu6uiU2ZHwr1rby\":true,\"spotify:artist:2w9zwq3AktTeYYMuhMjju8\":true,\"spotify:artist:0hCNtLu0JehylgoiP8L4Gh\":true,\"spotify:artist:5yG7ZAZafVaAlMTeBybKAL\":true,\"spotify:artist:6ueGR6SWhUJfvEhqkvMsVs\":true,\"spotify:artist:2auiVi8sUZo17dLy1HwrTU\":true,\"spotify:artist:4fpTMHe34LC5t3h5ztK8qu\":true,\"spotify:artist:7DuTB6wdzqFJGFLSH17k8e\":true,\"spotify:artist:6veh5zbFpm31XsPdjBgPER\":true,\"spotify:artist:1vkJFCwstOoJO7yQ4lTtLK\":true,\"spotify:artist:6If57j6e3TXXk0HiLcIZca\":true,\"spotify:artist:5YGY8feqx7naU7z4HrwZM6\":true,\"spotify:artist:7jZMxhsB8djyIbYmoiJSTs\":true,\"spotify:artist:1G0YV9WooUBjrwDq0Q7EFK\":true,\"spotify:artist:4NHQUGzhtTLFvgF5SZesLK\":true,\"spotify:artist:1l7ZsJRRS8wlW3WfJfPfNS\":true,\"spotify:artist:5cj0lLjcoR7YOSnhnX0Po5\":true,\"spotify:artist:1Xylc3o4UrD53lo9CvFvVg\":true}","albums": "{\"spotify:album:38aH4OObJSjtO48q2eNoA4\":{\"uri\":\"spotify:album:38aH4OObJSjtO48q2eNoA4\",\"title\":\"Girl Of My Dreams\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0254d18b47810756f87282ea43\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485154d18b47810756f87282ea43\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27354d18b47810756f87282ea43\",\"width\":640,\"height\":640}]},\"spotify:album:3caKTh2tJMowPiMz0cguLI\":{\"uri\":\"spotify:album:3caKTh2tJMowPiMz0cguLI\",\"title\":\"Greatest Hits: My Prerogative\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0238a33970ad21a2a1d1315875\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485138a33970ad21a2a1d1315875\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27338a33970ad21a2a1d1315875\",\"width\":640,\"height\":640}]},\"spotify:album:1OOIAMYpEOZeztHw5XuRmN\":{\"uri\":\"spotify:album:1OOIAMYpEOZeztHw5XuRmN\",\"title\":\"Attention\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0222bfe34cba1484475dd61353\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485122bfe34cba1484475dd61353\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27322bfe34cba1484475dd61353\",\"width\":640,\"height\":640}]},\"spotify:album:5G5s00CN4Kmxz340ED2WL2\":{\"uri\":\"spotify:album:5G5s00CN4Kmxz340ED2WL2\",\"title\":\"ATTENTION: MILEY LIVE\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020cb72bf16e0692468d81465b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510cb72bf16e0692468d81465b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730cb72bf16e0692468d81465b\",\"width\":640,\"height\":640}]},\"spotify:album:38xgBOLAcKoYWMSXWUDH1E\":{\"uri\":\"spotify:album:38xgBOLAcKoYWMSXWUDH1E\",\"title\":\"Attention\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0224b893fb9e7953ebc9517c6a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485124b893fb9e7953ebc9517c6a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27324b893fb9e7953ebc9517c6a\",\"width\":640,\"height\":640}]},\"spotify:album:1BykQV2nA2F8zXzsUJ6DQ2\":{\"uri\":\"spotify:album:1BykQV2nA2F8zXzsUJ6DQ2\",\"title\":\"Hot\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02429b0446d222e4ff7bbaa68b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851429b0446d222e4ff7bbaa68b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273429b0446d222e4ff7bbaa68b\",\"width\":640,\"height\":640}]},\"spotify:album:2ogiazbrNEx0kQHGl5ZBTQ\":{\"uri\":\"spotify:album:2ogiazbrNEx0kQHGl5ZBTQ\",\"title\":\"WAP (feat. Megan Thee Stallion)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c450c89d3eb750d3535b0a0c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c450c89d3eb750d3535b0a0c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c450c89d3eb750d3535b0a0c\",\"width\":640,\"height\":640}]},\"spotify:album:4A43tzEN3jILvseI1HeXGG\":{\"uri\":\"spotify:album:4A43tzEN3jILvseI1HeXGG\",\"title\":\"Put It On Da Floor Again (feat. Cardi B)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e025292a8bd0723363b27dc9610\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048515292a8bd0723363b27dc9610\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2735292a8bd0723363b27dc9610\",\"width\":640,\"height\":640}]},\"spotify:album:2drqVzCt52KiDxKgl0Rq0P\":{\"uri\":\"spotify:album:2drqVzCt52KiDxKgl0Rq0P\",\"title\":\"Money\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e028d5816c9f31f1187eb30913f\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048518d5816c9f31f1187eb30913f\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2738d5816c9f31f1187eb30913f\",\"width\":640,\"height\":640}]},\"spotify:album:6B26OzQRObxAp1tbf8jeTq\":{\"uri\":\"spotify:album:6B26OzQRObxAp1tbf8jeTq\",\"title\":\"Something for Thee Hotties\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0245fd9c645c76bd5b11bd7f3e\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485145fd9c645c76bd5b11bd7f3e\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27345fd9c645c76bd5b11bd7f3e\",\"width\":640,\"height\":640}]},\"spotify:album:2Wm9AhTq7byuyEIx5QXVWJ\":{\"uri\":\"spotify:album:2Wm9AhTq7byuyEIx5QXVWJ\",\"title\":\"Pressurelicious (feat. Future)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02fc5e1c268c1c72bf9da61625\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851fc5e1c268c1c72bf9da61625\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273fc5e1c268c1c72bf9da61625\",\"width\":640,\"height\":640}]},\"spotify:album:0KjckH1EE6HRRurMIXSc0r\":{\"uri\":\"spotify:album:0KjckH1EE6HRRurMIXSc0r\",\"title\":\"Good News\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02da256972582b455d46985ba9\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851da256972582b455d46985ba9\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273da256972582b455d46985ba9\",\"width\":640,\"height\":640}]},\"spotify:album:26jEIrN7WSAnVQXXUmLRSN\":{\"uri\":\"spotify:album:26jEIrN7WSAnVQXXUmLRSN\",\"title\":\"Tina Snow\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026cf50daf249842c725cef102\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516cf50daf249842c725cef102\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736cf50daf249842c725cef102\",\"width\":640,\"height\":640}]},\"spotify:album:4YP0h2KGDb20eJuStnBvim\":{\"uri\":\"spotify:album:4YP0h2KGDb20eJuStnBvim\",\"title\":\"Traumazine\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e021182d680c2894b4e0f39033e\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048511182d680c2894b4e0f39033e\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2731182d680c2894b4e0f39033e\",\"width\":640,\"height\":640}]},\"spotify:album:6vMJlYnbu2xPfkBNZ43UWf\":{\"uri\":\"spotify:album:6vMJlYnbu2xPfkBNZ43UWf\",\"title\":\"I Need a Miracle (The Remixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02493dfb8a742630f7c1a2aeda\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851493dfb8a742630f7c1a2aeda\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273493dfb8a742630f7c1a2aeda\",\"width\":640,\"height\":640}]},\"spotify:album:6qLRpElUtErtN1VJa8tS5Y\":{\"uri\":\"spotify:album:6qLRpElUtErtN1VJa8tS5Y\",\"title\":\"Purrr!\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02173d80af856582108e38955a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851173d80af856582108e38955a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273173d80af856582108e38955a\",\"width\":640,\"height\":640}]},\"spotify:album:2HIaUwS0PTUeqFFYHBBGAN\":{\"uri\":\"spotify:album:2HIaUwS0PTUeqFFYHBBGAN\",\"title\":\"Ungodly Hour\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02741bb85cfdde70bf9fc9436b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851741bb85cfdde70bf9fc9436b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273741bb85cfdde70bf9fc9436b\",\"width\":640,\"height\":640}]},\"spotify:album:1Wwj6FD198ttp8Re8kRUFr\":{\"uri\":\"spotify:album:1Wwj6FD198ttp8Re8kRUFr\",\"title\":\"Girl Of My Dreams\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029175463e7d2daa82ea6beee7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519175463e7d2daa82ea6beee7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739175463e7d2daa82ea6beee7\",\"width\":640,\"height\":640}]},\"spotify:album:5KbQGzcWL7VgTeLqjftNWH\":{\"uri\":\"spotify:album:5KbQGzcWL7VgTeLqjftNWH\",\"title\":\"Girl Of My Dreams (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026e0d8199637baad3e4ce6615\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516e0d8199637baad3e4ce6615\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736e0d8199637baad3e4ce6615\",\"width\":640,\"height\":640}]},\"spotify:album:6nDKYcq1CFwm01xRIXlcFV\":{\"uri\":\"spotify:album:6nDKYcq1CFwm01xRIXlcFV\",\"title\":\"Girl Of My Dreams\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027df19acdb5861bc17b533109\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517df19acdb5861bc17b533109\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737df19acdb5861bc17b533109\",\"width\":640,\"height\":640}]},\"spotify:album:4KaiavWFhR7j9tY1f7V6UL\":{\"uri\":\"spotify:album:4KaiavWFhR7j9tY1f7V6UL\",\"title\":\"Nightmare\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020db100d30d1ef9a91aefeabf\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510db100d30d1ef9a91aefeabf\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730db100d30d1ef9a91aefeabf\",\"width\":640,\"height\":640}]},\"spotify:album:4rs52z8T5zPbsa5HM75tua\":{\"uri\":\"spotify:album:4rs52z8T5zPbsa5HM75tua\",\"title\":\"Slut Pop\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b4bbea930ec98602a528f9ea\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b4bbea930ec98602a528f9ea\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b4bbea930ec98602a528f9ea\",\"width\":640,\"height\":640}]},\"spotify:album:2izzggtAmxtZaKs35JCurA\":{\"uri\":\"spotify:album:2izzggtAmxtZaKs35JCurA\",\"title\":\"Feed The Beast\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02861a8fa0986995f1e1e1b4c3\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851861a8fa0986995f1e1e1b4c3\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273861a8fa0986995f1e1e1b4c3\",\"width\":640,\"height\":640}]},\"spotify:album:63nZs6ZWIIeEIfJSBP8Lj9\":{\"uri\":\"spotify:album:63nZs6ZWIIeEIfJSBP8Lj9\",\"title\":\"M.I.L.F. $ (Remixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02fc21ec6fccad8f81e3bf85e7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851fc21ec6fccad8f81e3bf85e7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273fc21ec6fccad8f81e3bf85e7\",\"width\":640,\"height\":640}]},\"spotify:album:7Ff7he6c7fzyMhAakcoD2e\":{\"uri\":\"spotify:album:7Ff7he6c7fzyMhAakcoD2e\",\"title\":\"Double Dutchess\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a34c13f919154e4f73ccd48c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a34c13f919154e4f73ccd48c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a34c13f919154e4f73ccd48c\",\"width\":640,\"height\":640}]},\"spotify:album:5pLlGJrxuQO3jMoQe1XxZY\":{\"uri\":\"spotify:album:5pLlGJrxuQO3jMoQe1XxZY\",\"title\":\"Unapologetic (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026dee21d6cd1823e4d6231d37\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516dee21d6cd1823e4d6231d37\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736dee21d6cd1823e4d6231d37\",\"width\":640,\"height\":640}]},\"spotify:album:4XBfFj0WYyh5mBtU61EdyY\":{\"uri\":\"spotify:album:4XBfFj0WYyh5mBtU61EdyY\",\"title\":\"Unapologetic\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026ede83cf8307a1d0174029ac\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516ede83cf8307a1d0174029ac\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736ede83cf8307a1d0174029ac\",\"width\":640,\"height\":640}]},\"spotify:album:5UDXzVwWnn3mDy3mTpQPYb\":{\"uri\":\"spotify:album:5UDXzVwWnn3mDy3mTpQPYb\",\"title\":\"Unapologetic (Edited Version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02ab54aadb2320f1c687735d1e\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851ab54aadb2320f1c687735d1e\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273ab54aadb2320f1c687735d1e\",\"width\":640,\"height\":640}]},\"spotify:album:19ircUdNQ6aoqelvZJf2vC\":{\"uri\":\"spotify:album:19ircUdNQ6aoqelvZJf2vC\",\"title\":\"A Real Romantic\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02daec55e24fc6f409ca316bda\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851daec55e24fc6f409ca316bda\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273daec55e24fc6f409ca316bda\",\"width\":640,\"height\":640}]},\"spotify:album:5ppnlEoj4HdRRdRihnY3jU\":{\"uri\":\"spotify:album:5ppnlEoj4HdRRdRihnY3jU\",\"title\":\"Oral Fixation, Vol. 2 (Expanded Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0227ddd747545c0d0cfe7595fa\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485127ddd747545c0d0cfe7595fa\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27327ddd747545c0d0cfe7595fa\",\"width\":640,\"height\":640}]},\"spotify:album:4KdtEKjY3Gi0mKiSdy96ML\":{\"uri\":\"spotify:album:4KdtEKjY3Gi0mKiSdy96ML\",\"title\":\"Invasion of Privacy\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a0caffda54afd0a65995bbab\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a0caffda54afd0a65995bbab\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a0caffda54afd0a65995bbab\",\"width\":640,\"height\":640}]},\"spotify:album:4SBl4zvNIL4H137YRf2P0J\":{\"uri\":\"spotify:album:4SBl4zvNIL4H137YRf2P0J\",\"title\":\"Solar Power\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0236615a0a60523dd62135ab3a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485136615a0a60523dd62135ab3a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27336615a0a60523dd62135ab3a\",\"width\":640,\"height\":640}]},\"spotify:album:3lK2JRwfIOn2NaYtgEGTmZ\":{\"uri\":\"spotify:album:3lK2JRwfIOn2NaYtgEGTmZ\",\"title\":\"Solar Power (Deluxe Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a5603d487cfa2c30a05cdfaa\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a5603d487cfa2c30a05cdfaa\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a5603d487cfa2c30a05cdfaa\",\"width\":640,\"height\":640}]},\"spotify:album:3QFR3OduDKvQpTPsnmiYl9\":{\"uri\":\"spotify:album:3QFR3OduDKvQpTPsnmiYl9\",\"title\":\"Heartbreaker\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c1725be0a413be97208ccdca\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c1725be0a413be97208ccdca\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c1725be0a413be97208ccdca\",\"width\":640,\"height\":640}]},\"spotify:album:21x0bCve7UJ7ZAapjt8GFz\":{\"uri\":\"spotify:album:21x0bCve7UJ7ZAapjt8GFz\",\"title\":\"UP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0265f27da14d572556a8a59755\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485165f27da14d572556a8a59755\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27365f27da14d572556a8a59755\",\"width\":640,\"height\":640}]},\"spotify:album:2qTIltFPwJzsyssGeOwdRO\":{\"uri\":\"spotify:album:2qTIltFPwJzsyssGeOwdRO\",\"title\":\"Hot Shit (feat. Ye & Lil Durk)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b629e669238964a725937c1b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b629e669238964a725937c1b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b629e669238964a725937c1b\",\"width\":640,\"height\":640}]},\"spotify:album:1RdCB5mHiyWLYjmoCwHBch\":{\"uri\":\"spotify:album:1RdCB5mHiyWLYjmoCwHBch\",\"title\":\"Hot Shit (feat. Ye & Lil Durk) [Instrumental]\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b2fb52d8e6eb4a885f9b6407\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b2fb52d8e6eb4a885f9b6407\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b2fb52d8e6eb4a885f9b6407\",\"width\":640,\"height\":640}]},\"spotify:album:16maAu5lqvFBSEEHyB5GzV\":{\"uri\":\"spotify:album:16maAu5lqvFBSEEHyB5GzV\",\"title\":\"Wild Side (feat. Cardi B)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a8f5bb7820a39675e04f4aa8\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a8f5bb7820a39675e04f4aa8\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a8f5bb7820a39675e04f4aa8\",\"width\":640,\"height\":640}]},\"spotify:album:6oRrfGcUeAwfX1lTdxZFFj\":{\"uri\":\"spotify:album:6oRrfGcUeAwfX1lTdxZFFj\",\"title\":\"I Like It\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0237422e424f7e93330acc5719\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485137422e424f7e93330acc5719\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27337422e424f7e93330acc5719\",\"width\":640,\"height\":640}]},\"spotify:album:0beL2KlaidCnuLhvBn3C4X\":{\"uri\":\"spotify:album:0beL2KlaidCnuLhvBn3C4X\",\"title\":\"I Like It (feat. Kontra K and AK Ausserkontrolle)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0239175516853df9c057e9eb8a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485139175516853df9c057e9eb8a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27339175516853df9c057e9eb8a\",\"width\":640,\"height\":640}]},\"spotify:album:29PjmuuEZ2YCqkCoIjAoEt\":{\"uri\":\"spotify:album:29PjmuuEZ2YCqkCoIjAoEt\",\"title\":\"Be Careful\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0216a48372cce028b609da2a92\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485116a48372cce028b609da2a92\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27316a48372cce028b609da2a92\",\"width\":640,\"height\":640}]},\"spotify:album:0RCsSKIPBAjn5blwroKpdW\":{\"uri\":\"spotify:album:0RCsSKIPBAjn5blwroKpdW\",\"title\":\"WAP (Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02352108cb6eed19bd62b1dd8d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851352108cb6eed19bd62b1dd8d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273352108cb6eed19bd62b1dd8d\",\"width\":640,\"height\":640}]},\"spotify:album:4Rh57STD18rbjXbBrx2X65\":{\"uri\":\"spotify:album:4Rh57STD18rbjXbBrx2X65\",\"title\":\"Queen\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d0c7233f8b6511bf7e09de2b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d0c7233f8b6511bf7e09de2b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d0c7233f8b6511bf7e09de2b\",\"width\":640,\"height\":640}]},\"spotify:album:6zA5X3CQ5rgLKhTobyV5Id\":{\"uri\":\"spotify:album:6zA5X3CQ5rgLKhTobyV5Id\",\"title\":\"Queen (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02fc8c64bfc4323ff7ce68fea8\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851fc8c64bfc4323ff7ce68fea8\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273fc8c64bfc4323ff7ce68fea8\",\"width\":640,\"height\":640}]},\"spotify:album:2upw5IrzeqKApIQZyx5o6r\":{\"uri\":\"spotify:album:2upw5IrzeqKApIQZyx5o6r\",\"title\":\"Beam Me Up Scotty\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026d8b9f3e7337f6bff76ceff6\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516d8b9f3e7337f6bff76ceff6\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736d8b9f3e7337f6bff76ceff6\",\"width\":640,\"height\":640}]},\"spotify:album:7aADdYLiK1z7GlMFr0UIZw\":{\"uri\":\"spotify:album:7aADdYLiK1z7GlMFr0UIZw\",\"title\":\"Pink Friday (Complete Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02aa7d2641af0fa4c1f76fafbf\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851aa7d2641af0fa4c1f76fafbf\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273aa7d2641af0fa4c1f76fafbf\",\"width\":640,\"height\":640}]},\"spotify:album:3LJhoYn4nnHmvPRO3ppbsl\":{\"uri\":\"spotify:album:3LJhoYn4nnHmvPRO3ppbsl\",\"title\":\"Pink Friday\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c17570626959bfa6c2435925\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c17570626959bfa6c2435925\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c17570626959bfa6c2435925\",\"width\":640,\"height\":640}]},\"spotify:album:7GfHTwHGoDzOEDInYlnR25\":{\"uri\":\"spotify:album:7GfHTwHGoDzOEDInYlnR25\",\"title\":\"Pound Town 2 (feat. Nicki Minaj & Tay Keith)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c9ed77bebc9b91ea9f3dd6ba\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c9ed77bebc9b91ea9f3dd6ba\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c9ed77bebc9b91ea9f3dd6ba\",\"width\":640,\"height\":640}]},\"spotify:album:5CM66hwjlbZ06LhONWXOAs\":{\"uri\":\"spotify:album:5CM66hwjlbZ06LhONWXOAs\",\"title\":\"Barbie World (with Aqua) [From Barbie The Album]\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027e8f938c02fac3b564931116\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517e8f938c02fac3b564931116\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737e8f938c02fac3b564931116\",\"width\":640,\"height\":640}]},\"spotify:album:5g1PlQbcnlR5LtbJhSeCCC\":{\"uri\":\"spotify:album:5g1PlQbcnlR5LtbJhSeCCC\",\"title\":\"Barbie World (with Aqua) [From Barbie The Album]\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0252757adeebadd69524b2bc45\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485152757adeebadd69524b2bc45\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27352757adeebadd69524b2bc45\",\"width\":640,\"height\":640}]},\"spotify:album:4jzYKkhMfaEFxDRevZqDdK\":{\"uri\":\"spotify:album:4jzYKkhMfaEFxDRevZqDdK\",\"title\":\"Survive The Summer\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e022fe64d6b4d019a38af3dcdc4\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048512fe64d6b4d019a38af3dcdc4\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2732fe64d6b4d019a38af3dcdc4\",\"width\":640,\"height\":640}]},\"spotify:album:4z4Pgh0fNUQkmGP4K1XxDb\":{\"uri\":\"spotify:album:4z4Pgh0fNUQkmGP4K1XxDb\",\"title\":\"Reclassified\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02addae77268e3b66b310c8296\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851addae77268e3b66b310c8296\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273addae77268e3b66b310c8296\",\"width\":640,\"height\":640}]},\"spotify:album:43QAtqkOmiYzJr1LjoNx7Q\":{\"uri\":\"spotify:album:43QAtqkOmiYzJr1LjoNx7Q\",\"title\":\"Iam The Stripclub\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f3fae6759d6539972d332b41\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f3fae6759d6539972d332b41\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f3fae6759d6539972d332b41\",\"width\":640,\"height\":640}]},\"spotify:album:04MknhNSl3DH9qDbBr61bS\":{\"uri\":\"spotify:album:04MknhNSl3DH9qDbBr61bS\",\"title\":\"Started\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d454aaa70036f6ba8af3419f\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d454aaa70036f6ba8af3419f\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d454aaa70036f6ba8af3419f\",\"width\":640,\"height\":640}]},\"spotify:album:11JEpIQxVu38w29wPWNmsl\":{\"uri\":\"spotify:album:11JEpIQxVu38w29wPWNmsl\",\"title\":\"Mo Bounce\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b0055438d0178b6bb266546a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b0055438d0178b6bb266546a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b0055438d0178b6bb266546a\",\"width\":640,\"height\":640}]},\"spotify:album:4PO7o9mAqnbUt9wluLjhVB\":{\"uri\":\"spotify:album:4PO7o9mAqnbUt9wluLjhVB\",\"title\":\"Switch\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d9ecb3209aaaec6f246d527d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d9ecb3209aaaec6f246d527d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d9ecb3209aaaec6f246d527d\",\"width\":640,\"height\":640}]},\"spotify:album:6G7UUajF4m2Ms4VGOWSSMo\":{\"uri\":\"spotify:album:6G7UUajF4m2Ms4VGOWSSMo\",\"title\":\"Switch (Remixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02946fb05bcdae99cf8e288ea9\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851946fb05bcdae99cf8e288ea9\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273946fb05bcdae99cf8e288ea9\",\"width\":640,\"height\":640}]},\"spotify:album:1fUWcEXASKbg04bzQ3ftUV\":{\"uri\":\"spotify:album:1fUWcEXASKbg04bzQ3ftUV\",\"title\":\"Brazil (Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0212f9df4b726449f78030367c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485112f9df4b726449f78030367c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27312f9df4b726449f78030367c\",\"width\":640,\"height\":640}]},\"spotify:album:3HV3ecmJJ2GmHM93vVVKXF\":{\"uri\":\"spotify:album:3HV3ecmJJ2GmHM93vVVKXF\",\"title\":\"Confident (Deluxe Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024e4f7c7ec167ec30c1c66e69\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514e4f7c7ec167ec30c1c66e69\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734e4f7c7ec167ec30c1c66e69\",\"width\":640,\"height\":640}]},\"spotify:album:56yYgfX6M5FlpETfyZSHkn\":{\"uri\":\"spotify:album:56yYgfX6M5FlpETfyZSHkn\",\"title\":\"Confident\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02ed164cf1c10f028e8f528784\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851ed164cf1c10f028e8f528784\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273ed164cf1c10f028e8f528784\",\"width\":640,\"height\":640}]},\"spotify:album:67Oj2Xp58YdtR5LZCERafA\":{\"uri\":\"spotify:album:67Oj2Xp58YdtR5LZCERafA\",\"title\":\"WAP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0256c669004721a465f5c9498b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485156c669004721a465f5c9498b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27356c669004721a465f5c9498b\",\"width\":640,\"height\":640}]},\"spotify:album:5BNrcvfbLyADks4RXPW7VP\":{\"uri\":\"spotify:album:5BNrcvfbLyADks4RXPW7VP\",\"title\":\"Up\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d619b8baab0619516bb53804\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d619b8baab0619516bb53804\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d619b8baab0619516bb53804\",\"width\":640,\"height\":640}]},\"spotify:album:1MD1XVpaeS7xAG5mD5KeKJ\":{\"uri\":\"spotify:album:1MD1XVpaeS7xAG5mD5KeKJ\",\"title\":\"PUSSY\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f0fc0fd724fd6eadea48634c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f0fc0fd724fd6eadea48634c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f0fc0fd724fd6eadea48634c\",\"width\":640,\"height\":640}]},\"spotify:album:1q7SzYw0PLBW7bX54Bog0c\":{\"uri\":\"spotify:album:1q7SzYw0PLBW7bX54Bog0c\",\"title\":\"WAP (feat. Megan Thee Stallion)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e022c45e6016a98cc21d43a3126\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048512c45e6016a98cc21d43a3126\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2732c45e6016a98cc21d43a3126\",\"width\":640,\"height\":640}]},\"spotify:album:7mRhzwh8TINisagYjnmIMT\":{\"uri\":\"spotify:album:7mRhzwh8TINisagYjnmIMT\",\"title\":\"Hot\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02497e791a71b496fa4ddbc363\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851497e791a71b496fa4ddbc363\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273497e791a71b496fa4ddbc363\",\"width\":640,\"height\":640}]},\"spotify:album:7f9fxAFDIRaflD7W0k7Dhx\":{\"uri\":\"spotify:album:7f9fxAFDIRaflD7W0k7Dhx\",\"title\":\"Plan B\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029f8ac8acbc38949b5d07edb7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519f8ac8acbc38949b5d07edb7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739f8ac8acbc38949b5d07edb7\",\"width\":640,\"height\":640}]},\"spotify:album:4acZyhrXnAZR3PSDLAaoX5\":{\"uri\":\"spotify:album:4acZyhrXnAZR3PSDLAaoX5\",\"title\":\"REALLY HER\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0259061f4648d8590d0839d291\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485159061f4648d8590d0839d291\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27359061f4648d8590d0839d291\",\"width\":640,\"height\":640}]},\"spotify:album:2lUZ8Vde6vLKqg4kdaAuXZ\":{\"uri\":\"spotify:album:2lUZ8Vde6vLKqg4kdaAuXZ\",\"title\":\"BEACH BALL (feat. BIA)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02271e10a6f3e390d0550bfb42\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851271e10a6f3e390d0550bfb42\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273271e10a6f3e390d0550bfb42\",\"width\":640,\"height\":640}]},\"spotify:album:56vCgdP2fIuKtvMu6MBL2Q\":{\"uri\":\"spotify:album:56vCgdP2fIuKtvMu6MBL2Q\",\"title\":\"Lotus (Deluxe Version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e021736bda7a710514bcce25194\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048511736bda7a710514bcce25194\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2731736bda7a710514bcce25194\",\"width\":640,\"height\":640}]},\"spotify:album:2USigX9DhGuAini71XZEEK\":{\"uri\":\"spotify:album:2USigX9DhGuAini71XZEEK\",\"title\":\"Stripped\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027cd872c7701c4737b2f81d87\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517cd872c7701c4737b2f81d87\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737cd872c7701c4737b2f81d87\",\"width\":640,\"height\":640}]},\"spotify:album:47Tem5uw8ayCTyhDv1oXOY\":{\"uri\":\"spotify:album:47Tem5uw8ayCTyhDv1oXOY\",\"title\":\"Suéltame\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026cbd923c774da2482ec60054\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516cbd923c774da2482ec60054\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736cbd923c774da2482ec60054\",\"width\":640,\"height\":640}]},\"spotify:album:0WtOyuBYge9gx7X8MpCeeW\":{\"uri\":\"spotify:album:0WtOyuBYge9gx7X8MpCeeW\",\"title\":\"Pa Mis Muchachas (feat. Nathy Peluso)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027699b7a2ed0c80811937ba5d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517699b7a2ed0c80811937ba5d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737699b7a2ed0c80811937ba5d\",\"width\":640,\"height\":640}]},\"spotify:album:0W26jiUrelF5wFU9NupE40\":{\"uri\":\"spotify:album:0W26jiUrelF5wFU9NupE40\",\"title\":\"Twice\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d7d16f366e0fc0e32f12dac7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d7d16f366e0fc0e32f12dac7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d7d16f366e0fc0e32f12dac7\",\"width\":640,\"height\":640}]},\"spotify:album:1snrPQMoTrBsKl73wzSxbn\":{\"uri\":\"spotify:album:1snrPQMoTrBsKl73wzSxbn\",\"title\":\"Hands All Over (Revised International Standard version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029585ff55fff75c5c07a619cb\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519585ff55fff75c5c07a619cb\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739585ff55fff75c5c07a619cb\",\"width\":640,\"height\":640}]},\"spotify:album:0Fe4Uj7GkgA1uDGGk8s92C\":{\"uri\":\"spotify:album:0Fe4Uj7GkgA1uDGGk8s92C\",\"title\":\"Up (Instrumental)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02199f2f07a9be49f2c930299a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851199f2f07a9be49f2c930299a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273199f2f07a9be49f2c930299a\",\"width\":640,\"height\":640}]},\"spotify:album:46XHR39auVTRzFGIhgZxdQ\":{\"uri\":\"spotify:album:46XHR39auVTRzFGIhgZxdQ\",\"title\":\"Body (Joel Corry Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027a431e346c53e7afa60fa678\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517a431e346c53e7afa60fa678\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737a431e346c53e7afa60fa678\",\"width\":640,\"height\":640}]},\"spotify:album:7gEGuvkVs79hY4tG7OYnzx\":{\"uri\":\"spotify:album:7gEGuvkVs79hY4tG7OYnzx\",\"title\":\"Thot Shit\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02bc4f7b30f8bbbb9af57ea212\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851bc4f7b30f8bbbb9af57ea212\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273bc4f7b30f8bbbb9af57ea212\",\"width\":640,\"height\":640}]},\"spotify:album:6QcDsGaAocffXZY828eh8q\":{\"uri\":\"spotify:album:6QcDsGaAocffXZY828eh8q\",\"title\":\"Lick (with Megan Thee Stallion)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e022b4ff6591c974dda0b1f5741\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048512b4ff6591c974dda0b1f5741\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2732b4ff6591c974dda0b1f5741\",\"width\":640,\"height\":640}]},\"spotify:album:0pcFMWHPMVHE25NiT1U6Bc\":{\"uri\":\"spotify:album:0pcFMWHPMVHE25NiT1U6Bc\",\"title\":\"Girls in the Hood\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02526508b0ea45482aecd5814a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851526508b0ea45482aecd5814a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273526508b0ea45482aecd5814a\",\"width\":640,\"height\":640}]},\"spotify:album:6dm2dXeXB37jhsxKjgKAvw\":{\"uri\":\"spotify:album:6dm2dXeXB37jhsxKjgKAvw\",\"title\":\"Don’t Stop (feat. Young Thug)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02cab47a6cf7fba7cf73f83694\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851cab47a6cf7fba7cf73f83694\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273cab47a6cf7fba7cf73f83694\",\"width\":640,\"height\":640}]},\"spotify:album:4FeCh8gOiKw8syCtXysELk\":{\"uri\":\"spotify:album:4FeCh8gOiKw8syCtXysELk\",\"title\":\"FREAK\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e022bff8b7afd5b18cc2b09e73a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048512bff8b7afd5b18cc2b09e73a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2732bff8b7afd5b18cc2b09e73a\",\"width\":640,\"height\":640}]},\"spotify:album:52IFBdPDzazoTq21pbXw19\":{\"uri\":\"spotify:album:52IFBdPDzazoTq21pbXw19\",\"title\":\"Pull up Late\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e022286a970185da06a1c75fc36\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048512286a970185da06a1c75fc36\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2732286a970185da06a1c75fc36\",\"width\":640,\"height\":640}]},\"spotify:album:0BFB87VJlDwD7dI62BQ53B\":{\"uri\":\"spotify:album:0BFB87VJlDwD7dI62BQ53B\",\"title\":\"Realer\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e023949eb363afdf4bd41b09d60\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048513949eb363afdf4bd41b09d60\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2733949eb363afdf4bd41b09d60\",\"width\":640,\"height\":640}]},\"spotify:album:22F5ZYY1sxoJjk6HzZfmC1\":{\"uri\":\"spotify:album:22F5ZYY1sxoJjk6HzZfmC1\",\"title\":\"Pink Friday: Roman Reloaded The Re-Up (Explicit Version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02ef9ad61e2a4f15606fd4ab15\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851ef9ad61e2a4f15606fd4ab15\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273ef9ad61e2a4f15606fd4ab15\",\"width\":640,\"height\":640}]},\"spotify:album:4cIAp0fnyPfICPqELp7LSH\":{\"uri\":\"spotify:album:4cIAp0fnyPfICPqELp7LSH\",\"title\":\"Pink Friday (Deluxe Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e021455defcb0b02a3d3a5388f7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048511455defcb0b02a3d3a5388f7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2731455defcb0b02a3d3a5388f7\",\"width\":640,\"height\":640}]},\"spotify:album:2MLDIf7qds0NKW0JGltVT3\":{\"uri\":\"spotify:album:2MLDIf7qds0NKW0JGltVT3\",\"title\":\"Save It Til Morning (Edit)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b8bd2871730dbe85ee0a47a0\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b8bd2871730dbe85ee0a47a0\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b8bd2871730dbe85ee0a47a0\",\"width\":640,\"height\":640}]},\"spotify:album:5sUsbWCo9dM3NbgUMJWYFJ\":{\"uri\":\"spotify:album:5sUsbWCo9dM3NbgUMJWYFJ\",\"title\":\"You Already Know (feat. Nicki Minaj)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024f46535b78489c5c97d556a9\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514f46535b78489c5c97d556a9\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734f46535b78489c5c97d556a9\",\"width\":640,\"height\":640}]},\"spotify:album:4SWjZx8qzn06AA2VUdjBBd\":{\"uri\":\"spotify:album:4SWjZx8qzn06AA2VUdjBBd\",\"title\":\"London Bridge\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0238e1d04d2d408bba139e9e9d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485138e1d04d2d408bba139e9e9d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27338e1d04d2d408bba139e9e9d\",\"width\":640,\"height\":640}]},\"spotify:album:5qvBOUULs56zjLTTkUFyCM\":{\"uri\":\"spotify:album:5qvBOUULs56zjLTTkUFyCM\",\"title\":\"The Dutchess Deluxe EP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e025534f1152c5e041e08beeb15\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048515534f1152c5e041e08beeb15\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2735534f1152c5e041e08beeb15\",\"width\":640,\"height\":640}]},\"spotify:album:4SJNv3d4hMUrbJhsaBTVgj\":{\"uri\":\"spotify:album:4SJNv3d4hMUrbJhsaBTVgj\",\"title\":\"Clumsy (Collipark Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02755c415510393947cdd44264\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851755c415510393947cdd44264\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273755c415510393947cdd44264\",\"width\":640,\"height\":640}]},\"spotify:album:75uuE7LFS7RtcUVJOnNLMg\":{\"uri\":\"spotify:album:75uuE7LFS7RtcUVJOnNLMg\",\"title\":\"Whatever U Like\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a38abc449cf1e9da248f65cd\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a38abc449cf1e9da248f65cd\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a38abc449cf1e9da248f65cd\",\"width\":640,\"height\":640}]},\"spotify:album:2n1GcX9oFEQwAXUqTNyXbg\":{\"uri\":\"spotify:album:2n1GcX9oFEQwAXUqTNyXbg\",\"title\":\"Paris\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027389edf3d0d019603d8a8c64\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517389edf3d0d019603d8a8c64\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737389edf3d0d019603d8a8c64\",\"width\":640,\"height\":640}]},\"spotify:album:3jWfBkl247fFkyJprhd5qs\":{\"uri\":\"spotify:album:3jWfBkl247fFkyJprhd5qs\",\"title\":\"Paris (U.S. Standard Version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02442533891bd8dc4c1ce79049\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851442533891bd8dc4c1ce79049\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273442533891bd8dc4c1ce79049\",\"width\":640,\"height\":640}]},\"spotify:album:4jR7A5dJFXdCaY01wlL1p6\":{\"uri\":\"spotify:album:4jR7A5dJFXdCaY01wlL1p6\",\"title\":\"I Blame You\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f7da34d9ee06db11cea36e36\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f7da34d9ee06db11cea36e36\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f7da34d9ee06db11cea36e36\",\"width\":640,\"height\":640}]},\"spotify:album:6zig29KsNHeYua28UatVpd\":{\"uri\":\"spotify:album:6zig29KsNHeYua28UatVpd\",\"title\":\"Nothing In This World\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02000cb757e16e07bc82fcd26b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851000cb757e16e07bc82fcd26b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273000cb757e16e07bc82fcd26b\",\"width\":640,\"height\":640}]},\"spotify:album:0SZJzOdQan4oPVpgfwYPd9\":{\"uri\":\"spotify:album:0SZJzOdQan4oPVpgfwYPd9\",\"title\":\"Nothing In This World (Int'l Maxi)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0255c179390a96ee9b501cc226\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485155c179390a96ee9b501cc226\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27355c179390a96ee9b501cc226\",\"width\":640,\"height\":640}]},\"spotify:album:5CSwhP5jd2eoAiDv9snvev\":{\"uri\":\"spotify:album:5CSwhP5jd2eoAiDv9snvev\",\"title\":\"Nothing In This World (U.K. 2-Track)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e025ca228ec19d758b48f46e237\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048515ca228ec19d758b48f46e237\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2735ca228ec19d758b48f46e237\",\"width\":640,\"height\":640}]},\"spotify:album:0TJPd4Qf05QMSU8RyJiw2y\":{\"uri\":\"spotify:album:0TJPd4Qf05QMSU8RyJiw2y\",\"title\":\"Turn It Up\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024d2b1d63125ee21f901f70ec\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514d2b1d63125ee21f901f70ec\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734d2b1d63125ee21f901f70ec\",\"width\":640,\"height\":640}]},\"spotify:album:4rTifLgiw2mr5U9C4LuhTF\":{\"uri\":\"spotify:album:4rTifLgiw2mr5U9C4LuhTF\",\"title\":\"Turn It Up\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a7a2a41a5a54db491aef8b3d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a7a2a41a5a54db491aef8b3d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a7a2a41a5a54db491aef8b3d\",\"width\":640,\"height\":640}]},\"spotify:album:5x0jYQOTiA3VUsE7Ga8F8P\":{\"uri\":\"spotify:album:5x0jYQOTiA3VUsE7Ga8F8P\",\"title\":\"Come Alive\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027152fca71fcaa94c89b9be4b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517152fca71fcaa94c89b9be4b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737152fca71fcaa94c89b9be4b\",\"width\":640,\"height\":640}]},\"spotify:album:0Qqdz0tLL9khfuFDS1tWCa\":{\"uri\":\"spotify:album:0Qqdz0tLL9khfuFDS1tWCa\",\"title\":\"I Need You\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0236487d97d7a79ecec8b7c113\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485136487d97d7a79ecec8b7c113\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27336487d97d7a79ecec8b7c113\",\"width\":640,\"height\":640}]},\"spotify:album:2A4cjpxbVEXHpvWPIjhJZb\":{\"uri\":\"spotify:album:2A4cjpxbVEXHpvWPIjhJZb\",\"title\":\"Hot One\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0228cea49d01580f9f8742281a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485128cea49d01580f9f8742281a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27328cea49d01580f9f8742281a\",\"width\":640,\"height\":640}]},\"spotify:album:5dEiXfnGyPT4FhM7eJ4I1H\":{\"uri\":\"spotify:album:5dEiXfnGyPT4FhM7eJ4I1H\",\"title\":\"Stars Are Blind (Paris' Version) [feat. Kim Petras]\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029b03e45d921c5813673867cc\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519b03e45d921c5813673867cc\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739b03e45d921c5813673867cc\",\"width\":640,\"height\":640}]},\"spotify:album:1aewPKuZnk24bAoJIuh7Sv\":{\"uri\":\"spotify:album:1aewPKuZnk24bAoJIuh7Sv\",\"title\":\"Dreams Come True\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02045a048553cf8d3210bc6f5a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851045a048553cf8d3210bc6f5a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273045a048553cf8d3210bc6f5a\",\"width\":640,\"height\":640}]},\"spotify:album:6B7a05RkkW6jz71W7Erlaw\":{\"uri\":\"spotify:album:6B7a05RkkW6jz71W7Erlaw\",\"title\":\"Trash Me\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027ca16193a78375334536dc0d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517ca16193a78375334536dc0d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737ca16193a78375334536dc0d\",\"width\":640,\"height\":640}]},\"spotify:album:0w5HxteP4Tqwc1F9Bsido7\":{\"uri\":\"spotify:album:0w5HxteP4Tqwc1F9Bsido7\",\"title\":\"Sex Ed\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0284152286e8af8ee97beb7939\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485184152286e8af8ee97beb7939\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27384152286e8af8ee97beb7939\",\"width\":640,\"height\":640}]},\"spotify:album:0MHyAAVcnhmU76kko43Cax\":{\"uri\":\"spotify:album:0MHyAAVcnhmU76kko43Cax\",\"title\":\"Superficial\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0236af4f096f562f54b76c7eec\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485136af4f096f562f54b76c7eec\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27336af4f096f562f54b76c7eec\",\"width\":640,\"height\":640}]},\"spotify:album:5UKDPRUvUae1NhfhsYZiQp\":{\"uri\":\"spotify:album:5UKDPRUvUae1NhfhsYZiQp\",\"title\":\"I'll Do It\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e028208930dc5e3398c2aa3886b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048518208930dc5e3398c2aa3886b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2738208930dc5e3398c2aa3886b\",\"width\":640,\"height\":640}]},\"spotify:album:3ZNvrzPJ5AQZscVD2kWGVN\":{\"uri\":\"spotify:album:3ZNvrzPJ5AQZscVD2kWGVN\",\"title\":\"Body Language\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0240193c779fb21811a1907014\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485140193c779fb21811a1907014\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27340193c779fb21811a1907014\",\"width\":640,\"height\":640}]},\"spotify:album:3WPfxolk6PpVLPOt4ufSWV\":{\"uri\":\"spotify:album:3WPfxolk6PpVLPOt4ufSWV\",\"title\":\"Superficial [single]\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027c861609616dcc2e87094c80\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517c861609616dcc2e87094c80\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737c861609616dcc2e87094c80\",\"width\":640,\"height\":640}]},\"spotify:album:1SyXdBexSpid5DYf29cWvb\":{\"uri\":\"spotify:album:1SyXdBexSpid5DYf29cWvb\",\"title\":\"Particles\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020566766b248425ed2037cdfc\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510566766b248425ed2037cdfc\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730566766b248425ed2037cdfc\",\"width\":640,\"height\":640}]},\"spotify:album:09x0yWQxsi5KQZYAA3Xz01\":{\"uri\":\"spotify:album:09x0yWQxsi5KQZYAA3Xz01\",\"title\":\"These Boots Are Made for Walkin' EP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02ddf30854436e2efc610031fd\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851ddf30854436e2efc610031fd\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273ddf30854436e2efc610031fd\",\"width\":640,\"height\":640}]},\"spotify:album:3pct9ssKUHAgZFEbwyXeVu\":{\"uri\":\"spotify:album:3pct9ssKUHAgZFEbwyXeVu\",\"title\":\"Irresistible EP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0229b90025395de481b838ca50\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485129b90025395de481b838ca50\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27329b90025395de481b838ca50\",\"width\":640,\"height\":640}]},\"spotify:album:6ndZiXmpvvU4QYXlqXD4QK\":{\"uri\":\"spotify:album:6ndZiXmpvvU4QYXlqXD4QK\",\"title\":\"These Boots Are Made For Walkin'\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02ef235639d02a778bf8a98bb2\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851ef235639d02a778bf8a98bb2\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273ef235639d02a778bf8a98bb2\",\"width\":640,\"height\":640}]},\"spotify:album:4VKPlqL6mn9ajxzrdg8tJ1\":{\"uri\":\"spotify:album:4VKPlqL6mn9ajxzrdg8tJ1\",\"title\":\"A Public Affair EP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024f98cd477686c0fcc84e0a0b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514f98cd477686c0fcc84e0a0b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734f98cd477686c0fcc84e0a0b\",\"width\":640,\"height\":640}]},\"spotify:album:02YJfuKrZcuiOX9sjKRN1j\":{\"uri\":\"spotify:album:02YJfuKrZcuiOX9sjKRN1j\",\"title\":\"A Public Affair\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f55a77543a30f7d82080ca41\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f55a77543a30f7d82080ca41\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f55a77543a30f7d82080ca41\",\"width\":640,\"height\":640}]},\"spotify:album:0QKZ96QQH4lxtr2e4aQLLE\":{\"uri\":\"spotify:album:0QKZ96QQH4lxtr2e4aQLLE\",\"title\":\"Irresistible\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02339504a4fb243cf3c2477027\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851339504a4fb243cf3c2477027\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273339504a4fb243cf3c2477027\",\"width\":640,\"height\":640}]},\"spotify:album:7JyFyKqG9m3un0r4N72Js4\":{\"uri\":\"spotify:album:7JyFyKqG9m3un0r4N72Js4\",\"title\":\"This Is The Remix\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0235b1a591ab4dcacd3edae030\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485135b1a591ab4dcacd3edae030\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27335b1a591ab4dcacd3edae030\",\"width\":640,\"height\":640}]},\"spotify:album:4wdwc56jy3klCIZvkQDrEw\":{\"uri\":\"spotify:album:4wdwc56jy3klCIZvkQDrEw\",\"title\":\"This Is The Remix\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e023081e84908265afaba07a4ed\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048513081e84908265afaba07a4ed\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2733081e84908265afaba07a4ed\",\"width\":640,\"height\":640}]},\"spotify:album:6FJxoadUE4JNVwWHghBwnb\":{\"uri\":\"spotify:album:6FJxoadUE4JNVwWHghBwnb\",\"title\":\"RENAISSANCE\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020e58a0f8308c1ad403d105e7\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510e58a0f8308c1ad403d105e7\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730e58a0f8308c1ad403d105e7\",\"width\":640,\"height\":640}]},\"spotify:album:0Zd10MKN5j9KwUST0TdBBB\":{\"uri\":\"spotify:album:0Zd10MKN5j9KwUST0TdBBB\",\"title\":\"B'Day Deluxe Edition\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02026e88f624dfb96f2e1ef10b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851026e88f624dfb96f2e1ef10b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273026e88f624dfb96f2e1ef10b\",\"width\":640,\"height\":640}]},\"spotify:album:1L6sJLS18bJTadBupSYFAp\":{\"uri\":\"spotify:album:1L6sJLS18bJTadBupSYFAp\",\"title\":\"B'Day\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e027c4927f7bd6750438f01ba77\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048517c4927f7bd6750438f01ba77\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2737c4927f7bd6750438f01ba77\",\"width\":640,\"height\":640}]},\"spotify:album:06v9eHnqhMK2tbM2Iz3p0Y\":{\"uri\":\"spotify:album:06v9eHnqhMK2tbM2Iz3p0Y\",\"title\":\"Dangerously In Love\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a9fd4a0405945cd51e8de130\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a9fd4a0405945cd51e8de130\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a9fd4a0405945cd51e8de130\",\"width\":640,\"height\":640}]},\"spotify:album:5O7PYNgE3VLWrvB80fIaDZ\":{\"uri\":\"spotify:album:5O7PYNgE3VLWrvB80fIaDZ\",\"title\":\"I Am...World Tour\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0236bc260ada14991aae54fd39\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485136bc260ada14991aae54fd39\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27336bc260ada14991aae54fd39\",\"width\":640,\"height\":640}]},\"spotify:album:73wpHTLtL517aZQleP2zIi\":{\"uri\":\"spotify:album:73wpHTLtL517aZQleP2zIi\",\"title\":\"Party (feat. J. Cole)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0220b16d61e99345bcc5ad666e\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485120b16d61e99345bcc5ad666e\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27320b16d61e99345bcc5ad666e\",\"width\":640,\"height\":640}]},\"spotify:album:4zOrfDLtKoYFeUAc00lLCT\":{\"uri\":\"spotify:album:4zOrfDLtKoYFeUAc00lLCT\",\"title\":\"Single Ladies (Put A Ring On It) - Dance Remixes\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0213f0cc2d042ef327f10067cb\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485113f0cc2d042ef327f10067cb\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27313f0cc2d042ef327f10067cb\",\"width\":640,\"height\":640}]},\"spotify:album:6qavIPdgOkhfVrlZHPnrMt\":{\"uri\":\"spotify:album:6qavIPdgOkhfVrlZHPnrMt\",\"title\":\"Green Light Freemasons EP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02046f0e9c355b73e5c4bb8095\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851046f0e9c355b73e5c4bb8095\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273046f0e9c355b73e5c4bb8095\",\"width\":640,\"height\":640}]},\"spotify:album:0snwMpBNT6GdTSh2mAZyye\":{\"uri\":\"spotify:album:0snwMpBNT6GdTSh2mAZyye\",\"title\":\"Green Light\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02431109ed27391e59bb99d37c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851431109ed27391e59bb99d37c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273431109ed27391e59bb99d37c\",\"width\":640,\"height\":640}]},\"spotify:album:4KgcwGqMnH7akFQrcKzyln\":{\"uri\":\"spotify:album:4KgcwGqMnH7akFQrcKzyln\",\"title\":\"Irreemplazable\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0231cc96b274a0210cb3477931\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485131cc96b274a0210cb3477931\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27331cc96b274a0210cb3477931\",\"width\":640,\"height\":640}]},\"spotify:album:3iyqDnqaFZ2wMeiHAdkIgM\":{\"uri\":\"spotify:album:3iyqDnqaFZ2wMeiHAdkIgM\",\"title\":\"Ring The Alarm (Urban Mixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020cb75a6033b29bc6877b690d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510cb75a6033b29bc6877b690d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730cb75a6033b29bc6877b690d\",\"width\":640,\"height\":640}]},\"spotify:album:1uNij11lLGJogpUIUFBuJD\":{\"uri\":\"spotify:album:1uNij11lLGJogpUIUFBuJD\",\"title\":\"Ring The Alarm (Dance Mixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026dbe59d8b5da72b9618e6c87\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516dbe59d8b5da72b9618e6c87\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736dbe59d8b5da72b9618e6c87\",\"width\":640,\"height\":640}]},\"spotify:album:0dHql9ePRfN3PhfFEbTRCA\":{\"uri\":\"spotify:album:0dHql9ePRfN3PhfFEbTRCA\",\"title\":\"Ring The Alarm (Spanglish Mix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f4bb7e21954523d3c8e5e59c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f4bb7e21954523d3c8e5e59c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f4bb7e21954523d3c8e5e59c\",\"width\":640,\"height\":640}]},\"spotify:album:7oxMwmtHNppvRF72dlooTH\":{\"uri\":\"spotify:album:7oxMwmtHNppvRF72dlooTH\",\"title\":\"Ring The Alarm\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02753ac5b5f479f13a495f274b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851753ac5b5f479f13a495f274b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273753ac5b5f479f13a495f274b\",\"width\":640,\"height\":640}]},\"spotify:album:0A9F5KmnW57A9nHDUdjO1Z\":{\"uri\":\"spotify:album:0A9F5KmnW57A9nHDUdjO1Z\",\"title\":\"Baby Boy\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02e73b9af02bb006f1f76b9332\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851e73b9af02bb006f1f76b9332\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273e73b9af02bb006f1f76b9332\",\"width\":640,\"height\":640}]},\"spotify:album:1dBCl2oCOe5LF0CdSz1llL\":{\"uri\":\"spotify:album:1dBCl2oCOe5LF0CdSz1llL\",\"title\":\"Broken-Hearted Girl\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020ae07f8ede2214e56b2dc75d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510ae07f8ede2214e56b2dc75d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730ae07f8ede2214e56b2dc75d\",\"width\":640,\"height\":640}]},\"spotify:album:0buzXAn3IaIXLK8VjBL6c3\":{\"uri\":\"spotify:album:0buzXAn3IaIXLK8VjBL6c3\",\"title\":\"Broken-Hearted Girl\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02e4792de807df37959e54c8b4\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851e4792de807df37959e54c8b4\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273e4792de807df37959e54c8b4\",\"width\":640,\"height\":640}]},\"spotify:album:463TYrk70CKqd4eYWhFEDc\":{\"uri\":\"spotify:album:463TYrk70CKqd4eYWhFEDc\",\"title\":\"Run The World (Girls)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024d99bd6f0429ee19d3d92d93\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514d99bd6f0429ee19d3d92d93\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734d99bd6f0429ee19d3d92d93\",\"width\":640,\"height\":640}]},\"spotify:album:6sDm2SVKzQaTA2RzQsj3Ev\":{\"uri\":\"spotify:album:6sDm2SVKzQaTA2RzQsj3Ev\",\"title\":\"Run The World (Girls)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c64883f3ec0b5369cd9777fe\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c64883f3ec0b5369cd9777fe\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c64883f3ec0b5369cd9777fe\",\"width\":640,\"height\":640}]},\"spotify:album:2FpAsisq3cgeeI0ogrxGCG\":{\"uri\":\"spotify:album:2FpAsisq3cgeeI0ogrxGCG\",\"title\":\"Run The World (Girls) - Remixes\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020716302554d84fb1bb25fffa\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510716302554d84fb1bb25fffa\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730716302554d84fb1bb25fffa\",\"width\":640,\"height\":640}]},\"spotify:album:1hq4Vrcbua3DDBLhuWFEVQ\":{\"uri\":\"spotify:album:1hq4Vrcbua3DDBLhuWFEVQ\",\"title\":\"Partition\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020665233b3b508fb730c7a479\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510665233b3b508fb730c7a479\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730665233b3b508fb730c7a479\",\"width\":640,\"height\":640}]},\"spotify:album:7vZizzCMyhrVSDe7ngA7i8\":{\"uri\":\"spotify:album:7vZizzCMyhrVSDe7ngA7i8\",\"title\":\"4: The Remix\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026c619c99b519e827d4688434\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516c619c99b519e827d4688434\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736c619c99b519e827d4688434\",\"width\":640,\"height\":640}]},\"spotify:album:5T2DJctibP8AE17HzWpglf\":{\"uri\":\"spotify:album:5T2DJctibP8AE17HzWpglf\",\"title\":\"Man's World\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0279a9432282ee257ac7ca10df\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485179a9432282ee257ac7ca10df\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27379a9432282ee257ac7ca10df\",\"width\":640,\"height\":640}]},\"spotify:album:4HqIEAaytAyzVPnnT0j9j3\":{\"uri\":\"spotify:album:4HqIEAaytAyzVPnnT0j9j3\",\"title\":\"Dirt Femme (Extended Cut)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b1762f566a71db8ecec5d567\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b1762f566a71db8ecec5d567\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b1762f566a71db8ecec5d567\",\"width\":640,\"height\":640}]},\"spotify:album:3755MjOhMsW1I9u9mh3xPF\":{\"uri\":\"spotify:album:3755MjOhMsW1I9u9mh3xPF\",\"title\":\"Dirt Femme\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d5c0f77cf4c6ad252b9e082a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d5c0f77cf4c6ad252b9e082a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d5c0f77cf4c6ad252b9e082a\",\"width\":640,\"height\":640}]},\"spotify:album:1tuekzsMZQOuiMejKP6t2Y\":{\"uri\":\"spotify:album:1tuekzsMZQOuiMejKP6t2Y\",\"title\":\"Lady Wood\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029f0c014998bac13d3181474c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519f0c014998bac13d3181474c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739f0c014998bac13d3181474c\",\"width\":640,\"height\":640}]},\"spotify:album:3lb7EyEcWhZOK0SpZ2dNpn\":{\"uri\":\"spotify:album:3lb7EyEcWhZOK0SpZ2dNpn\",\"title\":\"CRASH (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0229c03653e9d51b8add17e0e2\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485129c03653e9d51b8add17e0e2\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27329c03653e9d51b8add17e0e2\",\"width\":640,\"height\":640}]},\"spotify:album:3dPFgCq5KuPHjBUdSoRmlX\":{\"uri\":\"spotify:album:3dPFgCq5KuPHjBUdSoRmlX\",\"title\":\"2 Die 4 (Jax Jones Midnight Snacks Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0219b82764657004104a45e089\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485119b82764657004104a45e089\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27319b82764657004104a45e089\",\"width\":640,\"height\":640}]},\"spotify:album:5kaCqETtik8oE7M9D8wxrW\":{\"uri\":\"spotify:album:5kaCqETtik8oE7M9D8wxrW\",\"title\":\"Sunshine Kitty\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0255520a551691cdaeec6100eb\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485155520a551691cdaeec6100eb\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27355520a551691cdaeec6100eb\",\"width\":640,\"height\":640}]},\"spotify:album:6p4OKNrv71scAKjHZ16G5t\":{\"uri\":\"spotify:album:6p4OKNrv71scAKjHZ16G5t\",\"title\":\"2 Die 4\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b60e5a76c9dc9f15a11c913d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b60e5a76c9dc9f15a11c913d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b60e5a76c9dc9f15a11c913d\",\"width\":640,\"height\":640}]},\"spotify:album:7a9hWSVvEnoUidwmDjVPuF\":{\"uri\":\"spotify:album:7a9hWSVvEnoUidwmDjVPuF\",\"title\":\"Be Right There\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0266de04aeffada7309519b593\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485166de04aeffada7309519b593\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27366de04aeffada7309519b593\",\"width\":640,\"height\":640}]},\"spotify:album:4l9wMVL4XAM5jPMXP5RAbL\":{\"uri\":\"spotify:album:4l9wMVL4XAM5jPMXP5RAbL\",\"title\":\"Move Your Body\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02dbe45fee4e36211b4bf8de71\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851dbe45fee4e36211b4bf8de71\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273dbe45fee4e36211b4bf8de71\",\"width\":640,\"height\":640}]},\"spotify:album:6nWc9BEgsraWegmmvvyvXI\":{\"uri\":\"spotify:album:6nWc9BEgsraWegmmvvyvXI\",\"title\":\"Move Your Body (RAIZHELL Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020ee9a0f7b20e800ca19262d0\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510ee9a0f7b20e800ca19262d0\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730ee9a0f7b20e800ca19262d0\",\"width\":640,\"height\":640}]},\"spotify:album:09nJrAnPgQU8dLEBj1o1lo\":{\"uri\":\"spotify:album:09nJrAnPgQU8dLEBj1o1lo\",\"title\":\"Move Your Body (Hedex Remix)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02b9cad54109b62b24dedcd8fc\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851b9cad54109b62b24dedcd8fc\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273b9cad54109b62b24dedcd8fc\",\"width\":640,\"height\":640}]},\"spotify:album:4S7vkTViiQhVqjtRfs09Cz\":{\"uri\":\"spotify:album:4S7vkTViiQhVqjtRfs09Cz\",\"title\":\"Move Your Body (Tiësto Edit)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0215386c4a9b085ecc3348fa5c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485115386c4a9b085ecc3348fa5c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27315386c4a9b085ecc3348fa5c\",\"width\":640,\"height\":640}]},\"spotify:album:06SY6Ke6mXzZHhURLVU57R\":{\"uri\":\"spotify:album:06SY6Ke6mXzZHhURLVU57R\",\"title\":\"Teenage Dream\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f619042d5f6b2149a4f5e0ca\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f619042d5f6b2149a4f5e0ca\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f619042d5f6b2149a4f5e0ca\",\"width\":640,\"height\":640}]},\"spotify:album:4E0vDZuTPYYySw3TcVi6H0\":{\"uri\":\"spotify:album:4E0vDZuTPYYySw3TcVi6H0\",\"title\":\"One Of The Boys (15th Anniversary Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029aad89c4734cd44cecaebf71\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519aad89c4734cd44cecaebf71\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739aad89c4734cd44cecaebf71\",\"width\":640,\"height\":640}]},\"spotify:album:3OALgjCs6Lqw41853v4wEQ\":{\"uri\":\"spotify:album:3OALgjCs6Lqw41853v4wEQ\",\"title\":\"One Of The Boys\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e023f97d4244eff5852477d9ee0\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048513f97d4244eff5852477d9ee0\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2733f97d4244eff5852477d9ee0\",\"width\":640,\"height\":640}]},\"spotify:album:3Kbuu2tHsIbplFUkB7a5oE\":{\"uri\":\"spotify:album:3Kbuu2tHsIbplFUkB7a5oE\",\"title\":\"Revival (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026bc7473df6c9d1fd90972e84\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516bc7473df6c9d1fd90972e84\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736bc7473df6c9d1fd90972e84\",\"width\":640,\"height\":640}]},\"spotify:album:7FbUyvtDTsoGMhTlGOtv5q\":{\"uri\":\"spotify:album:7FbUyvtDTsoGMhTlGOtv5q\",\"title\":\"Good For You\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02aad6fe0c229e8272edbce251\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851aad6fe0c229e8272edbce251\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273aad6fe0c229e8272edbce251\",\"width\":640,\"height\":640}]},\"spotify:album:1ABd3n81ABgFoQeXUGENeI\":{\"uri\":\"spotify:album:1ABd3n81ABgFoQeXUGENeI\",\"title\":\"Good For You (Remixes)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e023e1fa9b71570ad7d99da0aa5\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048513e1fa9b71570ad7d99da0aa5\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2733e1fa9b71570ad7d99da0aa5\",\"width\":640,\"height\":640}]},\"spotify:album:6oxVabMIqCMJRYN1GqR3Vf\":{\"uri\":\"spotify:album:6oxVabMIqCMJRYN1GqR3Vf\",\"title\":\"Dangerously In Love\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0245680a4a57c97894490a01c1\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485145680a4a57c97894490a01c1\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27345680a4a57c97894490a01c1\",\"width\":640,\"height\":640}]},\"spotify:album:21gk0Gn8JCF9bsu9dThv5e\":{\"uri\":\"spotify:album:21gk0Gn8JCF9bsu9dThv5e\",\"title\":\"P PACK\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e028be2bdd97160916ac9cba22d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048518be2bdd97160916ac9cba22d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2738be2bdd97160916ac9cba22d\",\"width\":640,\"height\":640}]},\"spotify:album:7lzAdbjppaETpFOUnKeazg\":{\"uri\":\"spotify:album:7lzAdbjppaETpFOUnKeazg\",\"title\":\"BURNA FONE\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0270b32301ac0acfebe649ccb4\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485170b32301ac0acfebe649ccb4\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27370b32301ac0acfebe649ccb4\",\"width\":640,\"height\":640}]},\"spotify:album:5IvrGvYLGSOnWGaLFAIze8\":{\"uri\":\"spotify:album:5IvrGvYLGSOnWGaLFAIze8\",\"title\":\"GETTN OVA U\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0241a385fb4f850eb5c8a2289b\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485141a385fb4f850eb5c8a2289b\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27341a385fb4f850eb5c8a2289b\",\"width\":640,\"height\":640}]},\"spotify:album:1glKNCGA70lAvykhx0Onr2\":{\"uri\":\"spotify:album:1glKNCGA70lAvykhx0Onr2\",\"title\":\"burnt ur clothes & changed the addy\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0281f4687cae99d484bfbd224c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485181f4687cae99d484bfbd224c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27381f4687cae99d484bfbd224c\",\"width\":640,\"height\":640}]},\"spotify:album:2eH0mvujQc0kt3TRu9W980\":{\"uri\":\"spotify:album:2eH0mvujQc0kt3TRu9W980\",\"title\":\"proof\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c19fe53ba01e1696a0ce722c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c19fe53ba01e1696a0ce722c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c19fe53ba01e1696a0ce722c\",\"width\":640,\"height\":640}]},\"spotify:album:4zPRnjsf4e82c3S44NssLx\":{\"uri\":\"spotify:album:4zPRnjsf4e82c3S44NssLx\",\"title\":\"ICYY\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02c041993b06872a5c3565d9ab\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851c041993b06872a5c3565d9ab\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273c041993b06872a5c3565d9ab\",\"width\":640,\"height\":640}]},\"spotify:album:7MHe3J3F71yESwmAGXvVvM\":{\"uri\":\"spotify:album:7MHe3J3F71yESwmAGXvVvM\",\"title\":\"Guilty\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02059fd37f4a273d9836ebcc2e\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851059fd37f4a273d9836ebcc2e\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273059fd37f4a273d9836ebcc2e\",\"width\":640,\"height\":640}]},\"spotify:album:4ue2Bx2IiCQ7LoQQJ2gmaM\":{\"uri\":\"spotify:album:4ue2Bx2IiCQ7LoQQJ2gmaM\",\"title\":\"Drunken Wordz Sober Thoughtz (Deluxe Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024f07b361b9b558ae9277eff3\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514f07b361b9b558ae9277eff3\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734f07b361b9b558ae9277eff3\",\"width\":640,\"height\":640}]},\"spotify:album:3QpNG7nH0VRIeKmMz7lEi7\":{\"uri\":\"spotify:album:3QpNG7nH0VRIeKmMz7lEi7\",\"title\":\"Call Me Crazy, But...\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020262c6c4ba48b91ce0a43f14\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510262c6c4ba48b91ce0a43f14\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730262c6c4ba48b91ce0a43f14\",\"width\":640,\"height\":640}]},\"spotify:album:3rnhvfgbXmDAcESeGp69Tx\":{\"uri\":\"spotify:album:3rnhvfgbXmDAcESeGp69Tx\",\"title\":\"Girl Disrupted\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02bfdfd679d67076a20f2318cd\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851bfdfd679d67076a20f2318cd\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273bfdfd679d67076a20f2318cd\",\"width\":640,\"height\":640}]},\"spotify:album:6wSipi0TDJMk8YDnFXecGX\":{\"uri\":\"spotify:album:6wSipi0TDJMk8YDnFXecGX\",\"title\":\"23\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020fe5c73085d30fa664801957\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510fe5c73085d30fa664801957\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730fe5c73085d30fa664801957\",\"width\":640,\"height\":640}]},\"spotify:album:74LaE3Z8eYdY9KlHjTXCVm\":{\"uri\":\"spotify:album:74LaE3Z8eYdY9KlHjTXCVm\",\"title\":\"Falling For You\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02e1879bb9c00ed43f711c5328\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851e1879bb9c00ed43f711c5328\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273e1879bb9c00ed43f711c5328\",\"width\":640,\"height\":640}]},\"spotify:album:6eiCnBFhY8yvhLjZzjIsxQ\":{\"uri\":\"spotify:album:6eiCnBFhY8yvhLjZzjIsxQ\",\"title\":\"Candydrip\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e023edd56946cb788a4d7457a08\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048513edd56946cb788a4d7457a08\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2733edd56946cb788a4d7457a08\",\"width\":640,\"height\":640}]},\"spotify:album:4L5OrhyYueJSMeJm1LrCQa\":{\"uri\":\"spotify:album:4L5OrhyYueJSMeJm1LrCQa\",\"title\":\"Bongos (feat. Megan Thee Stallion)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e026ddf81181c625bfaad8061ab\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048516ddf81181c625bfaad8061ab\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2736ddf81181c625bfaad8061ab\",\"width\":640,\"height\":640}]},\"spotify:album:47IM97GbpNyDREWlr2HtNM\":{\"uri\":\"spotify:album:47IM97GbpNyDREWlr2HtNM\",\"title\":\"Gangsta Bitch Music Vol. 2\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0245848cd86960ebce702abaf1\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485145848cd86960ebce702abaf1\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27345848cd86960ebce702abaf1\",\"width\":640,\"height\":640}]},\"spotify:album:72fCiWWDkVJ3mbCVapAY8K\":{\"uri\":\"spotify:album:72fCiWWDkVJ3mbCVapAY8K\",\"title\":\"Bongos: The Pack\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e025248e0dba802484ea205b9fa\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048515248e0dba802484ea205b9fa\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2735248e0dba802484ea205b9fa\",\"width\":640,\"height\":640}]},\"spotify:album:7MfUiQkVEDkOSmU83A2C9q\":{\"uri\":\"spotify:album:7MfUiQkVEDkOSmU83A2C9q\",\"title\":\"Liberation\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e020175a20a3689f9c8bdd35151\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048510175a20a3689f9c8bdd35151\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2730175a20a3689f9c8bdd35151\",\"width\":640,\"height\":640}]},\"spotify:album:7dHwC2E4J9ude0GoPhp4SI\":{\"uri\":\"spotify:album:7dHwC2E4J9ude0GoPhp4SI\",\"title\":\"Amala (Deluxe Version)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a6792b2d49a5afc06a675837\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a6792b2d49a5afc06a675837\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a6792b2d49a5afc06a675837\",\"width\":640,\"height\":640}]},\"spotify:album:3KdDCDDhxG9FCMoBt54N8U\":{\"uri\":\"spotify:album:3KdDCDDhxG9FCMoBt54N8U\",\"title\":\"Amala\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02741bebd59a89d3b30f25f786\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851741bebd59a89d3b30f25f786\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273741bebd59a89d3b30f25f786\",\"width\":640,\"height\":640}]},\"spotify:album:3zxAa7enGm7IYNUEpDZZ3d\":{\"uri\":\"spotify:album:3zxAa7enGm7IYNUEpDZZ3d\",\"title\":\"PORNHUB\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e024ec9becdc895e15b62cab48d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048514ec9becdc895e15b62cab48d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2734ec9becdc895e15b62cab48d\",\"width\":640,\"height\":640}]},\"spotify:album:3bfNGzHE5KSghNfX1YRBnu\":{\"uri\":\"spotify:album:3bfNGzHE5KSghNfX1YRBnu\",\"title\":\"Drunken Wordz Sober Thoughtz (Deluxe Edition)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0255608874752cf03f0c9a9c5a\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485155608874752cf03f0c9a9c5a\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27355608874752cf03f0c9a9c5a\",\"width\":640,\"height\":640}]},\"spotify:album:3f8UuQzY0L9xgC8jyWyruC\":{\"uri\":\"spotify:album:3f8UuQzY0L9xgC8jyWyruC\",\"title\":\"23\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02766217d9156034bbbacfa382\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851766217d9156034bbbacfa382\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273766217d9156034bbbacfa382\",\"width\":640,\"height\":640}]},\"spotify:album:3pinxQZQz4ww7EkXasxWt6\":{\"uri\":\"spotify:album:3pinxQZQz4ww7EkXasxWt6\",\"title\":\"It's A Man's World\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02947396d020ceb16d00b4ef84\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851947396d020ceb16d00b4ef84\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273947396d020ceb16d00b4ef84\",\"width\":640,\"height\":640}]},\"spotify:album:091JnKYEdqWQ6tyEbCgAEV\":{\"uri\":\"spotify:album:091JnKYEdqWQ6tyEbCgAEV\",\"title\":\"TRU - LP\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f32f4182535ec5e418095393\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f32f4182535ec5e418095393\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f32f4182535ec5e418095393\",\"width\":640,\"height\":640}]},\"spotify:album:0HbeEgfli0wuwgs0gHYxdD\":{\"uri\":\"spotify:album:0HbeEgfli0wuwgs0gHYxdD\",\"title\":\"Mirrors\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e029f60409f5ad5740c52eeceaa\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d000048519f60409f5ad5740c52eeceaa\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b2739f60409f5ad5740c52eeceaa\",\"width\":640,\"height\":640}]},\"spotify:album:1rKzZT1QTsQoEAvsOXHnGB\":{\"uri\":\"spotify:album:1rKzZT1QTsQoEAvsOXHnGB\",\"title\":\"Red Wine\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02bb1bc185c4b6e73d61e57d53\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851bb1bc185c4b6e73d61e57d53\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273bb1bc185c4b6e73d61e57d53\",\"width\":640,\"height\":640}]},\"spotify:album:5gXDrzBIzmAhiE0dNKwy0i\":{\"uri\":\"spotify:album:5gXDrzBIzmAhiE0dNKwy0i\",\"title\":\"Night Shades\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02a4c01842096428fb14859bdc\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851a4c01842096428fb14859bdc\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273a4c01842096428fb14859bdc\",\"width\":640,\"height\":640}]},\"spotify:album:2eQMC9nJE3f3hCNKlYYHL1\":{\"uri\":\"spotify:album:2eQMC9nJE3f3hCNKlYYHL1\",\"title\":\"Teenage Dream\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02d20c38f295039520d688a888\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851d20c38f295039520d688a888\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273d20c38f295039520d688a888\",\"width\":640,\"height\":640}]},\"spotify:album:5jem47f4IRH6UaxNAWO6vD\":{\"uri\":\"spotify:album:5jem47f4IRH6UaxNAWO6vD\",\"title\":\"Pink Friday\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e0243f15453faa4973061411a79\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d0000485143f15453faa4973061411a79\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b27343f15453faa4973061411a79\",\"width\":640,\"height\":640}]},\"spotify:album:39hdawySriH7efjFpv9v3q\":{\"uri\":\"spotify:album:39hdawySriH7efjFpv9v3q\",\"title\":\"KIKI (Deluxe)\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02442a7328010359c550b94c2c\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851442a7328010359c550b94c2c\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273442a7328010359c550b94c2c\",\"width\":640,\"height\":640}]},\"spotify:album:0LHqiYYOsVM9lh9c9w0G1j\":{\"uri\":\"spotify:album:0LHqiYYOsVM9lh9c9w0G1j\",\"title\":\"333\",\"imageUrls\":[{\"url\":\"https://i.scdn.co/image/ab67616d00001e02f79d8c04bf5b9efc576c975d\",\"width\":300,\"height\":300},{\"url\":\"https://i.scdn.co/image/ab67616d00004851f79d8c04bf5b9efc576c975d\",\"width\":64,\"height\":64},{\"url\":\"https://i.scdn.co/image/ab67616d0000b273f79d8c04bf5b9efc576c975d\",\"width\":640,\"height\":640}]},\"spotify:album:3wOMqxNHgkga91RBC7BaZU\":{\"uri\":\"spotify:album:3wOMqxNHgkga91RBC7BaZU\",\"title\":\"Amala (Deluxe Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02e0c9d69f356c8b8a378a4d3c\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851e0c9d69f356c8b8a378a4d3c\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273e0c9d69f356c8b8a378a4d3c\",\"width\":640}]},\"spotify:album:57ClUwZ0tRUkC7QUMMFFk5\":{\"uri\":\"spotify:album:57ClUwZ0tRUkC7QUMMFFk5\",\"title\":\"GPP\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e021b0f7ff1cd98724290b07cbf\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048511b0f7ff1cd98724290b07cbf\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2731b0f7ff1cd98724290b07cbf\",\"width\":640}]},\"spotify:album:5L1hH3Wj0WenhPzJaQa4Sc\":{\"uri\":\"spotify:album:5L1hH3Wj0WenhPzJaQa4Sc\",\"title\":\"NANi\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e020e1b1ac446251d8152d4d408\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048510e1b1ac446251d8152d4d408\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2730e1b1ac446251d8152d4d408\",\"width\":640}]},\"spotify:album:5DvJgsMLbaR1HmAI6VhfcQ\":{\"uri\":\"spotify:album:5DvJgsMLbaR1HmAI6VhfcQ\",\"title\":\"Endless Summer Vacation\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02cd222052a2594be29a6616b5\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851cd222052a2594be29a6616b5\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273cd222052a2594be29a6616b5\",\"width\":640}]},\"spotify:album:3vUpSuV7VbV4vonGqQQmUG\":{\"uri\":\"spotify:album:3vUpSuV7VbV4vonGqQQmUG\",\"title\":\"Streets (Silhouette Remix)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e023d71acea7817007ee3c5b8fb\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048513d71acea7817007ee3c5b8fb\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2733d71acea7817007ee3c5b8fb\",\"width\":640}]},\"spotify:album:28Yv9BE6ZI6dccK0sxbEq4\":{\"uri\":\"spotify:album:28Yv9BE6ZI6dccK0sxbEq4\",\"title\":\"Best Friend (feat. Doja Cat)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e029aeed9bbffaac4c99cc4c4d9\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048519aeed9bbffaac4c99cc4c4d9\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2739aeed9bbffaac4c99cc4c4d9\",\"width\":640}]},\"spotify:album:7mdpibDh6Sec6o6zItcSEH\":{\"uri\":\"spotify:album:7mdpibDh6Sec6o6zItcSEH\",\"title\":\"ICY\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0259dc6229be2836d4d432b2f0\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485159dc6229be2836d4d432b2f0\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27359dc6229be2836d4d432b2f0\",\"width\":640}]},\"spotify:album:3WNxdumkSMGMJRhEgK80qx\":{\"uri\":\"spotify:album:3WNxdumkSMGMJRhEgK80qx\",\"title\":\"...Baby One More Time (Digital Deluxe Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e028e49866860c25afffe2f1a02\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048518e49866860c25afffe2f1a02\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2738e49866860c25afffe2f1a02\",\"width\":640}]},\"spotify:album:5rlB2HPoNHg2m1wmmh0TRv\":{\"uri\":\"spotify:album:5rlB2HPoNHg2m1wmmh0TRv\",\"title\":\"Britney Jean (Deluxe Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e023c9f7b8faf039c7607d12255\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048513c9f7b8faf039c7607d12255\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2733c9f7b8faf039c7607d12255\",\"width\":640}]},\"spotify:album:4Dx1H8qhJ2hFkChgfZuqQV\":{\"uri\":\"spotify:album:4Dx1H8qhJ2hFkChgfZuqQV\",\"title\":\"Glory (Deluxe)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0298c6c8d8470b73b0fccc23c6\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485198c6c8d8470b73b0fccc23c6\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27398c6c8d8470b73b0fccc23c6\",\"width\":640}]},\"spotify:album:0z7pVBGOD7HCIB7S8eLkLI\":{\"uri\":\"spotify:album:0z7pVBGOD7HCIB7S8eLkLI\",\"title\":\"In The Zone\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02efc6988972cb04105f002cd4\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851efc6988972cb04105f002cd4\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273efc6988972cb04105f002cd4\",\"width\":640}]},\"spotify:album:2tve5DGwub1TtbX1khPX5j\":{\"uri\":\"spotify:album:2tve5DGwub1TtbX1khPX5j\",\"title\":\"Circus (Deluxe Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0254c6edd554935d73e159e199\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485154c6edd554935d73e159e199\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27354c6edd554935d73e159e199\",\"width\":640}]},\"spotify:album:5PmgtkodFl2Om3hMXONDll\":{\"uri\":\"spotify:album:5PmgtkodFl2Om3hMXONDll\",\"title\":\"Oops!... I Did It Again\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e022aa20611c7fb964a74ab01a6\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048512aa20611c7fb964a74ab01a6\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2732aa20611c7fb964a74ab01a6\",\"width\":640}]},\"spotify:album:1V55l3MrGqxsAjN74uGGD5\":{\"uri\":\"spotify:album:1V55l3MrGqxsAjN74uGGD5\",\"title\":\"This Is Me...Then (20th Anniversary Edition)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e024ac54a919de29ef7012d2314\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048514ac54a919de29ef7012d2314\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2734ac54a919de29ef7012d2314\",\"width\":640}]},\"spotify:album:3Gby5NNeNYkMgAnrtEA3lc\":{\"uri\":\"spotify:album:3Gby5NNeNYkMgAnrtEA3lc\",\"title\":\"On The 6\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e025c34d7a87663652675cf3264\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048515c34d7a87663652675cf3264\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2735c34d7a87663652675cf3264\",\"width\":640}]},\"spotify:album:5Bd99eGJKXoRMnqgqWlWmp\":{\"uri\":\"spotify:album:5Bd99eGJKXoRMnqgqWlWmp\",\"title\":\"Ain't Your Mama\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02b1ab92b8e26ab1cb783ffe15\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851b1ab92b8e26ab1cb783ffe15\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273b1ab92b8e26ab1cb783ffe15\",\"width\":640}]},\"spotify:album:1l8TpRDfjJjKdtbzNtSycM\":{\"uri\":\"spotify:album:1l8TpRDfjJjKdtbzNtSycM\",\"title\":\"This Is Me...Then\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02a1bf4c1efc808162ac95090f\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851a1bf4c1efc808162ac95090f\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273a1bf4c1efc808162ac95090f\",\"width\":640}]},\"spotify:album:2wPFvtDrBewKjn6twDowgU\":{\"uri\":\"spotify:album:2wPFvtDrBewKjn6twDowgU\",\"title\":\"On The 6 / J. Lo (Coffret 2 CD)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0296fce45db44d34c489a83499\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485196fce45db44d34c489a83499\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27396fce45db44d34c489a83499\",\"width\":640}]},\"spotify:album:7pJj6tOX5HCBaYfLPiHfDn\":{\"uri\":\"spotify:album:7pJj6tOX5HCBaYfLPiHfDn\",\"title\":\"Jenny From The Block - The Remixes\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02d5cf73c1679244d959651dff\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851d5cf73c1679244d959651dff\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273d5cf73c1679244d959651dff\",\"width\":640}]},\"spotify:album:1IYVB8NfiRqhdZlTxjspNh\":{\"uri\":\"spotify:album:1IYVB8NfiRqhdZlTxjspNh\",\"title\":\"Rainbow\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0255de63b8aaf464fe8146b4f1\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485155de63b8aaf464fe8146b4f1\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27355de63b8aaf464fe8146b4f1\",\"width\":640}]},\"spotify:album:6cBlaud5JVmPjkjxnwIMLx\":{\"uri\":\"spotify:album:6cBlaud5JVmPjkjxnwIMLx\",\"title\":\"TEXAS HOLD 'EM\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0249188fe723e4734b391f5162\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485149188fe723e4734b391f5162\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27349188fe723e4734b391f5162\",\"width\":640}]},\"spotify:album:2NXwHjhgaAdkDy6GPSxMAd\":{\"uri\":\"spotify:album:2NXwHjhgaAdkDy6GPSxMAd\",\"title\":\"TEXAS HOLD 'EM\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e026c1836a40380c147eab9c98f\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048516c1836a40380c147eab9c98f\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2736c1836a40380c147eab9c98f\",\"width\":640}]},\"spotify:album:5RHDcbKUJ0isLtDr97nP9P\":{\"uri\":\"spotify:album:5RHDcbKUJ0isLtDr97nP9P\",\"title\":\"99 Nights\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02ca6459583ed21c7df9998ea7\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851ca6459583ed21c7df9998ea7\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273ca6459583ed21c7df9998ea7\",\"width\":640}]},\"spotify:album:1tmbrZyioCQ9AnSEVCgF5W\":{\"uri\":\"spotify:album:1tmbrZyioCQ9AnSEVCgF5W\",\"title\":\"Confetti (Piano Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e022b7c89a8eaf33f5a3b380ce5\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048512b7c89a8eaf33f5a3b380ce5\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2732b7c89a8eaf33f5a3b380ce5\",\"width\":640}]},\"spotify:album:4VJNLOXqF1aKhk2BIxMeuI\":{\"uri\":\"spotify:album:4VJNLOXqF1aKhk2BIxMeuI\",\"title\":\"Confetti (VF)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0289303562638d1425cc45dbb0\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485189303562638d1425cc45dbb0\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27389303562638d1425cc45dbb0\",\"width\":640}]},\"spotify:album:3ThlxfLSy4bfKzxWqmC7VN\":{\"uri\":\"spotify:album:3ThlxfLSy4bfKzxWqmC7VN\",\"title\":\"Guess featuring Billie Eilish\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e028b8d8be49f9c4a44b0574144\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048518b8d8be49f9c4a44b0574144\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2738b8d8be49f9c4a44b0574144\",\"width\":640}]},\"spotify:album:5UlTVoEmOp7GuZN5PgnUq6\":{\"uri\":\"spotify:album:5UlTVoEmOp7GuZN5PgnUq6\",\"title\":\"360\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0252b3b1829d550ece26677087\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485152b3b1829d550ece26677087\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27352b3b1829d550ece26677087\",\"width\":640}]},\"spotify:album:1u54eF07irCSSssyDG67R2\":{\"uri\":\"spotify:album:1u54eF07irCSSssyDG67R2\",\"title\":\"WET TENNIS\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02035ef25cd05ffba3078e7027\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851035ef25cd05ffba3078e7027\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273035ef25cd05ffba3078e7027\",\"width\":640}]},\"spotify:album:7jgBVzMVZuuhaTG5zQ0Vgk\":{\"uri\":\"spotify:album:7jgBVzMVZuuhaTG5zQ0Vgk\",\"title\":\"Hard Candy\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e020254cb69386bd62f83f90c6b\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048510254cb69386bd62f83f90c6b\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2730254cb69386bd62f83f90c6b\",\"width\":640}]},\"spotify:album:1cYse7L4pszuJPF6me5tQC\":{\"uri\":\"spotify:album:1cYse7L4pszuJPF6me5tQC\",\"title\":\"The Remix (International Version)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e025f5694a3762ffbf51e88d970\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048515f5694a3762ffbf51e88d970\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2735f5694a3762ffbf51e88d970\",\"width\":640}]},\"spotify:album:38Ur5vOXFNPWHZv4umkqwU\":{\"uri\":\"spotify:album:38Ur5vOXFNPWHZv4umkqwU\",\"title\":\"Born This Way - The Remix\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e027c0c2cebb5cde2376f83d9ca\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048517c0c2cebb5cde2376f83d9ca\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2737c0c2cebb5cde2376f83d9ca\",\"width\":640}]},\"spotify:album:5xBJBxfQFowtJ5yq7MnXMG\":{\"uri\":\"spotify:album:5xBJBxfQFowtJ5yq7MnXMG\",\"title\":\"HEAT\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e027de2b9727e4016ab9ddbe4d5\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048517de2b9727e4016ab9ddbe4d5\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2737de2b9727e4016ab9ddbe4d5\",\"width\":640}]},\"spotify:album:72220mUyaNDhUhz5oIk5yo\":{\"uri\":\"spotify:album:72220mUyaNDhUhz5oIk5yo\",\"title\":\"The 25th Anniversary of Christina Aguilera | Spotify Anniversaries LIVE\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02ec52118faafdbd41b13d0450\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851ec52118faafdbd41b13d0450\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273ec52118faafdbd41b13d0450\",\"width\":640}]},\"spotify:album:7lCwZB97kT2240mSxZQjaw\":{\"uri\":\"spotify:album:7lCwZB97kT2240mSxZQjaw\",\"title\":\"Stripped - 20th Anniversary Edition\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e0270c9602ec2b6f589d29b9015\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d0000485170c9602ec2b6f589d29b9015\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b27370c9602ec2b6f589d29b9015\",\"width\":640}]},\"spotify:album:3C8w2Wr2dGfJYoUOioDcxe\":{\"uri\":\"spotify:album:3C8w2Wr2dGfJYoUOioDcxe\",\"title\":\"Juicy\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e028496ab58261773e49148d421\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048518496ab58261773e49148d421\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2738496ab58261773e49148d421\",\"width\":640}]},\"spotify:album:1MmVkhiwTH0BkNOU3nw5d3\":{\"uri\":\"spotify:album:1MmVkhiwTH0BkNOU3nw5d3\",\"title\":\"Hot Pink\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02f14aa81116510d3a6df8432b\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851f14aa81116510d3a6df8432b\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273f14aa81116510d3a6df8432b\",\"width\":640}]},\"spotify:album:54tInqO543zy0Y5F2VsUQI\":{\"uri\":\"spotify:album:54tInqO543zy0Y5F2VsUQI\",\"title\":\"Amala\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e020f4f19f09818756f25916e45\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048510f4f19f09818756f25916e45\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2730f4f19f09818756f25916e45\",\"width\":640}],\"artistNameList\":\"Doja Cat\"},\"spotify:album:2zlicR85tXxObkgVu9dfWm\":{\"uri\":\"spotify:album:2zlicR85tXxObkgVu9dfWm\",\"title\":\"Roll With Us\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02b0d0b470b8a1b8eb0a576143\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851b0d0b470b8a1b8eb0a576143\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273b0d0b470b8a1b8eb0a576143\",\"width\":640}],\"artistNameList\":\"Doja Cat\"},\"spotify:album:2N367tN1eIXrHNVe86aVy4\":{\"uri\":\"spotify:album:2N367tN1eIXrHNVe86aVy4\",\"title\":\"Baby, I'm Jealous (feat. Doja Cat)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02d0927ea5b0dde802e65eb9b6\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851d0927ea5b0dde802e65eb9b6\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273d0927ea5b0dde802e65eb9b6\",\"width\":640}],\"artistNameList\":\"Bebe Rexha, Doja Cat\"},\"spotify:album:6t5D6LEgHxqUVOxJItkzfb\":{\"uri\":\"spotify:album:6t5D6LEgHxqUVOxJItkzfb\",\"title\":\"All Your Fault: Pt. 2\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e021ba5682505dd6e2592b16e41\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048511ba5682505dd6e2592b16e41\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2731ba5682505dd6e2592b16e41\",\"width\":640}],\"artistNameList\":\"Bebe Rexha\"},\"spotify:album:6NQXnBKeDrpQGWPQsgIiwA\":{\"uri\":\"spotify:album:6NQXnBKeDrpQGWPQsgIiwA\",\"title\":\"Streets (Disclosure Remix)\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e028d86711edbe0b3fbc29e7dbb\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d000048518d86711edbe0b3fbc29e7dbb\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b2738d86711edbe0b3fbc29e7dbb\",\"width\":640}],\"artistNameList\":\"Doja Cat, Disclosure\"},\"spotify:album:3KGVOGmIbinlrR97aFufGE\":{\"uri\":\"spotify:album:3KGVOGmIbinlrR97aFufGE\",\"title\":\"TYLA\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02af0b5968b8bad3923b2ea76b\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851af0b5968b8bad3923b2ea76b\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273af0b5968b8bad3923b2ea76b\",\"width\":640}],\"artistNameList\":\"Tyla\"},\"spotify:album:3G77BQuJy3jahjdkKQNNNM\":{\"uri\":\"spotify:album:3G77BQuJy3jahjdkKQNNNM\",\"title\":\"CAPRISONGS\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02a1a30cf13d406a0d5d33ae53\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851a1a30cf13d406a0d5d33ae53\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273a1a30cf13d406a0d5d33ae53\",\"width\":640}],\"artistNameList\":\"FKA twigs\"},\"spotify:album:26IdRjba8f8DNa7c0FwfQb\":{\"uri\":\"spotify:album:26IdRjba8f8DNa7c0FwfQb\",\"title\":\"ALL OUT\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02f2bf9685109a09bdc176fb43\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851f2bf9685109a09bdc176fb43\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273f2bf9685109a09bdc176fb43\",\"width\":640}],\"artistNameList\":\"K/DA\"},\"spotify:album:6BLifYKjswTEsL4KXylO5p\":{\"uri\":\"spotify:album:6BLifYKjswTEsL4KXylO5p\",\"title\":\"Sweettalk my Heart\",\"imageUrls\":[{\"height\":300,\"url\":\"https://i.scdn.co/image/ab67616d00001e02100450e135460718f5d6c9ea\",\"width\":300},{\"height\":64,\"url\":\"https://i.scdn.co/image/ab67616d00004851100450e135460718f5d6c9ea\",\"width\":64},{\"height\":640,\"url\":\"https://i.scdn.co/image/ab67616d0000b273100450e135460718f5d6c9ea\",\"width\":640}],\"artistNameList\":\"Tove Lo\"}}","configVersion": "1.9"}`;
	
	new Spicetify.Menu.Item(
		"Hide-Arbitrary-Images Settings",
		false,
		() =>
		{
			Spicetify.PopupModal.display({
				title: "Hide-Arbitrary-Images Settings",
				content
			});
		},
		trashbinIcon
	).register();
	
	
	const widget = new Spicetify.Playbar.Widget(
		THROW_TEXT,
		trashbinIcon,
		async (self) =>
		{
			
			let albumUri = Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack.metadata.album_uri;
			//console.log ("debug, albumUri: "+ albumUri);
			
			let isBannedAlbum = trashAlbumList.has(albumUri);
			
			let meta = await fetchAlbum(albumUri); // WIP
			
			//const uri = Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack.metadata.uri;
			//const uriObj = Spicetify.URI.fromString(uri);
			//const type = uriObj.type;
			
			if ( ! isBannedAlbum)
			{
				//trashSongList[uri] = true;
				
				
				const album = new AlbumData();
				
				album.uri = meta.uri;
				album.title = meta.title;
				album.imageUrls = meta.imageUrls;
				album.artistNameList = meta.artistNameList;
				
				trashAlbumList.set(meta.uri, album);
				
				
				document.body.appendChild(styleToHideCoverArtImageOnAnAlbumPage); // -> lehet hogy hibából távolítjuk el de ez nem baj mert most nem akarom megírni a checking logikát hogy ha az ember éppen egy album page-en van és az az album azonos mint a jelenleg letiltásra kerülő szám akkor rejtsük el azonnal az album page -en lévő képet is. Inkább rejtsük el mindig azt, mint könnyű megoldás. False pozitív eredményeket fog adni gyakran de ez nem gond. Néha hibából el fogja rejteni a cover art-ot.
				document.body.appendChild(styleToHideNowPlayingTrackCoverArtImage);
				
				Spicetify.showNotification("Album added to trashbin " + meta.uri);
				
				
				setWidgetState(true);
				//if (shouldSkipCurrentTrack(uri, type))
				//Spicetify.Player.next();
			}
			else
			{
				trashAlbumList.delete(meta.uri);
				setWidgetState(false);
				
				//document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage); -> lehet hogy hibából távolítjuk el és látszódna egy amúgy blokkolandó kép, szóval ne távolítsuk el.
				if (document.body.contains(styleToHideNowPlayingTrackCoverArtImage))
				{
					document.body.removeChild(styleToHideNowPlayingTrackCoverArtImage);
				}
				
				Spicetify.showNotification("Album removed from trashbin");
			}
			
			putDataLocal();
		},
		false,
		false,
		enableWidget
	);
	
	function migrateStorage()
	{
		const migrationKey = "HideImages-migration-from-1.8-to-1.9-complete";

		function migrateKey(oldKey, newKey)
		{
			//const oldData = Spicetify.LocalStorage.get(oldKey);
			let oldData = null;
			
			if (newKey === "HideImages_TrashAlbumList")
			{
				oldData = initValue(newKey, new Map());
			}
			else
			{
				oldData = initValue(newKey, {});
			}
			
			//console.log(oldData);
			
			if (oldData !== null)
			{
				if (newKey === "HideImages_TrashAlbumList")
				{
					Spicetify.LocalStorage.set("HideImages_TrashAlbumList", mapToString(oldData));
				}
				else
				{
					Spicetify.LocalStorage.set(newKey, objectToString(oldData));
					
				}
				Spicetify.LocalStorage.remove(oldKey);
			}
		}
		
		// DEBUG:
		//if (true)
		if (Spicetify.LocalStorage.get(migrationKey) !== "true")
		{
			
			console.log("Migrating HideImages extension storage keys...");
			
			migrateKey("TrashAlbumList", "HideImages_TrashAlbumList");
			migrateKey("TrashSongList", "HideImages_TrashSongList");
			migrateKey("TrashArtistList", "HideImages_TrashArtistList");
			
			// Mark migration as complete
			Spicetify.LocalStorage.set(migrationKey, "true");
			Spicetify.LocalStorage.set(HideImages_config_version_dbkey, "1.9");
			console.log("Storage migration completed.");
		}
	};
	
	
	// LocalStorage Setup
	// I realized TrashSongList and TrashArtistList shouldn't be used because trashbin.js uses them too (TrashAlbumList is used by them but we should rename that one as well). We should migrate data over to another storage key and mark in the storage that we have done this act and it the mark is present, avoid doing this act again.
	migrateStorage();
	let trashAlbumList = initValue("HideImages_TrashAlbumList", new Map());
	let trashSongList = initValue("HideImages_TrashSongList", {});
	let trashArtistList = initValue("HideImages_TrashArtistList", {});
	//console.log(trashAlbumList);
	//console.log(trashSongList);
	//console.log(trashArtistList);
	// let userHitBack = false; // We dont need this because we, unlike trashbin.js, are trying to filter album covers even when the user has pressed the previous track button.
	
	
	putDataLocal();
	refreshEventListeners(trashbinStatus);
	setWidgetState(
		trashSongList[Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack.uri],
		Spicetify.URI.fromString(Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack.uri).type !== Spicetify.URI.Type.TRACK
	);
	
	new Spicetify.ContextMenu.Item(
		"Hide this Image",
		async ([uri], [uid] = [], context = undefined) =>
		{
			const type = uri.split(":")[1];
			let meta;
			switch (type)
			{
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
			
			if ( ! foundElement)
			{
				//trashAlbumList[meta.title] = true;
				
				const album = new AlbumData();
				
				album.uri = meta.uri;
				album.title = meta.title;
				album.imageUrls = meta.imageUrls;
				album.artistNameList = meta.artistNameList;
				
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
				if (document.body.contains(styleToHideCoverArtImageOnAnAlbumPage))
				{
					document.body.removeChild(styleToHideCoverArtImageOnAnAlbumPage);
				}
				Spicetify.showNotification("Album removed from trashbin");
			}
			putDataLocal(); // save the state.
		},
		([uri]) =>
		{
			const type = uri.split(":")[1];
			switch (type)
			{
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
	
	
	const fetchAlbum = async uri =>
	{
		const {getAlbum} = Spicetify.GraphQL.Definitions;
		const {data} = await Spicetify.GraphQL.Request(getAlbum, {
			uri,
			locale: Spicetify.Locale.getLocale(),
			offset: 0,
			limit: 10
		});
		const res = data.albumUnion;
		//Debug, to discover what the data object contains:
		//console.log(data);
		//console.log(res);
		
		
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
			artistNameList: getArtistNames(res),
			description: "Album",
			imageUrls: res.coverArt.sources
			//imageUrl: res.coverArt.sources.reduce((prev, curr) => (prev.width > curr.width ? prev : curr)).url
		};
	};
	
	function getArtistNames(res)
	{
		if (!res.artists || !Array.isArray(res.artists.items)) {
			return ""; // Return empty string if items is missing or not an array
		}
		return res.artists.items.map(item => item?.profile?.name || "Unknown Artist").join(", "); // E.g. "Eminem, Another Artist, Third Artist".
	}
	
	function refreshEventListeners(enabled)
	{
		trashbinStatus = enabled;
		if (enabled)
		{
			Spicetify.Player.addEventListener("songchange", watchChange);
			enableWidget && widget.register();
			watchChange();
		}
		else
		{
			Spicetify.Player.removeEventListener("songchange", watchChange);
			widget.deregister();
		}
	}
	
	function setWidgetState(state, hidden = false)
	{
		hidden ? widget.deregister() : enableWidget && widget.register();
		widget.active = !! state;
		widget.label = state ? UNTHROW_TEXT : THROW_TEXT;
	}
	
	function watchChange()
	{
		const contextTrack = Spicetify.Platform.PlayerAPI._queue._queue.track?.contextTrack || Spicetify.Queue.track?.contextTrack;
		//const data = Spicetify.Platform.PlayerAPI._queue || Spicetify.Queue;
		// outdated: const data = Spicetify.Player.data || Spicetify.Queue;
		if ( ! contextTrack)
		{
			return;
		}
		
		
		//let track = data.track;
		//if (!track) return;
		//let albumUri = track.metadata["album_uri"];
		//let track = data.track.contextTrack;
		//if (!track) return;
		let albumUri = contextTrack.metadata.album_uri;
		//let albumUri2 = contextTrack.metadata["album_uri"];
		//console.log (albumUri);
		//console.log (albumUri2);
		let isBannedAlbum = trashAlbumList.has(albumUri);
		
		const isBanned = trashSongList[contextTrack.uri] || isBannedAlbum;
		setWidgetState(isBanned, Spicetify.URI.fromString(contextTrack.uri).type !== Spicetify.URI.Type.TRACK);
		
		if (isBanned)
		{
			//Spicetify.Player.next();
			// document.body.append(style, container);
			// await document.documentElement.requestFullscreen();
			// document.body.append(contextMenu);
			//console.debug("This song is banned");
			document.body.appendChild(styleToHideNowPlayingTrackCoverArtImage);
			return;
		}
		else
		{
			// Delay this bc when the song changes the old cover is visible for a split second if I run this without a timeout. A quick, dirty solution.
			setTimeout(() =>
			{
				//console.debug("This song is _Not_ banned");
				if (document.body.contains(styleToHideNowPlayingTrackCoverArtImage))
				{
					document.body.removeChild(styleToHideNowPlayingTrackCoverArtImage);
				}
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
		//artistUri = data.item.metadata[`artist_uri:${uriIndex}`];
		//}
	}
	
	/**
	 *
	 * @param {string} uri
	 * @param {string} type
	 * @returns {boolean}
	 */
	function shouldSkipCurrentTrack(uri, type)
	{
		const curTrack = Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack.metadata;
		if (type === Spicetify.URI.Type.TRACK)
		{
			if (uri === curTrack.uri)
			{
				return true;
			}
		}
		
		if (type === Spicetify.URI.Type.ARTIST)
		{
			let count = 1;
			let artUri = curTrack.metadata.artist_uri;
			while (artUri)
			{
				if (uri === artUri)
				{
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
	function toggleThrow(uris)
	{
		const uri = uris[0];
		const uriObj = Spicetify.URI.fromString(uri);
		const type = uriObj.type;
		
		const list = type === Spicetify.URI.Type.TRACK ? trashSongList : trashArtistList;
		
		if ( ! list[uri])
		{
			list[uri] = true; // trashSongList, trashArtistList
			
			//if (shouldSkipCurrentTrack(uri, type))
			//Spicetify.Player.next();
			
			Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack?.uri === uri && setWidgetState(true);
			// note: Trashbin.js seems to do this a bit differently. https://github.com/spicetify/cli/blob/main/Extensions/trashbin.js
			Spicetify.showNotification(type === Spicetify.URI.Type.TRACK ? "Song added to trashbin" : "Artist added to trashbin");
		}
		else
		{
			delete list[uri];
			Spicetify.Platform.PlayerAPI._queue._queue.track.contextTrack?.uri === uri && setWidgetState(false);
			Spicetify.showNotification(type === Spicetify.URI.Type.TRACK ? "Song removed from trashbin" : "Artist removed from trashbin");
		}
		
		putDataLocal();
	}
	
	/**
	 * Only accept one track or artist URI
	 * @param {string[]} uris
	 * @returns {boolean}
	 */
	function shouldAddContextMenu(uris)
	{
		if (uris.length > 1 || ! trashbinStatus)
		{
			return false;
		}
		
		const uri = uris[0];
		const uriObj = Spicetify.URI.fromString(uri);
		if (uriObj.type === Spicetify.URI.Type.TRACK)
		{
			//this.name = trashSongList[uri] ? UNTHROW_TEXT : THROW_TEXT;
			return true;
		}
		
		if (uriObj.type === Spicetify.URI.Type.ARTIST)
		{
			//this.name = trashArtistList[uri] ? UNTHROW_TEXT : THROW_TEXT;
			return true;
		}
		
		
		return false;
	}
	
	const cntxMenu = new Spicetify.ContextMenu.Item(THROW_TEXT, toggleThrow, shouldAddContextMenu, trashbinIcon);
	cntxMenu.register();
	
	function putDataLocal()
	{
		//https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
		//https://stackoverflow.com/a/53461519/5686427
		
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify([...trashAlbumList]));
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify(trashAlbumList, null, '\t'));
		
		//Spicetify.LocalStorage.set("HideImages_TrashAlbumList", JSON.stringify(Array.from(trashAlbumList.entries())));
		
		
		Spicetify.LocalStorage.set("HideImages_TrashAlbumList", mapToString(trashAlbumList));
		
		
		Spicetify.LocalStorage.set("HideImages_TrashSongList", objectToString(trashSongList));
		Spicetify.LocalStorage.set("HideImages_TrashArtistList", objectToString(trashArtistList));
		Spicetify.LocalStorage.set(HideImages_config_version_dbkey, "1.9");
	}
	async function exportItems2()
	{
		const data = {
			songs: trashSongList,
			artists: trashArtistList,
		};

		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: "hide-images 1.json",
				types: [
					{
						description: "Spicetify HideImages backup",
						accept: {
							"application/json": [".json"],
						},
					},
				],
			});
			
			const writable = await handle.createWritable();
			
			const data = {
				songs: objectToString(trashSongList),
				artists: objectToString(trashArtistList),
				albums: mapToString(trashAlbumList),
				configVersion: "1.9"
			};
			
			await writable.write(JSON.stringify(data, null, "\t"));
			await writable.close();

			Spicetify.showNotification("Backup saved succesfully.");
		} catch {
			Spicetify.showNotification("Failed to save, try copying trashbin contents to clipboard and creating a backup manually.");
		}
	}
	function exportItems()
	{
		// Igazából ezt úgy kéne, hogy magát a localstorage-ben lévő JSON stringet rakja a songs, artists és albums objektum alá és azt importálja és exportálja és egyesével parse-olja be a három JSON string-et. Egyszerűbb lenne a kód. -> szerintem kész.
		
		const data = {
			songs: objectToString(trashSongList),
			artists: objectToString(trashArtistList),
			albums: mapToString(trashAlbumList),
			configVersion: "1.9"
		};
		Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(data, null, "\t"));
		
		//Spicetify.LocalStorage.set("TrashAlbumList", JSON.stringify(Array.from(trashAlbumList.entries())));
		
		Spicetify.showNotification("Copied to clipboard");
	}
	function importItems()
	{
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = e =>
		{
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onload = e =>
			{
				try
				{
					const data = JSON.parse(e.target.result);
					if (data.configVersion !== undefined)
					{
						if (data.configVersion === "1.9")
						{
							trashSongList = objectFromString(data.songs);
							trashArtistList = objectFromString(data.artists);
							//trashAlbumList = new Map(data.albums);
							trashAlbumList = mapFromString(data.albums);
						}
					}
					else // config version is 1.8. Do something.
					{
						trashSongList = data.songs;
						trashArtistList = data.artists;
						trashAlbumList = new Map(data.albums);
					}
					putDataLocal();
					Spicetify.showNotification("File Import Successful!");
					console.log(`trashSongList: ${Object.keys(trashSongList).length}`)
					console.log(`trashArtistList: ${Object.keys(trashArtistList).length}`)
					console.log(`trashAlbumList: ${trashAlbumList.size}`)
				}
				catch (ex)
				{
					Spicetify.showNotification("File Import Failed!", true);
					console.error(ex);
				}
			};
			reader.onerror = () =>
			{
				Spicetify.showNotification("File Read Failed!", true);
				console.error(reader.error);
			};
			reader.readAsText(file);
		};
		input.click();
	}
	function importDefaultItems()
	{
		try
		{
			const data = JSON.parse(defaultBlockListJSONString);
					if (data.configVersion !== undefined)
					{
						if (data.configVersion === "1.9")
						{
							trashSongList = objectFromString(data.songs);
							trashArtistList = objectFromString(data.artists);
							//trashAlbumList = new Map(data.albums);
							trashAlbumList = mapFromString(data.albums);
						}
					}
					else // config version is 1.8. Do something.
					{
						trashSongList = data.songs;
						trashArtistList = data.artists;
						trashAlbumList = new Map(data.albums);
					}
					putDataLocal();
					Spicetify.showNotification("Import Successful!");
					console.log(`trashSongList: ${Object.keys(trashSongList).length}`)
					console.log(`trashArtistList: ${Object.keys(trashArtistList).length}`)
					console.log(`trashAlbumList: ${trashAlbumList.size}`)
		}
		catch (e)
		{
			Spicetify.showNotification("Import Failed!", true);
			console.error(e);
		}
	}
})();


// A search page szűrése:
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
