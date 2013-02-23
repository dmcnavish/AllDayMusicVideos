currentVideoList = []
  	currentVideoIdx = 0;
	// Used to keep track of the current search term, and the artists used to determine
	// similar videos. The list will be used to make sure that we don't use the same artist each time.  
	previousSearches = [];  
    var params = { allowScriptAccess: "always", allowfullscreen:"true" };
    var atts = { id: "myytplayer" };
    
	swfobject.embedSWF("http://www.youtube.com/v/siFsdInZqC0?enablejsapi=1&playerapiid=ytplayer&version=3",
            "ytapiplayer", "625", "556", "8", null, null, params, atts);
	
	/**
	 * When the YouTube player is ready, perform the initial page setup.
	 */
	function onYouTubePlayerReady(playerid){
		var userEntry = document.getElementById('userEntry');
		if(userEntry.addEventListener){
			userEntry.addEventListener("keyup",handleEnter, false);
		}
		else{
			userEntry.attachEvent("keyup",handleEnter);
		}
		submitEntry = document.getElementById('submitEntry');
		if(submitEntry.addEventListener){
			submitEntry.addEventListener("click",handleSubmitClick,false);
		}
		else{
			submitEntry.attachEvent("click",handleSubmitClick);
		}
		
		//hide the player initially until the user has entered a search criteria.
		ytplayer = document.getElementById('myytplayer'); 	
    	if(ytplayer){
			ytplayer.style.visibility = "hidden";
			if(ytplayer.addEventListener){
    			ytplayer.addEventListener("onStateChange","onytplayerStateChange" );
    		}
    		else{
    			ytplayer.attacheEvent("onStateChange","onytplayerStateChange" );
    		}
    	}
	}

    /**
	 * Given a youtube video id, play the video and increment the current video index.
	 */
    function loadVideo(id){
    	ytplayer = document.getElementById('myytplayer'); 	
    	if(ytplayer){
			ytplayer.style.visibility = "visible";
			nextButton = document.getElementById('videoInput');
    		nextButton.style.display = 'block';
			sideInfo = document.getElementById('sideInfo');
			sideInfo.style.display = 'block';
    		ytplayer.loadVideoById(id);
    	}
    }
    
    /**
    * skip to the next video
    */
    function nextVideo(){
		currentVideoIdx++;
		if(currentVideoIdx >= currentVideoList.length){
			//clear the list and get more videos.  To make it more random, instead of 
			//using the original search term, we will use the first  artist in the list that doesn't  
			// doesn't match the search.  This could cause pretty random results depending on YQL similar search.	
			searchTerm = currentVideoList[0].artist;
			for(var i=0;i<=currentVideoList.length;i++){
				if(previousSearches.indexOf(currentVideoList[i].artist) == -1 ){
						searchTerm = currentVideoList[i].artist;
						break;
				}
			}
			
			currentVideoList = []
			currentVideoIdx = 0;
			getVideosList(searchTerm);			
		}
    	currentVid = currentVideoList[currentVideoIdx];
		if(currentVid != null){
    		playVideo(currentVid.artist, currentVid.title);
    	}
    	else{
    		//we have run out of videos with no way of getting more. This is a problem.
    	}
    }
    
    /**
     * Handle player state change
     */
    function onytplayerStateChange(newState){
    	if(newState == 0){
			nextVideo();
   		 }
    }
	
	/**
	 * Event triggered when user searches for new artist/song
	 * We are clearing the current video list if the user
	 * searches for a new keyword.
	 */
	function handleSubmitClick(obj, event){
		userEntry = document.getElementById('userEntry');
		searchTerm = userEntry.value;
		toggleErrorMessage(false);
		previousSearches = [];
		previousSearches.push(searchTerm);
		if(searchTerm != null && searchTerm != ''){
			currentVideoList = [];
		}
		getVideosList(searchTerm);
	}
	
	function handleEnter(obj,event){
    	if(obj.keyCode == 13){
	 	   	handleSubmitClick(null,null);
	   	}
	}
	
	/**
	 * Given an array, mix it up in a random order.
	 */
	function shuffleArray(a){
		var len = a.length;
		var i = len;
		while(i--){
			var p = parseInt(Math.random()*len);
			var t = a[i];
			a[i] = a[p];
			a[p] = t;
		}
		return a;
	}
	
	/**
	 * Check if a value is in the array
	 */
	function arrayContains(a,v){
		for(var i=0;i<a.length;i++){
			if(v.indexOf(a[i]) != -1)
				return true;
		}
		return false;
	}

	function getVideoListCallback(data){
		if(data == null || data.query.results == null){
			toggleErrorMessage(true,'Sorry, no videos found. Please try again.');
		}
		else{
			processVideoList(data);
			if(currentVideoList.length > 0){
				vidId = currentVideoList[0].id;
				getSimilarVideos(vidId);
			}
		}

	}
	
	/**
	 *  Get a list of videos from yql that match the given search criteria
	 */
	function getVideosList(searchTerm){
		searchUrl = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20music.video.search%20where%20keyword="'+searchTerm+'"&format=json&diagnostics=true';
		ajax(searchUrl,getVideoListCallback)
	}
	
	function gSimilarVideoCallback(data){
		processVideoList(data);
		currentVideoList = shuffleArray(currentVideoList);
		//only used for testing
		//displaySongList();
		origVid = currentVideoList[0];
		previousSearches.push(origVid.artist);
		playVideo(origVid.artist, origVid.title);
	}
		
	/**
	* Get a list of similar videos from yql
	*/
	function getSimilarVideos(vidId){
		similarUrl = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20music.video.similar%20where%20id="' + vidId + '"&format=json';
		ajax(similarUrl,gSimilarVideoCallback);
	}
	
	/**
	 * process a list of videos from yql
	 */
	function processVideoList(data){
		if(data == null || data.query.results == null){
			//console.debug('data is null');
			return;
		}
		//console.debug('data is valid');
		
		var v = data.query.results.Video;
		for(var i=0; i< v.length; i++){
			value = v[i];
			if(value == null) continue;
			var movie = new Object();
			if(value.Artist.name == null){
				movie.artist = (value.Artist[0].name).replace(/[^a-zA-Z 0-9]+/g,'');
			}
			else{
				movie.artist = (value.Artist.name).replace(/[^a-zA-Z 0-9]+/g,'');
			}
			movie.title = (value.title).replace(/[^a-zA-Z 0-9]+/g,'');
			movie.id = value.id;
			if(movie.artist != 'unknown' 
				&& movie.title.indexOf('On Yahoo Music') == -1 
				&& movie.title.indexOf('Interview') == -1 )
				currentVideoList.push(movie);
		}
		
		/*$.each(data.query.results.Video, function(key, value){
					var movie = new Object();
					if(value.Artist.name == null){
						movie.artist = (value.Artist[0].name).replace(/[^a-zA-Z 0-9]+/g,'');
					}
					else{
						movie.artist = (value.Artist.name).replace(/[^a-zA-Z 0-9]+/g,'');
					}
					movie.title = (value.title).replace(/[^a-zA-Z 0-9]+/g,'');
					movie.id = value.id;
					if(movie.artist != 'unknown')
						currentVideoList.push(movie);
		});*/
				
	}
	
	/**
	 * Get a youtube video id that matches the given artist/title
	 */
	function playVideo(artist,title){
		searchUrl = 'https://gdata.youtube.com/feeds/api/videos?q='+artist + ' ' + title +'&orderby=relevance&start-index=1&max-results=2&v=2&alt=json';
		ajax(searchUrl, playVideoCallback);
		populateCurrentVideoInfo(artist, title);
	}

	function playVideoCallback(data){
		playing = false;
		
		var canEmbed = false;
		var e = data.feed.entry;
		if(e != null){
			for(var i=0; i< e.length;i++){
				value = e[i];		
				//check to see if the api allows us to embed the video
				for(var j=0; j< value.yt$accessControl.length;j++){
					if(value.yt$accessControl[j].action != 'embed')
						continue;
					else{
						permission = value.yt$accessControl[j].permission;
						if(permission == 'allowed')
							canEmbed = true;
						break;
					}
				}
				
				videoId = value.media$group.yt$videoid.$t;
				if(videoId != null && videoId != '' && !playing && canEmbed){
					loadVideo(videoId);
					playing=true;
				}//if
			}
		}
		
		if(!canEmbed){
			nextVideo();
		}
		/*$.each(data.feed.entry, function(key, value){
			videoId = value.media$group.yt$videoid.$t;
			if(videoId != null && videoId != '' && !playing){
				loadVideo(videoId);
				playing=true;
			}//if
		});//each
		*/
	}
	
	/**
	 * populate the screen with the current video's artist and title, also populate the side div
	 * with info about the artist.
	 */ 
	function populateCurrentVideoInfo(artist, title){
		document.getElementById('currentVid').innerHTML = '';
		document.getElementById('currentVid').innerHTML = '<h3>' + artist + ' - ' + title +'</h3>';
		
		document.getElementById('currentArtist').innerHTML = '';
		document.getElementById('currentArtist').innerHTML = '<h3>' + artist + '</h3>';
		
		artistInfo = getArtistNameInfo(artist);
		
	}
	
	/**
	 * Get a list of results that match the given artist.
	 */
	function getArtistNameInfo(artistName){
		var url = 'http://en.wikipedia.org/w/api.php?action=query&list=search&srprop=timestamp&format=json&srsearch=' + artistName +'&callback=getArtistInfo'
		var script = document.createElement('script');
		script.src=url;
		document.body.appendChild(script);
	}
	
	/**
	 * data will contain a list of matches for a given artist. 
	 * Take first result and then look for one containing 'band','musician', (need more examples). If found, override first result.
	 * Then invoke below link
	 */
	function getArtistInfo(data){
		results = data.query.search;
		var artistName = '';
		var titles = ['band','musician', 'rapper'];
		for(var r in results){
			if(results[r] == null) continue;
			if(artistName == '') 
				artistName = results[r].title;
			else if(arrayContains(titles, results[r].title)){
				artistName = results[r].title;
			}
		}
		if(artistName == ''){
			console.log('artistName is null, cant get info')
			return;
		}
		var url = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=1&titles=' + artistName +'&callback=getArtistInfoSuccess'
		var script = document.createElement('script');
		script.src=url;
		document.body.appendChild(script);
	}
	
	/**
	 * On success display the wikiopedia info of the artist on the page.
	 */
	function getArtistInfoSuccess(data){
		pages = data.query.pages;
		page = null;
		for(var p in pages){
			console.log(p);
			if(p != null) page = p;
		}
		//console.log('getArtistInfoSuccess ' + data.query.pages[page].extract);
		artistInfo = '';
		if(page != null) { 
			artistInfo = data.query.pages[page].extract;
			if(artistInfo.indexOf('may refer to') != -1) {
				//if the result contains 'may refer to' that means that wikipedia found more than one result.
				getArtistInfo( data.query.pages[page].title + ' (band)');
				artistInfo = '';
			}
		}
		document.getElementById('currentArtistInfo').innerHTML = '';
		document.getElementById('currentArtistInfo').innerHTML = '<p>' + artistInfo +'</p>';
	}
	
	/**
	 * Generic function to make ajax calls.  Append callback method to url before calling this method.
	 */
	function ajax(url, callback){
		toggleDisplay(true, 'loadingDiv');
		var ajaxRequest;
		console.log('making ajax call for url:' + url)
		try{
			// Opera 8.0+, Firefox, Safari
			ajaxRequest = new XMLHttpRequest();
		} catch (e){
			// Internet Explorer Browsers
			try{
				ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try{
					ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e){
					// Something went wrong
					alert("Your browser broke!");
					return false;
				}
			}
		}
		
		// Create a function that will receive data sent from the server
		ajaxRequest.onreadystatechange = function(){
			if(ajaxRequest.readyState == 4 && ajaxRequest.responseText != ''){
				data = eval("("+ajaxRequest.responseText+")");
				if(data.query.diagnostics && data.query.diagnostics.url.error){
					toggleErrorMessage(true,"Error invoking external service. Please try again.");
					toggleDisplay(false, 'loadingDiv');
				}
				else{
					callback(data);
				}
				//console.log(data.query.pages);
			}
		}
		ajaxRequest.open("GET", url, true);
		ajaxRequest.send(null); 
	}
	
	/**
	 * for debugging, to display the list of videos to play
	 */
	function displaySongList(){
		console.log('displaying list');
		var songlist = "";
		songlist = songlist.concat('<p>Current video list length: ' + currentVideoList.length + '<ol>');
		for(i=0; i< currentVideoList.length; i++){
			//console.log('currentVideo: ' + currentVideoList[i].artist);
			songlist = songlist.concat('<li>Artist:' + currentVideoList[i].artist + ' Title : ' + currentVideoList[i].title + ' Id: ' + currentVideoList[i].id +'</li>' );
		}
		songlist = songlist.concat('</ol>');
		
		document.getElementById('allVideos').innerHTML += songlist;
	}
	
	function toggleErrorMessage(doShow, msg){
		if(doShow){
			document.getElementById('errorMessage').innerHTML = msg;
		}
		toggleDisplay(doShow, 'errorMessageDiv');
	}

	//Toggle the display of an object by its id
	function toggleDisplay(doShow, objId){
		doDisplay = "none";
		if(doShow){
			doDisplay = "block";
		}
		document.getElementById(objId).style.display = doDisplay;
	}
    
    