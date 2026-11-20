# Phase 1 — giả định và nhật ký

## Giả định

Các giá trị contract là lựa chọn cân bằng cho bản đầu: tốc độ 6 m/s; đom đóm 5/đèn; chứa tối đa 5; tương tác 2.5 m; pulse bán kính 5 m; đêm 300 giây; 3 lửa. Mất một lần chạm trừ một lửa; rơi ceil(50%) số đom đóm; invulnerability 1.5 giây. Điểm theo README và `game.contract.json`. `fall_enabled=false`, nên không có rơi khỏi đảo/hit fall.

## Nhật ký dùng AI

- Phase 1: dùng AI để lập thiết kế, kế hoạch, viết mô phỏng/CLI/game và kiểm thử. Ước tính token/chi phí: không có số đo đáng tin cậy từ harness; cần chủ repo điền số liệu thực tế nếu dashboard cung cấp.
- Lỗi phát hiện: test ban đầu so sánh tọa độ chính xác hơn contract làm tròn 3 chữ số; scenario patch đèn làm mất giá trị deposited; test scenario một đèn không phản ánh đủ năm đèn thắng. Đã điều chỉnh kiểm chứng để phù hợp quy ước contract.
- Tiết kiệm: dùng Node test runner và geometry thủ tục, không thêm asset pipeline hoặc framework.

## Evaluation / retro

- Đạt: core headless cơ bản, JSONL, scenario/input validation, deterministic compare và UI 3D tối giản. Lần ghi chép ban đầu: `npm test` 12/12; lần tái dựng từ tag: 18/18 và `npm run verify` passed.
- Đã có ảnh chụp và kiểm tra chạy 5 giây bằng Playwright Firefox trong `docs/proof/phase-1.md`; chưa xác nhận chơi trọn đêm hay thắng game trong browser.
- Lần sau: thêm scenario end-to-end cho từng loại sự kiện/terminal condition trước khi xây UI và ghi token usage ngay mỗi phase.
