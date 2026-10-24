// Do not trust Host, Origin or forwarding headers as authentication.
export function isLoopbackPeer(req) {
  const peer = req.socket?.remoteAddress;
  if (peer === '::1') return true;
  const value = typeof peer === 'string' ? peer.replace(/^::ffff:/i, '') : '';
  const parts = value.split('.');
  return parts.length === 4 && parts[0] === '127' && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
