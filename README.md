# Đảo Đèn Lồng — Phase 3: Đèn cạn dầu

Game 3D góc nhìn thứ ba với ba đêm: Đảo Bến, Đảo Cau và Đảo Chuông. Mây nhặt đom đóm, thắp/châm dầu đèn, lướt và tỏa sáng để giữ ít nhất 60% đèn sáng tới bình minh, vượt qua Bóng Mực cùng Gió Lạc.

## Chạy game

```bash
npm install
npm start
```

Mở http://localhost:4173. (Sau khi clone: hai lệnh cài và chạy.)

## Điều khiển
- WASD: di chuyển · Space: nhảy · Shift: lướt · E: nạp đom đóm · F: tỏa sáng · Esc/P: tạm dừng.

## Điểm
- Điểm được cộng khi nạp đom đóm, thắp đèn, trúng pulse và thắng đêm; tổng điểm giữ qua các đêm thắng.

## Headless Test Contract v1.2

```bash
node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/game.jsonl
npm test
npm run verify
npm run benchmark
```

Tuning/map nằm trong `game.contract.json` và `src/maps.js`. Mô phỏng chạy 60 tick/giây, seed + scenario + inputs giống nhau cho JSONL giống hệt nhau. `--night` nhận 1, 2 hoặc 3; snapshots mặc định mỗi 10 tick. Pause giữ `sim_tick` và thời gian mô phỏng.

## Số liệu chuẩn

Tốc độ chạy 6 m/s, lướt 14 m/s trong 0.2 s; sức chứa ban đầu 10, tăng hai sau mỗi lần thắp thành công tới tối đa 20. Đèn chưa từng sáng cần 10 đom đóm, đèn từng sáng cần 5 để thắp lại; đèn đang sáng hao 1 dầu/s, châm dầu +10/đom đóm, Bóng Mực có thể hút 5 dầu/s khi đèn yếu. Đêm 1/2/3 kéo dài 240/270/300 giây. Toàn bộ tuning v1.2 xem trong `game.contract.json`.

## Sáng tạo của tôi

Tạo hình nhân vật và hiệu ứng ánh sáng thủ tục theo bảng màu chuẩn; âm thanh tổng hợp chạy ở browser. Renderer/audio/settings không thay đổi kết quả headless.

## Bằng chứng và ghi chép

- Kiểm tra Phase 1: `docs/proof/phase-1.md`
- Acceptance criteria Ticket-02: `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md`
- Thiết kế Ticket-03: `docs/superpowers/specs/2026-11-20-ticket-03-oil-lanterns-design.md`; quyết định dầu/thắng: `docs/adr/2026-11-20-oil-lanterns-and-dawn.md`; breaking changes: `CHANGELOG.md`.
- Checklist browser: `tests/browser-smoke.md`
- Nguồn và giấy phép: `CREDITS.md`, `LICENSE`.
