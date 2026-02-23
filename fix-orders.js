const fs = require('fs');

const filePath = 'src/app/orders/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
    { pattern: /Chua c d\? li\?u don hng \(d l\?c\)/g, text: "Chưa có dữ liệu đơn hàng (đã lọc)" },
    { pattern: /V\?n Hnh & on Hng \(Operations & Orders\)/g, text: "Vận Hành & Đơn Hàng (Operations & Orders)" },
    { pattern: /Gim st t\? l\? hon, h\?y v hi\?u qu\? v\?n chuy\?n\./g, text: "Giám sát tỷ lệ hoàn, hủy và hiệu quả vận chuyển." },
    { pattern: /T\?ng on Hng \(Total Orders\)/g, text: "Tổng Đơn Hàng (Total Orders)" },
    { pattern: /T\? L\? Thnh Cng \(Success Rate\)/g, text: "Tỷ Lệ Thành Công (Success Rate)" },
    { pattern: /on hon thnh/g, text: "Đơn hoàn thành" },
    { pattern: /Tỷ Lệ Hủy \(Cancel Rate\)/g, text: "Tỷ Lệ Hủy (Cancel Rate)" },
    { pattern: /don h\?y/g, text: "đơn hủy" },
    { pattern: /T\? L\? Hon \(Return Rate\)/g, text: "Tỷ Lệ Hoàn (Return Rate)" },
    { pattern: /Phn Tch L Do H\?y \(Cancellation Reasons Analysis\)/g, text: "Phân Tích Lý Do Hủy (Cancellation Reasons Analysis)" },
    { pattern: /Hon Tr\? Theo VVC \(Returns by Carrier\)/g, text: "Hoàn Trả Theo ĐVVC (Returns by Carrier)" },
    { pattern: /Số lượng \(Qty\)/g, text: "Số lượng (Qty)" },
    { pattern: /Chua c d\? li\?u/g, text: "Chưa có dữ liệu" }
];

for (const { pattern, text } of replacements) {
    content = content.replace(pattern, text);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated orders page using regex map.");
