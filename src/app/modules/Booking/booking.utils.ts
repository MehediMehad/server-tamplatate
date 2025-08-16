// helper: hours diff
export const diffHours = (startISO: string, endISO: string) => {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return (e - s) / (1000 * 60 * 60);
};
