# 당근마켓 클론 웹앱 설계

## 기능 요약
- 게시판 (사진 + 글 + 희망가격)
- 닉네임 + 비밀번호로 사용자 식별 (회원가입/로그인 없음)
- 사용자 간 실시간 채팅
- 사용자 간 포인트 거래 (포인트는 어드민이 수동 지급)

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | 풀스택, SSR/CSR 혼합 |
| DB + 실시간 | Firestore | 실시간 채팅, 게시판 모두 처리 가능 |
| 이미지 업로드 | Firebase Storage | Firestore와 같은 생태계 |
| 배포 | Firebase Hosting | Next.js static export 또는 Cloud Functions |
| 스타일 | Tailwind CSS | 빠른 UI 개발 |

> Socket.io, PostgreSQL, Prisma, Cloudinary 불필요 — Firebase로 통합

---

## 사용자 식별 방식

```
닉네임 + 비밀번호 입력
→ Firestore users 컬렉션에서 닉네임 조회
→ 없으면 자동 생성 (bcrypt로 비번 해시 저장)
→ 있으면 비번 대조
→ 확인된 userId를 localStorage에 저장 (세션 유지)
```

---

## Firestore 데이터 구조

```
users/
  {userId}/
    nickname: string
    passwordHash: string
    points: number
    createdAt: timestamp

posts/
  {postId}/
    title: string
    description: string
    price: number
    images: string[]       // Firebase Storage URLs
    status: "ACTIVE" | "RESERVED" | "SOLD"
    authorId: string
    authorNickname: string
    createdAt: timestamp

chatRooms/
  {roomId}/
    postId: string
    participants: [userId1, userId2]
    createdAt: timestamp

    messages/             // 서브컬렉션
      {messageId}/
        senderId: string
        senderNickname: string
        content: string
        createdAt: timestamp

pointTransactions/
  {txId}/
    senderId: string
    receiverId: string
    amount: number
    memo: string
    createdAt: timestamp
```

---

## 라우트 구조

```
app/
├── page.tsx              # 게시글 목록 (누구나 열람)
├── posts/
│   ├── [id]/             # 게시글 상세 + 채팅하기 버튼
│   └── new/              # 게시글 작성
├── chat/
│   ├── page.tsx          # 내 채팅 목록
│   └── [roomId]/         # 채팅방 (Firestore 실시간 구독)
├── profile/
│   └── [nickname]/       # 프로필 + 포인트 잔액 + 송금
└── admin/
    └── page.tsx          # 어드민: 포인트 수동 지급
```

---

## 핵심 흐름

### 글 작성 / 채팅 시작
```
버튼 클릭 → 닉네임+비번 입력 모달
→ Firestore users에서 인증
→ localStorage에 userId 저장
→ 이후 액션 진행
```

### 실시간 채팅
```
Firestore messages 서브컬렉션에 onSnapshot 구독
→ 새 메시지 즉시 반영 (Socket.io 불필요)
```

### 포인트 송금
```
Firestore Transaction으로 원자적 처리
→ 내 points 차감 + 상대 points 증가 + pointTransactions 기록
```

### 어드민 포인트 지급
```
/admin 페이지에서 닉네임 검색
→ 지급할 금액 입력
→ Firestore Transaction으로 points 증가 + 기록
```

---

## 구현 순서

1. **Firebase 프로젝트 세팅** + Next.js 초기화
2. **게시판** — 목록/상세/작성/이미지 업로드
3. **사용자 식별** — 닉네임+비번 모달, Firestore upsert
4. **채팅** — 채팅방 생성, 실시간 메시지
5. **포인트** — 잔액 표시, 송금, 어드민 지급 페이지
