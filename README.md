youtube-most-popular
====================

A simple node application that fetches the most popular Youtube videos (in the US region) using the Youtube API. A popular video is defined by having:

* More than 1 million views.
* More than 90% positive likes.

The application asynchronously fetches all Youtube categories, channels for each category, and videos for each channel.

##How to##

1. Clone the repository. 
2. Make sure Mongodb is running. Create a database named `youtube-most-popular`.
3. Replace the Youtube API key with your own API key.
4. Run the `youtube.js` script to fetch the videos:
    
        node youtube.js
        
   The popular videos are saved in a `videos` collection inside the Mongo database.
5. Once the videos are saved, you can run `client.js`, a simple client app that displays the saved videos.
	
	    node client.js
	 
    Visit `localhost:8080` to preview the videos.  
