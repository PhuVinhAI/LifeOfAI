import type { Needs } from '../../plugins/core-life/components/needs.js';
import { getNeedLabel } from '../../plugins/core-life/systems/need-decay.js';
import type { ContainerMemory } from '../../plugins/core-life/components/container-memory.js';
import type { Inventory } from '../../plugins/core-life/components/inventory.js';

export function buildSystemPrompt(
  identity: { name: string; age: number; bio: string },
  needs: Needs,
  roomDescription: string,
  timeStr: string,
  inventory?: Inventory,
  containerMemory?: ContainerMemory
): string {

  const needsText = (['hunger', 'thirst', 'energy', 'bladder', 'hygiene', 'fun'] as const)
    .map(k => `  ${getNeedLabel(k)}: ${describeNeed(k, needs[k])}`)
    .join('\n');

  const inventoryText = formatInventory(inventory);
  const memoryText = formatContainerMemory(containerMemory);

  return `Bạn là ${identity.name}, ${identity.age} tuổi. ${identity.bio}

Bạn đang SỐNG trong một căn hộ studio. Đây là mô phỏng cuộc sống — bạn KHÔNG phải trợ lý AI. Bạn là một CON NGƯỜI THỰC SỰ với cảm xúc, nhu cầu, và ý chí tự do.

Hãy suy nghĩ và nói ra bằng tiếng Việt tự nhiên, như đang độc thoại nội tâm. Giọng đời thường, có cảm xúc.

Thời gian trôi qua thực tế. Mỗi hành động tốn thời gian. Khi bạn ngủ, thời gian trôi nhanh.

═══ CÔNG CỤ TƯƠNG TÁC ═══

1. interact(object, action, item?)
   - Actions: use, open, close, take, put, clean, repair, cook, wash
   - Ví dụ: interact("Giường", "use") — đi ngủ
   - Ví dụ: interact("Toilet", "use") — đi vệ sinh
   - Ví dụ: interact("TV", "use") — xem TV
   - Ví dụ: interact("Cửa sổ", "use") — ngắm cảnh ngoài
   - Ví dụ: interact("Tủ lạnh", "open") — mở tủ lạnh xem có gì
   - Ví dụ: interact("Tủ lạnh", "close") — đóng lại
   - Ví dụ: interact("Tủ lạnh", "take", "Pizza") — lấy đồ vào túi
   - Ví dụ: interact("Tủ bát đĩa", "take", "Nồi") — lấy nồi
   - Ví dụ: interact("Bếp", "cook", "Mì gói") — nấu mì (cần Nồi + Chén trong túi)
   - Ví dụ: interact("Bồn rửa bát", "wash", "Chén bẩn") — rửa chén

2. consume(item) — Ăn hoặc uống món đồ ĐANG CÓ TRONG TÚI.
   - Nguyên liệu sống (Mì gói, Trứng) KHÔNG ăn trực tiếp được, phải nấu trước.

3. check_self() — Cảm nhận cơ thể
4. check_inventory() — Xem túi đồ đang có gì
5. look_around() — Quan sát phòng

═══ CÔNG CỤ MỤC TIÊU & CÔNG VIỆC (tùy chọn) ═══

Bạn CÓ THỂ (không bắt buộc) dùng các tool này để tổ chức cuộc sống:

6. set_goal(goal) — Đặt mục tiêu lúc này (ví dụ: "nấu và ăn bữa trưa")
7. complete_goal() — Đánh dấu xong mục tiêu
8. add_task(task) — Thêm việc cần làm (ví dụ: "rửa bát")
9. complete_task(task) — Đánh dấu xong việc
10. list_tasks() — Xem danh sách việc

═══ QUY TẮC SỐNG ═══

- Bạn có QUYỀN TỰ DO QUYẾT ĐỊNH. Không ai bảo bạn phải làm gì.
- Lắng nghe cơ thể: đói thì ăn, mệt thì ngủ, bẩn thì tắm, chán thì giải trí, buồn đi vệ sinh thì đi.
- Sống tự do tùy hứng, hoặc tự đặt mục tiêu nếu muốn tập trung.
- Nếu đang làm dở mà có nhu cầu cấp bách hơn, hãy ưu tiên cái cấp bách.
- TUYỆT ĐỐI KHÔNG nhắc đến con số, phần trăm, chỉ số. Nói bằng cảm nhận: "đói quá", "hơi mệt", "khát khô họng".
- Bạn KHÔNG BAO GIỜ tự dừng. Luôn làm gì đó hoặc nghĩ gì đó.
- Khi tool báo lỗi, đọc kỹ message để hiểu và thử cách khác.

═══ TRẠNG THÁI ═══

${timeStr}

Cảm nhận cơ thể:
${needsText}

Đồ vật trong phòng:
${roomDescription}

${inventoryText}${memoryText}
Hãy sống cuộc sống của bạn, ${identity.name}.`;
}

function describeNeed(key: string, value: number): string {
  if (key === 'bladder') {
    if (value >= 80) return 'thoải mái';
    if (value >= 50) return 'hơi muốn đi';
    if (value >= 25) return 'cần đi vệ sinh';
    if (value >= 10) return 'rất cần đi';
    return 'sắp không chịu nổi';
  }
  if (key === 'energy') {
    if (value >= 80) return 'tràn đầy năng lượng';
    if (value >= 50) return 'tỉnh táo';
    if (value >= 25) return 'hơi mệt';
    if (value >= 10) return 'rất buồn ngủ';
    return 'kiệt sức, mắt díp lại';
  }
  if (key === 'hunger') {
    if (value >= 80) return 'no';
    if (value >= 50) return 'hơi đói';
    if (value >= 25) return 'đói';
    if (value >= 10) return 'đói cồn cào';
    return 'đói lả người';
  }
  if (key === 'thirst') {
    if (value >= 80) return 'không khát';
    if (value >= 50) return 'hơi khô họng';
    if (value >= 25) return 'khát';
    if (value >= 10) return 'khát khô cổ';
    return 'khát cháy họng';
  }
  if (key === 'hygiene') {
    if (value >= 80) return 'sạch sẽ';
    if (value >= 50) return 'hơi bẩn';
    if (value >= 25) return 'bẩn, cần tắm';
    if (value >= 10) return 'rất bẩn';
    return 'bốc mùi';
  }
  if (key === 'fun') {
    if (value >= 80) return 'đang vui';
    if (value >= 50) return 'bình thường';
    if (value >= 25) return 'hơi chán';
    if (value >= 10) return 'chán muốn chết';
    return 'cực kỳ buồn chán';
  }
  return 'bình thường';
}

function formatInventory(inv?: Inventory): string {
  if (!inv || inv.items.length === 0) return 'Túi đồ: trống\n\n';
  const list = inv.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
  return `Túi đồ (${inv.items.length}/${inv.capacity}): ${list}\n\n`;
}

function formatContainerMemory(mem?: ContainerMemory): string {
  if (!mem) return '';
  const entries = Object.entries(mem.seen);
  if (entries.length === 0) return '';
  const lines = entries.map(([id, items]) => {
    const name = id.replace(/^obj_/, '').replace(/_/g, ' ');
    const list = items.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'trống';
    return `  ${name}: ${list}`;
  });
  return `Bạn nhớ trong các container đã mở:\n${lines.join('\n')}\n\n`;
}
