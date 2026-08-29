export function getVisiblePageNumbers(currentPage, totalPages) {
  const total = Math.max(0, Number(totalPages) || 0);
  if (total <= 0) return [];

  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);
  const range = (start, end) => {
    const list = [];
    for (let n = start; n <= end; n += 1) list.push(n);
    return list;
  };

  if (total <= 3) return range(1, total);

  if (current <= 2) return range(1, 3);
  if (current <= 4) return range(1, Math.min(5, total));

  let start = current - 2;
  let end = current + 2;
  if (end > total) {
    end = total;
    start = Math.max(1, end - 4);
  }
  if (start < 1) {
    start = 1;
    end = Math.min(total, 5);
  }
  return range(start, end);
}
