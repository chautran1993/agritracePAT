import sys,json
sys.path.insert(0,'.tmp-analysis')
import cv2,numpy as np
from pathlib import Path
names=['codex-clipboard-ce688ebd-5d39-4d8d-8a81-954f1ebf05a6.png','codex-clipboard-382cc4fa-8ca4-4971-b8c6-c1cbab12c187.png','codex-clipboard-1ebe82fd-c267-4786-ac16-08f7c0c070a1.png','codex-clipboard-a66e1a17-4387-4eb2-b94a-343a0569c8d3.png','codex-clipboard-8fb764dd-6962-4ee7-bf56-c792d943281c.png','codex-clipboard-0a935087-f9ea-460d-a497-3e2ece2995e8.png']
images=[cv2.resize(cv2.imread(str(Path('C:/Users/vungo/AppData/Local/Temp')/n)),(2048,1094))for n in names]
sift=cv2.SIFT_create(nfeatures=14000);features=[]
for im in images:
 mask=np.ones(im.shape[:2],np.uint8)*255;mask[:150,700:1340]=0;mask[960:,750:1310]=0;mask[:,1970:]=0
 features.append(sift.detectAndCompute(cv2.cvtColor(im,cv2.COLOR_BGR2GRAY),mask))
transforms=[np.eye(3)];support=[0]
for i in range(1,len(images)):
 candidates=[]
 for j in range(i):
  matches=cv2.BFMatcher().knnMatch(features[i][1],features[j][1],k=2);good=[m for m,n in matches if m.distance<.65*n.distance]
  if len(good)<10:continue
  src=np.float32([features[i][0][m.queryIdx].pt for m in good]);dst=np.float32([features[j][0][m.trainIdx].pt for m in good]);a,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2)
  if a is not None:candidates.append((int(inliers.sum()),j,np.vstack([a,[0,0,1]])))
 score,j,m=max(candidates,key=lambda c:c[0]);matrix=transforms[j]@m
 if score<50 or not .98<np.linalg.det(matrix[:2,:2])<1.02:raise ValueError('Unreliable registration')
 transforms.append(matrix);support.append(score);print('REGISTER',i,'via',j,'inliers',score,'offset',matrix[:2,2].tolist())
results=[]
for index,im in enumerate(images[1:],1):
 b,g,r=[v.astype(np.int16)for v in cv2.split(im)]
 line=((((b-r>25)&(b>110)&(g<215)&(r<170))|((r>180)&(g<155)&(b<155))).astype(np.uint8)*255)
 line=cv2.morphologyEx(line,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8));line=cv2.dilate(line,np.ones((2,2),np.uint8))
 cv2.rectangle(line,(700,0),(1340,150),255,-1);cv2.rectangle(line,(1970,0),(2047,1093),255,-1);cv2.rectangle(line,(760,960),(1300,1093),255,-1)
 n,labels,stats,_=cv2.connectedComponentsWithStats(255-line,4);count=0
 for label in range(1,n):
  x,y,w,h,area=stats[label]
  if area<1000 or area>180000 or min(w,h)<20 or x<3 or y<3 or x+w>1968 or y+h>1090:continue
  region=(labels==label).astype(np.uint8)*255
  land=(r>200)&(g>200)&(b<200)
  if np.count_nonzero(land&(labels==label))/area<.75:continue
  contours,_=cv2.findContours(region,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);contour=max(contours,key=cv2.contourArea);poly=cv2.approxPolyDP(contour,2,True)[:,0,:]
  if len(poly)<3 or len(poly)>16:continue
  if any((abs(py-960)<6 and 750<px<1310)or(abs(py-150)<6 and 690<px<1350)or abs(px-1970)<6 for px,py in poly):continue
  if cv2.contourArea(contour)/max(cv2.contourArea(cv2.convexHull(contour)),1)<.70:continue
  ref=(np.c_[poly,np.ones(len(poly))]@transforms[index].T)[:,:2]
  results.append({'imageIndex':index,'referenceOutline':ref.tolist(),'pixelOutline':poly.tolist()});count+=1
 print('EXTRACT',index,count)
json.dump({'images':[{'name':n,'toReference':transforms[i].tolist(),'inliers':support[i]}for i,n in enumerate(names)],'outlines':results},open('src/data/tanAnExtensionImages.json','w'),indent=2)
