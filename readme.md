# HideImages

Hide sexually explicit, bothersome, or any other images you want from Spotify using this Spicetify extension.


## Usage:

Open the context menu at tracks, albums or artists and click on the menu item to throw them to the trashbin and never see their images again.

What works:  
Almost everything except these features which are not implemented yet: 

- filtering of Discography pages, 
- filtering of the Home page, 
- filtering of Playlists (the icon of the playlist on the playlist's page and the playlist icons on artist overview pages). 

There are no blocked images by default but you can import a default set of blocked images by importing the `default blocklist (importable at will).json` file in the extension's settings.

## Known bugs:

- Right clicking and blocking a song will add the song to the trashbin while it's supposed to add the album to the trashbin. It will display the message "Song added to trashbin". Pressing the trash _icon_ (next to the song's name) works correctly, however. 

## Notes to self:

### How to develop Spicetify extensions:  
`spicetify --extension --live-update watch` will make spicetify auto-reload modified extensions. 