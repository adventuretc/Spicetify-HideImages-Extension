# Hide Arbitrary Images extension for Spotify/Spicetify

Hide sexually explicit, bothersome, or any other arbitrary image you'd like in the Spotify desktop app using this Spicetify extension.

Also available on the [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace).

## Usage:

Open the context menu at tracks, albums or artists and click on the menu item to throw them to the trashbin and never see their images again.

There are no images blocked by default but you can import a default set of blocked images by opening the settings and clicking a button (top right menu -> "Hide-Arbitrary-Images Settings" -> "Import default blocklist" button.) or by manually importing the `default blocklist (importable at will).json` file, which is also done in the extension's settings.  
The default blocklist contains about 288 entires, mostly naked or half-naked women (naked breasts, naked thighs (the boundary is 2 cm's above the knees), naked bottoms, naked vaginas (yes, really, you wouldn't believe) and naked waists or torsos).

What works: Almost everything.

- the cover art of the currently playing track on the lower left. 
- the cover art when you view an album. 
- background images of artists. 
- every cover art on artist overview pages except playlists. 
- everything in the "Queue" view. 
- everything in the "Recently played" view. 
- the insides of a Playlist.
- the highlighted song on the search page. 
- the "Songs" tab of the search page. 
- the "Albums", "Playlists" and "Artists" tabs of the Search page. 
- The "Recent searches" section when you first click on the Search button.
- the Home page.
- on the "All" tab of the search page: "Artists", "Albums" rows.
- the "Fans also like" section on artist overview pages.
- filtering of Discography pages.

What is not implemented yet: (In my experience these are rarely bothersome but I may do them later)

- removing the so called "photo" of Playlists (the icon of the playlist on the playlist's page and the playlist icons on artist overview pages),
- on the "All" tab of the search page: "Playlists", "Featuring" rows, and the track results on the right.
- the "popular tracks" on artist pages. 
- the "Playlists" tab of the Search page. 
- in the Home page's "Recently played" section if a _single track_ appears, it is not hidden even though the containing album is supposed to be hidden. 

## How to install: 

### Method 1:
1. install Spicetify (a desktop Spotify mod). https://spicetify.app/docs/getting-started
2. install this extension as a Spicetify extension. https://spicetify.app/docs/advanced-usage/extensions/

### Method 2:
1. install Spicetify (a desktop Spotify mod). https://spicetify.app/docs/getting-started
2. install [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace). 
3. install this extension through the browser of the Marketplace, inside the Spotify client. 

## Known bugs:

- Right clicking and blocking a song will add the song to the trashbin whereas it's supposed to add the album to the trashbin. It will display the message "Song added to trashbin". Pressing the trash _icon_ (next to the song's name) works correctly, however. 

## The goal of the project:

Have Spotify implement this same feature in their client. Currently, you can disable playing back explicit-rated content wich blocks _every_ song that has swearwords and doesn't prevent displaying of the associated artwork which is a far cry from what this extension provides or what an option to filter sexually explicit cover arts would provide. Steam also has this feature, at least the latter. 

## Notes to self:

### How to develop Spicetify extensions:  
`spicetify --extension --live-update watch` will make spicetify auto-reload modified extensions. 

`spicetify apply`

`spotify --remote-debugging-port=9222 --enable-developer-mode`

`chromium-browser "chrome://inspect/"`

## How to update the source code if it breaks:

Since this is a fork of trashbin.js and that one is a lot better maintained, just check out what they are up to.

https://github.com/spicetify/cli/commits/main/Extensions/trashbin.js

## Misc:

- The theme in the screenshot is Bloom with the coffee color scheme.
- The code quality is 4.5/10, "it gets the job done". Would-be-nice list:
	- refactor everything to have a method whose parameters are: selector to select parent element which contains both the url-containing element and the image-containing element, selector to select uri-containing element inside the parent, selector to select the image-containing element inside the parent, a delegated anonymous method to extract the uri from the uri-containing element, an enum constant or string to communicate whether this is an album, artist, playlist or what else (to know in which block list to look for the uri. Use `Spicetify.URI.Type.ALBUM`).
	- have more code comments.
	- remove old code pieces. 
	- remove outdated comments. 
