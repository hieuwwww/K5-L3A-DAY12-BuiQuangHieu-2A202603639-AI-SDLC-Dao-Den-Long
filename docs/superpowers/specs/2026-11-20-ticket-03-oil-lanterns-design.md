# Ticket-03 — Đèn cạn dầu: thiết kế Phase 3

## Mục tiêu và phạm vi

Chuyển từ thắng sớm khi thắp tất cả đèn sang giữ ít nhất 60% đèn sáng đến bình minh; đèn có dầu, tắt, châm dầu, thắp lại. Bóng Mực nhắm đèn yếu, có thể hút dầu; tăng sức chứa theo lần thắp; thay điểm và thời lượng đêm. Nâng headless contract lên v1.2, giữ 60 Hz, tính quyết định và các luật Phase 1–2 không bị thay thế. Giao diện hiển thị dầu, sức chứa và bảng màu dễ phân biệt; không để trình duyệt quyết định luật chơi.

## Cách tiếp cận

- **Chọn:** `src/simulation.js` giữ trạng thái đèn, thời điểm hút và luật thắng; lưu dầu bằng số nguyên `fuel_ticks` (1 đơn vị dầu = 60 fuel_ticks), snapshot chuyển sang một chữ số thập phân. Browser chỉ dựng hình/nhấp nháy từ snapshot và cài đặt. Tránh sai số ở mốc 0/30/100 và giữ kết quả headless tái lập.
- **Không chọn:** dầu dạng số thực rồi làm tròn khi so sánh; dễ lệch biên khi cộng hao và nhiều Bóng Mực.
- **Không chọn:** xử lý dầu và vùng an toàn trong renderer; headless sẽ khác browser.

## Mô hình trạng thái và thứ tự

- Đèn bắt đầu `lit=false, fuel_ticks=0, deposited=0, ever_lit=false, relit_count=0`. Scenario được vá trước tick 0; `lit:true` không có fuel nghĩa là 100, `ever_lit` mặc định theo `lit`, `relit_count` mặc định 0. Đèn tắt có fuel 0. Giá trị dầu nhập scenario quy đổi một lần sang fuel_ticks; đầu ra snapshot `fuel` làm tròn một chữ số thập phân. `target_lantern_id` của shade là ID đèn đang hút hoặc mục tiêu đèn wander; mục tiêu không hợp lệ được bỏ qua khi cập nhật.
- Trong mỗi simulation tick: giữ thứ tự Ticket-02, tại bước 2 trừ 1/60 dầu tự hao cho mọi đèn sáng và 5/60 cho **mỗi Bóng Mực đã ở trạng thái drain khi bước bắt đầu**. Phát `fuel_drain` cho mỗi con đang hút ở mỗi tick thứ 60 của thời gian mô phỏng (sau khi trừ dầu), `fuel` là dầu còn lại sau hao/hút, làm tròn một chữ số; tick tắt đèn vẫn ghi sự kiện theo quy tắc tick thứ 60. Ngay sau bước 2, đèn có fuel ≤ 0 tắt, deposited về 0, phát `lantern_out` một lần; `ever_lit` vẫn đúng. Sau đó cập nhật Mây, tương tác, Bóng Mực và các bước cũ; xét thua hết lửa trước, rồi mới xét bình minh sau mọi cập nhật. Bóng vừa vào drain chỉ hút từ tick kế tiếp (đã được duyệt).
- Đèn chưa sáng nhận đom đóm để nạp: lần đầu cần 10, từng sáng rồi cần 5. Đủ ngưỡng thì `lit=true, fuel_ticks=6000, ever_lit=true`, tăng `successful_lights`, `relit_count` chỉ tăng với lần thắp lại; `lantern_lit` thêm `relight` boolean. Đèn sáng có fuel < 100 nhận châm dầu theo `min(carried, ceil((100-fuel)/10))` với dầu tính chính xác từ fuel_ticks; mỗi đom đóm +10 dầu và chặn ở 100, phát `refuel {lantern_id,amount,fuel}`. Khi không mang đom đóm, đèn vẫn có thể là đích gần nhất nhưng không có sự kiện. Đèn đầy dầu không phải đích tương tác. Chọn đèn đủ điều kiện gần nhất XZ, ID nhỏ hơn khi hòa. Giữ sự kiện `deposit` cho nạp vào đèn tắt.
- Sức chứa `min(20,10+2*successful_lights)`, khởi đầu 0 lần thắp mỗi đêm (scenario có thể đặt `player.successful_lights`). Điểm: +5 mỗi đom đóm đã dùng; +100 thắp lần đầu, +40 thắp lại; stun shade +15 nếu **ngay trước pulse** đang drain, không thì +5; bình minh thắng +50+floor(fuel) mỗi đèn còn sáng và +50 mỗi lửa; không thưởng thời gian. Replay khởi tạo lại điểm đêm và số lần thắp; tổng điểm chỉ cộng lúc thắng như Ticket-02.
- Shade ở wander ưu tiên đèn sáng fuel < 30 gần nhất (theo vị trí shade, hòa ID), nếu không có thì về đèn tắt gần nhất; chase giữ hành vi đuổi Mây. Đến cách đèn yếu ≤2 m XZ thì vào drain và đứng yên; từ drain chuyển chase nếu Mây cách ≤6 m, nếu không thì wander khi đèn hết dầu, được châm lên ≥30 hoặc lệch >2 m. Pulse đưa sang stunned; hết choáng về wander. Vùng an toàn chỉ tồn tại khi đèn sáng và fuel ≥30; hồi dầu qua mốc này đẩy shade gần đó ra mép trong tối đa 30 tick và không gây sát thương trong lúc đẩy, như lúc vừa thắp.
- Thời lượng đêm 240/270/300 giây. Khi hết giờ: nếu còn lửa và đèn sáng ≥ ceil(0.6×số đèn), thắng `dawn_survived`; ngược lại thua `dawn`. Không còn `all_lit` hoặc thắng sớm.

## Contract và giao diện

- `game.contract.json`, cấu hình chuẩn và validator cùng chuyển thành v1.2 với tám tuning mới và thời lượng mới; cập nhật schema scenario trong `src/contract-io.js` cho đèn, player, shade; snapshot giữ v1.1 fields và thêm fuel/ever_lit/relit_count/capacity, shade `drain`; sự kiện mới theo ticket. Mọi scenario/test cũ chịu tác động phải cập nhật có ghi lý do; không skip.
- HUD cho biết đang mang/sức chứa, số đèn sáng/ngưỡng, đèn gần nhất có dầu hoặc tiến độ nạp. Trên đèn sáng có thanh dầu; dưới 30 thanh và đèn nhấp nháy 1 Hz. Đèn tắt xẹp 20% và có vết rách giấy để nhận biết không cần màu. Setting “Bảng màu dễ phân biệt” lưu bền: viền và mắt Bóng Mực đổi #7A3CFF → #00B3FF; màu cảnh báo UI #FF5A5F → #FFFFFF kèm ⚠. Tín hiệu hiển thị không thay headless.
- Tạo ADR về mô hình dầu/thắng, changelog breaking changes và bằng chứng phase qua test scenario headless, Node và browser smoke.

## Kiểm chứng và giới hạn

Test các biên dầu 0/29.9/30/100, tương tác hòa ID, nhiều drain cộng dồn, drain tick đầu/tick 60, thắp lại, pulse khi drain, sức chứa 20, bình minh tick cuối, no_flames ưu tiên, scenario và byte-identical JSONL. Browser xem trạng thái đèn đầy/yếu/tắt, chế độ mù màu và settings sau reload; chạy `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check`. Không tự nhận đo FPS 60 giây nếu chưa thực hiện.

Không thay đổi tốc độ di chuyển, các thông số combat khác, số lượng đảo/đèn, hoặc gameplay bằng logic riêng ở browser. Không tag `phase-3` trước khi toàn bộ yêu cầu được kiểm chứng.
