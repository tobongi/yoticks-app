type PasswordResetDelivery = {
  email: string;
  name: string;
  token: string;
};

export async function deliverPasswordReset({ email, name, token }: PasswordResetDelivery): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  const webhookUrl = process.env.PASSWORD_RESET_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('PASSWORD_RESET_WEBHOOK_URL is required to deliver password recovery messages.');
  }

  const deepLinkBase = process.env.PASSWORD_RESET_DEEP_LINK_BASE || 'yoticks://auth/reset';
  const separator = deepLinkBase.includes('?') ? '&' : '?';
  const resetUrl = `${deepLinkBase}${separator}token=${encodeURIComponent(token)}`;
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, name, resetUrl, expiresInMinutes: 30 }),
  });

  if (!response.ok) {
    throw new Error(`Password reset delivery failed with status ${response.status}.`);
  }
}
