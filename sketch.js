const islandSketch = (p) => { // 將全部介面與操作封裝在 p5.js 實例模式中
let dragActive = false; // 記錄目前是否正在拖曳操作場景
let rotationMode = true; // 預設讓水平拖曳環繞場景
let previousPointerX = 0; // 記錄上一影格的滑鼠水平位置
let previousPointerY = 0; // 記錄上一影格的滑鼠垂直位置
let dragStartedOnControls = false; // 避免控制卡點擊同時下達角色移動命令
let didDrag = false; // 區分移動滑鼠與點選地面
let pointerStartX = 0; // 記錄滑鼠按下時的水平位置
let pointerStartY = 0; // 記錄滑鼠按下時的垂直位置
let playerReady = false; // 記錄進入者是否已完成設定
let hasSavedPlayerProfile = false; // 記錄是否成功保存過進入者資料
let playerProfile = { name: "旅人", pet: "none", outfit: "casual", hairStyle: "short", hairColor: "#49352c", helmet: false }; // 設定新玩家的預設角色資料
let avatarPanel; // 保存角色設定面板元素
let avatarToggle; // 保存角色設定切換按鈕元素
let avatarForm; // 保存角色設定表單元素
let avatarStatus; // 保存角色設定狀態訊息元素
let stamps = []; // 儲存場景提供的五個集章地點
let stampLabelHits = []; // 記錄各個集章膠囊標籤的滑鼠點擊區域
let lastStampDescription = ""; // 保存最近集章地點的說明文字
const islandLabels = [ // 建立對應五座浮島位置的地圖標籤
{ id: "01", title: "公園", x: -13, z: 8 }, // 標記西北側公園島
{ id: "02", title: "現代城市", x: 13, z: 8 }, // 標記東北側現代城市島
{ id: "03", title: "科技城", x: 0, z: 0 }, // 標記中央科技樞紐島
{ id: "04", title: "現代城市", x: -13, z: -8 }, // 標記西南側現代城市島
{ id: "05", title: "鄉村", x: 13, z: -8 } // 標記東南側鄉村島
]; // 結束浮島標籤資料
p.setup = () => { // 初始化 p5.js 實例與介面
p.createCanvas(p.windowWidth, p.windowHeight).parent("scene-root"); // 將 p5 畫布放在 3D 場景上方並交由此實例更新
p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2)); // 限制介面像素密度以維持效能
p.textFont("Microsoft JhengHei, sans-serif"); // 設定繁體中文介面字型
setupCanvasControls(); // 綁定位於畫布上方的可點擊控制熱區
setupAvatarSettings(); // 載入已保存的進入者資料並初始化設定面板
}; // 結束 p5.js 實例初始化
p.draw = () => { // 以 p5.js 作為介面與 3D 場景的主迴圈
p.clear(); // 清除介面畫布但保留透明背景以顯示 3D 場景
updatePlayerFromKeys(); // 讀取方向鍵並移動進入者
if (window.sceneControls && window.sceneControls.update) { window.sceneControls.update(p.deltaTime / 1000, p.millis() / 1000); } // 由 p5.js 主迴圈更新行人、玩家、鏡頭與 three.js 畫面
refreshStamps(); // 從 three.js 場景同步五個集章地點
updateStampCollection(); // 檢查玩家是否進入任一集章圓圈
refreshStamps(); // 同步本影格中剛完成的集章狀態
drawPanel(); // 繪製場景控制卡與左上集章進度
drawIslandTags(); // 將各島名稱貼合在其場景位置
drawStampLabels(); // 在集章圈上方繪製可點選的白色膠囊標籤
drawPlayerName(); // 在進入者頭頂繪製角色名稱
drawStampDescription(); // 在畫面下方顯示最近集章地點說明
drawHint(); // 顯示簡短的操作提示
}; // 結束 p5.js 主迴圈影格
function normalizePlayerProfile(profile) { // 驗證並整理從瀏覽器儲存區讀取的角色設定
const pets = ["none", "dog", "cat", "rabbit"]; // 列出可選擇的小動物類型
const outfits = ["casual", "traveler", "sport", "ranger"]; // 列出可選擇的服裝樣式
const hairstyles = ["short", "long", "spiky", "curly"]; // 列出可選擇的頭髮樣式
const hairColors = ["#49352c", "#26232c", "#b96e42", "#d6b75f"]; // 列出可選擇的頭髮顏色
return { name: typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 16) : "旅人", pet: pets.includes(profile.pet) ? profile.pet : "none", outfit: outfits.includes(profile.outfit) ? profile.outfit : "casual", hairStyle: hairstyles.includes(profile.hairStyle) ? profile.hairStyle : "short", hairColor: hairColors.includes(profile.hairColor) ? profile.hairColor : "#49352c", helmet: Boolean(profile.helmet) }; // 回傳欄位合法的角色資料
} // 結束角色資料驗證
function setupAvatarSettings() { // 初始化角色設定表單並載入上次登入的角色資料
avatarPanel = document.getElementById("avatar-panel"); // 取得角色設定面板
avatarToggle = document.getElementById("avatar-settings-toggle"); // 取得角色設定切換按鈕
avatarForm = document.getElementById("avatar-form"); // 取得角色設定表單
avatarStatus = document.getElementById("avatar-status"); // 取得設定狀態訊息區
hasSavedPlayerProfile = false; // 重設瀏覽器角色資料載入狀態
try { // 嘗試讀取本機已保存的角色資料
const savedProfile = window.localStorage.getItem("water-island-player"); // 讀取此遊戲專用的角色資料
if (savedProfile) { playerProfile = normalizePlayerProfile(JSON.parse(savedProfile)); hasSavedPlayerProfile = true; } // 驗證並套用上次的角色設定
} catch (error) { console.error("無法讀取已保存的角色設定：", error); avatarStatus.textContent = "無法讀取已保存設定，請重新儲存角色。"; } // 顯示本機資料讀取錯誤
avatarForm.elements.name.value = playerProfile.name; // 將角色名稱填入設定表單
avatarForm.elements.pet.value = playerProfile.pet; // 將上次選擇的小動物填入表單
avatarForm.elements.outfit.value = playerProfile.outfit; // 將上次選擇的服裝填入表單
avatarForm.elements.hairStyle.value = playerProfile.hairStyle; // 將上次選擇的髮型填入表單
avatarForm.elements.hairColor.value = playerProfile.hairColor; // 將上次選擇的髮色填入表單
avatarForm.elements.helmet.checked = playerProfile.helmet; // 還原上次的安全帽選擇
avatarPanel.hidden = false; // 進入群島時先顯示角色設定面板
avatarToggle.textContent = "收起設定"; // 顯示收起角色設定的按鈕文字
avatarToggle.addEventListener("click", () => { avatarPanel.hidden = !avatarPanel.hidden; avatarToggle.textContent = avatarPanel.hidden ? "角色設定" : "收起設定"; if (avatarPanel.hidden && document.activeElement) { document.activeElement.blur(); } }); // 開啟或收起角色設定面板
avatarForm.addEventListener("submit", (event) => { event.preventDefault(); savePlayerProfile(); }); // 保存設定後建立或更新進入者
playerReady = true; // 允許新進入者使用預設造型開始移動
if (window.sceneControls && window.sceneControls.configurePlayer) { applyPlayerProfile(); } else { window.addEventListener("scene-ready", applyPlayerProfile, { once: true }); } // 等待場景就緒後將資料套用到 3D 人物
} // 結束角色設定初始化
function setupCanvasControls() { // 讓透明 HTML 熱區可靠地操作 p5 繪製的場景按鈕
document.getElementById("orbit-control").addEventListener("click", () => { rotationMode = !rotationMode; }); // 切換旋轉與平移操作模式
document.getElementById("reset-control").addEventListener("click", () => { rotationMode = true; if (window.sceneControls) { window.sceneControls.reset(); } }); // 重設鏡頭並恢復旋轉模式
document.getElementById("zoom-out-control").addEventListener("click", () => { if (window.sceneControls) { window.sceneControls.zoom(0.15); } }); // 點擊縮小熱區縮小場景
document.getElementById("zoom-in-control").addEventListener("click", () => { if (window.sceneControls) { window.sceneControls.zoom(-0.15); } }); // 點擊放大熱區放大場景
} // 結束場景按鈕事件綁定
function applyPlayerProfile() { // 將表單選項轉換為 Q 版人物外觀參數
if (!window.sceneControls || !window.sceneControls.configurePlayer) { return; } // 等待 3D 場景建立玩家控制方法
const outfits = { casual: { shirtColor: "#4c9f9b", backpack: false }, traveler: { shirtColor: "#e97866", backpack: true, backpackColor: "#d78255" }, sport: { shirtColor: "#638fcb", backpack: false }, ranger: { shirtColor: "#6d9d5a", backpack: true, backpackColor: "#a16b42" } }; // 定義各服裝樣式的顏色與配件
window.sceneControls.configurePlayer({ ...outfits[playerProfile.outfit], name: playerProfile.name, pet: playerProfile.pet, hairStyle: playerProfile.hairStyle, hairColor: playerProfile.hairColor, helmet: playerProfile.helmet }); // 更新玩家模型與同行寵物
} // 結束角色外觀套用
function savePlayerProfile() { // 驗證、保存並套用角色設定
const formData = new FormData(avatarForm); // 讀取表單內的角色選項
const name = String(formData.get("name") || "").trim(); // 清除角色名稱前後空白
if (!name) { avatarStatus.textContent = "請先輸入角色名稱。"; avatarForm.elements.name.focus(); return; } // 阻止空白名稱並提示使用者
playerProfile = normalizePlayerProfile({ name, pet: formData.get("pet"), outfit: formData.get("outfit"), hairStyle: formData.get("hairStyle"), hairColor: formData.get("hairColor"), helmet: formData.has("helmet") }); // 驗證並保存目前表單選項
const wasSaved = hasSavedPlayerProfile; // 記錄本次保存前是否已有角色資料
try { window.localStorage.setItem("water-island-player", JSON.stringify(playerProfile)); } catch (error) { avatarStatus.textContent = "無法保存角色設定，請檢查瀏覽器儲存權限。"; console.error("無法保存角色設定：", error); return; } // 將角色資料持久保存於目前瀏覽器
hasSavedPlayerProfile = true; // 記錄本次角色資料已成功保存
playerReady = true; // 啟用方向鍵與點選移動
applyPlayerProfile(); // 立即更新人物造型與小動物
avatarStatus.textContent = wasSaved ? "角色設定已更新並保存。" : "角色已建立，歡迎進入群島！"; // 顯示角色設定保存結果
avatarPanel.hidden = true; // 保存後收起設定面板
avatarToggle.textContent = "角色設定"; // 更新設定按鈕文字
if (document.activeElement) { document.activeElement.blur(); } // 讓方向鍵能在設定完成後控制角色
} // 結束角色資料保存
function updatePlayerFromKeys() { // 依照方向鍵移動角色並交由場景換算斜視方向
if (!playerReady || !window.sceneControls || !window.sceneControls.walkPlayer) { return; } // 玩家或場景控制尚未就緒時略過鍵盤輸入
if (!avatarPanel.hidden) { window.sceneControls.walkPlayer(0, 0, 0); return; } // 設定面板開啟時暫停方向鍵行走
const focusedTag = document.activeElement ? document.activeElement.tagName : ""; // 取得目前焦點元素類型
if (focusedTag === "INPUT" || focusedTag === "SELECT" || focusedTag === "BUTTON") { window.sceneControls.walkPlayer(0, 0, 0); return; } // 不在輸入表單時才讀取方向鍵
const horizontal = (p.keyIsDown(p.RIGHT_ARROW) ? 1 : 0) - (p.keyIsDown(p.LEFT_ARROW) ? 1 : 0); // 將左右方向鍵轉成水平移動方向
const vertical = (p.keyIsDown(p.UP_ARROW) ? 1 : 0) - (p.keyIsDown(p.DOWN_ARROW) ? 1 : 0); // 將上下方向鍵轉成垂直移動方向
window.sceneControls.walkPlayer(horizontal, vertical, Math.min(p.deltaTime / 1000, 0.05)); // 依影格時間交由 three.js 換算斜視方向並移動
} // 結束方向鍵控制
function refreshStamps() { // 取得五座島的集章資料與最新顏色狀態
if (window.sceneControls && window.sceneControls.getStamps) { stamps = window.sceneControls.getStamps(); } // 從 three.js 場景同步地點與集章狀態
} // 結束集章資料同步
function updateStampCollection() { // 玩家走進橘色圓圈時完成該地點集章
if (!playerReady || !window.sceneControls || !window.sceneControls.getPlayerPosition) { return; } // 玩家場景資料尚未就緒時略過檢查
const position = window.sceneControls.getPlayerPosition(); // 取得進入者目前世界座標
if (!position) { return; } // 玩家模型尚未建立時略過檢查
stamps.forEach((stamp, index) => { // 逐一檢查尚未完成的集章點
if (stamp.collected || Math.hypot(position.x - stamp.x, position.z - stamp.z) > 0.92) { return; } // 角色未踏入圓圈或已集章時不處理
if (window.sceneControls.setStampCollected(index)) { lastStampDescription = stamp.description; } // 將場景圓圈改綠並顯示地點說明
}); // 結束集章範圍檢查
} // 結束玩家集章判斷
function drawStampLabels() { // 在五個集章圈上方繪製可互動白色膠囊標籤
if (!window.sceneControls || !window.sceneControls.project) { return; } // 場景投影方法尚未就緒時略過繪製
stampLabelHits = []; // 清除上一影格標籤點擊範圍
stamps.forEach((stamp, index) => { // 依序繪製各集章地點
const point = window.sceneControls.project(stamp.x, 2.45, stamp.z); // 將集章位置投影到 p5.js 畫布
if (!point || !point.visible || point.x < -80 || point.x > p.width + 80 || point.y < -50 || point.y > p.height + 50) { return; } // 略過目前位於畫面外的集章標籤
p.textSize(12); // 設定膠囊標籤文字大小
p.textStyle(p.BOLD); // 加粗標籤提升辨識度
const label = `${stamp.id}　${stamp.name}`; // 組合集章編號與地點名稱
const width = Math.max(100, p.textWidth(label) + 26); // 依照標籤字數計算白色膠囊寬度
const x = p.constrain(point.x, width / 2 + 8, p.width - width / 2 - 8); // 避免標籤超出畫面左右邊界
const y = p.constrain(point.y - 35, 18, p.height - 70); // 將膠囊安排在集章圈上方且保持可見
p.noStroke(); // 關閉膠囊標籤外框
p.fill(255, 247); // 繪製近乎不透明的白色膠囊底色
p.rect(x - width / 2, y - 16, width, 32, 16); // 繪製白色圓角集章標籤
p.fill(stamp.collected ? p.color(47, 135, 85) : p.color(209, 105, 42)); // 以綠色或橘色呈現集章編號
p.textAlign(p.CENTER, p.CENTER); // 將標籤文字置中對齊
p.text(label, x, y); // 顯示集章編號與地點名稱
stampLabelHits.push({ index, x, y, width, height: 32 }); // 保存標籤畫面範圍以支援滑鼠點選
}); // 結束集章標籤繪製
p.textAlign(p.LEFT, p.BASELINE); // 還原一般文字對齊方式
p.textStyle(p.NORMAL); // 還原一般文字樣式
} // 結束集章標籤繪製
function drawPlayerName() { // 在進入者頭頂繪製玩家名稱標籤
if (!playerReady || !window.sceneControls || !window.sceneControls.projectPlayer) { return; } // 等待玩家與場景投影方法就緒
const point = window.sceneControls.projectPlayer(); // 將玩家頭頂位置投影到 p5.js 畫布
if (!point || !point.visible) { return; } // 略過目前位於攝影機畫面外的玩家名稱
p.textSize(11); // 設定玩家名稱文字大小
p.textStyle(p.BOLD); // 使用粗體提高名稱可讀性
const labelWidth = p.constrain(p.textWidth(playerProfile.name) + 22, 56, 180); // 依名稱長度計算標籤寬度
p.noStroke(); // 關閉名稱標籤外框
p.fill(38, 42, 44, 225); // 設定深色半透明名稱底板
p.rect(point.x - labelWidth / 2, point.y - 29, labelWidth, 23, 12); // 在角色頭頂繪製圓角名稱底板
p.fill(255); // 設定名稱文字為白色
p.textAlign(p.CENTER, p.CENTER); // 將名稱文字置中對齊
p.text(playerProfile.name, point.x, point.y - 17); // 顯示進入者名稱
p.textAlign(p.LEFT, p.BASELINE); // 還原文字預設對齊方式
p.textStyle(p.NORMAL); // 還原文字一般字重
} // 結束玩家名稱標籤繪製
function drawPanel() { // 繪製場景控制卡與左上集章進度
const collected = stamps.filter((stamp) => stamp.collected).length; // 計算已完成的集章數量
p.noStroke(); // 關閉控制卡圖形外框
p.fill(247, 250, 243, 232); // 設定柔和的暖白色卡片
p.rect(18, 18, 238, 148, 18); // 繪製左上角控制卡與集章區域
p.fill(40, 54, 53); // 設定主標題的深色
p.textStyle(p.BOLD); // 使用粗體呈現主標題
p.textSize(18); // 設定主標題文字大小
p.text("五島群島", 34, 48); // 繪製場景名稱
p.fill(rotationMode ? p.color(225, 167, 73) : p.color(230, 239, 229)); // 依照旋轉模式切換按鈕底色
p.rect(176, 31, 68, 28, 10); // 繪製可切換環繞模式的按鈕
p.fill(rotationMode ? p.color(255) : p.color(48, 101, 98)); // 依照旋轉模式切換按鈕文字顏色
p.textSize(10); // 設定旋轉模式按鈕文字大小
p.textAlign(p.CENTER, p.CENTER); // 將旋轉模式文字置中
p.text(rotationMode ? "旋轉中" : "平移中", 210, 45); // 顯示目前的拖曳操作模式
p.textAlign(p.LEFT, p.BASELINE); // 還原標題與副標題的文字對齊方式
p.fill(88, 112, 105); // 設定副標題的灰綠色
p.textStyle(p.NORMAL); // 將文字樣式切回一般字重
p.textSize(11); // 設定副標題文字大小
p.text("公園・雙城・科技・鄉村", 34, 69); // 簡介五座浮島主題
p.fill(47, 112, 86); // 設定集章進度文字顏色
p.textStyle(p.BOLD); // 強調集章進度
p.textSize(12); // 設定集章進度文字大小
p.text(collected === 5 ? "完成探索！五個集章全部收集" : `集章進度　${collected} / 5`, 34, 88); // 顯示左上集章進度或全部完成訊息
p.stroke(211, 220, 207); // 設定卡片分隔線顏色
p.strokeWeight(1); // 設定卡片分隔線粗細
p.line(34, 97, 240, 97); // 繪製控制卡內的細分隔線
p.noStroke(); // 關閉按鈕圖形外框
p.fill(39, 114, 111); // 設定重設按鈕的深青綠色
p.rect(30, 108, 70, 35, 11); // 繪製重設視角按鈕
p.fill(230, 239, 229); // 設定縮放按鈕的淺綠底色
p.rect(106, 108, 55, 35, 11); // 繪製縮小按鈕
p.rect(167, 108, 77, 35, 11); // 繪製放大按鈕
p.fill(255); // 設定重設按鈕文字為白色
p.textStyle(p.BOLD); // 將控制按鈕文字設為粗體
p.textSize(11); // 設定控制按鈕文字大小
p.textAlign(p.CENTER, p.CENTER); // 將按鈕文字置中對齊
p.text("重設", 65, 125); // 繪製重設按鈕文字
p.fill(48, 101, 98); // 設定縮放按鈕文字顏色
p.text("− 縮小", 133.5, 125); // 繪製縮小按鈕文字
p.text("＋ 放大", 205.5, 125); // 繪製放大按鈕文字
p.textAlign(p.LEFT, p.BASELINE); // 還原文字預設對齊方式
p.textStyle(p.NORMAL); // 還原文字一般字重
} // 結束場景控制卡繪製
function drawIslandTags() { // 在各浮島上方繪製深色區域標籤
if (!window.sceneControls || !window.sceneControls.project) { return; } // 等待 three.js 場景提供投影方法
islandLabels.forEach((island) => { // 依序計算每座島嶼的畫面位置
const point = window.sceneControls.project(island.x, 1.15, island.z - 2.6); // 將島嶼世界座標投影至介面畫布
if (!point.visible) { return; } // 略過位於攝影機視野外的標籤
const width = island.title.length > 3 ? 112 : 92; // 依中文標題長度設定標籤寬度
const x = p.constrain(point.x, width / 2 + 12, p.width - width / 2 - 12); // 避免標籤超出畫面左右邊界
const y = p.constrain(point.y, 178, p.height - 54); // 避免標籤遮住控制卡或操作提示
if (x - width / 2 < 266 && y < 168) { return; } // 避免浮島標籤與左上控制卡重疊
p.noStroke(); // 關閉標籤外框
p.fill(38, 42, 44, 238); // 設定深色圓角標籤底色
p.rect(x - width / 2, y - 15, width, 30, 15); // 繪製浮島名稱膠囊標籤
p.fill(241, 119, 62); // 設定編號的暖橘色
p.textStyle(p.BOLD); // 強調標籤編號與名稱
p.textSize(11); // 設定標籤文字大小
p.textAlign(p.LEFT, p.CENTER); // 將標籤文字靠左置中
p.text(island.id, x - width / 2 + 12, y); // 顯示浮島編號
p.fill(255); // 設定浮島名稱為白色
p.text(island.title, x - width / 2 + 42, y); // 顯示浮島主題名稱
}); // 結束浮島標籤繪製
p.textAlign(p.LEFT, p.BASELINE); // 還原文字預設對齊方式
p.textStyle(p.NORMAL); // 還原文字一般字重
} // 結束地圖標籤繪製
function drawStampDescription() { // 在畫面下方顯示集章地點說明與完成訊息
const collected = stamps.filter((stamp) => stamp.collected).length; // 計算已完成的集章數量
const message = collected === 5 ? "太棒了！五座島都已集滿印章，探索完成！" : lastStampDescription; // 全部集章後顯示完成訊息
if (!message) { return; } // 尚未集章時不顯示說明卡片
const width = Math.min(440, p.width - 32); // 依照視窗寬度限制說明卡片大小
const x = (p.width - width) / 2; // 將說明卡片置中
const y = p.height - 105; // 將說明卡片安排在畫面下方並避開操作提示
p.noStroke(); // 關閉說明卡外框
p.fill(247, 250, 243, 238); // 設定說明卡片的暖白半透明底色
p.rect(x, y, width, 58, 16); // 繪製地點說明圓角卡片
p.fill(collected === 5 ? p.color(47, 135, 85) : p.color(54, 86, 83)); // 完成時以綠色顯示訊息
p.textStyle(p.BOLD); // 強調地點說明文字
p.textSize(13); // 設定說明文字大小
p.textAlign(p.CENTER, p.CENTER); // 將說明文字置中
p.text(message, p.width / 2, y + 29, width - 28, 42); // 顯示最近集章地點說明或完成訊息
p.textAlign(p.LEFT, p.BASELINE); // 還原文字預設對齊方式
p.textStyle(p.NORMAL); // 還原文字一般字重
} // 結束集章說明繪製
function drawHint() { // 繪製不遮擋場景的操作提示
const hintWidth = Math.min(390, p.width - 32); // 依照視窗寬度限制完整操作提示
p.noStroke(); // 關閉提示背景外框
p.fill(247, 250, 243, 210); // 設定半透明暖白提示底色
p.rect((p.width - hintWidth) / 2, p.height - 39, hintWidth, 25, 12); // 繪製小型提示膠囊
p.fill(54, 86, 83); // 設定操作提示文字顏色
p.textSize(10); // 設定操作提示文字大小
p.textAlign(p.CENTER, p.CENTER); // 將操作提示文字置中對齊
p.text("方向鍵行走・點選地面或集章標籤前往・拖曳旋轉・滾輪縮放", p.width / 2, p.height - 27); // 顯示行走、尋路、場景操作方式
p.textAlign(p.LEFT, p.BASELINE); // 還原文字預設對齊方式
} // 結束操作提示繪製
p.mousePressed = (event) => { // 處理滑鼠按下以操作視角按鈕或開始拖曳
if (event.target && event.target.closest && event.target.closest("#avatar-panel, #avatar-settings-toggle, #canvas-controls")) { return; } // 保留原生角色表單與 HTML 控制按鈕的點擊行為
if (p.mouseX >= 18 && p.mouseX <= 256 && p.mouseY >= 18 && p.mouseY <= 166) { // 判斷滑鼠是否位於左上控制卡範圍
dragStartedOnControls = true; // 記錄目前操作的是控制卡而非場景地面
if (!window.sceneControls) { return; } // 避免場景尚未初始化時呼叫控制方法
if (p.mouseY >= 31 && p.mouseY <= 59 && p.mouseX >= 176 && p.mouseX <= 244) { rotationMode = !rotationMode; } // 點擊切換環繞旋轉模式
else if (p.mouseY >= 108 && p.mouseY <= 143 && p.mouseX >= 30 && p.mouseX <= 100) { rotationMode = true; window.sceneControls.reset(); } // 點擊重設視角並恢復環繞模式
else if (p.mouseY >= 108 && p.mouseY <= 143 && p.mouseX >= 106 && p.mouseX <= 161) { window.sceneControls.zoom(0.15); } // 點擊縮小視角按鈕
else if (p.mouseY >= 108 && p.mouseY <= 143 && p.mouseX >= 167 && p.mouseX <= 244) { window.sceneControls.zoom(-0.15); } // 點擊放大視角按鈕
return; // 避免控制卡操作同時開始場景拖曳
} // 結束控制卡區域判斷
dragStartedOnControls = false; // 清除控制卡點選狀態
didDrag = false; // 開始新的點選或拖曳辨識
dragActive = true; // 開始記錄場景拖曳操作
previousPointerX = p.mouseX; // 保存拖曳起始水平位置
previousPointerY = p.mouseY; // 保存拖曳起始垂直位置
pointerStartX = p.mouseX; // 保存判斷拖曳起點的水平座標
pointerStartY = p.mouseY; // 保存判斷拖曳起點的垂直座標
}; // 結束滑鼠按下處理
p.mouseDragged = (event) => { // 依照滑鼠拖曳方向平移、調高或旋轉攝影機
if (event.target && event.target.closest && event.target.closest("#avatar-panel, #avatar-settings-toggle, #canvas-controls")) { return; } // 不攔截角色表單與 HTML 控制按鈕的拖曳
if (Math.hypot(p.mouseX - pointerStartX, p.mouseY - pointerStartY) > 6) { didDrag = true; } // 移動超過門檻時將操作視為拖曳而非地面點選
if (dragActive && window.sceneControls) { const horizontalDelta = p.mouseX - previousPointerX; if (rotationMode || p.keyIsDown(p.SHIFT)) { window.sceneControls.orbit(horizontalDelta * 0.008); } else { window.sceneControls.pan(horizontalDelta); } window.sceneControls.tilt((previousPointerY - p.mouseY) * 0.06); } // 水平依目前模式環繞或平移，垂直拖曳調整攝影機高度
previousPointerX = p.mouseX; // 更新下一影格使用的水平位置
previousPointerY = p.mouseY; // 更新下一影格使用的垂直位置
return false; // 停止瀏覽器選取頁面文字
}; // 結束拖曳旋轉處理
p.mouseReleased = () => { // 在滑鼠放開時結束場景拖曳
dragActive = false; // 清除拖曳狀態
}; // 結束滑鼠放開處理
p.mouseClicked = (event) => { // 處理集章標籤與地面點選移動
if (event.target && event.target.closest && event.target.closest("#avatar-panel, #avatar-settings-toggle, #canvas-controls")) { return; } // 不攔截角色表單與 HTML 控制按鈕的原生點擊
if (didDrag || dragStartedOnControls || !playerReady || !avatarPanel.hidden) { return; } // 略過相機拖曳、控制卡操作或設定面板開啟時的點擊
const clickedStamp = stampLabelHits.find((label) => Math.abs(p.mouseX - label.x) <= label.width / 2 && Math.abs(p.mouseY - label.y) <= label.height / 2); // 判斷是否點選集章膠囊標籤
if (clickedStamp && window.sceneControls && window.sceneControls.movePlayerToWorld) { window.sceneControls.movePlayerToWorld(stamps[clickedStamp.index].x, stamps[clickedStamp.index].z); return; } // 點擊標籤時直接讓角色走向該集章圈
if (window.sceneControls && window.sceneControls.movePlayerTo) { window.sceneControls.movePlayerTo(p.mouseX, p.mouseY); } // 將地面點選座標交給 three.js Raycaster 尋找目的地
}; // 結束滑鼠點選移動
p.mouseWheel = (event) => { // 依照滾輪方向調整場景縮放
if (event.target && event.target.closest && event.target.closest("#avatar-panel, #canvas-controls")) { return; } // 保留設定面板的原生捲動與控制按鈕操作
if (window.sceneControls) { window.sceneControls.zoom(event.deltaY * 0.003); } // 將滾輪移動量交給正交攝影機縮放
return false; // 避免滾輪操作捲動整個網頁
}; // 結束滾輪縮放處理
p.keyPressed = () => { // 接收方向鍵並避免遊戲畫面捲動
if (avatarPanel && avatarPanel.hidden && [p.UP_ARROW, p.DOWN_ARROW, p.LEFT_ARROW, p.RIGHT_ARROW].includes(p.keyCode)) { return false; } // 角色操作期間攔截方向鍵的瀏覽器預設捲動
}; // 結束方向鍵事件處理
p.windowResized = () => { // 當瀏覽器尺寸改變時更新介面畫布
p.resizeCanvas(p.windowWidth, p.windowHeight); // 讓 p5.js 畫布重新填滿視窗
}; // 結束介面尺寸更新
}; // 結束 p5.js 實例模式程式
new p5(islandSketch); // 建立 p5.js 實例並以其 draw 作為應用程式主迴圈
