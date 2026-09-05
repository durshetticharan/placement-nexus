export async function logAudit(data: any) {
  // Temporary mock for audit logging since the AuditLog model is not yet implemented in Phase 11 schema
  console.log('[AUDIT LOG]', JSON.stringify(data));
}
