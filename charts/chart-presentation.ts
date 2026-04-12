export function getTimeSeriesXAxisInterval(dataLength: number, isCompact: boolean) {
  if (isCompact) {
    if (dataLength <= 12) {
      return 2;
    }

    return Math.max(Math.floor(dataLength / 5), 2);
  }

  if (dataLength <= 24) {
    return 2;
  }

  return Math.max(Math.floor(dataLength / 8), 1);
}

export function getCategoryXAxisInterval(dataLength: number, isCompact: boolean) {
  if (!isCompact || dataLength <= 3) {
    return 0;
  }

  if (dataLength <= 6) {
    return 1;
  }

  return 2;
}

export function truncateChartLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}...`;
}