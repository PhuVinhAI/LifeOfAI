# LifeOfAI — Bảng thuật ngữ

## Thực thể (Entities)

- **Agent** — Một AI sống trong thế giới mô phỏng. Agent có chỉ số nhu cầu, tính cách, mục tiêu, và ký ức. Agent tự ra quyết định và hành động thông qua vòng lặp AI (agent loop), không cần người dùng điều khiển.
- **Object** — Bất kỳ đồ vật nào trong thế giới có thể tương tác được: đồ nội thất, thiết bị, đồ ăn, dụng cụ. Object là tổ hợp của các Trait.
- **Room** — Một không gian khép kín chứa Object và Agent. Mỗi Room có lưới tọa độ (grid) xác định vị trí của mọi thứ bên trong.
- **Item** — Đồ vật nhỏ có thể cầm, di chuyển, tiêu thụ, hoặc chứa trong Container (ví dụ: đồ ăn, sách, chìa khóa).

## Hệ thống Agent

- **Need** — Một chỉ số sinh lý hoặc tâm lý của Agent. Need giảm dần theo thời gian (decay) và được đáp ứng thông qua tương tác với Object. Ví dụ: Đói, Khát, Năng lượng, Vệ sinh, Vệ sinh thân thể, Giải trí.
- **Goal** — Mục tiêu ngắn hạn hoặc dài hạn mà Agent hướng tới. Goal được chọn dựa trên mức độ khẩn cấp của Need, Personality, và hoàn cảnh hiện tại. Ví dụ: "Giải quyết cơn đói", "Kiếm tiền", "Giao tiếp xã hội".
- **Action** — Một hành động cụ thể Agent thực hiện để tiến tới Goal. Action được thực thi thông qua Capability của Object.
- **Memory** — Ký ức ngắn hạn (lịch sử hội thoại trong context window) của Agent. Khi vượt quá token limit, ký ức cũ nhất bị cắt bỏ.
- **Personality** — Tính cách bất biến của Agent, định nghĩa qua mô hình Big Five (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism). Personality ảnh hưởng đến mức độ ưu tiên của Goal và cách Agent phản ứng với sự kiện.
- **Mood** — Trạng thái cảm xúc thay đổi chậm (vài giờ đến vài ngày), tích lũy từ các sự kiện nhỏ.
- **Emotion** — Cảm xúc tức thời (vài giây đến vài phút), phản ứng trực tiếp với sự kiện vừa xảy ra.
- **Skill** — Kỹ năng của Agent trong một lĩnh vực (ví dụ: Nấu ăn, Sửa chữa, Lập trình). Skill tăng qua luyện tập và mở khóa Capability mới ở các cấp độ cao hơn.

## Hệ thống Thế giới

- **Trait** — Một "miếng ghép hành vi" đóng gói FSM và logic bên trong. Object = tổ hợp nhiều Trait. Mỗi Trait chịu trách nhiệm cho một khía cạnh hành vi của Object. Ví dụ: Usable, Cleanable, Breakable, Container, NeedProvider.
- **Capability** — Một hành động mà Object hỗ trợ. Capability được phân giải động từ tổ hợp Trait của Object. Agent tương tác với Object thông qua Capability thay vì gọi trực tiếp Trait.
- **FSM (Finite State Machine)** — Máy trạng thái hữu hạn bên trong mỗi Trait, định nghĩa các trạng thái và điều kiện chuyển trạng thái của Object. Ví dụ: sạch → bẩn → hỏng → đang sửa → sạch.
- **Recipe** — Công thức chế tạo: đầu vào (nguyên liệu + dụng cụ + kỹ năng yêu cầu) → đầu ra (sản phẩm + phụ phẩm).
- **Lifecycle** — Vòng đời của Agent: sinh ra, trưởng thành, già đi, chết.

## Hệ thống Vận hành

- **Tick** — Một bước thời gian trong mô phỏng. Mỗi Tick, tất cả System chạy, Need giảm, Object cập nhật trạng thái.
- **Turn** — Đơn vị tương tác của người dùng. Một Turn có thể chứa nhiều Tick. Người dùng bấm Play để bắt đầu Turn, Pause để tạm dừng.
- **Plugin** — Một module độc lập đóng gói Trait, System, Component, Tool, và Data cho một domain cụ thể (ví dụ: core-life, social, economy). Plugin được load bởi Plugin Loader mà không cần sửa core.

## Hệ thống AI

- **Agent Loop** — Vòng lặp AI: Agent nhận context → stream suy nghĩ → gọi tool → nhận kết quả → tiếp tục. Agent không tự dừng, chỉ dừng khi người dùng Pause.
- **Tool** — Hàm mà AI có thể gọi để tương tác với thế giới. Công cụ chính là `interact(object, action, params)`, phân giải qua Capability Resolver để tìm Trait phù hợp xử lý.
- **Context Window** — Tập hợp message history AI có thể "nhìn thấy" tại một thời điểm. Bao gồm system prompt, memory gần đây, trạng thái hiện tại của Agent và Room.

## Hệ thống UI

- **CLI** — Giao diện dòng lệnh, render bằng Ink (React for terminal). Hiển thị: bản đồ phòng, trạng thái Agent, stream suy nghĩ của AI, log tool call.
- **Mod** — Nội dung do người dùng tạo (Object mới, Trait mới, Recipe mới, Personality mới) đặt trong thư mục `mods/`, được load và override dữ liệu gốc.
