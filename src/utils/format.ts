/**
 * Format number to VND currency string without decimals
 */
export const formatVND = (amount: number): string => {
    if (isNaN(amount)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
};

/**
 * Format large numbers with dots as thousand separators
 */
export const formatNumber = (num: number, maxDecimals: number = 3): string => {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: maxDecimals,
        minimumFractionDigits: 0
    }).format(num);
};
