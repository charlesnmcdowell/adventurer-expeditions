"""Read-only localhost review server; source-art thumbnails are made in memory.
No uploads, mutations, symlinks, directories outside the two allowed roots.
"""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,parse_qs,unquote
from io import BytesIO
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'adventurer-expeditions-source-art'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionAbortedError,ConnectionResetError):pass
 def do_GET(self):
  url=urlsplit(self.path)
  if url.path!='/__audit_thumbnail':
   p=(ROOT/unquote(url.path).lstrip('/')).resolve()
   if not p.is_relative_to(ROOT) or p.relative_to(ROOT).parts[:1] not in [('docs',),('assets',)]:return self.send_error(404)
   return super().do_GET()
  q=parse_qs(url.query);base=SOURCE if q.get('source')==['1'] else ROOT
  p=(base/q.get('path',[''])[0]).resolve()
  if not p.is_relative_to(base.resolve()) or p.suffix.lower() not in ['.png','.jpg','.jpeg','.webp','.gif'] or not p.is_file():return self.send_error(404)
  try:
   with Image.open(p) as im:
    im.thumbnail((200,130));im=im.convert('RGBA');bg=Image.new('RGBA',im.size,(58,64,72,255));bg.alpha_composite(im);out=BytesIO();bg.convert('RGB').save(out,'JPEG',quality=70)
   body=out.getvalue();self.send_response(200);self.send_header('Content-Type','image/jpeg');self.send_header('Cache-Control','max-age=3600');self.end_headers();self.wfile.write(body)
  except (OSError,ValueError):self.send_error(415)
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--port',type=int,default=8894);args=ap.parse_args()
 ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
