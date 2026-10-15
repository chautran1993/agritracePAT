// Stable demonstration identities shared by the zone catalog and map.
export const householdNames=[
 'Nguyễn Văn Hùng','Lê Thị Mai','Phạm Văn Tâm','Trần Thị Sen',
 'Võ Văn Bình','Đặng Thị Lan','Bùi Văn Phúc','Huỳnh Thị Hoa',
 'Đỗ Văn Thành','Ngô Thị Hạnh','Dương Văn Lợi','Phan Thị Thảo',
 'Lý Văn Nam','Mai Thị Thu','Cao Văn Tuấn','Hồ Thị Hương',
 'Nguyễn Văn Hải','Lê Thị Ngọc','Phạm Văn Sơn','Trần Thị Ánh',
 'Võ Văn Long','Đặng Thị Cúc','Bùi Văn Minh','Huỳnh Thị Liên',
 'Đỗ Văn Quang','Ngô Thị Yến','Dương Văn Đức','Phan Thị Hà',
 'Lý Văn Khánh','Mai Thị Trang',
];
export function householdForPlot(id:string){
 const index=Math.max(0,Number(id.replace(/^T/,''))-1);
 const zoneIndex=index%4;
 const members=householdNames.map((name,i)=>({id:`H${String(i+1).padStart(3,'0')}`,name,zoneId:`VT00${i%4+1}`})).filter((_,i)=>i%4===zoneIndex);
 return members[Math.floor(index/4)%members.length];
}
