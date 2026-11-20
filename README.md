# Đảo Đèn Lồng — Phase 1

Game 3D góc nhìn thứ ba: Mây nhặt đom đóm và nạp năm Đèn Lồng Lớn để xua bóng đêm. Thắng khi thắp đủ năm đèn; thua khi hết lửa hoặc bình minh đến.

## Chạy game

```bash
npm install
npm start
```

Mở http://localhost:4173. (Sau khi clone: hai lệnh cài và chạy.)

## Điều khiển
- WASD: di chuyển · Space: nhảy · E: nạp đom đóm vào đèn gần nhất · F: tỏa sáng · R: chơi lại sau khi kết thúc.
- Giữ F chỉ kích hoạt một lần đến khi nhả và bấm lại.

## Điểm
- +10 mỗi đom đóm nhặt hoặc nạp; +50 mỗi đèn thắp (nạp đom đóm không làm mất điểm).
- +5 mỗi Bóng Mực bị choáng; +1 mỗi giây còn lại khi thắng; +20 mỗi lửa còn lại khi thắng.

## Headless Test Contract v1.0

```bash
node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/game.jsonl
npm test
npm run verify
```

Tuning chính xác nằm trong `game.contract.json`. Mô phỏng chạy 60 tick/giây, seed giống nhau cho JSONL giống hệt nhau. Có thể truyền `--scenario file.json --inputs file.json`; snapshots mặc định mỗi 10 tick.

## Giả định Phase 1

- Mỗi đèn cần 5 đom đóm; sức chứa là 5. Đêm kéo dài 300 giây.
- Mây có 3 lửa; pulse tiêu hao 1 lửa và có hồi chiêu 1 giây. Bóng Mực chạm Mây sẽ làm mất 1 lửa; rơi đom đóm bằng làm tròn lên một nửa số đang mang.
- Nhân vật/đảo dùng hình khối thủ tục, không dùng asset bên ngoài. Khoảng cách gameplay đo trên mặt phẳng XZ theo contract.
- Một vài trường contract (fall) chưa có cơ chế tương ứng; xem tuning và notes.

## Sáng tạo của tôi

Ánh sáng đom đóm bay lơ lửng, đèn màu vàng cam và sương xanh tím tạo tương phản ấm/lạnh; tất cả chỉ ở renderer, không thay đổi kết quả headless. Bằng chứng hồi quy: `npm test` và `npm run verify`.

## Bằng chứng và ghi chép

- Kiểm tra phase: `docs/proof/phase-1.md`
- Giả định/nhật ký AI/retro: `docs/notes/phase-1.md`
- Nguồn và giấy phép: `CREDITS.md`, `LICENSE`.
