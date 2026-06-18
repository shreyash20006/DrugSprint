/**
 * Generates and triggers download of a standard .ics file for calendar sync.
 */
export const downloadICS = (
  title: string,
  description: string,
  dateStr: string,
  location: string = 'TGPCOP Campus'
) => {
  const date = new Date(dateStr);
  
  // Format dates to YYYYMMDDTHHMMSSZ format
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const startStr = formatICSDate(date);
  
  // Default duration is 2 hours
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const endStr = formatICSDate(endDate);

  const cleanDescription = description
    ? description.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
    : 'Join us for this exciting campus event!';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PROID:-//TGPCOP Student Council//Event Sync//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@tgpcop.edu`,
    `DTSTAMP:${startStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (navigator.maxTouchPoints > 0) {
    // Mobile downloads helper
    const reader = new FileReader();
    reader.onload = function(e) {
      window.location.href = e.target?.result as string;
    };
    reader.readAsDataURL(blob);
  } else {
    // Desktop downloads helper
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
