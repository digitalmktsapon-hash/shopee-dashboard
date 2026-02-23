const fs = require('fs');
const path = require('path');

const files = [
    'src/app/revenue/page.tsx',
    'src/app/fees/page.tsx',
    'src/app/customers/page.tsx',
    'src/app/risk/page.tsx',
    'src/app/orders/page.tsx'
];

const dict = {
    "Chua c d? li?u doanh thu (d l?c)": "Chưa có dữ liệu doanh thu (đã lọc)",
    "so v?i k? tru?c": "so với kỳ trước",
    "Phn Tch Doanh Thu & L?i Nhu?n": "Phân Tích Doanh Thu & Lợi Nhuận",
    "Khng tnh don H?y & Hon tr? - Tr? gi Shop/Shopee d tr? - COGS m?c d?nh 40%": "Không tính đơn Hủy & Hoàn trả - Trợ giá Shop/Shopee đã trừ - COGS mặc định 40%",
    "Doanh Thu Net": "Doanh Thu Net",
    "L?i Nhu?n (U?c Tnh)": "Lợi Nhuận (Ước Tính)",
    "Bin L?i Nhu?n": "Biên Lợi Nhuận",
    "Chi Ph & Tr? Gi (Fees & Subsidies - CFO)": "Chi Phí & Trợ Giá (Fees & Subsidies - CFO)",
    "Ki?m sot cc lo?i ph sn, voucher v hi?u qu? tr? gi.": "Kiểm soát các loại phí sàn, voucher và hiệu quả trợ giá.",
    "Chua c d? li?u ph (d l?c)": "Chưa có dữ liệu phí (đã lọc)",
    "T?ng Ph Sn (Total Platform Fees)": "Tổng Phí Sàn (Total Platform Fees)",
    "T? L? Ph / Doanh Thu (Fee / Revenue Ratio)": "Tỷ Lệ Phí / Doanh Thu (Fee / Revenue Ratio)",
    "T?ng Tr? Gi (Total Subsidies)": "Tổng Trợ Giá (Total Subsidies)",
    "C?u Trc Chi Ph (Fee Structure)": "Cấu Trúc Chi Phí (Fee Structure)",
    "Phn B? Tr? Gi & Voucher (Subsidy & Voucher Allocation)": "Phân Bổ Trợ Giá & Voucher (Subsidy & Voucher Allocation)",
    "Chi ti?t cc kho?n ph (Fee Details)": "Chi tiết các khoản phí (Fee Details)",
    "Lo?i Ph (Fee Type)": "Loại Phí (Fee Type)",
    "Gi Tr? (Value)": "Giá Trị (Value)",
    "T? L? / T?ng Ph (% of Total Fees)": "Tỷ Lệ / Tổng Phí (% of Total Fees)",
    "T? L? / Doanh Thu (% of Revenue)": "Tỷ Lệ / Doanh Thu (% of Revenue)",
    "Khng c d? li?u ph": "Không có dữ liệu phí",
    "Khng c d? li?u tr? gi": "Không có dữ liệu trợ giá",
    "Phn Tch Khch Hng (Customer Insights)": "Phân Tích Khách Hàng (Customer Insights)",
    "Hi?u hnh vi mua s?m v gi tr? vng d?i khch hng.": "Hiểu hành vi mua sắm và giá trị vòng đời khách hàng.",
    "Chua c d? li?u khch hng (d l?c)": "Chưa có dữ liệu khách hàng (đã lọc)",
    "Khch Hng M?i (New Customers)": "Khách Hàng Mới (New Customers)",
    "Khch Hng Quay L?i (Returning)": "Khách Hàng Quay Lại (Returning)",
    "Gi Tr? Don Hng TB (AOV)": "Giá Trị Đơn Hàng TB (AOV)",
    "T? L? Gi? Chn (Retention Rate)": "Tỷ Lệ Giữ Chân (Retention Rate)",
    "Phn Ph?i Theo T?nh/Thnh Ph? (Geographic Distribution)": "Phân Phối Theo Tỉnh/Thành Phố (Geographic Distribution)",
    "Th?y d?i s? khch quay l?i": "Thay đổi số khách quay lại",
    "Th?y d?i AOV": "Thay đổi AOV",
    "Khch m?i vs Quay l?i": "Khách mới vs Quay lại",
    "R?i Ro & B?t Thu?ng (Risk & Anomalies)": "Rủi Ro & Bất Thường (Risk & Anomalies)",
    "Pht hi?n don hng b?t thu?ng, t? l? hon/h?y v t?i uu v?n hnh.": "Phát hiện đơn hàng bất thường, tỷ lệ hoàn/hủy và tối ưu vận hành.",
    "Chua c d? li?u (d l?c)": "Chưa có dữ liệu (đã lọc)",
    "T?ng Don H?y": "Tổng Đơn Hủy",
    "T?ng Don Tr? Hng": "Tổng Đơn Trả Hàng",
    "L Do H?y Don (Cancellation Reasons)": "Lý Do Hủy Đơn (Cancellation Reasons)",
    "L Do Tr? Hng (Return Reasons)": "Lý Do Trả Hàng (Return Reasons)",
    "Khng c d? li?u h?y don": "Không có dữ liệu hủy đơn",
    "Khng c d? li?u tr? hng": "Không có dữ liệu trả hàng",
    " bao g?m VAT": "Đã bao gồm VAT",
    "M?c tiu:": "Mục tiêu:",
    "Ki?m Sot R?i Ro on Hng": "Kiểm Soát Rủi Ro Đơn Hàng",
    "Phn tch su bin l?i nhu?n, chi ph qu?ng co v v?n hnh trn t?ng don hng.": "Phân tích sâu biên lợi nhuận, chi phí quảng cáo và vận hành trên từng đơn hàng.",
    "Tm theo M don hng, V?n don...": "Tìm theo Mã đơn hàng, Vận đơn...",
    "?? Ch? s? Ki?m Sot Chi Ph": "Chỉ số Kiểm Soát Chi Phí",
    "Tr? gi NB + Voucher Shop + Ph VC tr? hng + Ph sn": "Trợ giá NB + Voucher Shop + Phí VC trả hàng + Phí sàn",
    "T?NG CHI PH": "TỔNG CHI PHÍ",
    "Ngu?i bn tr? gi": "Người bán trợ giá",
    "Ph sn (C+DV+TT)": "Phí sàn (CĐ+DV+TT)",
    "Danh sch don hng c?n ch ": "Danh sách đơn hàng cần chú ý",
    "Nguyn Nhn": "Nguyên Nhân",
    "Hnh ?ng": "Hành Động",
    "Tr?ng Thi": "Trạng Thái",
    "Doanh Thu": "Doanh Thu",
    "Ph + KM (%)": "Phí + KM (%)",
    "L?i / L?": "Lời / Lỗ",
    "An ton": "An toàn",
    "Theo di": "Theo dõi",
    "C?nh bo": "Cảnh báo",
    "Nguy hi?m": "Nguy hiểm",
    "Ph c? d?nh": "Phí cố định",
    "Ph sn": "Phí sàn",
    "Gi v?n": "Giá vốn",
    "T? h?p": "Tổ hợp",
    "Khc": "Khác",
    "Chua c d? li?u r?i ro": "Chưa có dữ liệu rủi ro",
    "H? th?ng dang ho?t d?ng an ton ho?c khng c d? li?u don hng.": "Hệ thống đang hoạt động an toàn hoặc không có dữ liệu đơn hàng.",
    "Khch Hng": "Khách Hàng",
    "Lin H?": "Liên Hệ",
    "a Ch?": "Địa Chỉ",
    "S? on": "Số Đơn",
    "T?ng Chi Tiu": "Tổng Chi Tiêu",
    "on G?n Nh?t": "Đơn Gần Nhất",
    "L?ch S?": "Lịch Sử",
    "Khch vng lai": "Khách vãng lai",
    "Nh?n:": "Nhãn:",
    "Hi?n th? 100 khch hng d?u tin. Vui lng dng b? l?c d? tm ki?m thm.": "Hiển thị 100 khách hàng đầu tiên. Vui lòng dùng bộ lọc để tìm kiếm thêm.",
    "L?ch S? Mua Hng": "Lịch Sử Mua Hàng",
    "Ngy Mua": "Ngày Mua",
    "M on": "Mã Đơn",
    "Gi Tr?": "Giá Trị",
    "Chi ti?t don hng:": "Chi tiết đơn hàng:",
    "Phn lo?i:": "Phân loại:",
    "Khng c thng tin chi ti?t s?n ph?m.": "Không có thông tin chi tiết sản phẩm.",
    "Khng c d? li?u l?ch s?": "Không có dữ liệu lịch sử",
    ">ng</button>": ">Đóng</button>",
    "Chua c d? li?u don hng (d l?c)": "Chưa có dữ liệu đơn hàng (đã lọc)",
    "V?n Hnh & on Hng (Operations & Orders)": "Vận Hành & Đơn Hàng (Operations & Orders)",
    "Gim st t? l? hon, h?y v hi?u qu? v?n chuy?n.": "Giám sát tỷ lệ hoàn, hủy và hiệu quả vận chuyển.",
    "T?ng on Hng (Total Orders)": "Tổng Đơn Hàng (Total Orders)",
    "T? L? Thnh Cng (Success Rate)": "Tỷ Lệ Thành Công (Success Rate)",
    "on hon thnh": "Đơn hoàn thành",
    "T? L? H?y (Cancel Rate)": "Tỷ Lệ Hủy (Cancel Rate)",
    " don h?y": " đơn hủy",
    "T? L? Hon (Return Rate)": "Tỷ Lệ Hoàn (Return Rate)",
    "Phn Tch L Do H?y (Cancellation Reasons Analysis)": "Phân Tích Lý Do Hủy (Cancellation Reasons Analysis)",
    "Hon Tr? Theo VVC (Returns by Carrier)": "Hoàn Trả Theo ĐVVC (Returns by Carrier)",
    "S? lu?ng (Qty)": "Số lượng (Qty)",
    "Chua c d? li?u": "Chưa có dữ liệu"
};

for (const f of files) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) continue;

    let content = fs.readFileSync(p, 'utf8');
    let changed = false;

    // Create a dictionary matching \xC3 (the mangled chars usually have \uFFFD)
    // We will do exact replace first
    for (const [bad, good] of Object.entries(dict)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
        }
    }

    // Also try by replacing ? in `bad` string with \uFFFD in case it's actually \uFFFD
    const fallbackDict = {};
    for (const [bad, good] of Object.entries(dict)) {
        fallbackDict[bad.replace(/\?/g, '\uFFFD')] = good;
    }

    for (const [bad, good] of Object.entries(fallbackDict)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`Updated ${f}`);
    } else {
        console.log(`No exact matches in ${f}`);
    }
}
