# ADR-002: Plugin Architecture

## Status
Accepted

## Context
LifeOfAI bắt đầu là MVP 1 phòng + 1 AI, nhưng tầm nhìn là mô phỏng giống thật 99.99% với hàng chục domain: kinh tế, xã hội, giải trí, sức khỏe, giáo dục, giao thông...

Nếu code kiểu monolithic, mỗi domain mới thêm vào sẽ làm core phình to, khó test, khó maintain. Cần một cách để mỗi domain phát triển độc lập mà không phá vỡ domain khác.

## Decision

**Plugin Architecture** — mỗi domain là 1 plugin độc lập đóng gói tất cả thành phần của nó.

Core engine chỉ chứa abstraction (trait registry, capability resolver, event bus, game loop) và không chứa bất kỳ game logic cụ thể nào.

Mỗi plugin khai báo đầy đủ trong manifest:
```ts
interface Plugin {
  name: string
  dependencies: string[]
  traits: TraitClass[]
  systems: System[]
  components: ComponentSchema[]
  tools: ToolDefinition[]
  data: () => Promise<YAMLData[]>
}
```

Plugin Loader trong core:
- Đọc plugin manifest
- Đăng ký traits, systems, components, tools vào registry
- Load data (YAML/JSON) vào asset store
- Resolve dependency order giữa các plugin

## Alternatives Considered

### Monolithic với feature flags
- **Từ chối vì:** Core vẫn phình to, mọi domain vẫn sống chung 1 codebase. Feature flag không giải quyết được vấn đề tổ chức code.

### Microservices (mỗi domain 1 service riêng)
- **Từ chối vì:** Quá phức tạp cho game single-player. Network latency giữa các service làm chậm game loop. Chỉ hợp lý khi có multiplayer.

### Submodule-based (mỗi domain 1 git submodule)
- **Từ chối vì:** Git submodule khó quản lý versioning. Plugin architecture trong cùng 1 repo đơn giản hơn cho MVP.

## Consequences

**Tích cực:**
- Thêm domain mới = tạo thư mục plugin mới, không đụng core
- Tắt/bật plugin dễ dàng
- Plugin có thể phụ thuộc lẫn nhau (social phụ thuộc core-life)
- Test từng plugin độc lập, integration test cho tổ hợp plugin

**Đánh đổi:**
- Phải thiết kế core abstraction đủ tốt ngay từ đầu
- Plugin API cần ổn định — thay đổi API nghĩa là sửa tất cả plugin
- Overhead ban đầu cao hơn so với monolithic
