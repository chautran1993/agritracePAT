import sys, json
sys.path.insert(0,'.tmp-analysis')
import cv2, numpy as np
from pathlib import Path
base=Path('C:/Users/vungo/AppData/Local/Temp')
names=['codex-clipboard-912f1e92-fd9e-402b-9fbb-7a38e52a8858.png','codex-clipboard-908b0974-ffdb-4cba-b103-4d2662ae96b9.png','codex-clipboard-f8497ed8-6c19-4f8d-91af-107cfc4dbdc1.png','codex-clipboard-bc59a414-0a22-43e4-b54b-78140e2fdcb0.png','codex-clipboard-88079171-4b03-453d-91f5-20cdf4f75418.png','codex-clipboard-b1b5bc52-39a8-4dc1-8d5b-a6d7b7c62b0e.png']
images=[cv2.resize(cv2.imread(str(base/n)),(2048,round(cv2.imread(str(base/n)).shape[0]*2048/cv2.imread(str(base/n)).shape[1]))) for n in names]
sift=cv2.SIFT_create(nfeatures=16000)
features=[]
for im in images:
 mask=np.ones(im.shape[:2],np.uint8)*255
 mask[:150,700:1340]=0;mask[:,1980:]=0;mask[960:,:]=0
 features.append(sift.detectAndCompute(cv2.cvtColor(im,cv2.COLOR_BGR2GRAY),mask))
transforms=[np.eye(3)]
for i in range(1,len(images)):
 candidates=[]
 for j in range(i):
  matches=cv2.BFMatcher().knnMatch(features[i][1],features[j][1],k=2)
  good=[m for m,n in matches if m.distance<.65*n.distance]
  if len(good)<8:continue
  src=np.float32([features[i][0][m.queryIdx].pt for m in good]);dst=np.float32([features[j][0][m.trainIdx].pt for m in good])
  a,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2)
  if a is not None:
   matrix=np.vstack([a,[0,0,1]]);score=int(inliers.sum());candidates.append((score,j,matrix))
 score,j,m=max(candidates,key=lambda v:v[0]);transforms.append(transforms[j]@m)
 print('REGISTER',i,'via',j,'inliers',score,'matrix',transforms[i].tolist())
json.dump([{'image':names[i],'toReference':transforms[i].tolist()} for i in range(1,len(images))],open('src/data/additionalImageRegistration.json','w'),indent=2)
