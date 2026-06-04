# ADR-004: Goal-Driven AI (Dual-Layer Decision)

## Status
Accepted

## Context
Agent trong mô phỏng cần hành xử giống người thật: có kế hoạch, có ưu tiên, có chuỗi hành động phức tạp để đạt mục tiêu. Nếu Agent chỉ phản ứng đơn thuần với Need (đói → ăn, mệt → ngủ), nó sẽ không khác gì bot tự động.

Cần một hệ thống ra quyết định mà ở đó Agent:
- Chủ động lên kế hoạch (không bị động)
- Có ưu tiên giữa các nhu cầu đang cạnh tranh
- Có thể thực hiện chuỗi hành động phức tạp (không chỉ 1 tool rồi xong)
- Bị ảnh hưởng bởi Personality (không phải mọi Agent đều giống nhau)

## Decision

**Dual-Layer Decision System:**

```
Layer 1 — GOAL SELECTOR (chạy mỗi N tick)
  Input: Needs + Personality + Mood + thời gian trong ngày + sự kiện gần đây
  Output: 1 Goal ưu tiên cao nhất
  
  Ví dụ:
    - Đói 10% + Neuroticism cao → Goal: "satisfy_hunger" (urgency: 85)
    - Need social thấp + Extraversion cao → Goal: "socialize" (urgency: 70)
    - Đang giờ làm việc + Có job → Goal: "work" (urgency: 90)

Layer 2 — ACTION PLANNER (chạy liên tục trong Agent Loop)
  Input: Goal hiện tại + trạng thái thế giới + Object xung quanh
  Output: Stream suy nghĩ + chuỗi tool calls để đạt Goal
  
  Ví dụ Goal "satisfy_hunger":
    → "Đói quá, xem tủ lạnh có gì..."
    → interact("fridge", "open") → "trống"
    → "Hết đồ rồi, phải đặt đồ ăn..."
    → interact("phone", "use", {app: "delivery"})
    → Chờ ship đến → interact("food", "eat")
    → Goal hoàn thành → Goal Selector chọn goal tiếp theo
```

Goal Selector KHÔNG dùng AI — dùng công thức tính urgency để tiết kiệm token và đảm bảo tính nhất quán.

## Alternatives Considered

### Reactive (chỉ AI quyết định mọi thứ)
- **Từ chối vì:** AI sẽ phản ứng đơn giản với prompt "mày muốn làm gì?" — không có kế hoạch dài hạn. Mỗi turn AI phải tự nhớ mình đang làm gì → tốn context window.

### Fully scripted (không AI, script tất cả hành vi)
- **Từ chối vì:** Mất đi sự sáng tạo và tính bất ngờ của AI. Không đạt được độ "giống thật".

### Single-layer (AI tự quản lý cả goal lẫn action)
- **Từ chối vì:** AI phải vừa chọn mục tiêu vừa thực hiện trong cùng 1 context. Token tốn kém, dễ bị lạc hướng khi đang thực hiện dở chuỗi hành động.

## Consequences

**Tích cực:**
- Agent có kế hoạch dài hạn, không chỉ phản ứng
- Personality thực sự ảnh hưởng đến hành vi (không chỉ là text trong prompt)
- Goal Selector có thể mở rộng với Goal mới mà không thay đổi Action Planner
- Dễ debug: tách biệt "tại sao làm" khỏi "làm gì"

**Đánh đổi:**
- 2 layer tăng độ phức tạp so với reactive đơn giản
- Cần thiết kế urgency formula cẩn thận — sai công thức → Agent hành xử kỳ lạ
- Khi Goal thay đổi giữa chừng (ví dụ: đang nấu ăn thì bladder emergency), cần xử lý interrupt
