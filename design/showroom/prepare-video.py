from pathlib import Path
import subprocess,json,re
ROOT=Path(__file__).resolve().parents[2]; TEMP=Path(r'C:\Users\elite\AppData\Local\Temp\edf-showroom-assets')
BASE=Path(r'C:\Users\elite\EDF-Creative\projects\edifi-explainer')
SOURCE=Path(r'C:\Users\elite\EDF-Creative\output\video\edifi-explainer\social\EDiFi-Explainer-16x9.mp4')
OUT=ROOT/'media/showroom'; OUT.mkdir(parents=True,exist_ok=True)
ass=(BASE/'social/cap_16x9.ass').read_text(encoding='utf-8-sig')
def seconds(stamp):
 h,m,s=stamp.split(':'); return int(h)*3600+int(m)*60+float(s)
lines=[]
for line in ass.splitlines():
 if line.startswith('Dialogue:'):
  t=seconds(line.split(',')[1])
  if not (21.3<=t<47.1 or 50.3<=t<78.2): continue
 lines.append(line)
(TEMP/'overlay.ass').write_text('\n'.join(lines),encoding='utf-8')
# Preserve original master except these scenes. Cover all old UI pixels with vetted stills.
scenes=[('scene-schedule',21.3,28.5),('scene-patient',28.5,36.9),('scene-week',36.9,42.5),('scene-operations',42.5,47.5),('scene-patient',50.3,56.7),('scene-sources',56.7,69.6),('scene-frequency',69.6,78.7)]
args=['ffmpeg','-hide_banner','-loglevel','error','-i',str(SOURCE)]
for name,a,b in scenes: args+=['-loop','1','-framerate','30','-i',str(TEMP/(name+'.png'))]
filters=['[0:v]scale=1280:720[v0]']
for i,(_,a,b) in enumerate(scenes): filters.append(f"[v{i}][{i+1}:v]overlay=0:0:enable='gte(t,{a})*lt(t,{b})'[v{i+1}]")
filters+=['[v7]subtitles=overlay.ass,split=2[before][after]', '[before]trim=end=62.933333,setpts=PTS-STARTPTS[vb]','[after]trim=start=69.266667:end=95.3,setpts=PTS-STARTPTS[va]','[0:a]asplit=2[abefore][aafter]','[abefore]atrim=end=62.933333,asetpts=PTS-STARTPTS[ab]','[aafter]atrim=start=69.266667:end=95.3,asetpts=PTS-STARTPTS[aa]','[vb][ab][va][aa]concat=n=2:v=1:a=1[v][a]']
args+=['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-preset','medium','-crf','28','-maxrate','560k','-bufsize','1120k','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','64k','-movflags','+faststart','-y',str(OUT/'tour.mp4')]
subprocess.run(args,cwd=TEMP,check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','json',str(OUT/'tour.mp4')]))
report=dict(source=str(SOURCE),replacement_scenes=scenes,removed_master_interval=[62.933333,69.266667],removed_reason='Remove It goes and finds it through phone call sentence and its captions to avoid implying automated phone caller.',caption_source='social/cap_16x9.ass',narration_source='vo7/script.json',method='Vetted cropped Craft UI stills cover entire original UI scenes. Original footage and audio retained elsewhere. Captions restored from original approved ASS on replaced scenes.',probe=probe)
(ROOT/'design/showroom/video-manifest.json').write_text(json.dumps(report,indent=2))
print(json.dumps(probe))
