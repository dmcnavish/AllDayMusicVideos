import webapp2
from google.appengine.ext.webapp import template
import os
from google.appengine.api import memcache
import logging
import urllib2
import json as simplejson

class MainPage(webapp2.RequestHandler):
	def get(self):
		logging.getLogger().setLevel(logging.DEBUG)
		template_values = {
			'quote': getQuote()
		}

		path = os.path.join(os.path.dirname(__file__), 'mvideo.html')
		self.response.out.write(template.render(path, template_values))
		
################################################
# Retrieve a new random quote from i heart qotes.
# then save it in memcache and set it to expire
# every 12hrs.
################################################
def getQuote():
	quote = memcache.get('quote')
	#logging.debug('quote from memcache: ' + str(quote))
	if quote == None or quote == 'None':
		try:
			logging.debug('invoking iheartquotes')
			# At the moment, i heart quotes doesn't have a music category so song/poems is the closest we can get.
			# Maybe we could scrape http://www.goodreads.com/quotes/tag/music
			url = 'http://www.iheartquotes.com/api/v1/random?source=songs_poems&format=json'
			data = urllib2.urlopen(url, timeout=30).read()
			
			jsondata = simplejson.loads(data)
			quote = jsondata['quote']
			logging.debug('quote being saved to memcache: ' + quote)
			memcache.add(key='quote',value=quote,time=43200)
		except Exception, error:
			logging.error('error invoking i heart quotes: ' + str(error))
	return quote;

app = webapp2.WSGIApplication([('/',MainPage)], debug=True)
