// 게임에 들어가는 내용(층 배치, 공간 설명, 퀴즈, NPC 대사)을 모두 이 파일에 모았어요.
// 숫자는 미터 단위이고, 설계도(평면도) 기준으로 x는 동쪽, z는 남쪽이에요.
// 문장만 고치고 싶을 때는 desc, q, opts, why, lines 를 바꾸면 돼요.

// ---------- 퀴즈 (층마다 5개 안팎, 공간 소개를 확인하는 쉬운 문제) ----------
// a: 정답 번호(0부터), why: 정답을 맞힌 뒤 보여 주는 한마디
export const QUIZZES = {
  "w1-vest": { q: "정문으로 들어오면 처음 지나는 방풍실! 이름처럼 무엇을 막아 줄까요?", opts: ["바깥바람", "공룡", "숙제"], a: 0, why: "방풍(防風)은 '바람을 막는다'는 뜻이에요. 겨울엔 찬바람, 여름엔 더운 바람이 안으로 바로 들어오지 않게 해 줘요." },
  "w1-cafe": { q: "북카페에서 할 수 있는 일로 가장 알맞은 것은?", opts: ["책 읽고 친구와 이야기 나누기", "수영 연습하기", "자동차 고치기"], a: 0, why: "북카페는 책과 대화가 있는 쉼터예요. 소파에 앉아 책을 읽어도 좋아요." },
  "w1-lego": { q: "레고랜드에서는 무엇으로 상상한 것을 만들어 볼까요?", opts: ["블록", "진흙탕", "아이스크림"], a: 0, why: "알록달록 블록으로 건물도, 로봇도 만들 수 있어요. 바닥에 떨어진 블록은 꼭 치워 주세요!" },
  "w1-meet": { q: "청소년 자치배움터의 '자치'는 무슨 뜻일까요?", opts: ["우리 일을 우리가 스스로 정하고 꾸려 가기", "선생님이 모든 걸 정해 주기", "자면서 치킨 먹기"], a: 0, why: "자치배움터는 청소년이 직접 회의하고 정하는 곳이에요. 치킨은… 회의 끝나고 먹기로 해요." },
  "w1-office": { q: "궁금한 게 있거나 도움이 필요할 때 선생님을 만날 수 있는 곳은?", opts: ["운영사무실", "화장실 맨 끝 칸", "옥상 굴뚝"], a: 0, why: "운영사무실에는 배움터를 꾸려 가는 선생님들이 계세요. 언제든 노크해요!" },
  "w1-club1": { q: "같은 관심사를 가진 친구들이 모여 함께 활동하는 모임은?", opts: ["동아리", "동굴", "동그라미"], a: 0, why: "동아리활동실에서는 밴드, 영상, 보드게임처럼 좋아하는 걸 친구들과 함께해요." },

  "w2-lounge": { q: "2층 한가운데 넓은 소셜라운지는 어떤 곳일까요?", opts: ["친구들과 자유롭게 쉬고 이야기하는 곳", "시험만 보는 곳", "잠만 자는 곳"], a: 0, why: "소셜라운지는 2층의 거실 같은 곳이에요. 수업 사이사이 모여서 쉬어요." },
  "w2-chroma": { q: "크로마키 스튜디오 벽이 초록색인 까닭은?", opts: ["영상에서 초록색을 지우고 다른 배경을 넣으려고", "눈이 편하라고", "개구리가 좋아해서"], a: 0, why: "초록 배경을 지우면 우주든 바닷속이든 원하는 배경을 넣을 수 있어요. 그래서 초록 옷을 입으면 몸이 사라져요!" },
  "w2-fashion": { q: "옷을 만들 때 몸의 길이를 재는 도구는?", opts: ["줄자", "숟가락", "리코더"], a: 0, why: "패션디자인실에서는 줄자로 치수를 재고, 재봉틀로 옷을 만들어요." },
  "w2-band": { q: "밴드연습실의 큰 소리가 밖으로 새지 않게 해 주는 시설은?", opts: ["방음", "방귀", "방학"], a: 0, why: "방음 시설 덕분에 마음껏 드럼을 쳐도 옆 교실은 조용해요. 방귀는… 막을 수 없어요." },
  "w2-dance": { q: "댄스연습실 벽 한쪽에 커다랗게 붙어 있어 내 동작을 볼 수 있는 것은?", opts: ["거울", "칠판", "냉장고"], a: 0, why: "벽 가득한 거울을 보면서 동작을 맞춰 봐요." },
  "w2-cook": { q: "요리를 시작하기 전에 가장 먼저 해야 할 일은?", opts: ["손 깨끗이 씻기", "간식 먼저 먹기", "냄비 쓰고 춤추기"], a: 0, why: "깨끗한 손이 맛있는 요리의 시작이에요." },

  "w3-class1": { q: "미래교육실 앞쪽에 있는, 글씨도 쓰고 영상도 볼 수 있는 커다란 화면은?", opts: ["전자칠판", "돌칠판", "거북이 등껍질"], a: 0, why: "미래교육실에는 전자칠판과 모둠 책상이 있어서 함께 배우기 좋아요." },
  "w3-invent": { q: "생활 속 불편함을 해결하는 새로운 물건이나 방법을 만들어 내는 일은?", opts: ["발명", "발표", "발차기"], a: 0, why: "발명교육실에서는 '이게 있으면 좋겠다!' 하는 생각을 직접 만들어 봐요." },
  "w3-maker": { q: "미래창작공방은 어떤 곳일까요?", opts: ["생각한 것을 직접 만들어 보는 곳", "낮잠 자는 곳", "물건을 파는 가게"], a: 0, why: "공방은 무언가를 만드는 작업실이에요. 상상을 손으로 만들어 봐요." },
  "w3-meet": { q: "회의할 때 가장 좋은 태도는?", opts: ["다른 사람 의견을 끝까지 듣기", "내 말만 크게 하기", "몰래 게임하기"], a: 0, why: "끝까지 들어 주는 게 자치 회의의 첫걸음이에요." },
  "w3-hall": { q: "3층 교실들을 이어 주는 넓은 복도 공간의 이름은?", opts: ["교육홀", "놀이공원", "지하철역"], a: 0, why: "교육홀은 3층 교실들의 가운데에 있는 넓은 공간이에요." },

  "w4-theater": { q: "4층 시청각실에서 주로 하는 일은?", opts: ["영화·공연·강연 보기", "수영 대회", "김장하기"], a: 0, why: "시청각실은 많은 사람이 함께 보고 듣는 4층의 큰 강당이에요." },
  "w4-stage": { q: "무대에 오르기 전에 공연을 준비하는 방은?", opts: ["공연준비실", "냉동실", "기관실"], a: 0, why: "공연준비실에서 옷을 갈아입고 마지막 연습을 해요. 옷걸이에 재밌는 모자도 있대요!" },
  "w4-wheel": { q: "시청각실에는 휠체어를 탄 친구도 함께 볼 수 있는 자리가 있어요. 이렇게 만드는 까닭은?", opts: ["누구나 함께 쓸 수 있게 하려고", "자리가 남아서", "의자가 모자라서"], a: 0, why: "모두가 불편 없이 함께 쓰도록 배려한 공간이에요." },

  "e1-rink": { q: "롤러스케이트를 탈 때 꼭 해야 하는 것은?", opts: ["헬멧과 보호대 착용", "눈 감고 타기", "뒤로만 타기"], a: 0, why: "넘어져도 다치지 않게 헬멧과 무릎·팔꿈치 보호대를 꼭 해요. 벽에는 안전매트도 있어요." },
  "e1-locker": { q: "스케이트보관소는 어떤 곳일까요?", opts: ["스케이트를 보관하는 곳", "스케이트를 녹이는 곳", "스케이트를 먹는 곳"], a: 0, why: "선반과 사물함에 스케이트를 가지런히 넣어 둬요." },
  "e1-radio": { q: "방송실에서 하는 일은?", opts: ["안내 방송과 음악 틀기", "라면 끓이기", "빨래하기"], a: 0, why: "롤러장에 신나는 음악을 틀어 주는 곳이 바로 방송실이에요." },
  "e1-parents": { q: "롤러스케이트장 옆 학부모 대기공간은 누구를 위한 곳일까요?", opts: ["아이를 기다리는 보호자", "길 잃은 고양이", "외계인"], a: 0, why: "보호자가 편하게 앉아서 기다리며 롤러장을 볼 수 있어요." },

  "e2-futsal": { q: "풋살은 어떤 운동과 가장 비슷할까요?", opts: ["축구", "수영", "바둑"], a: 0, why: "풋살은 작은 경기장에서 하는 실내 축구예요." },
  "e2-gym": { q: "비가 오는 날에도 실내체육관에서 운동할 수 있는 까닭은?", opts: ["지붕이 있는 실내라서", "비를 다 마셔서", "모두 우산을 써서"], a: 0, why: "날씨와 상관없이 농구, 배드민턴 같은 운동을 할 수 있어요." },
  "e2-climb": { q: "클라이밍 벽 아래에 푹신한 매트를 까는 까닭은?", opts: ["떨어져도 다치지 않게", "낮잠 자려고", "예뻐 보이려고"], a: 0, why: "추락안전매트가 있어 안심하고 도전할 수 있어요." },
  "e2-lockm": { q: "운동하기 전에 옷을 갈아입는 곳은?", opts: ["탈의실", "회의실", "방송실"], a: 0, why: "남자 탈의실과 여자 탈의실이 따로 있어요." },

  "o-plaza": { q: "자치배움터 앞 넓은 마당의 이름은?", opts: ["창의교육마당", "놀부마당", "우주정거장"], a: 0, why: "창의교육마당에서 축제도 하고 공도 차요." },
  "o-deck": { q: "2층에서 자치배움터와 스포츠동을 이어 주는 다리의 이름은?", opts: ["교류데크", "무지개다리", "출렁다리"], a: 0, why: "교류데크를 건너면 밖으로 나가지 않고도 스포츠동 2층에 갈 수 있어요." },
  "o-bike": { q: "자전거를 타고 왔다면 어디에 세울까요?", opts: ["자전거 주차장", "엘리베이터 안", "북카페 소파 위"], a: 0, why: "자치배움터 동쪽에 자전거 주차장이 있어요." },
};

// ---------- 미니게임 ----------
export const GAMES = {
  stack: { name: "레고 블록 쌓기", room: "레고랜드", howto: "움직이는 블록이 아래 블록 위에 왔을 때 눌러서 쌓아요. 삐져나온 부분은 잘려 나가요!", goals: [6, 12, 18], unit: "층" },
  rhythm: { name: "리듬 댄스", room: "댄스연습실", howto: "화살표가 선에 닿을 때 같은 방향키(또는 버튼)를 눌러요.", goals: [30, 60, 85], unit: "%" },
  cook: { name: "떡볶이 재료 받기", room: "쿠킹클래스", howto: "냄비를 좌우로 움직여 떡볶이 재료를 받아요. 양말이나 운동화는 피해요!", goals: [8, 15, 22], unit: "점" },
  code: { name: "로봇 길 찾기", room: "코딩실", howto: "명령 블록을 순서대로 쌓고 '실행'을 눌러 로봇을 별까지 보내요.", goals: [1, 2, 3], unit: "단계" },
  drum: { name: "드럼 따라 치기", room: "밴드연습실", howto: "드럼이 연주하는 순서를 잘 듣고 똑같이 따라 쳐요.", goals: [3, 5, 7], unit: "단계" },
  race: { name: "롤러 레이스", room: "롤러스케이트장", howto: "빛나는 고리를 차례대로 지나 두 바퀴를 달려요. 쌩쌩 할아버지를 이겨 보세요!", goals: [1, 2, 3], unit: "" },
  penalty: { name: "승부차기", room: "풋살장", howto: "조준이 마음에 들 때 한 번, 힘이 알맞을 때 또 한 번 눌러 공을 차요. 다섯 번 차요!", goals: [1, 2, 4], unit: "골" },
  climb: { name: "클라이밍 도전", room: "실내클라이밍", howto: "홀드를 밟고 폴짝폴짝 올라가 꼭대기 종을 울려요.", goals: [1, 1, 1], unit: "" },
};

// ---------- 층 배치 ----------
// rect: [x0, x1, z0, z1]   doors: { side: n|s|e|w, at: 문 가운데 좌표, w: 폭 }
// open: 벽 없는 공간(라운지, 홀)   solid: 들어갈 수 없는 방(화장실, 엘리베이터)
// noDex: 도감에 넣지 않는 곳   kind: 가구 배치 종류
const CORE = (f) => [
  { id: `${f}-stair1`, name: "계단", rect: [6.6, 9.9, 0, 6.4], kind: "stairs", doors: [{ side: "s", at: 8.25, w: 1.8 }], noDex: true },
  { id: `${f}-elev`, name: "엘리베이터", rect: [9.9, 12.4, 0, 3.2], kind: "elevator", solid: true, doors: [{ side: "s", at: 11.15 }], noDex: true },
  { id: `${f}-wcm`, name: "화장실(남)", rect: [12.4, 15.6, 0, 4.2], kind: "toilet", solid: true, doors: [{ side: "s", at: 14 }], noDex: true, sign: "남" },
  { id: `${f}-wcf`, name: "화장실(여)", rect: [15.6, 18.8, 0, 4.2], kind: "toilet", solid: true, doors: [{ side: "s", at: 17.2 }], noDex: true, sign: "여" },
  { id: `${f}-ehall`, name: "엘리베이터 홀", rects: [[18.8, 21.9, 0, 6.4], [9.9, 12.4, 3.2, 6.4], [12.4, 18.8, 4.2, 6.4]], kind: "ehall", open: true, noDex: true, floor: "tile" },
  { id: `${f}-stair2`, name: "계단", rect: [25.4, 28.8, 0, 6.4], kind: "stairs", doors: [{ side: "s", at: 27.1, w: 1.8 }], noDex: true },
];
const WEST_ELEV = { x: 11.15, z: 4.3, face: Math.PI };
const WATER_LINES = ["꿀꺽꿀꺽! 시원하다~ 탐험 에너지 충전 완료!", "물을 세 컵이나 마셨더니… 화장실이 바로 옆이라 다행이에요!", "정수기 옆 쪽지: '종이컵 대신 내 텀블러 쓰기!'"];
const CORE_GAGS = () => [
  { kind: "toilet", pos: [14, 5.0] }, { kind: "toilet", pos: [17.2, 5.0] },
  { kind: "text", pos: [20.35, 1.3], r: 1.5, label: "정수기", verb: "물 마시기", lines: WATER_LINES },
];

export const SCENES = {
  w1: {
    name: "자치배움터 1층", short: "1층", building: "west", level: 1,
    slabs: [[6.6, 28.8, 0, 6.4], [0, 28.8, 6.4, 20]],
    outline: [[6.6, 0], [28.8, 0], [28.8, 20], [0, 20], [0, 6.4], [6.6, 6.4]],
    rooms: [
      ...CORE("w1"),
      { id: "w1-meet", name: "소회의실", rect: [21.9, 25.4, 0, 6.4], kind: "meeting", doors: [{ side: "s", at: 23.65 }], floor: "carpet", color: "#2fb2ff", quiz: "w1-meet",
        desc: "긴 탁자에 둘러앉아 회의하는 방이에요. 청소년 자치회가 여기서 배움터의 일을 함께 정해요." },
      { id: "w1-lego", name: "레고랜드", rect: [0, 6.6, 6.4, 10.6], kind: "lego", doors: [{ side: "e", at: 8.5 }], floor: "tile", color: "#ff4747", quiz: "w1-lego", game: "stack", gameAt: [5.2, 7.0],
        desc: "블록으로 상상한 것을 마음껏 만들어 보는 방이에요. 바닥에 떨어진 블록을 밟지 않게 조심!" },
      { id: "w1-net", name: "통신실", rect: [0, 6.6, 10.6, 12.8], kind: "telecom", doors: [{ side: "e", at: 11.7, w: 1.2 }], floor: "tile", color: "#7a8699",
        desc: "인터넷과 전화가 지나가는 장비가 모여 있는 작은 방이에요." },
      { id: "w1-office", name: "운영사무실", rect: [0, 6.6, 12.8, 20], kind: "office", doors: [{ side: "e", at: 14.2 }], floor: "carpet", color: "#3fd16f", quiz: "w1-office",
        desc: "배움터를 꾸려 가는 선생님들이 일하는 곳이에요. 도움이 필요하면 언제든 찾아와요." },
      { id: "w1-club1", name: "동아리활동실 1", rect: [21.4, 28.8, 8.8, 13.2], kind: "club", doors: [{ side: "w", at: 11 }], floor: "wood", color: "#ff9a1a", quiz: "w1-club1",
        desc: "동아리 친구들이 모여 활동하는 방이에요. 커다란 화면과 책상이 있어요." },
      { id: "w1-club2", name: "동아리활동실 2", rect: [21.4, 28.8, 13.2, 20], kind: "club", doors: [{ side: "w", at: 15 }], floor: "wood", color: "#ff9a1a",
        desc: "두 번째 동아리활동실이에요. 모둠 책상을 붙였다 뗐다 하며 쓸 수 있어요." },
      { id: "w1-vest", name: "방풍실", rect: [6.9, 13.7, 17.4, 20], kind: "vestibule", doors: [{ side: "n", at: 10.3, w: 2.2 }], floor: "mat", color: "#9b7bff", quiz: "w1-vest", quizAt: [12.6, 18.4],
        desc: "정문과 로비 사이의 작은 공간이에요. 바깥바람이 안으로 바로 들어오지 않게 막아 줘요." },
      { id: "w1-cafe", name: "북카페", rect: [13.7, 21.4, 8.8, 20], kind: "books", open: true, floor: "wood", color: "#c98a49", quiz: "w1-cafe", quizAt: [14.8, 10.2],
        desc: "책장과 소파가 있는 1층의 쉼터예요. 책을 읽거나 친구와 이야기를 나눠요." },
      { id: "w1-lobby", name: "전시 로비", rect: [6.6, 13.7, 8.8, 17.4], kind: "lobby", open: true, floor: "tile", color: "#00a2ea",
        desc: "들어오자마자 만나는 로비예요. 친구들이 만든 작품을 전시해요." },
      { id: "w1-hall", name: "1층 복도", rect: [6.6, 28.8, 6.4, 8.8], kind: "hall", open: true, noDex: true },
    ],
    exits: [
      { axis: "z", c: 20, at: 10.3, w: 2.2, to: "outdoor", spawn: "fromMain", label: "정문", verb: "밖으로 나가기" },
      { axis: "x", c: 28.8, at: 7.6, w: 1.8, to: "outdoor", spawn: "fromSub", label: "부출입구", verb: "밖으로 나가기" },
    ],
    elevator: WEST_ELEV,
    spawns: { fromMain: { x: 10.3, z: 18.3, face: Math.PI }, fromSub: { x: 27.6, z: 7.6, face: -Math.PI / 2 }, elevator: { x: 11.15, z: 4.6, face: 0 } },
    npcs: [
      { id: "teacher", name: "김쌤", role: "운영 선생님", look: { skin: "#f3cfae", shirt: "#3b82f6", pants: "#334155", hair: "#2b1d16", hat: "none" }, pos: [2.6, 18.4], face: Math.PI,
        lines: ["어서 와! 나는 운영사무실 김쌤이야. 궁금한 건 뭐든 물어봐.", "서류가 산더미야… 그래도 너희 웃는 얼굴 보면 힘이 난단다!", "아재개그 하나 할까? 세상에서 가장 가난한 왕은? …최저임금! 하하… 하…"] },
      { id: "jiu", name: "지우", role: "자치회 부회장", look: { skin: "#f6d0b0", shirt: "#22b8a0", pants: "#3a3f6b", hair: "#3b2a20", hat: "bow", hatColor: "#ff6b8b" }, pos: [9.6, 11], area: [8, 11.2, 9.4, 15.6],
        lines: ["안녕! 여긴 전시 로비야. 다 우리가 만든 작품이야, 멋지지?", "엘리베이터나 계단으로 2층, 3층, 4층에도 가 봐!", "층마다 방에 들어가면 공간 카드가 열려. 도감을 다 채우면 임명장을 준대!"] },
      { id: "cat", name: "냥이 사서", role: "북카페 고양이", animal: "cat", pose: "sleep", pos: [16.4, 13.25], y: 0.42, face: 0.3,
        lines: ["쿨쿨… zZ", "…(실눈을 뜨고) 책은 제자리에 꽂아 달라옹.", "냐옹. 책 반납은 내일 해도 된다옹… zZ"] },
    ],
    gags: [
      ...CORE_GAGS(),
      { kind: "text", pos: [4.4, 11.7], r: 1.8, label: "통신 장비", verb: "살펴보기", lines: ["쉿! 와이파이가 자는 중이에요… zZ", "초록 불이 깜빡깜빡. 인터넷이 열심히 달리는 중이래요!", "케이블이 엄청 많아요. 이걸 다 이으면 순창에서 서울까지…는 아니에요."] },
      { kind: "text", pos: [23.65, 1.4], r: 1.8, label: "회의 화이트보드", verb: "읽기", lines: ["오늘의 안건: ① 축제 때 뭐 하지? ② 급식에 떡볶이 넣어 주세요 ③ 회의 끝나고 치킨?", "회의 규칙: 끝까지 듣기, 손 들고 말하기, 졸지 않기(특히 김쌤)."] },
      { kind: "text", pos: [11.9, 11.6], r: 1.7, label: "전시 작품", verb: "감상하기", lines: ["작품명 「고추장 공룡」. 만든 사람: 순창 어린이. 설명: 매운 걸 먹으면 불을 뿜어요.", "작품명 「미래의 자치배움터」. 지붕에 미끄럼틀이 달려 있어요.", "작품명 「급식 떡볶이 탑」. 높이 3미터. 맛은 비밀."] },
      { kind: "lego", rect: [0.8, 5.6, 7.0, 10.0] },
    ],
  },

  w2: {
    name: "자치배움터 2층", short: "2층", building: "west", level: 2,
    slabs: [[6.6, 28.8, 0, 6.4], [28.8, 34.8, 0, 10.4], [0, 28.8, 6.4, 20]],
    outline: [[6.6, 0], [34.8, 0], [34.8, 10.4], [28.8, 10.4], [28.8, 20], [0, 20], [0, 6.4], [6.6, 6.4]],
    rooms: [
      ...CORE("w2"),
      { id: "w2-band", name: "밴드연습실", rect: [21.9, 25.4, 0, 6.4], kind: "band", doors: [{ side: "s", at: 23.65 }], floor: "carpet", color: "#9b7bff", quiz: "w2-band", game: "drum", gameAt: [22.9, 4.0],
        desc: "드럼, 기타, 건반으로 합주하는 방이에요. 방음이 잘 돼서 마음껏 연주해요." },
      { id: "w2-code", name: "코딩실", rect: [28.8, 34.8, 0, 10.4], kind: "coding", doors: [{ side: "w", at: 8.2 }], floor: "tile", color: "#2fb2ff", game: "code", gameAt: [32.0, 8.9],
        desc: "컴퓨터로 프로그램을 만들고 로봇을 움직여 보는 방이에요." },
      { id: "w2-makeup", name: "분장실", rect: [0, 6.6, 6.4, 9.4], kind: "makeup", doors: [{ side: "e", at: 7.9, w: 1.2 }], floor: "wood", color: "#ff9ad5",
        desc: "공연이나 촬영 전에 거울 앞에서 분장하고 옷을 갈아입는 방이에요." },
      { id: "w2-chroma", name: "크로마키 스튜디오", rect: [0, 6.6, 9.4, 12.4], kind: "chroma", doors: [{ side: "e", at: 10.9, w: 1.2 }], floor: "green", color: "#2bbf4a", quiz: "w2-chroma", quizAt: [5.5, 9.9],
        desc: "초록 벽 앞에서 영상을 찍고, 초록색을 지워 원하는 배경을 넣는 스튜디오예요." },
      { id: "w2-fashion", name: "패션디자인실", rect: [0, 8, 12.4, 20], kind: "fashion", doors: [{ side: "n", at: 7.3, w: 1.3 }], floor: "wood", color: "#ff6b8b", quiz: "w2-fashion",
        desc: "재봉틀과 마네킹이 있는 방이에요. 내가 디자인한 옷을 직접 만들어 봐요." },
      { id: "w2-dance", name: "댄스연습실", rect: [8, 20, 12.4, 20], kind: "dance", doors: [{ side: "n", at: 14, w: 1.8 }], floor: "wood", color: "#ffb000", quiz: "w2-dance", game: "rhythm", gameAt: [14, 16.4],
        desc: "벽 가득 거울이 있는 넓은 연습실이에요. 음악에 맞춰 춤을 연습해요." },
      { id: "w2-cook", name: "쿠킹클래스", rect: [20, 28.8, 12.4, 20], kind: "cooking", doors: [{ side: "n", at: 24.4, w: 1.6 }], floor: "tile", color: "#ff7a1a", quiz: "w2-cook", game: "cook", gameAt: [27.2, 13.8],
        desc: "조리대와 냉장고가 있는 요리 교실이에요. 친구들과 함께 요리하고 나눠 먹어요." },
      { id: "w2-lounge", name: "소셜라운지", rect: [6.6, 28.8, 6.4, 12.4], kind: "lounge", open: true, floor: "lounge", color: "#00a2ea", quiz: "w2-lounge", quizAt: [26.6, 7.4],
        desc: "2층 한가운데의 넓은 쉼터예요. 수업 사이사이 친구들과 모여 쉬어요." },
    ],
    exits: [{ axis: "x", c: 28.8, at: 11.4, w: 1.6, to: "e2", spawn: "fromDeck", label: "교류데크", verb: "스포츠동으로 건너가기" }],
    elevator: WEST_ELEV,
    spawns: { elevator: { x: 11.15, z: 4.6, face: 0 }, fromDeck: { x: 27.4, z: 11.4, face: -Math.PI / 2 } },
    npcs: [
      { id: "doyun", name: "도윤", role: "댄스 동아리", look: { skin: "#e9b98f", shirt: "#ffc93c", pants: "#25324f", hair: "#151515", hat: "cap", hatColor: "#2f6fe0" }, pos: [16, 8.4], area: [9, 26, 7.2, 9.6],
        lines: ["댄스연습실 거울 앞에서 리듬 댄스 해 봤어? 나보다 잘하면 인정!", "바나나는 왜 춤을 잘 출까? …바나나가 원래 '나나나~' 하거든! …미안.", "교류데크로 나가면 스포츠동 2층이야. 풋살 한 판 어때?"] },
      { id: "bot", name: "코딩봇", role: "코딩실 로봇", look: { skin: "#c9d3e0", shirt: "#5b6b82", pants: "#3a4558", hair: "#c9d3e0", hat: "antenna" }, pos: [30.4, 7.6], face: 2.4,
        lines: ["삐빅. 반갑습니다, 인간 친구.", "삐빅. 저는 버그가 아니라 기능입니다.", "로봇 길 찾기 게임을 해 보세요. 저처럼 벽에 박치기하지 마시고요. 삐빅."] },
      { id: "chef", name: "떡볶이 셰프", role: "쿠킹클래스 선생님", look: { skin: "#f1c9a5", shirt: "#ffffff", pants: "#334155", hair: "#3b2a20", hat: "chef" }, pos: [24.2, 19.3], face: Math.PI,
        lines: ["오늘의 메뉴는 순창 고추장 떡볶이!", "재료 받기 게임에서 양말은 절대 넣으면 안 돼. 지난번에 누가 넣었거든…", "요리의 비결? 손 씻기, 그리고 고추장 듬뿍!"] },
      { id: "mannequin", name: "마네킹", role: "패션디자인실", look: { skin: "#e8e2d8", shirt: "#ff6b8b", pants: "#e8e2d8", hair: "#e8e2d8", hat: "none" }, pos: [1.6, 15.2], face: Math.PI / 2, still: true, blank: true,
        lines: ["……", "(마네킹이에요. 대답이 없어요.)", "……(방금 눈 깜빡인 것 같은데?)"] },
    ],
    gags: [
      ...CORE_GAGS(),
      { kind: "mirror", pos: [1.0, 7.9], r: 1.5, label: "분장실 거울", verb: "들여다보기" },
      { kind: "ghost", pos: [3.4, 10.1], r: 1.5, label: "촬영 카메라", verb: "녹화 버튼 누르기" },
    ],
  },

  w3: {
    name: "자치배움터 3층", short: "3층", building: "west", level: 3,
    slabs: [[6.6, 28.8, 0, 6.4], [28.8, 34.8, 0, 6.4], [0, 31, 6.4, 20]],
    outline: [[6.6, 0], [34.8, 0], [34.8, 6.4], [31, 6.4], [31, 20], [0, 20], [0, 6.4], [6.6, 6.4]],
    terraces: [{ rect: [31, 34.8, 6.4, 12.4], rails: ["e", "s"] }],
    rooms: [
      ...CORE("w3"),
      { id: "w3-meet", name: "소회의실", rect: [21.9, 25.4, 0, 6.4], kind: "meeting", doors: [{ side: "s", at: 23.65 }], floor: "carpet", color: "#2fb2ff", quiz: "w3-meet",
        desc: "3층의 회의실이에요. 모둠별로 계획을 세우고 발표를 준비해요." },
      { id: "w3-maker", name: "미래창작공방", rect: [28.8, 34.8, 0, 6.4], kind: "maker", doors: [{ side: "s", at: 29.9, w: 1.4 }], floor: "tile", color: "#ff9a1a", quiz: "w3-maker",
        desc: "생각한 것을 직접 만들어 보는 작업실이에요. 3D 프린터가 열심히 무언가를 만들고 있어요." },
      { id: "w3-class1", name: "미래교육실 1", rect: [0, 6.6, 6.4, 11.8], kind: "classroom", doors: [{ side: "e", at: 9.1 }], floor: "wood", color: "#3fd16f", quiz: "w3-class1",
        desc: "전자칠판과 모둠 책상이 있는 교실이에요. 미래를 준비하는 여러 수업이 열려요." },
      { id: "w3-prep", name: "준비실", rect: [0, 4.6, 11.8, 14], kind: "prep", doors: [{ side: "e", at: 12.9, w: 1.2 }], floor: "tile", color: "#7a8699",
        desc: "수업 준비물을 모아 두는 작은 방이에요." },
      { id: "w3-class2", name: "미래교육실 2", rect: [0, 6.2, 14, 20], kind: "classroom", doors: [{ side: "n", at: 5.4, w: 1.2 }], floor: "wood", color: "#3fd16f",
        desc: "두 번째 미래교육실이에요. 모둠으로 둘러앉아 토론하기 좋아요." },
      { id: "w3-class3", name: "미래교육실 3", rect: [6.2, 12.6, 14, 20], kind: "classroom", doors: [{ side: "n", at: 9.4 }], floor: "wood", color: "#3fd16f",
        desc: "세 번째 미래교육실이에요. 전자칠판으로 영상을 보며 배워요." },
      { id: "w3-invent", name: "발명교육실", rect: [12.6, 20, 11.8, 20], kind: "invent", doors: [{ side: "n", at: 16.3 }], floor: "tile", color: "#ffd91a", quiz: "w3-invent",
        desc: "생활 속 불편함을 해결할 아이디어를 떠올리고 만들어 보는 교실이에요." },
      { id: "w3-class4", name: "미래교육실 4", rect: [20, 27.2, 11.8, 20], kind: "classroom", doors: [{ side: "n", at: 23.6 }], floor: "wood", color: "#3fd16f",
        desc: "네 번째 미래교육실이에요. 창가 쪽에 정리장이 있어요." },
      { id: "w3-prep2", name: "교육준비실", rect: [27.2, 31, 11.8, 20], kind: "prep", doors: [{ side: "n", at: 29.1, w: 1.2 }], floor: "tile", color: "#7a8699",
        desc: "선생님들이 수업을 준비하는 방이에요." },
      { id: "w3-hall", name: "교육홀", rects: [[6.6, 31, 6.4, 11.8], [4.6, 12.6, 11.8, 14]], kind: "hall2", open: true, floor: "tile", color: "#00a2ea", quiz: "w3-hall", quizAt: [8.0, 7.4],
        desc: "3층 교실들을 이어 주는 넓은 홀이에요." },
      { id: "w3-terrace", name: "외부 휴게공간", rect: [31, 34.8, 6.4, 12.4], kind: "terrace", open: true, outside: true, floor: "deck", color: "#3fd16f",
        desc: "3층 바깥에 있는 작은 쉼터예요. 바람 쐬며 쉬어 가요." },
    ],
    exits: [{ axis: "x", c: 31, at: 9.4, w: 1.6, kind: "opening" }],
    elevator: WEST_ELEV,
    spawns: { elevator: { x: 11.15, z: 4.6, face: 0 } },
    npcs: [
      { id: "edi", name: "에디쌤", role: "발명교육실 선생님", look: { skin: "#f3cfae", shirt: "#f4f4f4", pants: "#475569", hair: "#d9d9d9", hat: "goggles" }, pos: [18.6, 17.8], face: Math.PI,
        lines: ["에디슨은 전구를 만들려고 수천 번 실패했대.", "나는 오늘 컵라면 물 맞추기에 1000번 실패했지. 이것도 발명의 과정이야!", "발명은 '불편해!'라고 말하는 데서 시작해. 너는 뭐가 불편하니?"] },
      { id: "seoyeon", name: "서연", role: "3층 친구", look: { skin: "#f6d0b0", shirt: "#ff6b8b", pants: "#2f4b8f", hair: "#151515", hat: "headphones", hatColor: "#ffc93c" }, pos: [16, 9], area: [8, 28, 7.2, 11.2],
        lines: ["3층은 공부하는 층이야. 근데 교육홀에서 노는 게 제일 재밌어.", "외부 휴게공간 가 봤어? 바람이 시원해!", "냉장고에 코끼리를 넣는 방법은? 문 열고, 넣고, 닫으면 끝! …발명 끝!"] },
    ],
    gags: [
      ...CORE_GAGS(),
      { kind: "text", pos: [33.2, 2.2], r: 1.6, label: "3D 프린터", verb: "들여다보기", lines: ["위잉… 3D 프린터가 무언가를 만들고 있어요. 완성! …치킨 모양 지우개?!", "위잉… 이번엔 미니 자치배움터 모형이에요. 완전 똑같아요!", "위잉… 실패! 스파게티처럼 엉켰어요. 괜찮아요, 다시 하면 돼요."] },
      { kind: "text", pos: [16.3, 13.2], r: 1.6, label: "발명 아이디어 상자", verb: "열어 보기", lines: ["아이디어 1: 자동으로 숙제해 주는 연필 (선생님 반대로 기각)", "아이디어 2: 비 오면 저절로 펴지는 가방 우산", "아이디어 3: 고추장 맛 치약 (모두가 반대함)"] },
    ],
  },

  w4: {
    name: "자치배움터 4층", short: "4층", building: "west", level: 4,
    slabs: [[6.6, 28.8, 0, 6.4], [0, 28.8, 6.4, 11], [0, 20.6, 11, 20]],
    outline: [[6.6, 0], [28.8, 0], [28.8, 11], [20.6, 11], [20.6, 20], [0, 20], [0, 6.4], [6.6, 6.4]],
    terraces: [{ rect: [20.6, 28.6, 11, 18.6], rails: ["e", "s"] }],
    rooms: [
      ...CORE("w4"),
      { id: "w4-stage", name: "공연준비실", rect: [21.9, 25.4, 0, 6.4], kind: "perform", doors: [{ side: "s", at: 23.65 }], floor: "wood", color: "#ff6b8b", quiz: "w4-stage",
        desc: "공연 전에 옷을 갈아입고 마지막 연습을 하는 방이에요. 옷걸이의 모자를 써 볼 수 있어요!" },
      { id: "w4-store", name: "창고·준비실", rect: [0, 6.6, 6.4, 11], kind: "prep", doors: [{ side: "e", at: 8.7, w: 1.2 }], floor: "tile", color: "#7a8699",
        desc: "시청각실에서 쓰는 장비와 의자를 보관하는 방이에요." },
      { id: "w4-theater", name: "시청각실", rect: [0, 20.6, 11, 20], kind: "theater", doors: [{ side: "n", at: 9.6, w: 2.4 }, { side: "n", at: 16.4, w: 1.6 }], floor: "carpet", color: "#e0464e", quiz: "w4-theater", quizAt: [18.6, 12.4], quiz2: "w4-wheel", quiz2At: [18.8, 18.4],
        desc: "의자가 줄지어 놓인 4층의 큰 강당이에요. 영화, 공연, 강연을 함께 봐요." },
      { id: "w4-hall", name: "시청각실 홀", rect: [6.6, 28.8, 6.4, 11], kind: "hall", open: true, floor: "tile", color: "#00a2ea",
        desc: "시청각실 앞의 넓은 홀이에요. 공연이 끝나면 여기서 사진을 찍어요." },
      { id: "w4-terrace", name: "옥상 테라스", rect: [20.6, 28.6, 11, 18.6], kind: "roof", open: true, outside: true, floor: "deck", color: "#3fd16f",
        desc: "4층 바깥의 하늘 쉼터예요. 순창의 하늘과 산이 한눈에 보여요." },
    ],
    exits: [{ axis: "z", c: 11, at: 22.9, w: 1.6, kind: "opening" }],
    elevator: WEST_ELEV,
    spawns: { elevator: { x: 11.15, z: 4.6, face: 0 } },
    npcs: [
      { id: "movie", name: "하준", role: "영화 동아리", look: { skin: "#e9b98f", shirt: "#e0464e", pants: "#1f2937", hair: "#151515", hat: "cap", hatColor: "#111827" }, pos: [14, 9], area: [8, 20, 7.4, 10.4],
        lines: ["시청각실에서 지금 우리 동아리 영화 상영 중이야! 화면을 봐 봐.", "제목은 「레고 밟은 날」. 장르는… 공포!", "팝콘은 없어. 대신 순창 고추장 과자는 어때?"] },
      { id: "star", name: "별이", role: "옥상 테라스 친구", look: { skin: "#f6d0b0", shirt: "#7c5cff", pants: "#334155", hair: "#3b2a20", hat: "bow", hatColor: "#ffc93c" }, pos: [26, 16], area: [22, 27.6, 12.4, 17.6],
        lines: ["여기서 보면 순창이 다 보여! 저쪽이 강천산 방향이래.", "망원경 봤어? 가끔 이상한 게 보인대…", "밤에 오면 별이 쏟아진대. 그래서 내 이름이 별이야. …진짜야."] },
    ],
    gags: [
      ...CORE_GAGS(),
      { kind: "hat", pos: [24.6, 1.4], r: 1.6, label: "의상 옷걸이", verb: "모자 써 보기" },
      { kind: "text", pos: [27.4, 12.2], r: 1.6, label: "망원경", verb: "들여다보기", lines: ["저 멀리 강천산이 보여요! 단풍이 울긋불긋해요.", "어? 하늘에 UFO가?! …아, 비둘기네요.", "저기 롤러장 지붕에 태양광 패널이 반짝여요."] },
      { kind: "text", pos: [3.2, 15.5], r: 2.2, label: "스크린", verb: "영화 보기", lines: ["상영 중: 「레고 밟은 날」 — 주인공이 레고를 밟고 하늘로 날아올라요. 관객 모두 '아야!'", "상영 중: 「급식실의 비밀」 — 오늘 떡볶이가 나온다는 소문은 사실이었다!", "상영 중: 「투명인간 크로마키」 — 초록 옷을 입은 주인공이 사라졌어요!"] },
    ],
  },

  e1: {
    name: "스포츠동 1층", short: "스포츠 1층", building: "east", level: 1,
    slabs: [[0, 22.2, 0, 66.6], [-2.2, 0, 27.4, 34.6]],
    outline: [[0, 0], [22.2, 0], [22.2, 66.6], [0, 66.6], [0, 34.6], [-2.2, 34.6], [-2.2, 27.4], [0, 27.4]],
    rooms: [
      { id: "e1-radio", name: "방송실", rect: [0, 3.8, 0, 8], kind: "broadcast", doors: [{ side: "s", at: 1.9, w: 1.3 }], floor: "carpet", color: "#9b7bff", quiz: "e1-radio",
        desc: "롤러장에 음악과 안내 방송을 내보내는 방이에요." },
      { id: "e1-locker", name: "스케이트보관소", rect: [3.8, 11.2, 0, 8], kind: "skateLocker", doors: [{ side: "s", at: 7.5, w: 1.6 }], floor: "tile", color: "#2fb2ff", quiz: "e1-locker",
        desc: "롤러스케이트를 보관하는 선반이 줄지어 있어요." },
      { id: "e1-wcm", name: "화장실(남)", rect: [11.2, 15.2, 0, 5.2], kind: "toilet", solid: true, doors: [{ side: "s", at: 13.2 }], noDex: true, sign: "남" },
      { id: "e1-wcf", name: "화장실(여)", rect: [15.2, 19.2, 0, 5.2], kind: "toilet", solid: true, doors: [{ side: "s", at: 17.2 }], noDex: true, sign: "여" },
      { id: "e1-rest", name: "쉼터", rects: [[19.2, 22.2, 0, 8], [11.2, 19.2, 5.2, 8]], kind: "ehall", open: true, noDex: true, floor: "tile" },
      { id: "e1-shop", name: "매점", rect: [0, 4.2, 20, 24.6], kind: "shop", doors: [{ side: "e", at: 22.3, w: 1.6 }], floor: "tile", color: "#ff7a1a",
        desc: "간식과 음료를 파는 작은 가게예요. 롤러 타고 나서 시원한 음료 한 잔!" },
      { id: "e1-elev", name: "엘리베이터", rect: [0, 3, 24.6, 27.4], kind: "elevator", solid: true, doors: [{ side: "e", at: 26 }], noDex: true },
      { id: "e1-vest", name: "스포츠동 방풍실", rect: [-2.2, 0, 27.4, 34.6], kind: "vestibule", doors: [{ side: "e", at: 31, w: 2.2 }], floor: "mat", color: "#9b7bff", noDex: true },
      { id: "e1-stair", name: "계단", rect: [0, 3.6, 40, 46.5], kind: "stairs", doors: [{ side: "e", at: 43.2, w: 1.6 }], noDex: true },
      { id: "e1-parents", name: "학부모 대기공간", rect: [0, 5, 8, 20], kind: "waiting", open: true, floor: "wood", color: "#3fd16f", quiz: "e1-parents", quizAt: [1.2, 9.2],
        desc: "보호자가 앉아서 기다리며 롤러장을 볼 수 있는 곳이에요." },
      { id: "e1-lobby", name: "스포츠동 로비", rect: [0, 5, 24.6, 46.5], kind: "hall", open: true, noDex: true, floor: "tile" },
      { id: "e1-wait", name: "대기공간", rect: [0, 5, 46.5, 66.6], kind: "waiting", open: true, floor: "wood", color: "#3fd16f",
        desc: "롤러장 남쪽 끝의 쉼터예요. 스케이트 끈을 묶고 준비해요." },
      { id: "e1-rink", name: "롤러스케이트장", rect: [5, 22.2, 8, 66.6], kind: "rink", open: true, floor: "rink", color: "#ff4747", quiz: "e1-rink", quizAt: [6.2, 10.4], game: "race", gameAt: [19.0, 37],
        desc: "타원형 트랙을 씽씽 달리는 실내 롤러스케이트장이에요. 벽에는 안전매트가 있어요." },
    ],
    exits: [{ axis: "x", c: -2.2, at: 31, w: 2.2, to: "outdoor", spawn: "fromEast", label: "스포츠동 출입구", verb: "밖으로 나가기" }],
    elevator: { x: 3.9, z: 26, face: -Math.PI / 2 },
    spawns: { fromOutside: { x: -1.0, z: 31, face: Math.PI / 2 }, elevator: { x: 4.2, z: 26, face: Math.PI / 2 } },
    npcs: [
      { id: "coach", name: "롤러 코치", role: "롤러장 선생님", look: { skin: "#e9b98f", shirt: "#ff4747", pants: "#1f2937", hair: "#151515", hat: "helmet", hatColor: "#ffd91a" }, pos: [21.3, 34.2], face: -Math.PI / 2,
        lines: ["헬멧 쓰고, 보호대 하고, 준비됐지?", "트랙 위 빛나는 표시에서 F를 누르면 레이스 시작이야!", "저기 쌩쌩 할아버지는 왕년에 '롤러장의 번개'였대. 조심해!"] },
      { id: "grandpa", name: "쌩쌩 할아버지", role: "롤러장 단골", look: { skin: "#f1cfb2", shirt: "#2fb2ff", pants: "#334155", hair: "#e5e5e5", hat: "helmet", hatColor: "#ff4747" }, pos: [5.9, 50], area: [5.5, 6.4, 40, 60],
        lines: ["허허, 내가 이래 봬도 롤러장의 번개였지!", "젊은 친구, 나랑 한 판 붙어 볼 텐가?", "할아버지가 왜 이렇게 빠르냐고? 매일 아침 고추장 한 숟갈이지!"] },
      { id: "shopkeeper", name: "매점 이모", role: "매점", look: { skin: "#f3cfae", shirt: "#ffb000", pants: "#5b4b6b", hair: "#3b2a20", hat: "bun" }, pos: [1.2, 22.3], face: Math.PI / 2,
        lines: ["어서 와! 오늘은 바나나우유 1+1이야!", "…근데 너 돈 있니? 없구나. 괜찮아, 구경은 공짜야!", "롤러 타고 나면 꼭 물 마시렴. 물은 공짜란다!"] },
    ],
    gags: [
      { kind: "toilet", pos: [13.2, 5.9] }, { kind: "toilet", pos: [17.2, 5.9] },
      { kind: "text", pos: [20.7, 1.3], r: 1.5, label: "정수기", verb: "물 마시기", lines: WATER_LINES },
      { kind: "mic", pos: [1.4, 2.2], r: 1.5, label: "방송 마이크", verb: "방송하기" },
      { kind: "text", pos: [7.5, 2.0], r: 1.8, label: "사물함", verb: "열어 보기", lines: ["사물함을 열었더니… 짝짝이 양말 한 짝이!", "사물함 안에 쪽지가 있어요. '레이스에서 할아버지 이기는 법: 안쪽 코스로 달려라.'", "스케이트 한 켤레가 가지런히 놓여 있어요. 사이즈 300… 누구 발이지?"] },
    ],
  },

  e2: {
    name: "스포츠동 2층", short: "스포츠 2층", building: "east", level: 2,
    slabs: [[0, 22.2, 0, 66.6]],
    outline: [[0, 0], [22.2, 0], [22.2, 66.6], [0, 66.6]],
    rooms: [
      { id: "e2-futsal", name: "풋살장", rect: [4.5, 22.2, 0, 27.4], kind: "futsal", doors: [{ side: "w", at: 6, w: 1.8 }, { side: "w", at: 21, w: 1.8 }], floor: "court", color: "#2bbf4a", quiz: "e2-futsal", quizAt: [6.0, 25.2], game: "penalty", gameAt: [15.6, 9.4],
        desc: "인조 잔디가 깔린 실내 풋살장이에요. 비가 와도 공을 찰 수 있어요." },
      { id: "e2-elev", name: "엘리베이터", rect: [0, 3, 24.6, 27.4], kind: "elevator", solid: true, doors: [{ side: "s", at: 1.5 }], noDex: true },
      { id: "e2-lockm", name: "탈의실(남)", rect: [6, 22.2, 27.4, 31.4], kind: "lockerRoom", doors: [{ side: "s", at: 8.2, w: 1.4 }], floor: "wood", color: "#2fb2ff", quiz: "e2-lockm",
        desc: "운동하기 전에 옷을 갈아입는 남자 탈의실이에요." },
      { id: "e2-lockf", name: "탈의실(여)", rect: [6, 22.2, 33, 37], kind: "lockerRoom", doors: [{ side: "n", at: 8.2, w: 1.4 }], floor: "wood", color: "#ff6b8b",
        desc: "운동하기 전에 옷을 갈아입는 여자 탈의실이에요." },
      { id: "e2-gym", name: "실내체육관", rect: [4.5, 22.2, 37, 66.6], kind: "gym", doors: [{ side: "w", at: 41, w: 1.8 }], floor: "gym", color: "#ff9a1a", quiz: "e2-gym", quizAt: [6.2, 39],
        desc: "농구 골대가 있는 넓은 체육관이에요. 농구, 배드민턴, 피구를 해요." },
      { id: "e2-wait", name: "대기공간", rect: [0, 4.5, 0, 24.6], kind: "waiting", open: true, floor: "wood", color: "#3fd16f",
        desc: "풋살장 옆 쉼터예요. 교류데크로 나가면 자치배움터 2층이에요." },
      { id: "e2-lobby", name: "스포츠동 2층 로비", rects: [[0, 6, 27.4, 37], [6, 22.2, 31.4, 33]], kind: "hall", open: true, noDex: true, floor: "tile" },
      { id: "e2-wait2", name: "대기공간", rect: [0, 4.5, 37, 48], kind: "hall", open: true, noDex: true, floor: "wood" },
      { id: "e2-climb", name: "실내클라이밍", rect: [0, 4.5, 48, 66.6], kind: "climb", open: true, floor: "mat", color: "#9b7bff", quiz: "e2-climb", quizAt: [3.4, 48.8], game: "climb",
        desc: "벽에 붙은 홀드를 잡고 올라가는 클라이밍 벽이에요. 바닥에는 푹신한 안전매트가 있어요." },
    ],
    exits: [{ axis: "x", c: 0, at: 13, w: 1.6, to: "w2", spawn: "fromDeck", label: "교류데크", verb: "자치배움터로 건너가기" }],
    elevator: { x: 1.5, z: 28.2, face: Math.PI },
    spawns: { elevator: { x: 1.5, z: 28.6, face: 0 }, fromDeck: { x: 1.2, z: 13, face: Math.PI / 2 } },
    npcs: [
      { id: "keeper", name: "골대지기", role: "풋살 골키퍼", look: { skin: "#e9b98f", shirt: "#22c55e", pants: "#1f2937", hair: "#151515", hat: "none", gloves: true }, pos: [13.35, 2.1], face: 0, still: true,
        lines: ["내 별명은 '순창의 거미손'이야!", "승부차기 할래? 페널티 마크에서 F를 눌러!", "사실… 공이 무서워서 눈 감고 막아. 쉿!"] },
      { id: "hoop", name: "민혁", role: "농구 동아리", look: { skin: "#f3cfae", shirt: "#ff9a1a", pants: "#1f2937", hair: "#151515", hat: "headband", hatColor: "#ffffff" }, pos: [13, 52], area: [8, 18, 42, 62],
        lines: ["농구공이 왜 둥근지 알아? 네모나면 드리블이 안 되거든!", "실내체육관은 비 와도 문제없어. 최고지?", "클라이밍 벽 꼭대기 종 쳐 봤어? 나는 아직…"] },
    ],
    gags: [
      { kind: "text", pos: [13.35, 63.6], r: 2.0, label: "농구 골대", verb: "슛 쏘기", lines: ["슛! …림을 맞고 튕겨서 내 이마에 맞았어요. 아야!", "슛! 철썩! 골인이에요! (아무도 안 봤지만 진짜예요)", "슛! 공이 골대 위에 끼었어요… 누가 좀 꺼내 줘요!"] },
    ],
  },
};

// 바깥(창의교육마당)에서 문으로 이어지는 곳
export const OUTDOOR = {
  name: "창의교육마당", short: "바깥",
  doors: [
    { x: -4.1, z: -9.4, r: 2.6, label: "자치배움터 정문", verb: "들어가기", to: "w1", spawn: "fromMain" },
    { x: 15.0, z: -22.4, r: 2.2, label: "부출입구", verb: "들어가기", to: "w1", spawn: "fromSub" },
    { x: 25.2, z: 3.9, r: 2.4, label: "스포츠동 출입구", verb: "들어가기", to: "e1", spawn: "fromOutside" },
  ],
  spawns: { start: { x: -2, z: -3, face: Math.PI }, fromMain: { x: -4.1, z: -7.8, face: 0 }, fromSub: { x: 16.2, z: -22.4, face: Math.PI / 2 }, fromEast: { x: 24.0, z: 3.9, face: -Math.PI / 2 } },
  zones: [
    { id: "o-plaza", name: "창의교육마당", rect: [-15.2, 15.2, -10, -0.4], quiz: "o-plaza", quizAt: [-0.6, -8.4], desc: "자치배움터 정문 앞의 넓은 마당이에요. 축제를 열고, 친구들과 공을 차요." },
    { id: "o-park", name: "주차장", rect: [-21.4, 13.4, 0.5, 38], desc: "자동차 49대를 세울 수 있는 주차장이에요. 차가 다니니 조심조심!" },
    { id: "o-bike", name: "자전거 주차장", rect: [16, 19, -27.5, -19], quiz: "o-bike", quizAt: [18.6, -18.2], desc: "자전거 7대를 세울 수 있는 곳이에요. 부출입구 바로 옆이에요." },
    { id: "o-deck", name: "교류데크 아래", rect: [15, 27.5, -21, -12], quiz: "o-deck", quizAt: [22.6, -11.4], desc: "머리 위 다리가 교류데크예요. 2층에서 자치배움터와 스포츠동을 이어 줘요." },
  ],
  npcs: [
    { id: "minji", name: "민지", role: "자치회 회장", look: { skin: "#f6d0b0", shirt: "#22b8a0", pants: "#3a3f6b", hair: "#2b1d16", hat: "bow", hatColor: "#ff6b8b" }, pos: [-5, -5], area: [-9, 2, -7.6, -2.6],
      lines: ["안녕! 나는 자치회 회장 민지야. 여기는 순창 청소년 자치배움터 앞 창의교육마당이야.", "정문으로 들어가면 1층, 엘리베이터 타면 4층까지 갈 수 있어. 오른쪽 큰 건물은 롤러장이랑 풋살장이 있는 스포츠동이야!", "방에 들어갈 때마다 공간 카드가 열려. 도감을 다 채워서 탐험대장이 되어 봐!"] },
    { id: "halmae", name: "순창 할머니", role: "동네 어르신", look: { skin: "#f1cfb2", shirt: "#c76b98", pants: "#5b4b6b", hair: "#dcdcdc", hat: "bun" }, pos: [-7.5, -6], area: [-9, -6, -7.4, -3.6],
      lines: ["순창 하면 고추장이지! 저기 장독들 보이니?", "장이 맛있게 익어 가듯, 너희 꿈도 여기서 무럭무럭 익어 가길 바란다~", "할머니가 퀴즈 하나 낼까? 고추장이 제일 무서워하는 건? …'맵다'는 소리! 허허."] },
    { id: "dog", name: "장군이", role: "마당 강아지", animal: "dog", pos: [3, -4], area: [-5, 6, -7.6, -2.6],
      lines: ["멍! 멍멍!", "(꼬리를 신나게 흔들어요. 같이 놀자는 것 같아요!)", "멍! (공 차는 거 보여 달래요.)"] },
  ],
};

export const HATS = {
  none: "모자 없음", cap: "야구모자", bow: "리본", headphones: "헤드폰",
  crown: "왕관", party: "고깔모자", chef: "요리사 모자", pirate: "해적 모자", banana: "바나나",
};
export const COSTUME_HATS = ["crown", "party", "chef", "pirate", "banana"];
export const SHIRTS = ["#ff5a5f", "#2f80ed", "#27ae60", "#f2c94c", "#9b51e0"];

export const TOILET_LINES = ["똑똑… 안에 누가 있어요! 잠깐만요~", "지금은 볼일이 없어요. 다음에 올게요!", "쏴아아~ 물 내리는 소리가 들려요.", "문에 붙은 쪽지: '휴지는 휴지통 말고 변기에!'"];
export const LEGO_LINES = ["으악! 레고 밟았다!", "아야야! 레고는 정리하고 놀아요!", "끄아악! 세상에서 제일 아픈 게 레고 밟기래요!"];
export const ELEVATOR_LINES = ["♪ 띵~ 엘리베이터 음악이 흘러나와요.", "♪ 띵~ 거울을 보며 머리를 정리해요.", "♪ 띵~ 아무도 말을 안 해요. 엘리베이터는 원래 어색해요."];
