All Day Music Videos
====================

All Day Music Vidoes is a website that lets the user enter an artist and then searches and plays music videos.  It finds videos that are similar to the artist that were entered.  The engine does its best to find offical music videos from YouTube. 

The web currently works using the PS3 browser as well.

In order to find offical videos, the engine uses a combination of Yahoo APIs and Google's YouTube API. Videos that are similar to the given artist are found using Yahoo's music video service and then the YouTube API is used to find the actual video.

The app is currently running on Google App Engine and can be found at http://alldaymvideo.appspot.com/

In order to run the application locally, download the newest version of Google App Engine and load the main directory.