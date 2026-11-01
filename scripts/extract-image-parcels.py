import sys,json
sys.path.insert(0,'.tmp-analysis')
import cv2,numpy as np
from pathlib import Path
registrations=json.load(open('src/data/additionalImageRegistration.json'))
result=[]
for index,item in enumerate(registrations):
 im=cv2.imread(str(Path('C:/Users/vungo/AppData/Local/Temp')/item['image']));im=cv2.resize(im,(2048,1107));b,g,r=cv2.split(im)
 rr=r.astype(np.int16);gg=g.astype(np.int16);bb=b.astype(np.int16)
 raw=(((np.maximum(np.maximum(rr,gg),bb)-np.minimum(np.minimum(rr,gg),bb)<50)&(gg<240)&(gg>100))|((gg-rr>35)&(gg-bb>30)&(gg<245)&(rr<160))).astype(np.uint8)*255
 lines=cv2.HoughLinesP(raw,1,np.pi/720,threshold=40,minLineLength=50,maxLineGap=12)
 line=np.zeros_like(raw)
 if lines is not None:
  for itemline in np.asarray(lines).reshape(-1,4):
   x1,y1,x2,y2=itemline
   angle=np.degrees(np.arctan2(y2-y1,x2-x1))%180
   if (15<angle<40)or(90<angle<135)or(145<angle<165):cv2.line(line,(x1,y1),(x2,y2),255,3)
 line=cv2.morphologyEx(line,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
 cv2.rectangle(line,(690,0),(1340,152),255,-1);cv2.rectangle(line,(1970,0),(2047,1106),255,-1);cv2.rectangle(line,(590,968),(1360,1106),255,-1)
 free=255-line;n,labels,stats,centers=cv2.connectedComponentsWithStats(free,4)
 count=0
 for label in range(1,n):
  x,y,w,h,area=stats[label]
  if area<1500 or area>160000 or x<3 or y<3 or x+w>=1969 or y+h>=1104:continue
  if w<30 or h<30 or max(w/h,h/w)>20:continue
  region=(labels==label).astype(np.uint8)*255
  dark=((r<100)&(g<100)&(b<100)).astype(np.uint8)
  near=cv2.dilate(region,np.ones((11,11),np.uint8))>0
  if int(dark[near].sum())>max(10,area*.003):continue
  contours,_=cv2.findContours(region,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  contour=max(contours,key=cv2.contourArea);polygon=cv2.approxPolyDP(contour,2,True)[:,0,:]
  if len(polygon)<3 or len(polygon)>16:continue
  if any((abs(py-968)<7 and 580<px<1370) or (abs(px-1970)<7) or (abs(py-152)<7 and 680<px<1350) for px,py in polygon):continue
  hull=cv2.contourArea(cv2.convexHull(contour))
  if cv2.contourArea(contour)/max(hull,1)<.90:continue
  result.append({'imageIndex':index,'image':item['image'],'pixelOutline':polygon.tolist(),'referenceOutline':(np.c_[polygon,np.ones(len(polygon))]@np.array(item['toReference']).T)[:,:2].tolist(),'pixelArea':int(area)})
  count+=1
 print('EXTRACT',index+1,count)
json.dump(result,open('src/data/additionalImageOutlines.json','w'),indent=2)
# A standalone vector-data diagnostic, not an edited source screenshot.
canvas=np.ones((1650,3200,3),np.uint8)*255
for i,record in enumerate(result):
 pts=np.array(record['referenceOutline']);pts[:,0]+=320;pts=np.int32(pts)
 cv2.polylines(canvas,[pts],True,(80,130,30),2)
 center=pts.mean(axis=0).astype(int);cv2.putText(canvas,str(i+1),tuple(center),cv2.FONT_HERSHEY_SIMPLEX,.4,(20,20,20),1)
cv2.imwrite('../agritrace-deploy/extracted-parcel-diagnostic-2026-10-25.png',canvas)

