/**
 * Format number to VND currency string without decimals
 */
export const formatVND = (amount: number): string => {
    if (isNaN(amount)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
};

/**
 * Format large numbers with dots as thousand separators
 * @param num The number to format
 * @param maxDecimals Maximum decimal places
 * @param minDecimals Minimum decimal places (for padding 0.00)
 */
export const formatNumber = (num: number, maxDecimals: number = 3, minDecimals: number = 0): string => {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: maxDecimals,
        minimumFractionDigits: minDecimals
    }).format(num);
};

/**
 * Format date string to Vietnamese format: Thứ X, DD/MM/YYYY
 */
export const formatDateVN = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput);

        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayOfWeek = days[d.getDay()];

        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();

        return `${dayOfWeek}, ${dd}-${mm}-${yyyy}`;
    } catch (e) {
        return String(dateInput);
    }
};
