import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Address, getAddress } from 'viem';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const toTimestamp = (value: Date) => {
	return Math.floor(value.getTime() / 1000);
};

export enum FormatType {
	'us',
	'tiny',
	'symbol',
}

export const formatCurrency = (value: string | number, minimumFractionDigits = 0, maximumFractionDigits = 2, format = FormatType.tiny) => {
	const amount = typeof value === 'string' ? parseFloat(value) : value;

	// exceptions
	if (amount === null || !!isNaN(amount)) return null;
	if (amount < 0.01 && amount > 0 && maximumFractionDigits) {
		return '< 0.01';
	}

	// us
	if (format === FormatType.us) {
		const formatter = new Intl.NumberFormat('en-US', {
			maximumFractionDigits,
			minimumFractionDigits,
		});
		return formatter.format(amount);
	}

	// tiny
	if (format === FormatType.tiny) {
		const formatter = new Intl.NumberFormat('en-US', {
			maximumFractionDigits: amount < 1000 && amount > -1000 ? 2 : 0,
			minimumFractionDigits: amount < 1000 && amount > -1000 ? 2 : 0,
		});
		return formatter.format(amount).split(',').join(' ');
	}

	// symbol (k, M, B, T)
	if (format === FormatType.symbol) {
		const absAmount = Math.abs(amount);
		let scaledAmount: number;
		let suffix: string;

		if (absAmount >= 1_000_000_000_000) {
			scaledAmount = amount / 1_000_000_000_000;
			suffix = 'T';
		} else if (absAmount >= 1_000_000_000) {
			scaledAmount = amount / 1_000_000_000;
			suffix = 'B';
		} else if (absAmount >= 1_000_000) {
			scaledAmount = amount / 1_000_000;
			suffix = 'M';
		} else if (absAmount >= 1_000) {
			scaledAmount = amount / 1_000;
			suffix = 'k';
		} else {
			scaledAmount = amount;
			suffix = '';
		}

		const formatter = new Intl.NumberFormat('en-US', {
			minimumFractionDigits,
			maximumFractionDigits,
		});
		return formatter.format(scaledAmount).split(',').join(' ') + suffix;
	}
};

// Date formatting functions
export const formatDateLocale = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.toISOString().replaceAll('-', '').replaceAll(':', '').replaceAll('.', '');
};

export const formatDate = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.format('YYYY-MM-DD HH:mm');
};

export const formatDateDuration = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return dayjs.duration(date.toISOString()).humanize(true);
};

export const formatDuration = (time: number | bigint): string => {
	const duration = dayjs.duration(Number(time), 'seconds').humanize(false);
	return time > 0 ? duration : '-';
};

export const isDateExpired = (timestamp: number | bigint): boolean => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.isBefore();
};

export const isDateUpcoming = (timestamp: number | bigint): boolean => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.isAfter();
};

// String formatting functions
export function capLetter(data: string) {
	return data.charAt(0).toUpperCase() + data.slice(1);
}

export const shortenString = (str: string, start = 8, end = 6) => {
	return str.substring(0, start) + '...' + str.substring(str.length - end);
};

export const shortenAddress = (address: Address): string => {
	try {
		const formattedAddress = getAddress(address);
		return shortenString(formattedAddress);
	} catch {
		throw new TypeError("Invalid input, address can't be parsed");
	}
};