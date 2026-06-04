# ADR-003: Capability-Based Interaction

## Status
Accepted

## Context
Trong game mô phỏng, Agent cần tương tác với hàng trăm loại Object khác nhau. Có 2 cách để AI gọi hành động:

1. **Tool-per-object:** Mỗi Object có tool riêng (`use_toilet()`, `open_fridge()`, `turn_on_tv()`, `play_game()`, `cook_food()`...). Số lượng tool = số Object × số hành động.
2. **Capability-based:** 1 tool `interact(object, action, params)` duy nhất. Action được phân giải động dựa trên Trait của Object.

Khi số Object tăng lên hàng trăm, cách 1 khiến context window của AI bị quá tải vì phải liệt kê quá nhiều tool. AI cũng khó chọn đúng tool khi danh sách quá dài.

## Decision

**1 tool `interact` duy nhất**, dùng Capability Resolver để phân giải thành Trait xử lý.

```
AI gọi: interact("toilet", "use")
  → Capability Resolver: Object "toilet" có Trait Usable, Cleanable, NeedProvider
  → Action "use" match với Trait Usable
  → Trait Usable.onInteract("use", agent, world)
  → Trả kết quả: "Bạn đã dùng toilet. Bladder +40."
```

Tool bổ trợ vẫn có (để AI hiểu thế giới):
- `look_around()` — quét phòng, trả về danh sách Object + vị trí
- `check_self()` — xem chỉ số bản thân
- `think()` — suy nghĩ (stream text) mà không hành động

## Alternatives Considered

### Many tools (tool-per-object)
- **Từ chối vì:** Context window sẽ tràn khi có >50 Object. AI gặp khó khăn chọn tool khi danh sách dài. Thêm Object mới = thêm tool mới = sửa AI layer.

### Category-based tools (tool-per-category)
- **Từ chối vì:** Vẫn cần nhiều tool (use_furniture, use_appliance, consume_food...). Ranh giới giữa các category mờ nhạt (lò vi sóng là appliance hay furniture?). Không giải quyết triệt để.

## Consequences

**Tích cực:**
- 1 tool duy nhất cho mọi tương tác — context window nhẹ
- Thêm Object mới không cần thêm tool — chỉ cần Object có Trait phù hợp
- Capability Resolver tập trung logic phân giải, dễ debug

**Đánh đổi:**
- AI cần hiểu rõ danh sách Object + action có thể làm (từ mô tả trong context, không từ tool schema)
- Capability Resolver phải đủ thông minh để báo lỗi rõ ràng khi AI gọi action không hợp lệ
- AI có thể gọi action không tồn tại → cần error handling trong loop
