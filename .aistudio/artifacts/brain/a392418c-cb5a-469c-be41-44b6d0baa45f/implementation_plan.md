# Implementation Plan - 100% Authentic Mini Metro GUI Overhaul

Chuyển đổi toàn diện giao diện (GUI) của trò chơi thành thiết kế đồ họa vector tối giản, chuẩn xác 100% theo phong cách Mini Metro (Dinosaur Polo Club), đồng thời tích hợp chọn bản đồ các thành phố Việt Nam (Hà Nội, TP.HCM, Đà Nẵng, v.v.).

---

## 1. User Review & Confirmed Decisions
Dựa trên câu trả lời của người dùng:
1. **In-game HUD (Giao diện trong game)**:
   - Chuyển sang bố cục nguyên bản của Mini Metro: Góc trên cùng bên phải là Đồng hồ tròn tiến độ tuần (`Clock Ticker`) & Số lượng hành khách đã vận chuyển (`Passenger Delivery Counter`).
   - Khay chứa tài nguyên/kho bên dưới (`Bottom Inventory Dock`): Hiển thị các tuyến tàu khả dụng (vòng tròn màu tuyến), đầu tàu dự phòng, toa xe, hầm/cầu qua sông theo dạng icon tối giản.
   - Ẩn toàn bộ thanh drawer quản lý tuyến cồng kềnh bên trái và các thanh pill rườm rà phía trên.
2. **Start Menu (Màn hình khởi động)**:
   - Tái hiện 100% phong cách từ Screenshot 1: Nền xám đen tối giản `#232326` với các đường ray metro vector uốn lượn có tàu chạy ngầm.
   - Tiêu đề phong cách Harry Beck / London Underground: chữ trắng đậm, biểu tượng metro glyph góc cạnh `Mini Metro ■ ▲`.
   - Các nút bấm mũi tên đặc trưng kèm khung highlight xanh chữ nhật (`➔ Chơi / Play`, `➔ Thử thách / Daily Challenge`, `↓ Cài đặt / Options`, `↙ Thoát / Exit`).
   - Tích hợp bộ chọn bản đồ thành phố Việt Nam (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Hải Phòng, Cần Thơ) với preview bản đồ đường sông tối giản.
3. **Game Over (Màn hình kết thúc game)**:
   - Khắc phục triệt để lỗi ở Screenshot 2: Khi Game Over kích hoạt, tự động ẩn toàn bộ sidebar, topbar, HUD và drawer điều khiển.
   - Nền tối mờ tập trung tiêu cự (vignette focus) vào đúng nhà ga bị quá tải với vòng tròn đỏ cảnh báo.
   - Text kết quả màu trắng sắc nét, tương phản cao, định dạng typography thanh lịch chuẩn Mini Metro.
   - Các nút hành động (`Restart`, `Endless Mode`, `Creative Mode`, `Menu`) căn giữa gọn gàng, phong cách nút phẳng Mini Metro.

---

## 2. Proposed Architectural & Component Changes

### A. Màn hình Khởi động (`src/components/StartMenuModal.tsx`)
- Thay thế hoàn toàn giao diện cũ bằng visual identity nguyên bản từ Screenshot 1.
- Vector background động: Vẽ các tuyến metro mảnh chạy chéo 45°/90° với các toa tàu nhỏ trượt êm ái trên nền `#1d1e22`.
- Khối Menu trung tâm gồm:
  - Header: `Mini Metro` (font Sans-serif đậm, sạch sẽ, chuẩn tỷ lệ).
  - Navigation Buttons: Các nút bấm có mũi tên định hướng (`➔`, `↓`, `↙`) với hiệu ứng highlight xanh dương đặc trưng `#3b82f6` / `#4a88e8`.
  - Hộp thoại chọn thành phố: Khi nhấn "Chơi" (`➔ Chơi`), hiển thị bộ thẻ chọn thành phố Việt Nam với sơ đồ sông ngòi vector tối giản (Hà Nội - Sông Hồng; TP.HCM - Sông Sài Gòn; Đà Nẵng - Sông Hàn).

### B. Màn hình Game Over (`src/components/GameOverModal.tsx`)
- Xử lý vấn đề layer z-index và tương phản hiển thị:
  - Khi `isOpen = true`, toàn bộ `RouteSidebar`, `TopLeftMapCards`, và `Header` sẽ được gỡ hoặc ẩn hoàn toàn (`display: none` / conditional render).
  - Background overlay dùng màu đen mờ `rgba(15, 17, 23, 0.88)` với hiệu ứng radial mask làm nổi bật vị trí ga bị quá tải.
  - Typography trắng tinh `#ffffff` rõ nét:
    - Tiêu đề: **Game Over** (Font lớn, sắc nét, tương phản tối đa).
    - Thống kê: Số hành khách đã vận chuyển và số ngày hệ thống hoạt động trước khi quá tải.
    - Cụm nút bấm căn giữa màn hình với kiểu dáng Mini Metro xanh/trắng, không bị dính sang lề trái hay đè lên sidebar.

### C. In-Game HUD & Khay tài nguyên bên dưới (`src/components/Header.tsx`, `src/components/BottomToolbar.tsx`)
- **Top Bar tối giản**:
  - Góc trên bên phải: Đồng hồ hình tròn theo dõi chu kỳ tuần (Thứ Hai -> Chủ Nhật) + Số lượng hành khách được phục vụ (kèm icon hành khách tối giản).
  - Nút điều khiển tốc độ: Tạm dừng `||`, Tốc độ bình thường `▶`, Tốc độ nhanh `▶▶`.
  - Góc trên bên trái: Nút `Menu` tối giản và tên thành phố hiện tại.
- **Bottom Inventory Dock**:
  - Dải thanh công cụ đặt ở đáy màn hình chính giữa.
  - Hiển thị các tài nguyên theo biểu tượng đặc trưng của Mini Metro:
    - Tuyến đường: Các vòng tròn/viên thuốc màu tuyến có thể kéo thả để tạo tuyến mới.
    - Đầu tàu (Locomotives): Biểu tượng đầu tàu hình chữ nhật tối giản với số lượng tồn kho.
    - Toa tàu (Carriages): Biểu tượng toa tàu phụ.
    - Hầm / Cầu vượt sông (Tunnels): Biểu tượng nét đứt qua sông kèm số lượng còn lại.
  - Người chơi có thể click hoặc kéo tài nguyên trực tiếp lên bản đồ.

### D. Tinh chỉnh Canvas & Gameplay (`src/App.tsx`, `src/components/MapCanvas.tsx`)
- Tự động đóng sidebar quản lý khi chuyển sang chế độ chơi thuần Mini Metro.
- Đồng bộ mượt mà sự kiện chuyển cảnh từ Menu -> Chơi -> Game Over.
- Duy trì tính năng vay vốn ngân hàng tối giản khi người chơi cần mở rộng khẩn cấp mà không làm rườm rà HUD.

---

## 3. Verification Plan

### Automated Build Verification:
- Chạy `compile_applet` để xác minh TypeScript types, imports và bundle build không có lỗi.

### Manual / Visual Verification:
1. **Kiểm tra Start Menu**:
   - Mở app, xác nhận Start Menu hiển thị chuẩn giao diện như Screenshot 1: Nền vector tối, typography đậm, nút mũi tên kèm ô vuông highlight xanh.
   - Thử chọn các thành phố Việt Nam và nhấn Bắt đầu chơi.
2. **Kiểm tra In-Game HUD**:
   - Xác nhận thanh drawer cồng kềnh bên trái không còn che màn hình.
   - Góc trên phải hiển thị đúng đồng hồ tròn tuần và số khách.
   - Đáy màn hình hiển thị thanh dock tài nguyên tối giản (tuyến đường, đầu tàu, toa xe, hầm).
3. **Kiểm tra Game Over**:
   - Để một ga quá tải hoặc kích hoạt trạng thái Game Over.
   - Kiểm tra xem toàn bộ HUD và drawer có biến mất hoàn toàn không.
   - Kiểm tra độ tương phản văn bản chữ trắng trên nền tối, vị trí các nút hành động nằm ngay ngắn chính giữa màn hình.
