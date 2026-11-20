# Truy vết yêu cầu và bằng chứng (20/11/2026)

**Phạm vi:** bằng chứng trong workspace hiện tại; không phải xác nhận đã nộp hoặc đã đạt test ẩn. Chưa có tag nào nên **chưa có bằng chứng khớp tag**. Prompt gốc của người dùng được tìm trong lịch sử phiên OpenCode; giờ bên dưới là giờ địa phương ICT, không phải thời điểm phát hành trên GitHub.

| Phase | Prompt gốc nhận lúc | Yêu cầu chính và cách tự kiểm | Bằng chứng / giới hạn |
|---|---|---|---|
| 1 — PRD-0 | 14:56:15 | Game đêm đầu, CLI headless, 60 Hz, JSONL, tính tất định; `npm test`, `npm run verify`, `node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/game.jsonl` | `docs/proof/phase-1.md`, `tests/headless.test.js`, `tests/determinism.test.js`, `docs/notes/phase-1.md`; commit `621f2e3` lúc 15:00:43 là scaffold đầu phase, **không** chứng minh toàn bộ Phase 1 đã được tag. |
| 2 — Ticket-02 | 15:22:23 | Ba đảo/đêm, tuning v1.1, địch, lướt, pause và nội dung web; `npm test`, `npm run verify`, các scenario trong `tests/scenarios/` | `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md`, `docs/proof/phase-2.md`, `tests/browser-smoke.md`; chưa chơi thắng trọn ba đêm trên browser, chưa có tag/commit phase riêng. |
| 3 — Ticket-03 | 16:26:59 | Luật dầu, thắp lại, điều kiện thắng lúc bình minh, v1.2; `npm test`, `npm run verify`, `tests/phase3-simulation.test.js` | `docs/superpowers/specs/2026-11-20-ticket-03-oil-lanterns-design.md`, `docs/adr/2026-11-20-oil-lanterns-and-dawn.md`, `CHANGELOG.md`; chưa có tag/commit phase riêng. |
| 4 — Ticket-04 | 16:58:36 | v1.3, benchmark renderer, soak 10 đêm, leaderboard, accessibility, build; `npm test`, `npm run verify`, `npm run benchmark`, CLI trong README | `game.contract.json`, `bench.json`, `soak.json`, `docs/proof/phase-4-game.png`, `docs/demo/demo.mp4`, `tests/browser-smoke.md`, `docs/retro/2026-11-20-phase-1-to-4.md`; benchmark 1% low 24,72 FPS và soak RSS ~1,42× không đạt các ngưỡng đã ghi; chưa có tag hoặc Release. |

## Cách kiểm chứng lại

Từ clone sạch chạy `npm ci`, `npm test`, `npm run verify`, `npm run benchmark`, sau đó chạy các lệnh browser/soak ở README. `npm run benchmark` đo simulation, **không** thay thế benchmark web. Video hiện chỉ ghi hình chơi/cài đặt, không chứng minh chạy test và đo FPS; xem JSON và kết quả test riêng, không suy diễn clip thành bằng chứng khác.

## Trạng thái nộp bài

`SUBMISSION.md` và `RULES.md` tính hạn theo thời điểm tag và Release **trên GitHub**. Prompt Phase 2/3/4 không phải commit hoặc tag. Không được đổi tác giả/ngày commit, dựng lại commit/tag quá khứ hoặc gọi tag tạo sau hạn là đúng hạn. Nếu đã qua buổi lab, cần Coach xác nhận gia hạn trước khi xem các thay đổi mới là bài nộp hợp lệ. Đối chiếu lại thời điểm do Coach công bố (không suy ra hạn tuyệt đối chỉ từ prompt). Link LMS, trạng thái public và quyền xem ẩn danh phải do chủ repo xác nhận.
