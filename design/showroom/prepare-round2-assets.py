from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[2]; BASE=Path(r'C:\Users\elite\EDF-Creative\projects\edifi-explainer'); OUT=ROOT/'images/showroom'; MAN=[]
def emit(name,source,rect,width,masks=(),note='',attachment=None):
 original=Image.open(BASE/source).convert('RGB'); im=original.copy(); draw=ImageDraw.Draw(im)
 for box,color in masks: draw.rectangle(box,fill=color)
 im=im.crop(rect); im.thumbnail((width,10000),Image.Resampling.LANCZOS)
 path=OUT/(name+'.webp'); im.save(path,'WEBP',quality=91,method=6)
 data=dict(file=str(path.relative_to(ROOT)).replace('\\','/'),source=source,source_dimensions=list(original.size),source_crop=list(rect),width=im.width,height=im.height,bytes=path.stat().st_size,masks=[dict(rect=list(b),color=c) for b,c in masks],note=note)
 if attachment:data['attachment']=attachment
 MAN.append(data)
 return im
for name,src,rect,w in [
 ('r2-day-focus','f4/3day.png',(166,366,1378,1024),1000),
 ('r2-week','f4/week.png',(166,366,3820,1500),1800),
 ('r2-3day','f4/3day.png',(166,366,3820,1500),1800),
 ('r2-week-focus','f4/week.png',(166,366,2240,1230),1800),
 ('r2-frequency','f3/freq.png',(0,0,2539,620),1800),
 ('r2-frequency-row','f3/freq.png',(40,462,2510,614),1600),
 ('r2-frequency-rule','f3/freq.png',(1040,465,1930,610),880),
 ('r2-frequency-label','f3/freq.png',(40,477,430,540),390),
]:
 masks=([((1045,155,1600,197),'white'),((1045,350,1600,392),'white')] if src=='f3/freq.png' else [])
 emit(name,src,rect,w,masks,'Real source crop. Frequency annotation belongs in page, not the product pixels.')
 emit(name+'-mobile',src,rect,min(w,660),masks,'Mobile crop from original source.')
day=(166,366,1378,1024)
for name,y in [('avery',145),('olivia',273),('liam',401),('mia',529)]:
 rect=(186,366+y,686,366+y+116)
 attachment=dict(parent='r2-day-focus.webp',parent_source_crop=list(day),rect_in_parent_source=[20,y,500,116],normalized=[20/1212,y/658,500/1212,116/658])
 emit('r2-appointment-'+name,'f4/3day.png',rect,880,note='Exact source card cutout; same pixels as day focus.',attachment=attachment)
 emit('r2-appointment-'+name+'-mobile','f4/3day.png',rect,620,note='Mobile exact card cutout.',attachment=attachment)
# Real verified cards. Keep top identity, status, payer and procedure facts, mask money and ISO dates.
for name,rect in [('avery',(400,733,1108,1022)),('olivia',(1833,733,2542,1022)),('liam',(1117,877,1824,1184)),('mia',(2551,877,3258,1166))]:
 # Match local monetary badge and ISO verified date positions from each original card.
 x,y,x2,y2=rect
 if name in ['avery','olivia','mia']:
  money_y=142 if name=='avery' else 142
  masks=[((x+18,y+140,x+76,y+180),'#effcf3'),((x+18,y+216,x+400,y+250),'#effcf3')]
  if name=='olivia': masks=[((x+156,y+140,x+216,y+180),'#effcf3'),((x+18,y+216,x+400,y+250),'#effcf3')]
 else:
  masks=[((x+18,y+140,x+78,y+180),'#effcf3'),((x+18,y+214,x+400,y+250),'#effcf3'),((x+18,y+280,x+170,y+320),'#effcf3')]
 emit('r2-verified-'+name,'ui/02-board.png',rect,880,masks,'Actual verified card from day board, with currency and ISO date omitted. Different capture from the unverified day list; use as an illustrative reveal.')
 emit('r2-verified-'+name+'-mobile','ui/02-board.png',rect,620,masks,'Mobile original verified card crop.')
# Benefit detail: first three original cards, preserving source P and C badges and labels.
source='f2/amounts.png'; original=Image.open(BASE/source); ratio=original.width/2048
masks=[]
for box in [(66,171,215,218),(511,175,523,201),(392,208,543,298),(724,174,807,220),(724,277,764,308)]: masks.append((tuple(round(v*ratio) for v in box),'#f5f6fa'))
rect=(round(40*ratio),round(100*ratio),round(1020*ratio),round(385*ratio))
for suffix,w in [('',1300),('-mobile',660)]: emit('r2-benefit-detail'+suffix,source,rect,w,masks,'Three real benefit cards with monetary values omitted.')
# Exact P source chip inside annual maximum card for a literal detachment.
p_rect=tuple(round(v*ratio) for v in (213,177,253,217))
attachment=dict(parent='r2-benefit-detail.webp',parent_source_crop=list(rect),rect_in_parent_source=[p_rect[0]-rect[0],p_rect[1]-rect[1],p_rect[2]-p_rect[0],p_rect[3]-p_rect[1]],normalized=[(p_rect[0]-rect[0])/(rect[2]-rect[0]),(p_rect[1]-rect[1])/(rect[3]-rect[1]),(p_rect[2]-p_rect[0])/(rect[2]-rect[0]),(p_rect[3]-p_rect[1])/(rect[3]-rect[1])])
emit('r2-source-p-badge',source,p_rect,80,note='Literal P badge cutout; keep display at most native size for crispness.',attachment=attachment)
# Coverage: only the first two original columns, much more readable than the full table.
source='f2/coverage.png'; ratio=Image.open(BASE/source).width/2048
rect=tuple(round(v*ratio) for v in (45,68,1020,230)); masks=[(tuple(round(v*ratio) for v in (583,94,596,117)),'white')]
for suffix,w in [('',1300),('-mobile',660)]:emit('r2-coverage-detail'+suffix,source,rect,w,masks,'Four original coverage categories. X Ray punctuation masked.')
# Operational panels are sourced at original resolution, no enlargement.
for name,src,rect,w,masks in [
 ('r2-production','f4/production.png',(0,0,542,356),542,[((387,92,514,134),'white'),((28,278,98,314),'white')]),
 ('r2-confirm','f4/confirm.png',(0,0,542,533),542,[]),
 ('r2-alerts','f4/alerts.png',(16,101,525,285),509,[]),
 ('r2-today','f4/eligtoday.png',(0,0,542,310),542,[]),
 ('r2-sync','f2/syncpill.png',(0,0,272,74),272,[]),
 ('r2-verify','f2/verifybtn.png',(0,0,363,82),363,[]),
]:
 emit(name,src,rect,w,masks,'Original real product UI element; prohibited controls/values omitted.')
 if w>400:emit(name+'-mobile',src,rect,400,masks,'Mobile original operational panel.')
for entry in MAN:
 if entry['file'].split('/')[-1].startswith(('r2-frequency-row','r2-frequency-rule','r2-frequency-label')):
  x,y,right,bottom=entry['source_crop']; entry['attachment']=dict(parent='r2-frequency.webp',parent_source_crop=[0,0,2539,620],rect_in_parent_source=[x,y,right-x,bottom-y],normalized=[x/2539,y/620,(right-x)/2539,(bottom-y)/620])
(ROOT/'design/showroom/round2-asset-manifest.json').write_text(json.dumps(MAN,indent=2))
paths=[ROOT/m['file'] for m in MAN if '-mobile' not in m['file']]
sheet=Image.new('RGB',(1500,((len(paths)+2)//3)*330),'#0a1d47'); draw=ImageDraw.Draw(sheet)
for i,path in enumerate(paths):
 image=Image.open(path).convert('RGBA'); image.thumbnail((480,300)); sheet.paste(image,((i%3)*500,(i//3)*330),image); draw.text(((i%3)*500,(i//3)*330+305),path.name,fill='white')
sheet.save(ROOT/'design/showroom/round2-assets-reviewed.webp','WEBP',quality=88)
print(json.dumps([dict(file=m['file'],width=m['width'],height=m['height'],bytes=m['bytes']) for m in MAN],indent=2))
