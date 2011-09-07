#!/usr/bin/python

from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

class MyServer(BaseHTTPRequestHandler):
    def serveFile(self, path):
        try:
            f = open('./www' + path)
            self.wfile.write(f.read())
            f.close()
            return True
        except IOError:
            return False

    def do_GET(self):
        contentTypes = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.ico': 'image/vnd.microsoft.icon',
            '.txt': 'text/plain',
            '.manifest': 'text/cache-manifest',
        }
        contentType = 'text/html'
        for key in contentTypes:
            if self.path.endswith(key):
                contentType = contentTypes[key]

        self.send_response(200, 'OK')
        self.send_header('Content-Type', contentType)
        # self.send_header('Cache-Control', 'max-age=%d' % (365*24*60*60))
        self.end_headers()

        if not self.serveFile(self.path):
            if not self.serveFile(self.path + 'index.html'):
                self.wfile.write('<h1>Error 404</h1>')

print 'http://localhost:8000/'
HTTPServer(('', 8000), MyServer).serve_forever()
