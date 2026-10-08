#!/usr/bin/env python3
"""Tell Bing, Yandex and other IndexNow search engines about every URL in the sitemap.
Run after each deploy:  python3 tools/indexnow.py"""
import json, re, urllib.request
S = 'https://glintex.vercel.app'
KEY = 'dd3c65846c1925dad8710b7f171072a9'
urls = re.findall(r'<loc>([^<]+)</loc>', open('public/sitemap.xml').read())
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=json.dumps({'host': 'glintex.vercel.app', 'key': KEY, 'keyLocation': f'{S}/{KEY}.txt', 'urlList': urls}).encode(), headers={'Content-Type': 'application/json'})
print(urllib.request.urlopen(req).status, 'submitted', len(urls), 'URLs')
