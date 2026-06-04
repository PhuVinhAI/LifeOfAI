# ADR-001: ECS + Trait-Based Object System

## Status
Accepted

## Context
Thế giới LifeOfAI cần mô phỏng hàng trăm đồ vật với các trạng thái và hành vi phức tạp, đồng thời hỗ trợ nhiều AI cùng tương tác. Các đồ vật có chung nhiều pattern hành vi (dùng được, bẩn đi, hỏng, sửa được, chứa đồ...) nhưng tổ hợp theo cách khác nhau.

Cần chọn kiến trúc object system cho phép:
- Tái sử dụng hành vi giữa các đồ vật khác nhau
- Mở rộng vô hạn mà không đụng code cũ
- Logic FSM riêng cho từng khía cạnh hành vi
- Test từng hành vi độc lập

## Decision

**ECS (Entity Component System) với Trait-Based Object.**

- Entity = ID + tập hợp Component
- Component = dữ liệu thuần, không có logic
- System = logic xử lý entity có component phù hợp
- Trait = "miếng ghép hành vi" đóng gói FSM + logic cho một khía cạnh cụ thể

Object = Entity + tổ hợp Trait thay vì OOP class hierarchy.

Mỗi Trait:
- Có FSM riêng (các trạng thái + transition)
- Xử lý logic `onInteract()` cho Capability nó đăng ký
- Có `tick()` để cập nhật trạng thái mỗi frame
- Được test độc lập 1 lần

## Alternatives Considered

### OOP Class Hierarchy (Object → Furniture → Toilet)
- **Từ chối vì:** Diamond inheritance khi cần tổ hợp hành vi. Toilet vừa là Usable, Cleanable, Breakable — không thể kế thừa từ 3 class cùng lúc. Số lượng class bùng nổ khi thêm đồ mới.

### Component-only ECS (không có Trait)
- **Từ chối vì:** Mỗi Component chỉ chứa dữ liệu, không có FSM. Cần thêm System riêng cho từng tổ hợp component → số lượng System bùng nổ.

### God Object (mỗi object tự implement tất cả logic)
- **Từ chối vì:** Trùng lặp code, không tái sử dụng được, khó test, khó mở rộng.

## Consequences

**Tích cực:**
- Thêm đồ vật mới = tổ hợp Trait có sẵn trong file cấu hình, không cần code
- Mỗi Trait test 1 lần, tổ hợp bất kỳ đều hoạt động
- Nhiều AI cùng tương tác: ECS xử lý đồng thời tự nhiên
- Dễ serialize (component là dữ liệu thuần)

**Đánh đổi:**
- Khái niệm Trait cần thời gian để quen (không phải pattern phổ biến trong web dev)
- Cần Trait Registry + Capability Resolver để phân giải `interact()` → Trait nào xử lý
- FSM bên trong Trait cần được thiết kế cẩn thận để không xung đột giữa các Trait trên cùng Object
