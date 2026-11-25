import * as THREE from "three"; // 匯入 three.js 以建立 3D 場景
const root = document.getElementById("scene-root"); // 取得 3D 場景的容器
const scene = new THREE.Scene(); // 建立浮島公園場景
scene.background = new THREE.Color("#88c7ca"); // 採用參考圖中清透的青綠水色
scene.fog = new THREE.Fog("#88c7ca", 55, 110); // 以輕霧維持海面空間感
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); // 建立平滑抗鋸齒的 WebGL 繪圖器
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比例以平衡畫質與效能
renderer.shadowMap.enabled = true; // 啟用物件投射的陰影
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用柔和的陰影邊緣
renderer.outputColorSpace = THREE.SRGBColorSpace; // 使用標準 sRGB 色彩空間
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 使用電影式色調映射柔化亮部
renderer.toneMappingExposure = 1.08; // 微調場景整體曝光
root.appendChild(renderer.domElement); // 將 3D 畫布加入頁面
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100); // 建立等比例正交攝影機
const orbitCenter = new THREE.Vector3(0, 0.9, 0); // 將攝影機旋轉中心固定在中央科技島中心
const target = orbitCenter.clone(); // 設定攝影機初始注視中央島面
const cameraFollowOffset = new THREE.Vector3(0, 0, 0); // 保存使用者平移後相對角色的鏡頭偏移
let cameraAngle = Math.PI / 4; // 設定從右上方觀察場景的初始水平角度
let cameraZoom = 0.95; // 在完整呈現五島的同時讓場景更靠近畫面
let cameraHeight = 17; // 設定攝影機的俯視高度
const ambient = new THREE.HemisphereLight("#f4ffff", "#78999c", 2.15); // 使用天光補足物件暗部
scene.add(ambient); // 將環境光加入場景
const sunlight = new THREE.DirectionalLight("#fff5d8", 3.2); // 建立溫暖的方向光
sunlight.position.set(-8, 15, 10); // 將主光源放在場景左上方
sunlight.castShadow = true; // 讓主光源投射陰影
sunlight.shadow.mapSize.set(2048, 2048); // 提高陰影貼圖解析度
sunlight.shadow.camera.left = -42; // 設定大型場景陰影攝影機左界
sunlight.shadow.camera.right = 42; // 設定大型場景陰影攝影機右界
sunlight.shadow.camera.top = 42; // 設定大型場景陰影攝影機上界
sunlight.shadow.camera.bottom = -42; // 設定大型場景陰影攝影機下界
sunlight.shadow.bias = -0.00025; // 減少陰影表面的瑕疵
sunlight.shadow.radius = 5; // 柔化方向光陰影邊緣
scene.add(sunlight); // 將方向光加入場景
const water = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshStandardMaterial({ color: "#88c7ca", roughness: 0.88, metalness: 0.01 })); // 建立參考圖色調的寬廣青綠水面
water.rotation.x = -Math.PI / 2; // 將水面轉為水平
water.position.y = -0.14; // 將水面放在平台下方
const cameraMinHeight = Math.max(water.position.y + 0.75, 1.25); // 限制鏡頭最低高度並留在水面與平台上方
water.receiveShadow = true; // 讓水面承接浮島陰影
scene.add(water); // 將水面加入場景
const platformMaterial = new THREE.MeshStandardMaterial({ color: "#f0e2c4", roughness: 0.88 }); // 建立淺沙色平台側面材質
const deckMaterial = new THREE.MeshStandardMaterial({ color: "#d8c9a8", roughness: 0.9 }); // 建立淺木色平台表面材質
const yellowMaterial = new THREE.MeshStandardMaterial({ color: "#ffc844", roughness: 0.68 }); // 建立欄杆與警示條紋的黃色材質
const darkMaterial = new THREE.MeshStandardMaterial({ color: "#273a3b", roughness: 0.85 }); // 建立警示條紋的深色材質
const woodMaterial = new THREE.MeshStandardMaterial({ color: "#9b6846", roughness: 0.9 }); // 建立長椅木材材質
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#536e72", roughness: 0.72, metalness: 0.18 }); // 建立燈柱與支架的金屬材質
const grassMaterial = new THREE.MeshStandardMaterial({ color: "#91bd78", roughness: 0.94 }); // 建立公園與鄉村草地材質
const sandMaterial = new THREE.MeshStandardMaterial({ color: "#e7d4a9", roughness: 0.95 }); // 建立平台表面的沙色材質
const concreteMaterial = new THREE.MeshStandardMaterial({ color: "#b9c9c5", roughness: 0.9 }); // 建立城市街道與人行道材質
const pathMaterial = new THREE.MeshStandardMaterial({ color: "#e6dec7", roughness: 0.93 }); // 建立公園與鄉村步道材質
const flowerMaterials = ["#f5a4a8", "#f7d36b", "#f4f0dc", "#b8a2df"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 })); // 建立多色花朵材質
const platformSize = 11; // 放大五座方形浮島的可用腹地
const platformHeight = 0.72; // 加厚浮島基座並保留水面浮起的視覺
function box(parent, width, height, depth, material, x, y, z, castShadow = true) { // 建立可設定位置與陰影的方塊
const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material); // 建立方塊網格
mesh.position.set(x, y, z); // 設定方塊在父物件內的位置
mesh.castShadow = castShadow; // 設定方塊是否投射陰影
mesh.receiveShadow = true; // 讓方塊表面承接陰影
parent.add(mesh); // 將方塊加入指定父物件
return mesh; // 回傳方塊供後續調整
} // 結束方塊建立函式
function cylinder(parent, radiusTop, radiusBottom, height, material, x, y, z, segments = 7) { // 建立低多邊形圓柱
const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material); // 建立圓柱網格
mesh.position.set(x, y, z); // 設定圓柱在父物件內的位置
mesh.castShadow = true; // 讓圓柱投射陰影
mesh.receiveShadow = true; // 讓圓柱表面承接陰影
parent.add(mesh); // 將圓柱加入指定父物件
return mesh; // 回傳圓柱供後續調整
} // 結束圓柱建立函式
function sphere(parent, radius, material, x, y, z) { // 建立低多邊形球體
const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), material); // 使用二十面體製作低多邊形球
mesh.position.set(x, y, z); // 設定球體在父物件內的位置
mesh.scale.setScalar(1); // 保持球體比例一致
mesh.castShadow = true; // 讓球體投射陰影
mesh.receiveShadow = true; // 讓球體表面承接陰影
parent.add(mesh); // 將球體加入指定父物件
return mesh; // 回傳球體供後續調整
} // 結束球體建立函式
function addStripeSide(parent, sideAngle) { // 在平台側邊鋪設黃黑斜紋警示條
const stripeGroup = new THREE.Group(); // 建立可旋轉的條紋群組
stripeGroup.position.set(0, 0.32, 0); // 將斜紋置中對齊加厚後的平台側面
stripeGroup.rotation.y = sideAngle; // 讓斜紋貼合指定的側面方向
for (let index = -13; index <= 13; index += 1) { // 沿完整的平台側面排列交錯斜紋
const left = index * 0.42; // 計算每一道斜紋的水平起點
const points = [left, -0.3, 0, left + 0.25, -0.3, 0, left + 0.52, 0.3, 0, left + 0.27, 0.3, 0]; // 定義較高斜紋的四角座標
const geometry = new THREE.BufferGeometry(); // 為單一道斜紋建立幾何資料
geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3)); // 將斜紋頂點寫入幾何資料
geometry.setIndex([0, 2, 1, 0, 3, 2]); // 將四個頂點組成朝向平台外側的三角形
geometry.computeVertexNormals(); // 計算斜紋表面的法線
const material = index % 2 === 0 ? yellowMaterial : darkMaterial; // 交替選用黃色與深色材質
const stripe = new THREE.Mesh(geometry, material); // 建立單一道警示斜紋
stripe.position.z = -platformSize / 2 - 0.012; // 將斜紋稍微移到平台側面外側
stripe.castShadow = false; // 避免薄斜紋產生不必要的陰影
stripeGroup.add(stripe); // 將警示斜紋加入群組
} // 結束條紋排列
parent.add(stripeGroup); // 將整組警示斜紋加入平台
} // 結束平台側邊條紋函式
function addTree(parent, x, z, scale = 1, leafColor = "#62a877", treeType = "round") { // 依樹型拼出低多邊形樹木
const tree = new THREE.Group(); // 建立樹木群組
tree.position.set(x, 0.84, z); // 將樹木放在主題島嶼表面
tree.scale.setScalar(scale * 0.8); // 縮小樹木並保留主題島的開闊空間
obstacles.push({ parent, type: "circle", x, z, radius: 0.48 * scale }); // 記錄樹木碰撞範圍供玩家沿樹邊滑行
cylinder(tree, 0.12, 0.18, 0.85, woodMaterial, 0, 0.42, 0, 6); // 建立樹幹
const leaves = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.92 }); // 依照主題設定樹冠色彩
if (treeType === "pine") { const lower = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.05, 6), leaves); lower.position.set(0, 1.18, 0); lower.castShadow = true; tree.add(lower); const middle = new THREE.Mesh(new THREE.ConeGeometry(0.57, 0.9, 6), leaves); middle.position.set(0, 1.72, 0); middle.castShadow = true; tree.add(middle); const top = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.78, 6), leaves); top.position.set(0, 2.16, 0); top.castShadow = true; tree.add(top); } // 以層疊圓錐製作尖頂松樹
else if (treeType === "column") { const crown = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.9, 7), leaves); crown.position.set(0, 1.72, 0); crown.castShadow = true; tree.add(crown); } // 以高直樹冠呈現修剪過的行道樹
else if (treeType === "willow") { sphere(tree, 0.68, leaves, 0, 1.18, 0); sphere(tree, 0.45, leaves, -0.28, 1.5, 0.04); sphere(tree, 0.45, leaves, 0.28, 1.5, -0.04); cylinder(tree, 0.045, 0.055, 0.78, leaves, -0.42, 0.95, 0.02, 5); cylinder(tree, 0.045, 0.055, 0.7, leaves, 0.42, 0.98, -0.02, 5); } // 以垂掛枝葉呈現柔和的垂枝樹
else { sphere(tree, 0.58, leaves, 0, 1.13, 0); sphere(tree, 0.46, leaves, -0.18, 1.52, 0.08); sphere(tree, 0.34, leaves, 0.12, 1.82, -0.06); } // 以球冠組合呈現圓冠樹或花樹
parent.add(tree); // 將樹木加入平台
} // 結束樹木建立函式
function addBench(parent, x, z, rotation = 0) { // 使用方塊拼出公園長椅
const bench = new THREE.Group(); // 建立長椅群組
bench.position.set(x, 0.84, z); // 將長椅放在主題島嶼表面
bench.rotation.y = rotation; // 設定長椅朝向
bench.scale.setScalar(0.82); // 縮小長椅以配合放大的島面
box(bench, 1.22, 0.12, 0.34, woodMaterial, 0, 0.48, 0); // 建立長椅座面
box(bench, 1.22, 0.12, 0.32, woodMaterial, 0, 0.83, -0.14); // 建立長椅靠背
box(bench, 0.1, 0.48, 0.12, metalMaterial, -0.43, 0.23, 0); // 建立長椅左腳
box(bench, 0.1, 0.48, 0.12, metalMaterial, 0.43, 0.23, 0); // 建立長椅右腳
parent.add(bench); // 將長椅加入平台
} // 結束長椅建立函式
function addLamp(parent, x, z) { // 使用圓柱與球體拼出公園路燈
const lamp = new THREE.Group(); // 建立路燈群組
lamp.position.set(x, 0.84, z); // 將路燈放在主題島嶼表面
lamp.scale.setScalar(0.82); // 縮小路燈以保留步道空間
cylinder(lamp, 0.055, 0.075, 1.5, metalMaterial, 0, 0.75, 0, 7); // 建立路燈金屬燈柱
box(lamp, 0.46, 0.1, 0.13, metalMaterial, 0.16, 1.48, 0); // 建立路燈橫向燈臂
sphere(lamp, 0.2, new THREE.MeshStandardMaterial({ color: "#ffe59a", emissive: "#efb94d", emissiveIntensity: 0.35, roughness: 0.42 }), 0.35, 1.34, 0); // 建立球形暖光燈罩
cylinder(lamp, 0.18, 0.23, 0.08, metalMaterial, 0, 0.06, 0, 7); // 建立路燈底座
parent.add(lamp); // 將路燈加入平台
} // 結束路燈建立函式
function addShrub(parent, x, z, scale = 1, color = "#6eaa72") { // 使用多顆低多邊形球組成灌木
const shrub = new THREE.Group(); // 建立灌木群組
shrub.position.set(x, 0.84, z); // 將灌木放在島嶼地面
shrub.scale.setScalar(scale * 0.82); // 縮小灌木以避免佔滿草地
const material = new THREE.MeshStandardMaterial({ color, roughness: 0.94 }); // 建立灌木葉片材質
sphere(shrub, 0.38, material, 0, 0.28, 0); // 建立灌木中央葉團
sphere(shrub, 0.27, material, -0.25, 0.2, 0.04); // 建立灌木左側葉團
sphere(shrub, 0.29, material, 0.24, 0.19, -0.03); // 建立灌木右側葉團
parent.add(shrub); // 將灌木加入主題島嶼
} // 結束灌木建立函式
function addFlowerPatch(parent, x, z, count = 18) { // 在草地上種植成片的彩色花朵
for (let index = 0; index < count; index += 1) { // 逐一排列花莖與花朵
const offsetX = ((index * 37) % 100) / 100 - 0.5; // 計算花朵的水平散布位置
const offsetZ = ((index * 61) % 100) / 100 - 0.5; // 計算花朵的縱向散布位置
const flowerColor = flowerMaterials[index % flowerMaterials.length]; // 輪替使用不同花色
cylinder(parent, 0.014, 0.019, 0.19, grassMaterial, x + offsetX * 1.6, 0.95, z + offsetZ * 1.4, 5); // 建立細短花莖
sphere(parent, 0.068, flowerColor, x + offsetX * 1.6, 1.07, z + offsetZ * 1.4); // 建立縮小的彩色低多邊形花朵
} // 結束花朵排列
} // 結束花圃建立函式
function addBuilding(parent, x, z, width, depth, height, facadeColor, windowColor, accentColor = "#e9f4f2") { // 建立帶有窗格的現代建築
const groundY = 0.85; // 設定建築物所在的島嶼地面高度
const detailScale = 0.82; // 縮小建築物以襯托加大的平台腹地
const facade = new THREE.MeshStandardMaterial({ color: facadeColor, roughness: 0.56, metalness: 0.12 }); // 建立建築外牆材質
const windows = new THREE.MeshStandardMaterial({ color: windowColor, emissive: windowColor, emissiveIntensity: 0.16, roughness: 0.28, metalness: 0.28 }); // 建立玻璃窗材質
const scaledWidth = width * detailScale; // 計算縮小後的建築寬度
const scaledDepth = depth * detailScale; // 計算縮小後的建築深度
const scaledHeight = height * detailScale; // 計算縮小後的建築高度
obstacles.push({ parent, type: "box", x, z, halfWidth: scaledWidth / 2 + 0.16, halfDepth: scaledDepth / 2 + 0.16 }); // 記錄建築碰撞範圍並留出安全距離
box(parent, scaledWidth, scaledHeight, scaledDepth, facade, x, groundY + scaledHeight / 2, z); // 建立縮小後的建築主體
const floors = Math.floor(scaledHeight / 0.5); // 依照建築高度計算窗戶樓層數
const columns = scaledWidth > 1.3 ? 2 : 1; // 依照建築寬度計算窗戶欄數
for (let floor = 0; floor < floors; floor += 1) { // 沿建築高度逐層排列窗戶
for (let column = 0; column < columns; column += 1) { // 在建築正面逐欄排列窗戶
const localX = (column - (columns - 1) / 2) * (scaledWidth / (columns + 1)); // 計算正面窗戶水平位置
const windowY = groundY + 0.32 + floor * 0.46; // 計算每層窗戶的高度
const windowWidth = Math.min(0.27, scaledWidth / (columns + 1) * 0.62); // 限制窗戶寬度避免超出牆面
box(parent, windowWidth, 0.2, 0.04, windows, x + localX, windowY, z + scaledDepth / 2 + 0.022, false); // 安裝建築正面的窗戶
box(parent, 0.04, 0.2, windowWidth, windows, x + scaledWidth / 2 + 0.022, windowY, z + localX, false); // 安裝建築右側的窗戶
} // 結束單層窗戶排列
} // 結束建築窗格排列
box(parent, scaledWidth + 0.07, 0.09, scaledDepth + 0.07, new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.46, metalness: 0.24 }), x, groundY + scaledHeight - 0.07, z, false); // 加上建築頂端的裝飾線條
} // 結束現代建築建立函式
function addTileGrid(parent, material = pathMaterial) { // 在人行地面鋪設清楚但低對比的方格線
for (let index = -5; index <= 5; index += 1) { // 依照固定間距繪製十一列方磚接縫
const offset = index * 0.95; // 計算每一道方磚接縫的位置
box(parent, platformSize - 0.8, 0.018, 0.025, material, 0, 0.833, offset, false); // 繪製東西向的地磚接縫
box(parent, 0.025, 0.018, platformSize - 0.8, material, offset, 0.833, 0, false); // 繪製南北向的地磚接縫
} // 結束地磚接縫繪製
} // 結束方格地面建立函式
function addPark(parent) { // 建立樹木、步道與花圃密集的中央公園島
box(parent, platformSize - 0.46, 0.08, platformSize - 0.46, grassMaterial, 0, 0.78, 0); // 鋪設公園草地
const pathSpan = platformSize - 0.8; // 依照加大的平台延伸公園步道
box(parent, 1.05, 0.055, pathSpan, pathMaterial, 0, 0.85, 0); // 鋪設南北向公園步道
box(parent, pathSpan, 0.055, 1.05, pathMaterial, 0, 0.855, 0); // 鋪設東西向公園步道
box(parent, 1.45, 0.07, 1.45, sandMaterial, 0, 0.88, 0); // 建立步道中央的小型廣場
const pondMaterial = new THREE.MeshStandardMaterial({ color: "#69c5d6", roughness: 0.28, metalness: 0.18 }); // 建立公園池塘的清澈水面材質
box(parent, 1.9, 0.045, 1.12, pondMaterial, -3.1, 0.86, 0.1); // 建立公園西側的小池塘
const treeSpots = [[-4.1, -4.0], [0, -4.2], [4.1, -4.0], [-4.25, 3.8], [4.25, 3.8], [-4.4, -0.25]]; // 沿加大的公園邊界疏朗配置樹木
treeSpots.forEach((spot, index) => { const treeType = ["round", "pine", "blossom", "willow", "round", "column"][index]; const color = index % 2 === 0 ? "#df91a9" : "#78ad78"; addTree(parent, spot[0], spot[1], 0.95, color, treeType === "blossom" ? "round" : treeType); }); // 混合花樹、松樹、垂枝樹與行道樹
for (let index = 0; index < 8; index += 1) { // 沿著公園邊緣稀疏排列灌木
const side = index % 4; // 選擇灌木所在的島嶼邊
const offset = -3.9 + Math.floor(index / 4) * 2.7; // 計算灌木沿邊的位置
const x = side < 2 ? offset : side === 2 ? -4.7 : 4.7; // 計算灌木的水平座標
const z = side < 2 ? (side === 0 ? -4.7 : 4.7) : offset; // 計算灌木的縱向座標
addShrub(parent, x, z, 0.75 + (index % 2) * 0.16); // 增加公園綠籬與層次
} // 結束公園灌木排列
addFlowerPatch(parent, -2.7, -1.75, 9); // 種植一處低矮的西側花圃
addFlowerPatch(parent, 2.65, 1.8, 9); // 種植一處低矮的東側花圃
addBench(parent, -1.05, 1.55, Math.PI / 2); // 在步道旁設置休憩長椅
addBench(parent, 1.0, -1.55, Math.PI / 2); // 在另一側步道旁設置長椅
for (let index = 0; index < 2; index += 1) { addLamp(parent, index === 0 ? -0.82 : 0.82, index === 0 ? -1.65 : 1.65); } // 沿公園主步道設置兩盞路燈
} // 結束公園島造景
function addModernCity(parent, isTech = false) { // 建立密集的現代都會或科技城街區
const ground = isTech ? new THREE.MeshStandardMaterial({ color: "#394a61", roughness: 0.68 }) : concreteMaterial; // 依照主題選用城市地坪
box(parent, platformSize - 0.46, 0.08, platformSize - 0.46, ground, 0, 0.78, 0); // 鋪設城市街區底面
if (!isTech) { addTileGrid(parent, new THREE.MeshStandardMaterial({ color: "#a9b5b1", roughness: 0.9 })); } // 在一般城市地面標示淺色方磚接縫
box(parent, 1.05, 0.055, platformSize - 0.8, isTech ? metalMaterial : deckMaterial, 0, 0.85, 0); // 鋪設延伸至島嶼邊界的南北向城市大道
box(parent, platformSize - 0.8, 0.055, 1.05, isTech ? metalMaterial : deckMaterial, 0, 0.855, 0); // 鋪設延伸至島嶼邊界的東西向城市大道
const laneMaterial = new THREE.MeshStandardMaterial({ color: isTech ? "#54e1e9" : "#f7f0d7", emissive: isTech ? "#34b5ca" : "#000000", emissiveIntensity: isTech ? 0.45 : 0, roughness: 0.52 }); // 建立道路標線與科技光帶材質
for (let mark = -3; mark <= 3; mark += 1) { // 沿交叉大道繪製間隔標線
box(parent, 0.08, 0.025, 0.42, laneMaterial, 0, 0.89, mark * 1.12, false); // 繪製南北向車道標線
box(parent, 0.42, 0.025, 0.08, laneMaterial, mark * 1.12, 0.895, 0, false); // 繪製東西向車道標線
} // 結束道路標線繪製
const buildingSpots = isTech ? [[-3.05, -3.0], [3.05, -3.0], [-3.05, 3.0], [3.05, 3.0]] : [[-3.05, -3.0], [3.05, -3.0], [-3.05, 3.0], [3.05, 3.0], [-3.15, 1.25], [3.15, -1.25]]; // 讓科技城更開闊並保留都會街廓
buildingSpots.forEach((spot, index) => { // 逐一興建城市樓宇
const height = isTech ? [1.9, 2.5, 2.1, 2.7, 1.8, 2.2][index] : [1.7, 2.2, 1.9, 2.5, 1.6, 2.0][index]; // 讓建築高度維持低矮且錯落
const width = index % 2 === 0 ? 1.45 : 1.6; // 為每棟樓房保留街道留白
const depth = index % 2 === 0 ? 1.35 : 1.5; // 設定緊湊但不擁擠的建築深度
const facadeColor = isTech ? ["#344968", "#49617d", "#46537e", "#38566c"][index % 4] : ["#b6d2d7", "#d4d7cc", "#a9c5cb", "#dfcdb9"][index % 4]; // 交錯安排科技玻璃與現代外牆
const glassColor = isTech ? "#54e5ef" : ["#7ed0df", "#f7d98a", "#a1d9e8"][index % 3]; // 設定窗戶與玻璃幕牆顏色
addBuilding(parent, spot[0], spot[1], width, depth, height, facadeColor, glassColor, isTech ? "#70eff2" : "#edf0e5"); // 建立具有窗格的高樓
}); // 結束城市樓宇排列
if (isTech) { // 為科技城增添未來感地標
addBuilding(parent, 0, 0, 1.7, 1.7, 3.5, "#293f60", "#6ef5ff", "#61f1ef"); // 建立尺度克制的科技城中央塔樓
const domeMaterial = new THREE.MeshStandardMaterial({ color: "#65e2e8", emissive: "#2ca8b4", emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.3 }); // 建立中央能量穹頂材質
sphere(parent, 0.62, domeMaterial, 0, 4.0, 0); // 在縮小後的中央高塔頂端建造發光穹頂
cylinder(parent, 0.07, 0.07, 1.0, yellowMaterial, 2.35, 1.42, -2.35, 6); // 安裝科技城通訊天線
box(parent, 1.0, 0.08, 0.7, metalMaterial, -2.45, 0.93, 2.25); // 建立城市能源控制台
} else { // 為一般現代城市增添公共街景
addLamp(parent, -0.8, -1.6); // 在城市大道旁設置路燈
addLamp(parent, 0.8, 1.6); // 在城市另一端設置路燈
} // 結束城市專屬地標配置
} // 結束現代城市造景
function addCottage(parent, x, z, wallColor, roofColor, scale = 1) { // 建立鄉村木屋與斜頂
const width = 1.2 * scale * 0.82; // 縮小木屋寬度以留出鄉村庭院
const depth = 1.0 * scale * 0.82; // 縮小木屋深度以留出鄉村步道
const wallHeight = 0.82 * scale * 0.82; // 縮小木屋牆身高度
obstacles.push({ parent, type: "box", x, z, halfWidth: width / 2 + 0.16, halfDepth: depth / 2 + 0.16 }); // 記錄木屋碰撞範圍以避免角色穿牆
box(parent, width, wallHeight, depth, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 }), x, 0.84 + wallHeight / 2, z); // 建立彩色木屋牆身
const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.88, 0.68 * scale, 4), new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.88 })); // 建立四面斜頂屋頂
roof.rotation.y = Math.PI / 4; // 旋轉屋頂使斜面沿房屋邊線排列
roof.position.set(x, 0.84 + wallHeight + 0.19 * scale, z); // 將屋頂安裝在牆身上
roof.castShadow = true; // 讓屋頂投射柔和陰影
parent.add(roof); // 將屋頂加入鄉村島
box(parent, 0.26 * scale, 0.36 * scale, 0.045, darkMaterial, x, 0.84 + 0.18 * scale, z + depth / 2 + 0.025, false); // 裝設木屋正門
box(parent, 0.25 * scale, 0.22 * scale, 0.045, yellowMaterial, x - 0.32 * scale, 0.84 + 0.53 * scale, z + depth / 2 + 0.03, false); // 裝設木屋正面窗戶
} // 結束鄉村木屋建立函式
function addCountryside(parent) { // 建立田園農地、鄉村木屋與作物
box(parent, platformSize - 0.46, 0.08, platformSize - 0.46, grassMaterial, 0, 0.78, 0); // 鋪設鄉村草地
addTileGrid(parent, new THREE.MeshStandardMaterial({ color: "#b5a986", roughness: 0.95 })); // 在鄉村住宅區鋪設淡色方磚地面
box(parent, 1.0, 0.055, platformSize - 0.8, pathMaterial, 0, 0.85, 0); // 鋪設通往村莊的縱向石子路
box(parent, platformSize - 1.0, 0.055, 0.72, pathMaterial, 0, 0.855, 1.05); // 鋪設農舍前方的橫向小路
for (let row = 0; row < 4; row += 1) { // 逐列種植留有空隙的田園作物
for (let crop = 0; crop < 6; crop += 1) { // 沿田埂稀疏排列作物
const x = -3.25 + crop * 0.62; // 計算每株作物的水平位置
const z = -3.0 + row * 0.55; // 計算每列作物的縱向位置
cylinder(parent, 0.028, 0.036, 0.27, row % 2 === 0 ? yellowMaterial : grassMaterial, x, 0.98, z, 5); // 建立縮小的低多邊形作物莖稈
sphere(parent, 0.072, row % 2 === 0 ? yellowMaterial : flowerMaterials[1], x, 1.13, z); // 建立縮小的作物穗或花球
} // 結束單列作物排列
} // 結束農田種植
addCottage(parent, -2.75, 2.3, "#e9d8b8", "#a9634b", 1.05); // 建立村莊主屋
addCottage(parent, -0.95, 2.7, "#d4e5cf", "#796c56", 0.82); // 建立小型綠牆農舍
addCottage(parent, 2.55, 2.35, "#ead0b2", "#b27846", 0.96); // 建立村莊東側農舍
box(parent, 1.35, 1.05, 1.15, woodMaterial, 2.45, 1.365, -1.2); // 建立存放農具的木造穀倉
cylinder(parent, 0.34, 0.42, 1.25, metalMaterial, -2.85, 1.47, -1.55, 8); // 建立村口的小型糧倉
addTree(parent, 3.5, 3.5, 0.9); // 在村莊旁種植遮蔭樹
addTree(parent, -3.7, 2.7, 0.82); // 在鄉村步道旁增添樹木
addShrub(parent, 1.1, 3.35, 0.9, "#7ca85f"); // 在農舍旁種植綠色灌木
addFlowerPatch(parent, 0.85, 2.45, 12); // 在鄉村住宅旁種植花叢
} // 結束鄉村造景
const walkers = []; // 儲存所有會行走的 Q 版人物
const cyclists = []; // 儲存沿步道騎乘的低多邊形人物
const walkSurfaceMeshes = []; // 儲存可供滑鼠點選的島面與橋面
const bridgeRoutes = []; // 儲存橋樑端點供玩家尋路使用
const playerRoute = []; // 儲存點選移動時依序前往的路徑點
const obstacles = []; // 儲存樹木與建築碰撞範圍
const stamps = []; // 儲存五座島上的集章資料與圓形標記
let player = null; // 保存目前進入群島的玩家人物
let playerKeyboardMoving = false; // 記錄玩家是否正以方向鍵移動
const playerRaycaster = new THREE.Raycaster(); // 建立滑鼠點選場景地面的射線
const walkSurfaceMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); // 建立不可見但可被滑鼠選取的行走地面材質
function addWalkSurface(parent, width, depth, y, userData) { // 建立可供玩家行走與點選的透明地面
const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), walkSurfaceMaterial); // 建立透明地面網格
surface.rotation.x = -Math.PI / 2; // 將平面轉為水平地面
surface.position.y = y; // 設定可行走表面的高度
surface.userData = userData; // 記錄島嶼或橋樑的路徑資訊
parent.add(surface); // 將透明地面加入場景物件群組
walkSurfaceMeshes.push(surface); // 加入滑鼠點選射線的檢測清單
return surface; // 回傳透明地面供後續設定
} // 結束可行走地面建立
function makeChibi(params = {}) { // 依照外觀參數建立球頭膠囊身體的 Q 版人物
const shirtColor = params.shirtColor || "#4c9f9b"; // 取得上衣顏色或使用預設青綠色
const hairColor = params.hairColor || "#49352c"; // 取得頭髮顏色或使用預設深棕色
const hairStyle = params.hairStyle || "short"; // 取得頭髮樣式或使用俐落短髮
const helmet = Boolean(params.helmet); // 記錄人物是否配戴安全帽
const backpack = Boolean(params.backpack); // 記錄人物是否背著背包
const scale = params.scale || 0.72; // 預設縮小人物並保留外觀參數的自訂比例
const rootGroup = new THREE.Group(); // 建立人物根群組供定位與行走動畫使用
rootGroup.position.set(params.x || 0, 0.84, params.z || 0); // 將人物放置在指定島嶼地面
rootGroup.scale.setScalar(scale); // 套用人物整體尺寸比例
const skinMaterial = new THREE.MeshStandardMaterial({ color: "#f1bd98", roughness: 0.82 }); // 建立人物膚色材質
const shirtMaterial = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.78 }); // 建立人物上衣材質
const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.92 }); // 建立人物頭髮材質
const pantsMaterial = new THREE.MeshStandardMaterial({ color: "#44546b", roughness: 0.86 }); // 建立人物長褲材質
const shoeMaterial = new THREE.MeshStandardMaterial({ color: "#f5eee0", roughness: 0.72 }); // 建立人物鞋子材質
const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 9), skinMaterial); // 使用球體建立人物頭部
head.position.set(0, 1.75, 0); // 將頭部放在身體頂端
head.castShadow = true; // 讓人物頭部投射陰影
rootGroup.add(head); // 將頭部加入人物群組
cylinder(rootGroup, 0.09, 0.1, 0.16, skinMaterial, 0, 1.47, 0, 8); // 連接頭部與身體的短脖子
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.46, 4, 8), shirtMaterial); // 使用膠囊幾何建立約與頭部成 1 比 1.5 的身體
torso.position.set(0, 1.03, 0); // 將身體放在頭部正下方
torso.castShadow = true; // 讓人物身體投射陰影
rootGroup.add(torso); // 將身體加入人物群組
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 7), hairMaterial); // 使用球體建立貼合頭頂的髮型
hair.scale.set(1, hairStyle === "long" ? 0.7 : 0.54, hairStyle === "long" ? 1.05 : 0.94); // 依照髮型設定頭頂頭髮比例
hair.position.set(0, hairStyle === "long" ? 1.84 : 1.91, -0.045); // 依照髮型調整頭髮高度
rootGroup.add(hair); // 將頭髮加入人物群組
if (hairStyle === "long") { const leftLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.36, 3, 6), hairMaterial); leftLock.position.set(-0.22, 1.54, -0.02); rootGroup.add(leftLock); const rightLock = leftLock.clone(); rightLock.position.x = 0.22; rootGroup.add(rightLock); } // 以垂落髮束呈現長髮樣式
if (hairStyle === "spiky") { for (let spike = -1; spike <= 1; spike += 1) { const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 5), hairMaterial); tip.position.set(spike * 0.15, 2.12 - Math.abs(spike) * 0.04, -0.02); tip.castShadow = true; rootGroup.add(tip); } } // 以低多邊形尖束呈現俏皮尖髮
if (hairStyle === "curly") { sphere(rootGroup, 0.16, hairMaterial, -0.22, 1.91, 0); sphere(rootGroup, 0.16, hairMaterial, 0.22, 1.91, 0); sphere(rootGroup, 0.16, hairMaterial, 0, 2.03, -0.08); } // 以蓬鬆髮團呈現捲髮樣式
const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#342d2a", roughness: 0.6 }); // 建立簡單可愛的眼睛材質
sphere(rootGroup, 0.035, eyeMaterial, -0.095, 1.77, 0.264); // 建立人物左眼
sphere(rootGroup, 0.035, eyeMaterial, 0.095, 1.77, 0.264); // 建立人物右眼
if (helmet) { // 依參數決定是否加上安全帽
const helmetMaterial = new THREE.MeshStandardMaterial({ color: params.helmetColor || "#ffd45c", roughness: 0.5, metalness: 0.08 }); // 建立安全帽外殼材質
const helmetCap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), helmetMaterial); // 使用半球體製作安全帽
helmetCap.position.set(0, 1.92, 0); // 將安全帽放在頭頂
helmetCap.castShadow = true; // 讓安全帽投射陰影
rootGroup.add(helmetCap); // 將安全帽加入人物群組
cylinder(rootGroup, 0.34, 0.34, 0.055, helmetMaterial, 0, 1.88, 0.015, 12); // 加上安全帽前緣帽簷
} // 結束安全帽外觀設定
if (backpack) { // 依參數決定是否加上背包
const bagMaterial = new THREE.MeshStandardMaterial({ color: params.backpackColor || "#d78255", roughness: 0.8 }); // 建立背包布料材質
box(rootGroup, 0.39, 0.46, 0.2, bagMaterial, 0, 1.03, -0.245); // 將背包背在人物身後
box(rootGroup, 0.25, 0.13, 0.035, yellowMaterial, 0, 1.03, -0.36, false); // 加上背包的口袋與扣帶裝飾
} // 結束背包外觀設定
const leftArm = new THREE.Group(); // 建立左肩關節群組
leftArm.position.set(-0.25, 1.31, 0); // 將左手臂掛接在左肩位置
const leftArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 3, 7), shirtMaterial); // 使用膠囊建立左手臂
leftArmMesh.position.y = -0.25; // 將手臂從肩關節向下延伸
leftArmMesh.rotation.z = -0.12; // 讓手臂稍微自然外張
leftArmMesh.castShadow = true; // 讓左手臂投射陰影
leftArm.add(leftArmMesh); // 將膠囊手臂掛在左肩關節
sphere(leftArm, 0.09, skinMaterial, 0, -0.51, 0); // 建立左手掌
rootGroup.add(leftArm); // 將左肩關節加入人物
const rightArm = new THREE.Group(); // 建立右肩關節群組
rightArm.position.set(0.25, 1.31, 0); // 將右手臂掛接在右肩位置
const rightArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 3, 7), shirtMaterial); // 使用膠囊建立右手臂
rightArmMesh.position.y = -0.25; // 將手臂從肩關節向下延伸
rightArmMesh.rotation.z = 0.12; // 讓手臂稍微自然外張
rightArmMesh.castShadow = true; // 讓右手臂投射陰影
rightArm.add(rightArmMesh); // 將膠囊手臂掛在右肩關節
sphere(rightArm, 0.09, skinMaterial, 0, -0.51, 0); // 建立右手掌
rootGroup.add(rightArm); // 將右肩關節加入人物
const leftLeg = new THREE.Group(); // 建立左髖關節群組
leftLeg.position.set(-0.12, 0.63, 0); // 將左腿掛接在左髖關節
const legMaterial = pantsMaterial; // 讓膠囊雙腿共用人物長褲材質
const leftLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.42, 3, 7), legMaterial); // 使用膠囊建立左腿
leftLegMesh.position.y = -0.3; // 將左腿從髖關節向下延伸
leftLegMesh.castShadow = true; // 讓左腿投射陰影
leftLeg.add(leftLegMesh); // 將膠囊左腿掛在左髖關節
box(leftLeg, 0.19, 0.12, 0.3, shoeMaterial, 0, -0.58, 0.055); // 建立左腳鞋子
rootGroup.add(leftLeg); // 將左髖關節加入人物
const rightLeg = new THREE.Group(); // 建立右髖關節群組
rightLeg.position.set(0.12, 0.63, 0); // 將右腿掛接在右髖關節
const rightLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.42, 3, 7), legMaterial); // 使用膠囊建立右腿
rightLegMesh.position.y = -0.3; // 將右腿從髖關節向下延伸
rightLegMesh.castShadow = true; // 讓右腿投射陰影
rightLeg.add(rightLegMesh); // 將膠囊右腿掛在右髖關節
box(rightLeg, 0.19, 0.12, 0.3, shoeMaterial, 0, -0.58, 0.055); // 建立右腳鞋子
rootGroup.add(rightLeg); // 將右髖關節加入人物
return { root: rootGroup, leftArm, rightArm, leftLeg, rightLeg, route: { x: params.x || 0, z: params.z || 0, range: params.range || 0.7, speed: params.speed || 2, phase: params.phase || 0 } }; // 回傳人物與四肢關節控制資料
} // 結束 Q 版人物建立函式
function animateWalk(chibi, time) { // 使用正弦波驅動人物手腳的交替步行
const phase = time * chibi.route.speed + chibi.route.phase; // 計算人物本影格的步行相位
const swing = Math.sin(phase) * 0.58; // 以正弦函式計算手腳前後擺動角度
chibi.leftArm.rotation.x = swing; // 讓左手配合右腿向前擺動
chibi.rightArm.rotation.x = -swing; // 讓右手配合左腿向前擺動
chibi.leftLeg.rotation.x = -swing; // 讓左腿與左手交錯前後擺動
chibi.rightLeg.rotation.x = swing; // 讓右腿與右手交錯前後擺動
chibi.root.position.x = chibi.route.x + Math.sin(phase) * chibi.route.range; // 讓人物沿路徑水平來回行走
chibi.root.position.z = chibi.route.z + Math.cos(phase) * chibi.route.range * 0.32; // 讓人物沿橢圓路徑稍微轉向
chibi.root.position.y = 0.84 + Math.abs(Math.sin(phase * 2)) * 0.035; // 加入輕微上下彈跳模擬腳步
chibi.root.rotation.y = Math.atan2(Math.cos(phase) * chibi.route.range, -Math.sin(phase) * chibi.route.range * 0.32); // 讓人物面向移動方向
} // 結束人物步行動畫
function addBikeBeam(parent, start, end, radius, material) { // 以圓柱連接腳踏車車架的端點
const direction = new THREE.Vector3().subVectors(end, start); // 計算車架管件的方向與長度
const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 6), material); // 建立低多邊形車架管件
beam.position.copy(start).add(end).multiplyScalar(0.5); // 將管件置於兩端點中央
beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); // 將圓柱旋轉至車架方向
beam.castShadow = true; // 讓車架投射柔和陰影
parent.add(beam); // 將管件加入腳踏車群組
return beam; // 回傳管件供後續調整
} // 結束腳踏車車架管件
function addCyclist(parent, x, z, options = {}) { // 建立沿主題島步道騎乘的低多邊形人物
const bicycle = new THREE.Group(); // 建立腳踏車與騎士的總群組
bicycle.position.set(x, 0.84, z); // 將腳踏車放置在島面步道
bicycle.scale.setScalar(options.scale || 0.82); // 縮小車輛與人物以符合島嶼比例
const frameMaterial = new THREE.MeshStandardMaterial({ color: options.frameColor || "#e9783f", roughness: 0.58, metalness: 0.18 }); // 建立亮色低多邊形車架材質
const tireMaterial = new THREE.MeshStandardMaterial({ color: "#354247", roughness: 0.9 }); // 建立深色車胎材質
const spokeMaterial = new THREE.MeshStandardMaterial({ color: "#d8d6ca", roughness: 0.62, metalness: 0.3 }); // 建立淺色輪圈與輻條材質
const wheels = []; // 儲存可旋轉的腳踏車輪組
[-0.62, 0.62].forEach((wheelZ) => { // 在車架前後安裝兩個車輪
const wheel = new THREE.Group(); // 建立單一車輪旋轉軸
wheel.position.set(0, 0.35, wheelZ); // 設定前後輪的輪軸位置
wheel.rotation.y = Math.PI / 2; // 將車輪平面轉為側向
const spin = new THREE.Group(); // 建立車輪內部的旋轉輻條群組
const tire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 5, 12), tireMaterial); // 建立多邊形橡膠輪胎
spin.add(tire); // 將輪胎加入旋轉群組
for (let spoke = 0; spoke < 6; spoke += 1) { const angle = spoke * Math.PI / 3; addBikeBeam(spin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(angle) * 0.26, Math.sin(angle) * 0.26, 0), 0.012, spokeMaterial); } // 為車輪安裝六根低多邊形輻條
wheel.add(spin); // 將輪胎與輻條裝到輪軸
const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6), metalMaterial); // 建立車輪中心輪軸
axle.rotation.x = Math.PI / 2; // 將輪軸沿車輪側向安裝
wheel.add(axle); // 將輪軸加入車輪
bicycle.add(wheel); // 將車輪固定在腳踏車群組
wheels.push(spin); // 記錄此輪供騎乘動畫轉動
}); // 結束前後車輪安裝
for (let side = -1; side <= 1; side += 2) { // 在車架左右兩側建立三角管架
const offset = side * 0.075; // 將左右側車架稍微分開
const rear = new THREE.Vector3(offset, 0.35, -0.62); // 設定後輪軸端點
const front = new THREE.Vector3(offset, 0.35, 0.62); // 設定前輪軸端點
const crank = new THREE.Vector3(offset, 0.43, -0.03); // 設定腳踏曲柄軸端點
const seat = new THREE.Vector3(offset, 0.78, -0.27); // 設定座墊支架端點
const handle = new THREE.Vector3(offset, 0.78, 0.34); // 設定把手支架端點
addBikeBeam(bicycle, rear, crank, 0.035, frameMaterial); // 連接後輪與曲柄
addBikeBeam(bicycle, crank, seat, 0.035, frameMaterial); // 連接曲柄與座墊
addBikeBeam(bicycle, seat, rear, 0.035, frameMaterial); // 連接座墊與後輪
addBikeBeam(bicycle, seat, handle, 0.035, frameMaterial); // 連接座墊與把手
addBikeBeam(bicycle, handle, front, 0.035, frameMaterial); // 連接把手與前輪
addBikeBeam(bicycle, front, crank, 0.035, frameMaterial); // 連接前輪與曲柄
addBikeBeam(bicycle, crank, rear, 0.035, frameMaterial); // 補上車架下管
} // 結束左右側車架組裝
box(bicycle, 0.34, 0.07, 0.18, woodMaterial, 0, 0.82, -0.27); // 安裝深色腳踏車座墊
box(bicycle, 0.46, 0.06, 0.06, metalMaterial, 0, 0.84, 0.37); // 安裝寬把手與握把
const rider = makeChibi({ shirtColor: options.shirtColor || "#e97866", hairColor: options.hairColor || "#49352c", helmet: true, helmetColor: options.helmetColor || "#ffd45c", scale: 0.48, range: 0 }); // 建立配戴安全帽的 Q 版騎士
rider.root.position.set(0, 0.27, 0.06); // 將騎士調整至座墊上方的坐姿
rider.root.rotation.x = -0.08; // 讓騎士上身稍微前傾
rider.leftArm.rotation.x = -0.72; // 將左手伸向腳踏車把手
rider.rightArm.rotation.x = -0.72; // 將右手伸向腳踏車把手
bicycle.add(rider.root); // 將騎士加入腳踏車群組
parent.add(bicycle); // 將腳踏車與騎士加入主題島
cyclists.push({ root: bicycle, rider, wheels, route: { x, z, range: options.range || 0.28, speed: options.speed || 1.25, phase: options.phase || Math.random() * Math.PI * 2 } }); // 記錄騎士路線與動畫狀態
} // 結束腳踏車騎士建立
function animateCyclist(cyclist, time) { // 更新騎士繞行步道與踩踏動作
const phase = time * cyclist.route.speed + cyclist.route.phase; // 計算騎乘動畫相位
cyclist.root.position.x = cyclist.route.x + Math.sin(phase) * cyclist.route.range; // 沿步道作小幅水平繞行
cyclist.root.position.z = cyclist.route.z + Math.cos(phase) * cyclist.route.range * 0.28; // 沿橢圓路徑維持在道路附近
cyclist.root.rotation.y = Math.atan2(Math.cos(phase), -Math.sin(phase) * 0.28); // 讓車頭持續朝向移動方向
cyclist.wheels.forEach((wheel) => { wheel.rotation.z = phase * 2.4; }); // 轉動腳踏車前後輪
cyclist.rider.leftLeg.rotation.x = 0.62 + Math.sin(phase * 2) * 0.42; // 驅動騎士左腿踩踏踏板
cyclist.rider.rightLeg.rotation.x = 0.62 - Math.sin(phase * 2) * 0.42; // 驅動騎士右腿交替踩踏踏板
} // 結束腳踏車騎乘動畫
function addWalkers(parent, people) { // 將一組行人加入主題島並啟用行走動畫
people.forEach((person) => { // 依序建立這座島上的人物
const chibi = makeChibi({ ...person, phase: person.phase || Math.random() * Math.PI * 2 }); // 依外觀參數建立 Q 版人物
parent.add(chibi.root); // 將人物根群組加入所屬主題島
walkers.push(chibi); // 將人物加入動畫更新清單
}); // 結束主題島人物配置
} // 結束主題島行人配置
function attachPetCompanion(chibi, type) { // 依照玩家選擇建立跟隨的小動物
if (!type || type === "none") { return; } // 選擇不帶寵物時不建立動物
const companion = new THREE.Group(); // 建立可隨玩家移動的小動物群組
companion.position.set(-0.48, 0, -0.12); // 將小動物安排在玩家身旁
const furColor = type === "cat" ? "#d99b68" : type === "rabbit" ? "#eee5d3" : "#b77a4f"; // 依照動物類型選擇毛色
const furMaterial = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.92 }); // 建立柔和的動物毛色材質
const faceMaterial = new THREE.MeshStandardMaterial({ color: "#3d3431", roughness: 0.7 }); // 建立動物眼睛與鼻子的深色材質
sphere(companion, 0.22, furMaterial, 0, 0.48, 0); // 建立小動物圓潤身體
sphere(companion, 0.18, furMaterial, 0, 0.76, 0.14); // 建立小動物圓頭
for (let side = -1; side <= 1; side += 2) { sphere(companion, 0.035, faceMaterial, side * 0.07, 0.79, 0.29); } // 在動物臉部點上眼睛
sphere(companion, 0.035, faceMaterial, 0, 0.72, 0.31); // 建立小動物鼻子
for (let side = -1; side <= 1; side += 2) { cylinder(companion, 0.045, 0.06, 0.28, furMaterial, side * 0.12, 0.19, 0.02, 5); } // 建立小動物前腿
if (type === "rabbit") { for (let side = -1; side <= 1; side += 2) { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 3, 6), furMaterial); ear.position.set(side * 0.09, 1.04, 0.12); ear.rotation.z = side * 0.14; companion.add(ear); } } // 為兔子加上長耳朵
else if (type === "cat") { for (let side = -1; side <= 1; side += 2) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 5), furMaterial); ear.position.set(side * 0.12, 0.94, 0.11); companion.add(ear); } } // 為小貓加上尖耳朵
else { sphere(companion, 0.095, furMaterial, -0.15, 0.77, -0.02); sphere(companion, 0.095, furMaterial, 0.15, 0.77, -0.02); } // 為小狗加上垂耳
chibi.root.add(companion); // 將小動物掛在玩家身旁並隨行移動
} // 結束跟隨小動物建立
const platformPositions = [[-13, 8], [13, 8], [0, 0], [-13, -8], [13, -8]]; // 將放大的主題島疏朗環繞中央科技島配置
const platforms = []; // 建立平台群組清單供橋樑連接使用
platformPositions.forEach((position, index) => { // 依序建立五座浮島平台
const platform = new THREE.Group(); // 建立單座平台的物件群組
platform.position.set(position[0], 0, position[1]); // 設定平台在水面上的位置
const base = box(platform, platformSize, platformHeight, platformSize, platformMaterial, 0, 0.32, 0); // 建立放大後厚實的方形平台基座
base.castShadow = true; // 讓平台基座投射柔和陰影
box(platform, platformSize - 0.16, 0.12, platformSize - 0.16, deckMaterial, 0, 0.72, 0); // 建立平台頂部人行邊框
addStripeSide(platform, Math.PI); // 在攝影機可見的正面貼上黃黑斜紋
addStripeSide(platform, -Math.PI / 2); // 在攝影機可見的右側貼上黃黑斜紋
if (index === 0) { addPark(platform); addWalkers(platform, [{ x: -0.9, z: -2.0, shirtColor: "#e97866", hairColor: "#4b3427", backpack: true, range: 0.55 }, { x: 1.0, z: 2.0, shirtColor: "#638fcb", hairColor: "#47362b", range: 0.5 }, { x: 2.0, z: -1.6, shirtColor: "#d8a64d", hairColor: "#352b27", helmet: true, helmetColor: "#f4cc55", range: 0.48 }]); addCyclist(platform, 0, 2.65, { frameColor: "#e9783f", shirtColor: "#62a877", range: 0.26, phase: 0.3 }); } // 在公園步道配置散步遊客與騎單車訪客
if (index === 1) { addModernCity(platform); addWalkers(platform, [{ x: 0, z: -2.05, shirtColor: "#4877bb", hairColor: "#342c2b", backpack: true, range: 0.5 }, { x: 2.1, z: 0.1, shirtColor: "#df805f", hairColor: "#513528", range: 0.46 }]); addCyclist(platform, 0, 2.65, { frameColor: "#e9783f", shirtColor: "#4877bb", range: 0.26, phase: 1.8 }); } // 在東北城市大道配置行人與騎士
if (index === 2) { addModernCity(platform, true); addWalkers(platform, [{ x: 0, z: -2.2, shirtColor: "#49b8d0", hairColor: "#302d36", helmet: true, helmetColor: "#56e4ee", backpack: true, range: 0.45 }, { x: 2.1, z: 0.1, shirtColor: "#8274d0", hairColor: "#3b2e35", range: 0.45 }, { x: -2.1, z: 0, shirtColor: "#54aeb5", hairColor: "#3e3028", helmet: true, helmetColor: "#f2cb51", range: 0.42 }]); addCyclist(platform, 0, 2.65, { frameColor: "#55d8dc", shirtColor: "#49b8d0", helmetColor: "#56e4ee", range: 0.24, phase: 2.5 }); } // 在科技城大道配置工程師與騎士
if (index === 3) { addModernCity(platform); addWalkers(platform, [{ x: -0.1, z: -2.1, shirtColor: "#a26ac0", hairColor: "#42312b", backpack: true, range: 0.48 }, { x: 2.0, z: 0, shirtColor: "#4e9bb1", hairColor: "#3e2e26", range: 0.45 }]); addCyclist(platform, 0, 2.65, { frameColor: "#d98a54", shirtColor: "#a26ac0", range: 0.26, phase: 3.2 }); } // 在西南城市大道配置行人與騎士
if (index === 4) { addCountryside(platform); addWalkers(platform, [{ x: -1.7, z: 1.25, shirtColor: "#6d9d5a", hairColor: "#473327", backpack: true, range: 0.45 }, { x: 1.2, z: 1.9, shirtColor: "#bd7951", hairColor: "#5b402e", helmet: true, helmetColor: "#e9c35b", range: 0.42 }]); addCyclist(platform, 0, -0.1, { frameColor: "#77a950", shirtColor: "#6d9d5a", range: 0.24, phase: 4.1 }); } // 在東南鄉村石子路配置村民與騎士
addWalkSurface(platform, platformSize - 0.18, platformSize - 0.18, 0.84, { islandIndex: index }); // 在每座島面鋪設玩家可走動的透明地板
scene.add(platform); // 將平台加入場景
platforms.push(platform); // 儲存平台以供後續架設橋樑
}); // 結束五座平台的建立
const stampDefinitions = [ // 設定五座島各自的集章位置與地點說明
{ island: 0, x: 0, z: 0, name: "公園花園", description: "走進中央花園，欣賞花圃與公園步道。" }, // 設定公園中心集章點
{ island: 1, x: 0, z: 0, name: "城市十字街", description: "來到現代城市的街道交會處，看看繁忙街景。" }, // 設定東北城市集章點
{ island: 2, x: 0, z: 4.2, name: "科技能量站", description: "抵達科技城南側道路，探索未來城市。" }, // 設定中央科技城集章點
{ island: 3, x: 0, z: 0, name: "都會廣場", description: "漫步西南都會廣場，感受雙城生活。" }, // 設定西南城市集章點
{ island: 4, x: 4, z: 0, name: "鄉村農園", description: "來到鄉村農園，感受田野與農舍的悠閒。" } // 設定東南鄉村集章點
]; // 結束五個集章地點設定
stampDefinitions.forEach((definition, index) => { // 依序在各主題島面放置集章圓圈
const platform = platforms[definition.island]; // 取得集章點所屬平台
const marker = new THREE.Mesh(new THREE.CircleGeometry(0.82, 40), new THREE.MeshBasicMaterial({ color: "#f28a36", transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide })); // 建立醒目的橘色地面集章圈
marker.rotation.x = -Math.PI / 2; // 將集章圈平放在島面
marker.position.set(definition.x, 0.875, definition.z); // 將集章圈略微抬高避免與地面重疊
platform.add(marker); // 將集章圈加入所屬平台
stamps.push({ id: String(index + 1).padStart(2, "0"), name: definition.name, description: definition.description, x: platform.position.x + definition.x, z: platform.position.z + definition.z, radius: 0.82, mesh: marker, collected: false }); // 儲存集章資料與世界座標
}); // 結束集章圓圈建立
function addBridge(startIndex, endIndex) { // 在兩座平台之間建立帶欄杆的橋
const start = platforms[startIndex].position; // 取得起點平台中心
const end = platforms[endIndex].position; // 取得終點平台中心
const dx = end.x - start.x; // 計算橋樑的水平位移
const dz = end.z - start.z; // 計算橋樑的縱向位移
const length = Math.sqrt(dx * dx + dz * dz) - platformSize + 0.7; // 計算放大後兩座平台之間的橋面長度
const angle = Math.atan2(-dz, dx); // 計算橋樑沿本地 X 軸的旋轉角度
const bridge = new THREE.Group(); // 建立橋樑群組
bridge.position.set((start.x + end.x) / 2, 0.88, (start.z + end.z) / 2); // 將橋放在放大後的兩座平台之間
bridge.rotation.y = angle; // 讓橋面對準兩座平台
box(bridge, length, 0.18, 1.4, woodMaterial, 0, 0, 0); // 建立寬敞的木質橋面
addWalkSurface(bridge, length, 1.32, 0.1, { bridgeIndex: bridgeRoutes.length }); // 在橋面鋪設玩家可走動的透明地板
for (let side = -1; side <= 1; side += 2) { // 在橋面兩側架設黃色護欄
box(bridge, length, 0.14, 0.1, yellowMaterial, 0, 0.93, side * 0.65); // 建立橋樑上方的黃色扶手
for (let post = -1; post <= 1; post += 1) { // 沿橋面均勻排列欄杆立柱
box(bridge, 0.12, 0.68, 0.12, yellowMaterial, post * length * 0.38, 0.52, side * 0.65); // 建立加高的黃色護欄立柱
} // 結束單側欄杆立柱排列
} // 結束橋樑兩側護欄
scene.add(bridge); // 將橋樑加入場景
bridgeRoutes.push({ startIndex, endIndex, position: bridge.position.clone(), angle, length }); // 儲存橋樑端點供玩家跨島尋路
} // 結束橋樑建立函式
addBridge(0, 2); // 以中央科技島連接西北公園
addBridge(1, 2); // 以中央科技島連接東北城市
addBridge(2, 3); // 以中央科技島連接西南城市
addBridge(2, 4); // 以中央科技島連接東南鄉村
configurePlayer({ shirtColor: "#4c9f9b", hairColor: "#49352c", hairStyle: "short", scale: 0.72, pet: "none" }); // 建立初始進入者供設定面板套用造型
function findIslandIndex(x, z) { // 判斷世界座標位於哪一座島面
return platforms.findIndex((platform) => Math.abs(x - platform.position.x) <= platformSize / 2 - 0.18 && Math.abs(z - platform.position.z) <= platformSize / 2 - 0.18); // 回傳所在平台索引或未命中時的負一
} // 結束島面位置判斷
function findNearestIslandIndex(x, z) { // 找出距離指定座標最近的島嶼
return platforms.reduce((closest, platform, index) => { const current = platforms[closest].position.distanceToSquared(new THREE.Vector3(x, 0, z)); const candidate = platform.position.distanceToSquared(new THREE.Vector3(x, 0, z)); return candidate < current ? index : closest; }, 0); // 回傳最接近的島嶼索引
} // 結束最近島嶼搜尋
function getBridgeBetween(startIndex, endIndex) { // 查詢連接兩座島嶼的橋樑
return bridgeRoutes.find((bridge) => (bridge.startIndex === startIndex && bridge.endIndex === endIndex) || (bridge.startIndex === endIndex && bridge.endIndex === startIndex)); // 回傳符合端點的橋樑路線
} // 結束橋樑查詢
function isOnBridge(x, z, bridge) { // 判斷指定座標是否位於橋面內
const dx = x - bridge.position.x; // 計算座標相對橋中心的水平位移
const dz = z - bridge.position.z; // 計算座標相對橋中心的縱向位移
const localX = Math.cos(bridge.angle) * dx - Math.sin(bridge.angle) * dz; // 將座標轉換成橋面長度方向
const localZ = Math.sin(bridge.angle) * dx + Math.cos(bridge.angle) * dz; // 將座標轉換成橋面寬度方向
return Math.abs(localX) <= bridge.length / 2 + 0.1 && Math.abs(localZ) <= 0.68; // 檢查座標是否落在橋面範圍
} // 結束橋面範圍判斷
function isWalkable(x, z) { // 限制玩家只在五座平台與連接橋上移動
if (findIslandIndex(x, z) >= 0) { return true; } // 允許玩家在任一島面行走
return bridgeRoutes.some((bridge) => isOnBridge(x, z, bridge)); // 允許玩家在任一橋面行走
} // 結束可行走範圍判斷
function collidesWithObstacle(x, z) { // 檢查玩家是否進入樹木或建築的碰撞範圍
const playerRadius = 0.22; // 為玩家預留合理的身體寬度
return obstacles.some((obstacle) => { // 逐一檢查已註冊的障礙物
const local = obstacle.parent.worldToLocal(new THREE.Vector3(x, 0, z)); // 將玩家世界座標轉換成障礙物父群組的本地座標
if (obstacle.type === "circle") { return Math.hypot(local.x - obstacle.x, local.z - obstacle.z) < obstacle.radius + playerRadius; } // 以圓形範圍阻擋樹木
return Math.abs(local.x - obstacle.x) < obstacle.halfWidth + playerRadius && Math.abs(local.z - obstacle.z) < obstacle.halfDepth + playerRadius; // 以矩形範圍阻擋建築
}); // 結束障礙物逐一檢查
} // 結束障礙物碰撞檢查
function canOccupy(x, z) { // 同時限制玩家位於可走地面且不穿越障礙物
return isWalkable(x, z) && !collidesWithObstacle(x, z); // 回傳目前位置是否可安全站立
} // 結束玩家位置檢查
function resolvePlayerMove(dx, dz) { // 嘗試完整移動並在碰撞時沿障礙物邊緣滑行
const startX = player.root.position.x; // 保存本次移動起始水平位置
const startZ = player.root.position.z; // 保存本次移動起始縱向位置
if (canOccupy(startX + dx, startZ + dz)) { return { x: dx, z: dz }; } // 無障礙時直接接受完整移動
if (canOccupy(startX + dx, startZ)) { return { x: dx, z: 0 }; } // 碰撞時先沿水平切線滑過障礙
if (canOccupy(startX, startZ + dz)) { return { x: 0, z: dz }; } // 水平受阻時改沿縱向切線滑行
return { x: 0, z: 0 }; // 兩個方向均受阻時停留在原地
} // 結束沿障礙物邊緣滑行
function getWalkHeight(x, z) { // 依所在表面取得玩家腳下高度
const bridge = bridgeRoutes.find((route) => isOnBridge(x, z, route)); // 優先判斷是否位於高於島面的橋面
return bridge ? bridge.position.y + 0.1 : 0.84; // 回傳橋面或島面的行走高度
} // 結束行走高度查詢
function disposePlayerModel(rootGroup) { // 釋放替換角色時不再使用的模型資源
rootGroup.traverse((part) => { if (!part.isMesh) { return; } part.geometry.dispose(); const materials = Array.isArray(part.material) ? part.material : [part.material]; materials.forEach((material) => { if (material !== yellowMaterial) { material.dispose(); } }); }); // 釋放幾何與角色專用材質但保留共用材質
} // 結束角色資源釋放
function configurePlayer(params = {}) { // 建立或更新進入者外觀並保留目前位置
const x = player ? player.root.position.x : 0; // 取得既有玩家水平位置或使用中央島預設位置
const z = player ? player.root.position.z : 2.1; // 取得既有玩家縱向位置或使用中央島道路預設位置
if (player) { scene.remove(player.root); disposePlayerModel(player.root); } // 移除舊人物並釋放其專用資源
player = makeChibi({ ...params, x, z, scale: 0.72, range: 0 }); // 依照設定建立固定比例的玩家人物
player.root.position.y = getWalkHeight(x, z); // 將新人物放在目前地面高度
scene.add(player.root); // 將進入者加入場景
attachPetCompanion(player, params.pet); // 按照玩家選擇加入同行小動物
playerRoute.length = 0; // 清除造型更新前的自動移動路線
playerKeyboardMoving = false; // 停止造型更新前的方向鍵行走狀態
return true; // 回報角色建立完成
} // 結束進入者建立與更新
function queuePlayerDestination(destination, destinationIsland) { // 建立玩家前往指定島面的橋樑路線
const currentIsland = findIslandIndex(player.root.position.x, player.root.position.z); // 判斷玩家目前所在平台
const startIsland = currentIsland >= 0 ? currentIsland : findNearestIslandIndex(player.root.position.x, player.root.position.z); // 在橋上時改用最近島嶼作為路徑起點
playerRoute.length = 0; // 清除上一個點選目的地
if (startIsland !== destinationIsland) { if (startIsland !== 2) { const firstBridge = getBridgeBetween(startIsland, 2); if (firstBridge) { playerRoute.push(new THREE.Vector3(firstBridge.position.x, firstBridge.position.y + 0.1, firstBridge.position.z)); } } if (destinationIsland !== 2) { const lastBridge = getBridgeBetween(2, destinationIsland); if (lastBridge) { playerRoute.push(new THREE.Vector3(lastBridge.position.x, lastBridge.position.y + 0.1, lastBridge.position.z)); } } } // 依中央科技島樞紐安排跨島橋樑路線
playerRoute.push(destination); // 加入滑鼠點選的最後目的地
playerKeyboardMoving = false; // 停止方向鍵移動並開始自動走向新目的地
return true; // 回報已成功設定目的地
} // 結束玩家跨島路線建立
function setPlayerDestination(screenX, screenY) { // 將滑鼠點選座標轉成島面上的玩家目的地
if (!player) { return false; } // 玩家尚未建立時不接受移動指令
const pointer = new THREE.Vector2((screenX / window.innerWidth) * 2 - 1, 1 - (screenY / window.innerHeight) * 2); // 將畫面座標轉換成正規化裝置座標
playerRaycaster.setFromCamera(pointer, camera); // 從攝影機向滑鼠位置發射射線
const hits = playerRaycaster.intersectObjects(walkSurfaceMeshes, false); // 僅檢測透明島面與橋面
if (hits.length === 0) { return false; } // 點選海面或畫面空處時不移動玩家
const hit = hits[0]; // 取得最近的可行走表面交點
const destination = new THREE.Vector3(hit.point.x, getWalkHeight(hit.point.x, hit.point.z), hit.point.z); // 建立地面高度正確的目的地
let destinationIsland = hit.object.userData.islandIndex; // 取得點選的平台索引
const currentIsland = findIslandIndex(player.root.position.x, player.root.position.z); // 判斷玩家目前所在平台
const startIsland = currentIsland >= 0 ? currentIsland : findNearestIslandIndex(player.root.position.x, player.root.position.z); // 在橋上時改用最近島嶼作為路徑起點
if (destinationIsland === undefined) { const bridge = bridgeRoutes[hit.object.userData.bridgeIndex]; const otherEnd = bridge.startIndex === startIsland ? bridge.endIndex : bridge.startIndex; destinationIsland = otherEnd; } // 點選橋面時將橋的另一端視為目的島
return queuePlayerDestination(destination, destinationIsland); // 依中央樞紐規劃路線並開始移動
} // 結束滑鼠點選移動路線
function movePlayerToWorld(x, z) { // 讓角色移動至指定的島面座標
if (!player) { return false; } // 玩家尚未建立時不接受移動指令
const destinationIsland = findIslandIndex(x, z); // 確認目標位於其中一座平台
if (destinationIsland < 0) { return false; } // 拒絕平台以外的世界座標
return queuePlayerDestination(new THREE.Vector3(x, getWalkHeight(x, z), z), destinationIsland); // 依照所屬島嶼安排安全路線
} // 結束世界座標移動
function movePlayerWithKeys(horizontal, vertical, seconds) { // 依照方向鍵在攝影機相對方向移動玩家
if (!player) { return; } // 玩家尚未建立時忽略方向鍵
if (horizontal === 0 && vertical === 0) { playerKeyboardMoving = false; return; } // 沒有方向輸入時停止步行動畫
playerRoute.length = 0; // 方向鍵操作時取消自動尋路
const length = Math.hypot(horizontal, vertical); // 正規化斜向移動速度
const rightX = Math.sin(cameraAngle); // 計算攝影機畫面右方的世界水平向量
const rightZ = -Math.cos(cameraAngle); // 計算攝影機畫面右方的世界縱向向量
const forwardX = Math.cos(cameraAngle); // 計算攝影機畫面上方的世界水平向量
const forwardZ = Math.sin(cameraAngle); // 計算攝影機畫面上方的世界縱向向量
const dx = (horizontal * rightX + vertical * forwardX) / length; // 計算玩家水平移動方向
const dz = (horizontal * rightZ + vertical * forwardZ) / length; // 計算玩家縱向移動方向
const distance = 3.2 * seconds; // 依照時間計算本影格的行走距離
playerKeyboardMoving = false; // 先清除前一影格的方向鍵行走狀態
const movement = resolvePlayerMove(dx * distance, dz * distance); // 在平台與橋面內嘗試移動並處理障礙滑行
if (movement.x !== 0 || movement.z !== 0) { player.root.position.x += movement.x; player.root.position.z += movement.z; player.root.rotation.y = Math.atan2(movement.x, movement.z); playerKeyboardMoving = true; } // 套用安全位移並讓角色面向實際移動方向
} // 結束方向鍵玩家移動
function animatePlayer(delta, time) { // 推進玩家自動路線並播放步行姿勢
if (!player) { return; } // 玩家尚未建立時略過動畫
if (playerRoute.length > 0) { const waypoint = playerRoute[0]; const dx = waypoint.x - player.root.position.x; const dz = waypoint.z - player.root.position.z; const distance = Math.hypot(dx, dz); const step = 3.2 * delta; if (distance <= step && canOccupy(waypoint.x, waypoint.z)) { player.root.position.x = waypoint.x; player.root.position.z = waypoint.z; playerRoute.shift(); } else if (distance > 0.001) { const movement = resolvePlayerMove(dx / distance * step, dz / distance * step); if (movement.x !== 0 || movement.z !== 0) { player.root.position.x += movement.x; player.root.position.z += movement.z; player.root.rotation.y = Math.atan2(movement.x, movement.z); } else { playerRoute.length = 0; } } } // 依序沿橋面路線移動並在障礙邊緣滑行
const walking = playerKeyboardMoving || playerRoute.length > 0; // 判斷角色目前是否正在行走
const swing = walking ? Math.sin(time * 8) * 0.58 : 0; // 計算走路時手腳的交替擺動角度
player.leftArm.rotation.x = swing; // 擺動玩家左手
player.rightArm.rotation.x = -swing; // 擺動玩家右手
player.leftLeg.rotation.x = -swing; // 擺動玩家左腳
player.rightLeg.rotation.x = swing; // 擺動玩家右腳
player.root.position.y = getWalkHeight(player.root.position.x, player.root.position.z) + (walking ? Math.abs(Math.sin(time * 16)) * 0.025 : 0); // 設定玩家地面高度與步行彈跳
} // 結束玩家路徑與步行動畫
function updateCamera() { // 依照目前角度與距離更新攝影機
cameraHeight = THREE.MathUtils.clamp(cameraHeight, cameraMinHeight, 30); // 每次更新都將鏡頭高度限制在水面與平台上方
camera.position.set(orbitCenter.x + Math.cos(cameraAngle) * 21, cameraHeight, orbitCenter.z + Math.sin(cameraAngle) * 21); // 以中央島為水平旋轉軸心並調整俯視高度
camera.lookAt(target); // 讓攝影機始終注視場景中心
camera.zoom = cameraZoom; // 將縮放比例套用到正交攝影機視野
const aspect = window.innerWidth / window.innerHeight; // 取得視窗寬高比例
const viewHeight = 40; // 以正交攝影機呈現分散配置的五座主題島
camera.left = (-viewHeight * aspect) / 2; // 設定正交視野左界
camera.right = (viewHeight * aspect) / 2; // 設定正交視野右界
camera.top = viewHeight / 2; // 設定正交視野上界
camera.bottom = -viewHeight / 2; // 設定正交視野下界
camera.updateProjectionMatrix(); // 更新攝影機投影矩陣
} // 結束攝影機更新函式
updateCamera(); // 套用初始攝影機位置
window.sceneControls = { // 提供 p5.js 介面使用的場景控制方法
orbit: (delta) => { cameraAngle += delta; updateCamera(); }, // 依照拖曳量旋轉俯視角度
zoom: (amount) => { cameraZoom = THREE.MathUtils.clamp(cameraZoom - amount, 0.4, 3.0); updateCamera(); }, // 以正交攝影機縮放比例調整觀看遠近
pan: (pixels) => { const distance = pixels * 40 / (window.innerHeight * cameraZoom); cameraFollowOffset.x = THREE.MathUtils.clamp(cameraFollowOffset.x - Math.sin(cameraAngle) * distance, -30, 30); cameraFollowOffset.z = THREE.MathUtils.clamp(cameraFollowOffset.z + Math.cos(cameraAngle) * distance, -30, 30); updateCamera(); }, // 依照水平拖曳調整跟隨鏡頭偏移
tilt: (amount) => { cameraHeight = THREE.MathUtils.clamp(cameraHeight + amount, cameraMinHeight, 30); updateCamera(); }, // 依照垂直拖曳升降攝影機且不低於水面安全高度
reset: () => { cameraAngle = Math.PI / 4; cameraZoom = 0.95; cameraHeight = 17; cameraFollowOffset.set(0, 0, 0); target.copy(orbitCenter); updateCamera(); }, // 將攝影機恢復中央島旋轉軸心、高度與縮放
configurePlayer, // 提供角色設定介面更新進入者外觀的方法
movePlayerTo: setPlayerDestination, // 提供滑鼠點選地面設定玩家目的地的方法
movePlayerToWorld, // 提供集章標籤使用島面座標設定玩家目的地
walkPlayer: movePlayerWithKeys, // 提供方向鍵控制玩家移動的方法
getPlayerPosition: () => player ? { x: player.root.position.x, z: player.root.position.z } : null, // 提供玩家目前世界座標供集章判斷
getStamps: () => stamps.map(({ id, name, description, x, z, collected }) => ({ id, name, description, x, z, collected })), // 提供集章名稱與位置供 p5.js 介面繪製
setStampCollected: (index) => { const stamp = stamps[index]; if (!stamp || stamp.collected) { return false; } stamp.collected = true; stamp.mesh.material.color.set("#42a66c"); return true; }, // 將集章地面圓圈改為綠色
update: (delta, time) => { const frameDelta = Math.min(Math.max(delta, 0), 0.05); walkers.forEach((walker) => animateWalk(walker, time)); cyclists.forEach((cyclist) => animateCyclist(cyclist, time)); animatePlayer(frameDelta, time); if (player) { const smoothing = 1 - Math.exp(-frameDelta * 4.5); target.x += (player.root.position.x + cameraFollowOffset.x - target.x) * smoothing; target.z += (player.root.position.z + cameraFollowOffset.z - target.z) * smoothing; } updateCamera(); renderer.render(scene, camera); }, // 由 p5.js 主迴圈更新行人、騎士、玩家、跟隨鏡頭與 three.js 畫面
projectPlayer: () => { if (!player) { return null; } const point = new THREE.Vector3(player.root.position.x, player.root.position.y + 1.55, player.root.position.z).project(camera); return { x: (point.x + 1) * window.innerWidth / 2, y: (1 - point.y) * window.innerHeight / 2, visible: point.z > -1 && point.z < 1 }; }, // 將玩家頭頂位置投影供姓名標籤使用
project: (x, y, z) => { const point = new THREE.Vector3(x, y, z).project(camera); return { x: (point.x + 1) * window.innerWidth / 2, y: (1 - point.y) * window.innerHeight / 2, visible: point.z > -1 && point.z < 1 }; } // 將浮島世界座標投影至 p5.js 畫布
}; // 結束介面控制方法設定
window.dispatchEvent(new Event("scene-ready")); // 通知 p5.js 介面 three.js 玩家控制已就緒
function resize() { // 依照瀏覽器視窗尺寸調整繪圖器
renderer.setSize(window.innerWidth, window.innerHeight); // 更新 WebGL 畫布尺寸
updateCamera(); // 同步更新正交攝影機比例
} // 結束視窗尺寸調整函式
window.addEventListener("resize", resize); // 在視窗尺寸改變時重新排版場景
resize(); // 套用初始畫布尺寸
