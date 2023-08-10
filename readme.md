# Hide Arbitrary Images extension for Spotify/Spicetify

Hide sexually explicit, bothersome, or any other arbitrary image you'd like in the Spotify desktop app using this Spicetify extension.

Also available on the [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace).

## Usage:

Open the context menu at tracks, albums or artists and click on the menu item to throw them to the trashbin and never see their images again.

What works:  
Almost everything except these features which are not implemented yet: 

- filtering of Discography pages, 
- filtering of the Home page, 
- filtering of Playlists (the icon of the playlist on the playlist's page and the playlist icons on artist overview pages),
- the "Albums" and "Playlists" tabs of the Search page. 

There are no blocked images by default but you can import a default set of blocked images by importing the `default blocklist (importable at will).json` file in the extension's settings.

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

Have Spotify implement this same feature in their client.  

## Notes to self:

### How to develop Spicetify extensions:  
`spicetify --extension --live-update watch` will make spicetify auto-reload modified extensions. 

`spicetify apply`

`spotify --remote-debugging-port=9222 --enable-developer-mode`

`chromium-browser "chrome://inspect/"`

## Misc:

The theme in the screenshot is Bloom with the coffee color scheme.
