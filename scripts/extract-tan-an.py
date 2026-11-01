import sys,json
sys.path.insert(0,'.tmp-analysis')
import cv2,numpy as np
from pathlib import Path
names=['codex-clipboard-ce688ebd-5d39-4d8d-8a81-954f1ebf05a6.png','codex-clipboard-65ad4764-b1a8-486e-8acb-66a3535c5502.png','codex-clipboard-cbea86ff-85e0-4ca4-b3ca-44c8935b56dd.png']
images=[cv2.resize(cv2.imread(str(Path('C:/Users/vungo/AppData/Local/Temp')/n)),(2048,1094))for n in names]
sift=cv2.SIFT_create(nfeatures=12000);features=[]
for im in images:
 mask=np.ones(im.shape[:2],np.uint8)*255;mask[:150,700:1340]=0;mask[960:,750:1310]=0;mask[:,1970:]=0
 features.append(sift.detectAndCompute(cv2.cvtColor(im,cv2.COLOR_BGR2GRAY),mask))
transforms=[np.eye(3)]
for i in range(1,3):
 matches=cv2.BFMatcher().knnMatch(features[i][1],features[0][1],k=2);good=[m for m,n in matches if m.distance<.65*n.distance]
 src=np.float32([features[i][0][m.queryIdx].pt for m in good]);dst=np.float32([features[0][0][m.trainIdx].pt for m in good]);a,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2)
 transforms.append(np.vstack([a,[0,0,1]]));print('REGISTER',i,int(inliers.sum()),transforms[i].tolist())
results=[]
for index,im in enumerate(images):
 b,g,r=[v.astype(np.int16)for v in cv2.split(im)]
 blue=((b-r>25)&(b>110)&(g<215)&(r<170)).astype(np.uint8)*255
 red=((r>180)&(g<155)&(b<155)).astype(np.uint8)*255
 line=cv2.bitwise_or(blue,red)
 line=cv2.morphologyEx(line,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8));line=cv2.dilate(line,np.ones((2,2),np.uint8))
 cv2.rectangle(line,(700,0),(1340,150),255,-1);cv2.rectangle(line,(1970,0),(2047,1093),255,-1);cv2.rectangle(line,(760,960),(1300,1093),255,-1)
 n,labels,stats,_=cv2.connectedComponentsWithStats(255-line,4);count=0
 for label in range(1,n):
  x,y,w,h,area=stats[label]
  if area<1000 or area>180000 or min(w,h)<20 or x<3 or y<3 or x+w>1968 or y+h>1090:continue
  region=(labels==label).astype(np.uint8)*255;contours,_=cv2.findContours(region,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);contour=max(contours,key=cv2.contourArea);poly=cv2.approxPolyDP(contour,2,True)[:,0,:]
  if len(poly)<3 or len(poly)>16:continue
  if any((abs(py-960)<6 and 750<px<1310)or(abs(py-150)<6 and 690<px<1350)or abs(px-1970)<6 for px,py in poly):continue
  if cv2.contourArea(contour)/max(cv2.contourArea(cv2.convexHull(contour)),1)<.70:continue
  ref=(np.c_[poly,np.ones(len(poly))]@transforms[index].T)[:,:2]
  results.append({'imageIndex':index,'referenceOutline':ref.tolist(),'pixelOutline':poly.tolist()});count+=1
 print('EXTRACT',index,count)
json.dump({'images':[{'name':n,'toReference':transforms[i].tolist()}for i,n in enumerate(names)],'samplePixelCorners':[[437,80],[697,400],[655,434],[399,110]],'sampleCornerIndices':[0,1,2,4],'outlines':results},open('src/data/tanAnImageOutlines.json','w'),indent=2)
