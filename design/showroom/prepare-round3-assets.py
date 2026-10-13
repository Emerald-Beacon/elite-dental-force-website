from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
BASE=Path(r'C:\Users\elite\EDF-Creative\projects\edifi-explainer')
TOUR=ROOT/'media/showroom/tour.mp4'
def audio_hash():
 return subprocess.check_output(['ffmpeg','-v','error','-i',str(TOUR),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],text=True).strip()
before_audio=audio_hash() if TOUR.exists() else None
baseline_path=Path(r'C:\Users\elite\AppData\Local\Temp\edf-showroom-assets\tour-before-round3.mp4')
baseline_blob=subprocess.check_output(['git','show','HEAD:media/showroom/tour.mp4'],cwd=ROOT); baseline_path.write_bytes(baseline_blob)
baseline_audio=subprocess.check_output(['ffmpeg','-v','error','-i',str(baseline_path),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],text=True).strip()
baseline_duration=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(baseline_path)],text=True))['format']['duration']
for script in ['prepare-assets.py','prepare-round2-assets.py','prepare-video.py']:
 subprocess.run([sys.executable,str(ROOT/'design/showroom'/script)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
after_audio=audio_hash()
if before_audio: assert before_audio==after_audio, 'Audio packet hash changed unexpectedly'
assert baseline_audio==after_audio, 'Committed baseline audio packet hash changed unexpectedly'
source=Image.open(BASE/'f2/amounts.png').convert('RGB'); ratio=source.width/2048
ImageDraw.Draw(source).rectangle(tuple(round(v*ratio) for v in (511,175,523,201)),fill='#f5f6fa')
expected=source.crop((50,125,1279,483))
actual=Image.open(ROOT/'images/showroom/r2-benefit-detail.webp').convert('RGB')
assert ImageChops.difference(expected,actual).getbbox() is None, 'Desktop restored benefit pixels differ from original crop'
expected.thumbnail((660,10000),Image.Resampling.LANCZOS)
actual=Image.open(ROOT/'images/showroom/r2-benefit-detail-mobile.webp').convert('RGB')
assert ImageChops.difference(expected,actual).getbbox() is None, 'Mobile restored benefit pixels differ from source resize'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(TOUR),'-f','null','-'],check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(TOUR),'-vf','fps=1/3,scale=480:-1,tile=4x8','-frames:v','1','-c:v','libwebp','-quality','85','-y',str(ROOT/'design/showroom/video-reviewed.webp')],check=True)
entries=[]
for manifest in ['asset-manifest.json','round2-asset-manifest.json']:
 for entry in json.loads((ROOT/'design/showroom'/manifest).read_text()):
  name=Path(entry['file']).name
  if 'frequency' in name or name.startswith('r2-benefit-detail'):
   path=ROOT/entry['file']; assert path.stat().st_size==entry['bytes']; assert Image.open(path).size==(entry['width'],entry['height']); entries.append(entry)
paths=[ROOT/e['file'] for e in entries if '-mobile' not in e['file']]
sheet=Image.new('RGB',(1400,((len(paths)+1)//2)*320),'#0a1d47'); draw=ImageDraw.Draw(sheet)
for i,path in enumerate(paths):
 image=Image.open(path).convert('RGB'); image.thumbnail((670,275)); sheet.paste(image,((i%2)*700,(i//2)*320)); draw.text(((i%2)*700,(i//2)*320+285),path.name,fill='white')
sheet.save(ROOT/'design/showroom/round3-assets-reviewed.webp','WEBP',quality=90)
video=json.loads((ROOT/'design/showroom/video-manifest.json').read_text()); video.update(round3_note='Only frequency replacement artwork changed: internal engineering labels omitted. Monetary values remain masked in video. Existing cuts, narration, captions and duration preserved.',sha256=hashlib.sha256(TOUR.read_bytes()).hexdigest(),audio_sha256=after_audio)
(ROOT/'design/showroom/video-manifest.json').write_text(json.dumps(video,indent=2))
report=dict(source_values={'annual_maximum':'$1,500','remaining_conflict':['$1,125','$980'],'individual_deductible':'$50','deductible_remaining':'$0','deductible_met':'Yes'},benefit_source=str(BASE/'f2/amounts.png'),benefit_source_sha256=hashlib.sha256((BASE/'f2/amounts.png').read_bytes()).hexdigest(),benefit_crop=[50,125,1279,483],benefit_pixel_verification='Exact decoded RGB equality against original source crop with only prior middle-dot mask, and exact equality to its Lanczos mobile resize. Both restored benefits use lossless WebP.',frequency_note='All six OD CodeGroupNum / BenefitNum lines, including Not writable, masked in original source before crop/resize. Tight lifted rule excludes metadata completely.',assets=entries,video_sha256=video['sha256'],audio_sha256_before=before_audio,audio_sha256_after=after_audio,video_decode_exit=0)
assert video['probe']['format']['duration']==baseline_duration
report['committed_baseline']=dict(video_sha256=hashlib.sha256(baseline_blob).hexdigest(),audio_payload_sha256=baseline_audio,duration_seconds=baseline_duration,source='git show HEAD:media/showroom/tour.mp4 before Round 3 commit')
(ROOT/'design/showroom/round3-asset-manifest.json').write_text(json.dumps(report,indent=2))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss','66','-i',str(TOUR),'-frames:v','1','-c:v','libwebp','-quality','95','-y',str(ROOT/'design/showroom/round3-video-frequency.webp')],check=True)
print(json.dumps(dict(asset_count=len(entries),asset_bytes=sum(e['bytes'] for e in entries),video=video['probe'],video_sha256=video['sha256'],audio_unchanged=before_audio==after_audio,benefit_pixels_exact=True)))
