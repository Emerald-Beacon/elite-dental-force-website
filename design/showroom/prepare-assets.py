from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
BASE=Path(r'C:\Users\elite\EDF-Creative\projects\edifi-explainer')
OUT=ROOT/'images/showroom'; OUT.mkdir(parents=True,exist_ok=True)
TEMP=Path(r'C:\Users\elite\AppData\Local\Temp\edf-showroom-assets'); TEMP.mkdir(parents=True,exist_ok=True)
MAN=[]
def font(n,b=False): return ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if b else 'C:/Windows/Fonts/segoeui.ttf',n)
def save(im,name,source,note,maxsize=None):
 if maxsize: im.thumbnail(maxsize,Image.Resampling.LANCZOS)
 path=OUT/(name+'.webp'); im.save(path,'WEBP',quality=88,method=6)
 MAN.append(dict(file=str(path.relative_to(ROOT)).replace('\\','/'),source=source,width=im.width,height=im.height,bytes=path.stat().st_size,edits=note))
 return im
for src,name in [('week','screen-week'),('3day','screen-3day')]:
 im=Image.open(BASE/f'f4/{src}.png').convert('RGB').crop((146,346,3840,2000))
 save(im,name,f'f4/{src}.png','Crop to schedule columns, excluding toolbar hyphenation and sidebar.',(1320,900))
im=Image.open(BASE/'f4/eligtoday.png').convert('RGB').crop((0,0,542,310))
save(im,'screen-today','f4/eligtoday.png','Crop action button with dash.',(542,310))
im=Image.open(BASE/'f4/production.png').convert('RGB'); d=ImageDraw.Draw(im)
d.rectangle((387,92,514,134),fill='white'); d.rectangle((28,278,98,314),fill='white')
save(im,'screen-production','f4/production.png','Mask scheduled and collected currency values; retain labels, no substitute data.',(542,356))
save(Image.open(BASE/'f4/confirm.png'),'screen-confirm','f4/confirm.png','None',(542,533))
save(Image.open(BASE/'f4/alerts.png').crop((16,101,525,285)),'screen-alerts','f4/alerts.png','Crop tab bar containing Pinboard.',(509,184))
im=Image.open(BASE/'f2/patient.png').convert('RGB'); scale=im.width/1760
# Keep the attention heading and nonmonetary frequency rows; exclude buttons and currency conflict row.
box=tuple(round(v*scale) for v in (57,550,1460,940)); im=im.crop(box); d=ImageDraw.Draw(im)
d.rectangle(tuple(round(v*scale) for v in (10,100,1398,157)),fill=(255,242,213))
save(im,'screen-patient','f2/patient.png (film3.jsx patient scene)','Crop to attention panel and frequency rows; exclude caller buttons, currency conflict row and identity header.',(1320,600))
im=Image.open(BASE/'f3/freq.png').convert('RGB'); d=ImageDraw.Draw(im)
# Remove full last-service lines containing ISO date dashes, preserving frequency and source rows.
d.rectangle((1045,155,1600,197),fill='white'); d.rectangle((1045,350,1600,392),fill='white')
save(im,'frequency','f3/freq.png','Mask ISO date lines containing dashes.',(940,600))
for letter in 'pocs':
 im=Image.open(BASE/f'f3/lt-{letter}.png').convert('RGBA')
 # Keep the original white pill and lettering, remove the colored shadow outside it.
 mask=Image.new('L',im.size,0); ImageDraw.Draw(mask).rounded_rectangle((29,30,im.width-29,94),radius=32,fill=255); im.putalpha(mask); im=im.crop((29,30,im.width-28,95))
 save(im,f'source-{letter}',f'f3/lt-{letter}.png','Crop to white source pill, removing colored shadow.')
for name in ['matalena','richard','siona']:
 save(Image.open(BASE/f'people/{name}.png'),name,f'people/{name}.png','Resize only',(400,400))
navy='#0a1d47'
# OG follows existing og-eligibility.html 1200x630 typography, logo and bottom strip idiom.
im=Image.new('RGB',(1200,630),navy); d=ImageDraw.Draw(im)
for x in range(0,1200,26):
 for y in range(0,630,26): d.ellipse((x,y,x+1,y+1),fill='#0b1421')
d.text((72,185),'INSIDE EDIFI',font=font(15,True),fill='#4ba8f0')
d.text((72,220),'Take the tour.',font=font(64,True),fill='white')
d.text((72,315),'See the work behind every verified patient.',font=font(24),fill='#acc3d8')
d.text((72,357),'A closer look at EDiFi Eligibility.',font=font(20),fill='#acc3d8')
logo=Image.open(ROOT/'images/edf-icon-logo.png').convert('RGBA'); logo.thumbnail((70,70)); im.paste(logo,(1078,52),logo)
d.line((0,578,1200,578),fill='#153049'); d.text((72,595),'elitedentalforce.com',font=font(16),fill='#8197ab'); d.text((910,595),'Elite Dental Force',font=font(16),fill='#4ba8f0')
save(im,'og-showroom','images/blog/og-templates/og-eligibility.html layout; existing edf-icon-logo.png','Native Pillow composition, single navy and established OG template idiom.')
poster=Image.new('RGB',(1280,720),navy); d=ImageDraw.Draw(poster)
d.text((80,55),'EDiFi Eligibility',font=font(36,True),fill='white')
screen=Image.open(OUT/'screen-week.webp'); screen.thumbnail((1120,465)); poster.paste(screen,((1280-screen.width)//2,145)); d.text((80,647),'Take the tour',font=font(24),fill='#4ba8f0')
save(poster,'tour-poster','f4/week.png and native caption','Sanitized schedule crop framed on page navy.')
# Still replacement panels cover the entire master image only during risky UI scenes.
def panel(title,assets,name):
 im=Image.new('RGB',(1280,720),navy); d=ImageDraw.Draw(im); d.text((60,40),title,font=font(38,True),fill='white')
 if len(assets)==1:
  pic=Image.open(OUT/(assets[0]+'.webp')).convert('RGBA'); pic.thumbnail((1150,490)); im.paste(pic,((1280-pic.width)//2,135+(490-pic.height)//2),pic)
 elif len(assets)==4:
  for i,a in enumerate(assets):
   pic=Image.open(OUT/(a+'.webp')).convert('RGBA'); pic.thumbnail((440,150)); im.paste(pic,(180+(i%2)*500,210+(i//2)*210),pic)
 else:
  for i,a in enumerate(assets):
   pic=Image.open(OUT/(a+'.webp')).convert('RGBA'); pic.thumbnail((360,460)); im.paste(pic,(55+i*410,160),pic)
 im.save(TEMP/(name+'.png'))
panel('Your schedule. One view.',['screen-week'],'scene-schedule')
panel('See what needs attention.',['screen-patient'],'scene-patient')
panel('Your whole week, in view.',['screen-week'],'scene-week')
panel('Confirmations, production and alerts.',['screen-confirm','screen-production','screen-alerts'],'scene-operations')
panel('Only confirmed facts.',['source-p','source-o','source-c','source-s'],'scene-sources')
panel('Frequencies and plan rules.',['frequency'],'scene-frequency')
im=Image.open(BASE/'f2/amounts.png').convert('RGB'); ratio=im.width/2048; d=ImageDraw.Draw(im)
for box in [(66,171,215,218),(511,175,523,201),(1577,175,1603,205),(392,208,543,298),(724,174,807,220),(724,277,764,308),(1050,171,1195,219),(1380,211,1652,238),(1703,174,1819,218),(68,504,160,547)]:
 d.rectangle(tuple(round(v*ratio) for v in box),fill=(245,246,250))
im=im.crop((0,0,im.width,round(390*ratio)))
save(im,'screen-benefits','f2/amounts.png (film3.jsx)','Mask all currency values and ISO plan date; crop lower family balance row. Preserve benefit labels and provenance badges.',(1320,600))
im=Image.open(BASE/'f2/coverage.png').convert('RGB'); ratio=im.width/2048; d=ImageDraw.Draw(im)
d.rectangle(tuple(round(v*ratio) for v in (583,94,596,117)),fill='white')
save(im,'screen-coverage','f2/coverage.png (film3.jsx)','Mask X Ray hyphen; preserve coverage percentages and source letters.',(1320,600))
# Replace patient video panel with a real benefit summary and category coverage.
im=Image.new('RGB',(1280,720),navy); d=ImageDraw.Draw(im); d.text((60,40),'See the real picture.',font=font(38,True),fill='white')
for name,y in [('screen-benefits',190),('screen-coverage',425)]:
 pic=Image.open(OUT/(name+'.webp')); pic.thumbnail((1150,240)); im.paste(pic,((1280-pic.width)//2,y))
im.save(TEMP/'scene-patient.png')
im=Image.open(OUT/'screen-3day.webp'); save(im,'screen-3day-preview','f4/3day.png','Preview variant of cropped schedule columns.',(600,600))
for name in ['screen-production','screen-confirm','screen-alerts']:
 path=OUT/(name+'.webp'); im=Image.open(path); im.thumbnail((400,600)); im.save(path,'WEBP',quality=88,method=6)
 for entry in MAN:
  if entry['file']==str(path.relative_to(ROOT)).replace('\\','/'):
   entry.update(width=im.width,height=im.height,bytes=path.stat().st_size)
for name,width in [('screen-week',660),('screen-3day',660),('screen-benefits',660),('screen-coverage',660),('screen-patient',660),('frequency',600),('matalena',210),('richard',210),('siona',210),('screen-production',320),('screen-confirm',320),('screen-alerts',320),('screen-today',320),('screen-3day-preview',520)]:
 im=Image.open(OUT/(name+'.webp')); save(im,name+'-mobile',name+'.webp','Mobile variant.',(width,1000))
(ROOT/'design/showroom/asset-manifest.json').write_text(json.dumps(MAN,indent=2))
print(json.dumps(MAN,indent=2))
