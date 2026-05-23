export function getEventCapacity(event: {
  capacity?: number | null;
  registered_count?: number | null;
}) {
  const capacity = event.capacity ?? 0;
  const registered = event.registered_count ?? 0;
  const seatsLeft = capacity > 0 ? Math.max(0, capacity - registered) : null;
  const isFull = capacity > 0 && seatsLeft === 0;
  const progress = capacity > 0 ? Math.min(100, (registered / capacity) * 100) : 0;
  return { capacity, registered, seatsLeft, isFull, progress };
}

export function formatEventDate(deadline?: string | null) {
  if (!deadline) return 'Date TBA';
  return new Date(deadline).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isEventPast(deadline?: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}
